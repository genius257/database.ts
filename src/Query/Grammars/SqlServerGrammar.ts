import { Builder, Having, HavingOfType, WhereOfType } from "..";
import Expression from "../Expression";
import IndexHint from "../IndexHint";
import Grammar from "./Grammar";

export default class SqlServerGrammar extends Grammar {
    protected override operators = [
        '=', '<', '>', '<=', '>=', '!<', '!>', '<>', '!=',
        'like', 'not like', 'ilike',
        '&', '&=', '|', '|=', '^', '^=',
    ] as const;

    protected override selectComponents = [
        'aggregate',
        'columns',
        'from',
        'indexHint',
        'joins',
        'wheres',
        'groups',
        'havings',
        'orders',
        'offset',
        'limit',
        'lock',
    ] as const;

    /**
     * Compile a select query into SQL.
     */
    public override compileSelect(query: Builder): string
    {
        // An order by clause is required for SQL Server offset to function...
        if (query._offset && (query._orders.length === 0)) {
            query._orders.push({'sql': '(SELECT 0)'});
        }

        return super.compileSelect(query);
    }

    /**
     * Compile the "select *" portion of the query.
     */
    protected override compileColumns(query: Builder, columns: string[]): string|undefined
    {
        if (query._aggregate !== undefined) {
            return;
        }

        let select = query._distinct ? 'select distinct ' : 'select ';

        // If there is a limit on the query, but not an offset, we will add the top
        // clause to the query, which serves as a "limit" type clause within the
        // SQL Server system similar to the limit keywords available in MySQL.
        if ((typeof query._limit === "number") && query._limit > 0 && query._offset <= 0) {
            select += `top ${query._limit} `;
        }

        return `${select}${this.columnize(columns)}`;
    }

    /**
     * Compile the "from" portion of the query.g
     */
    protected override compileFrom(query: Builder, table: string): string
    {
        const from = super.compileFrom(query, table);

        if (typeof query._lock === 'string') {
            return `${from} ${query._lock}`;
        }

        if (query._lock !== undefined) {
            return `${from} with(rowlock,${(query._lock ? 'updlock,' : '')}holdlock)`;
        }

        return from;
    }

    /**
     * Compile the index hints for the query.
     */
    protected override compileIndexHint(query: Builder, indexHint: IndexHint):string
    {
        return indexHint.type === 'force'
                    ? `with (index(${indexHint.index}))`
                    : '';
    }

    /**
     * @inheritdoc
     */
    protected override whereBitwise(query: Builder, where: WhereOfType<"Bitwise">): string
    {
        const value = this.parameter(where.value);

        const operator = where.operator.replaceAll('?', '??');

        return `(${this.wrap(where.column)} ${operator} ${value}) != 0`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected override whereDate(query: Builder, where: WhereOfType<"Date">): string
    {
        const value = this.parameter(where.value);

        return `cast(${this.wrap(where.column)} as date) ${where.operator} ${value}`;
    }

    /**
     * Compile a "where time" clause.
     */
    protected override whereTime(_query: Builder, where: WhereOfType<"Time">): string
    {
        const value = this.parameter(where.value);

        return `cast(${this.wrap(where.column)} as time) ${where.operator} ${value}`;
    }

    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected override compileJsonContains(column: string, value: string): string
    {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `${value} in (select [value] from openjson(${field}${path}))`;
    }

    /**
     * Prepare the binding for a "JSON contains" statement.
     */
    public override prepareBindingForJsonContains(binding: boolean|string): string
    {
        return typeof binding === "boolean" ? JSON.stringify(binding) : binding;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected override compileJsonContainsKey(column: string): string
    {
        const segments = column.split('->');

        const lastSegment = segments.pop()!;

        let key;
        if (/\[([0-9]+)\]$/.test(lastSegment)) {
            const matches = lastSegment.match(/\[([0-9]+)\]$/)!;
            segments.push(lastSegment.substring(0, lastSegment.lastIndexOf(matches[0]!)));

            key = matches[1];
        } else {
            key = `'${lastSegment.replaceAll("'", "''")}'`;
        }

        const [field, path] = this.wrapJsonFieldAndPath(segments.join('->'));

        return `${key} in (select [key] from openjson(${field}${path}))`;
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected override compileJsonLength(column: string, operator: string, value: string): string
    {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `(select count(*) from openjson(${field}${path})) ${operator} ${value}`;
    }

    /**
     * Compile a "JSON value cast" statement into SQL.
     */
    public override compileJsonValueCast(value: string): string
    {
        return `json_query(${value})`;
    }

    /**
     * Compile a single having clause.
     */
    protected override compileHaving(having: Having): string
    {
        if (having.type === 'Bitwise') {
            return this.compileHavingBitwise(having);
        }

        return super.compileHaving(having);
    }

    /**
     * Compile a having clause involving a bitwise operator.
     */
    protected override compileHavingBitwise(having: HavingOfType<'Bitwise'>): string
    {
        const column = this.wrap(having.column);

        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter}) != 0`;
    }

    /**
     * Compile a delete statement without joins into SQL.
     */
    protected override compileDeleteWithoutJoins(query: Builder, table: string, where: string): string
    {
        const sql = super.compileDeleteWithoutJoins(query, table, where);

        return (query._limit !== undefined) && query._limit > 0 && query._offset <= 0
                        ? sql.replace('delete', `delete top (${query._limit})`)
                        : sql;
    }

    /**
     * Compile the random statement into SQL.
     */
    public override compileRandom(_seed: string|number): string
    {
        return 'NEWID()';
    }

    /**
     * Compile the "limit" portions of the query.
     */
    protected override compileLimit(query: Builder, limit: number): string
    {
        limit = Math.round(limit);//here we make sure it's a INT

        if (limit && query._offset > 0) {
            return `fetch next ${limit} rows only`;
        }

        return '';
    }

    /**
     * Compile the "offset" portions of the query.
     */
    protected override compileOffset(_query: Builder, offset: number): string
    {
        offset = Math.round(offset); //here we make sure it's a INT

        if (offset) {
            return `offset ${offset} rows`;
        }

        return '';
    }

    /**
     * Compile the lock into SQL.
     */
    protected override compileLock(_query: Builder, _value: boolean|string): string
    {
        return '';
    }

    /**
     * Wrap a union subquery in parentheses.
     */
    protected override wrapUnion(sql: string): string
    {
        return `select * from (${sql}) as ${this.wrapTable('temp_table')}`;
    }

    /**
     * Compile an exists statement into SQL.
     */
    public override compileExists(query: Builder): string
    {
        const existsQuery = query.clone();

        existsQuery._columns = [];

        return this.compileSelect(existsQuery.selectRaw('1 [exists]').limit(1));
    }

    /**
     * Compile an update statement with joins into SQL.
     */
    protected override compileUpdateWithJoins(query: Builder, table: string, columns: string, where: string): string
    {
        const alias = table.split(' as ').at(-1);

        const joins = this.compileJoins(query, query._joins);

        return `update ${alias} set ${columns} from ${table} ${joins} ${where}`;
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public override compileUpsert(query: Builder, values: unknown[], uniqueBy: unknown[], update: unknown[]): string
    {
        const columns = this.columnize(Object.keys(values[0]));

        let sql = `merge ${this.wrapTable(query._from)} `;

        const $parameters = values.map((record) => {
            return `(${this.parameterize(record)})`;
        }).join(', ');

        sql += `using (values ${parameters}) ${this.wrapTable('laravel_source')} (${columns}) `;

        const on = uniqueBy.map((column) => {
            return `${this.wrap(`laravel_source.${column}`)} = ${this.wrap(`${query._from}.${column}`)}`;
        }).join(' and ');

        sql += `on ${on} `;

        if (update) {
            update = update.map((value, key) => {
                return is_numeric(key)
                    ? `${this.wrap(value)} = ${this.wrap(`laravel_source.${value}`)}`
                    : `${this.wrap(key)} = ${this.parameter(value)}`;
            }).join(', ');

            sql += `when matched then update set ${update} `;
        }

        sql += `when not matched then insert (${columns}) values (${columns});`;

        return sql;
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public override prepareBindingsForUpdate(bindings: unknown[], $values: unknown[]): unknown[]
    {
        const {select: _, cleanBindings} = bindings;

        return Object.values({...values, ...cleanBindings.flat()});
    }

    /**
     * Compile the SQL statement to define a savepoint.
     */
    public override compileSavepoint(name: string): string
    {
        return `SAVE TRANSACTION ${name}`;
    }

    /**
     * Compile the SQL statement to execute a savepoint rollback.
     */
    public override compileSavepointRollBack(name: string): string
    {
        return `ROLLBACK TRANSACTION ${name}`;
    }

    /**
     * Get the format for database stored dates.
     */
    public override getDateFormat(): string
    {
        return 'Y-m-d H:i:s.v';//FIXME: if used with formatting of Date in JS, a Date format helper class/function is needed.
    }

    /**
     * Wrap a single string in keyword identifiers.
     */
    protected override wrapValue(value: string): string
    {
        return value === '*' ? value : `[${value.replaceAll(']', ']]')}]`;
    }

    /**
     * Wrap the given JSON selector.
     */
    protected override wrapJsonSelector(value: string): string
    {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_value(${field}${path})`;
    }

    /**
     * Wrap the given JSON boolean value.
     */
    protected override wrapJsonBooleanValue(value: string): string
    {
        return `'${value}'`;
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    public override wrapTable(table: Expression|string): string
    {
        if (! this.isExpression(table)) {
            return this.wrapTableValuedFunction(super.wrapTable(table));
        }

        return this.getValue(table);
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    protected override wrapTableValuedFunction(table: string): string
    {
        let matches;
        if ((matches = table.match(/^(.+?)(\(.*?\))]$/)) !== null) {
            table = `${matches[1]}]${matches[2]}`;
        }

        return table;
    }
}
