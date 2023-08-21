import type Builder from "../Builder";
import {WhereOfType} from "../Builder";
import IndexHint from "../IndexHint";
import Grammar from "./Grammar";

function setNestedKey(obj: Record<string|number, unknown>, keyString: string, value: unknown): void {
    const keys = keyString.split('.');
    let currentObj = obj;
  
    keys.forEach((key) => {
    //for (let i = 0; i < keys.length - 1; i++) {
      //const key = keys[i];
        if (!currentObj[key] || typeof currentObj[key] !== 'object') {
            currentObj[key] = {};
        }
        currentObj = currentObj[key] as typeof obj;
    });
  
    const finalKey = keys.at(-1)!;
    currentObj[finalKey] = value;
}

export default class SQLiteGrammar extends Grammar {
    protected override operators: string[] = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '<>',
        '!=',
        'like',
        'not like',
        'ilike',
        '&',
        '|',
        '<<',
        '>>',
    ];

    protected override compileLock(_query: Builder, _value: string | boolean): string {
        return "";
    }

    protected override wrapUnion(sql: string): string {
        return `select * from (${sql})`;
    }

    protected whereDate(query: Builder, where: WhereOfType<'Date'>): string {
        return this.dateBasedWhere('%Y-%m-%d', query, where);
    }

    protected whereDay(query: Builder, where: WhereOfType<'Day'>): string {
        return this.dateBasedWhere('%d', query, where);
    }

    protected whereMonth(query: Builder, where: WhereOfType<'Month'>): string {
        return this.dateBasedWhere('%m', query, where);
    }

    protected whereYear(query: Builder, where: WhereOfType<'Year'>): string {
        return this.dateBasedWhere('%Y', query, where);
    }

    protected whereTime(query: Builder, where: WhereOfType<'Time'>): string {
        return this.dateBasedWhere('%H:%M:%S', query, where);
    }

    protected dateBasedWhere(type: string, query: Builder, where: WhereOfType<'Date'|'Day'|'Month'|'Year'|'Time'>): string {
        const value = this.parameter(where.value);

        return `strftime('${type}', ${this.wrap(where.column)}) ${where.operator} cast(${value} as text)`;
    }

    protected override compileIndexHint(_query: Builder, indexHint: IndexHint): string {
        return indexHint.type === 'force' ? `indexed by ${indexHint.index}` : '';
    }

    protected compileJsonLength(column: string, operator: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_array_length(${field}${path}) ${operator} ${value}`;
    }

    protected compileJsonContainsKey(column: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_type(${field}${path}) is not null`;
    }

    public compileUpdate(query: Builder, values: unknown[]): string {
        if (query._joins.length > 0 || query._limit !== undefined) {
            return this.compileUpdateWithJoinsOrLimit(query, values);
        }

        return super.compileUpdate(query, values);
    }

    public compileInsertOrIgnore(query: Builder, values: unknown[]): string {
        return this.compileInsert(query, values).replace('insert', 'insert or ignore');
    }

    protected compileUpdateColumns(query: Builder, values: Record<string, unknown>): string {
        const jsonGroups = this.groupJsonColumnsForUpdate(values);

        //this step was split into multiplke steps, compared to the source, due to PHP vs JS complexity. source: https://github.com/laravel/framework/blob/256f4974a09e24170ceeeb9e573651fd5e1c703e/src/Illuminate/Database/Query/Grammars/SQLiteGrammar.php#L201
        const filteredValues = Object.fromEntries(Object.entries(values).filter(([key, _value]) => !this.isJsonSelector(key)));
        const mergedValues = {...filteredValues, ...jsonGroups};
        const mappedValues = Object.entries(mergedValues).map(([key, value]) => {
            const column = key.split('.').at(-1);

            value = jsonGroups[key] !== undefined ? this.compileJsonPatch(column, value) : this.parameter(value);

            //return [key, `${this.wrap(column)} = ${value}`];
            return `${this.wrap(column)} = ${value}`; //To skip doing Object.values(Object.fromEntries(...)) later
        });

        return mappedValues.join(', ');
    }

    public compileUpsert(query: Builder, values: unknown[], uniqueBy: unknown[], update: unknown[]): string {
        let sql = this.compileInsert(query, values);

        sql += ` on conflict (${this.columnize(uniqueBy)}) do update set `;

        const columns = Object.entries(update).map(([key, value]) => {
            return !isNaN(key) //Attempt to mack is_numeric. an alternative may be to check if update is an array ínstead?
                ? `${this.wrap(value)} = ${this.wrapValue('excluded')}.${this.wrap(value)}`
                : `${this.wrap(key)} = ${this.parameter(value)}`;
        }).join(', ');

        return `${sql}${columns}`;
    }

    protected groupJsonColumnsForUpdate(values: Record<string|number, unknown>): Record<string|number, unknown> {
        const groups = {};

        Object.entries(values).forEach(([key, value]) => {
            if (this.isJsonSelector(key)) {
                setNestedKey(groups, key.slice(key.indexOf('.')+1).replace(/->/g, '.'), value);
            }
        });

        return groups;
    }

    protected compileJsonPatch(column: string, value: unknown): string {
        return `json_patch(ifnull(${this.wrap(column)}, json('{}')), json(${this.parameter(value)}))`;
    }

    protected compileUpdateWithJoinsOrLimit(query: Builder, values: unknown[]): string {
        const table = this.wrapTable(query._from);

        const columns = this.compileUpdateColumns(query, values);

        const alias = query._from?.split(/\s+as\s+/i).at(-1);

        const selectSql = this.compileSelect(query.select(`${alias}.${rowid}`));

        return `update ${table} set ${columns} where ${this.wrap('rowid')} in (${selectSql})`;
    }

    public prepareBindingsForUpdate(bindings: unknown[], values: unknown[]): unknown[] {
        const groups = this.groupJsonColumnsForUpdate(values);

        values = values.filter((value, key) => !this.isJsonSelector(key)).merge($groups).map(function ($value) {
            return is_array($value) ? json_encode($value) : $value;
        });

        const {select: _, cleanBindings} = bindings;

        return Object.values({...values, ...cleanBindings.flat()});
    }

    public compileDelete(query: Builder): string {
        if (query._joins.length > 0 || query._limit !== undefined) {
            return this.compileDeleteWithJoinsOrLimit(query);
        }

        return super.compileDelete(query);
    }

    protected compileDeleteWithJoinsOrLimit(query: Builder): string {
        const table = this.wrapTable(query._from);

        const alias = query._from?.split(/\s+as\s+/i).at(-1);

        const selectSql = this.compileSelect(query.select(`${alias}.rowid`));

        return `delete from ${table} where ${this.wrap('rowid')} in (${selectSql})`;
    }

    public compileTruncate(query: Builder): Record<string, Array<unknown>> {
        return {
            'delete from sqlite_sequence where name = ?': [query._from],
            [`delete from ${this.wrapTable(query._from)}`]: [],
        }
    }

    protected wrapJsonSelector(value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_extract(${field}.${path})`;
    }
}
