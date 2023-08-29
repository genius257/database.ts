import { Bindings, type Builder, type WhereOfType } from "..";
import Expression from "../Expression";
import type IndexHint from "../IndexHint";
import Grammar from "./Grammar";

export default class MySqlGrammar extends Grammar {
    protected override operators = ['sounds like'] as const;

    protected override whereNull(query: Builder, where:  WhereOfType<'Null'>): string {
        const columnValue = this.getValue(where.column).toString();

        if (this.isJsonSelector(columnValue)) {
            const [field, path] = this.wrapJsonFieldAndPath(columnValue);

            return `(json_extract(${field}${path}) is null OR json_type(json_extract(${field}${path})) = 'NULL')`;
        }

        return super.whereNull(query, where);
    }

    protected override whereNotNull(query: Builder, where: WhereOfType<"NotNull">): string {
        const columnValue = this.getValue(where.column).toString();

        if (this.isJsonSelector(columnValue)) {
            const [field, path] = this.wrapJsonFieldAndPath(columnValue);

            return `(json_extract(${field}${path}) is not null AND json_type(json_extract(${field}${path})) != 'NULL')`;
        }

        return super.whereNotNull(query, where);
    }

    public override whereFullText(_query: Builder, where: WhereOfType<"Fulltext">): string {
        const columns = this.columnize(where.columns);

        const value = this.parameter(where.value);

        const mode = where.options.mode === 'boolean' ? ' in boolean mode' : ' in natural language mode';

        const expanded = where.options.expanded && where.options.mode !== 'boolean' ? ' with query expansion' : '';

        return `match (${columns}) against (${value}${mode}${expanded})`;
    }

    protected override compileIndexHint(_query: Builder, indexHint: IndexHint): string {
        switch (indexHint.type) {
            case 'hint':
                return `use index (${indexHint.index})`;
            case 'force':
                return `force index (${indexHint.index})`;
            default:
                return `ignore index (${indexHint.index})`;
        }
    }

    public override compileInsertOrIgnore(query: Builder, values: unknown[]): string {
        return this.compileInsert(query, values).replace('insert', 'insert ignore');
    }

    protected override compileJsonContains(column: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_contains(${field}, ${value}${path})`;
    }

    protected override compileJsonContainsKey(column: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `ifnull(json_contains_path(${field}, 'one'${path}), 0)`;
    }

    protected override compileJsonLength(column: string, operator: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_length(${field}${path}) ${operator} ${value}`;
    }

    public override compileJsonValueCast(value: string): string {
        return `cast(${value} as json)`;
    }

    public override compileRandom(seed: string|number): string {
        return `RAND(${seed})`;
    }

    protected override compileLock(_query: Builder, value: boolean|string): string {
        if (typeof value !== 'string') {
            return value ? 'for update' : 'lock in share mode';
        }

        return value;
    }

    public override compileInsert(query: Builder, values: unknown[]): string {
        if (values.length === 0) {
            values = [[]];
        }

        return super.compileInsert(query, values);
    }

    protected override compileUpdateColumns(query: Builder, values: Record<string, string|number|Expression>): string {
        return Object.entries(values).map(([key, value]) => {
            if (this.isJsonSelector(key)) {
                return this.compileJsonUpdateColumn(key, value);
            }

            return `${this.wrap(key)} = ${this.parameter(value)}`;
        }).join(', ');
    }

    public override compileUpsert(query: Builder, values: Array<string|number|Expression>, uniqueBy: unknown[], update: Array<string|number|Expression>): string {
        //const useUpsertAlias = query.connection.getConfig('use_upsert_alias');
        const useUpsertAlias = false;//WARNING: default override since connection is not available on this implementation. Maybe it could be a property for indicating feature availability?

        let sql = this.compileInsert(query, values);

        if (useUpsertAlias) {
            sql += ' as laravel_upsert_alias';
        }

        sql += ' on duplicate key update ';

        const columns = update.map((value, key) => {
            if (isNaN(key)) {
                return `${this.wrap(key)} = ${this.parameter(value)}`;
            }

            return useUpsertAlias
                ? `${this.wrap(value)} = ${this.wrap('laravel_upsert_alias')}.${this.wrap(value)}`
                : `${this.wrap(value)} = values(${this.wrap(value)})`;
        }).join(', ');

        return `${sql}${columns}`;
    }

    protected compileJsonUpdateColumn(key: string, value: string|number|Expression|boolean|Array<string|number|Expression>): string {
        if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';//TODO: toString() could be used on boolean to get same result.
        } else if (Array.isArray(value)) {
            value = 'cast(? as json)';
        } else {
            value = this.parameter(value);
        }

        const [field, path] = this.wrapJsonFieldAndPath(key);

        return `${field} = json_set(${field}${path}, ${value})`;
    }

    protected override compileUpdateWithoutJoins(query: Builder, table: string, columns: string, where: string): string {
        let sql = super.compileUpdateWithoutJoins(query, table, columns, where);

        if (query._orders.length > 0) {
            sql += ` ${this.compileOrders(query, query._orders)}`;
        }

        if (query._limit !== undefined) {
            sql += ` ${this.compileLimit(query, query._limit)}`;
        }

        return sql;
    }

    public override prepareBindingsForUpdate(bindings: Bindings, values: Record<string, unknown>): unknown[] {
        const _values = Object.entries(values)
            .filter(([column, value]) => !(this.isJsonSelector(column) && typeof value === 'boolean'))
            .map(value => Array.isArray(value) ? JSON.stringify(value) : value)

        return super.prepareBindingsForUpdate(bindings, _values);
    }

    protected override compileDeleteWithoutJoins(query: Builder, table: string, where: string): string {
        let sql = super.compileDeleteWithoutJoins(query, table, where);

        // When using MySQL, delete statements may contain order by statements and limits
        // so we will compile both of those here. Once we have finished compiling this
        // we will return the completed SQL statement so it will be executed for us.
        if (query._orders.length > 0) {
            sql += ` ${this.compileOrders(query, query._orders)}`;
        }

        if (query._limit !== undefined) {
            sql += ` ${this.compileLimit(query, query._limit)}`;
        }

        return sql;
    }

    protected override wrapValue(value: string): string {
        return value === '*' ? value : `\`${value.replace(/`/g, '``')}\``
    }

    protected override wrapJsonSelector(value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_unquote(json_extract(${field}${path}))`;
    }

    protected override wrapJsonBooleanSelector(value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_extract(${field}${path})`;
    }
}
