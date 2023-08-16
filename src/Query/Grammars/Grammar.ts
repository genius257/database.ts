import { HavingOfType, WhereOfType } from "..";
import BaseGrammar from "../../Grammar";
import Builder, { Aggregate, Having, Order, Union } from "../Builder";
import IndexHint from "../IndexHint";
import JoinClause from "../JoinClause";

export default class Grammar extends BaseGrammar {
    /** The grammar specific operators. */
    protected operators: string[] = [];
    /** The grammar specific bitwise operators. */
    protected bitwiseOperators: string[] = [];
    /** The components that make up a select clause. */
    protected selectComponents = [
        'aggregate',
        'columns',
        'from',
        'indexHint',
        'joins',
        'wheres',
        'groups',
        'havings',
        'orders',
        'limit',
        'offset',
        'lock',
    ] as const;

    public compileSelect(query: Builder): string {
        if ((query._unions.length > 0 || query._havings.length > 0) && query._aggregate !== undefined) {
            return this.compileUnionAggregate(query);
        }

        const original = query._columns;

        let sql = this.concatenate(this.compileComponents(query)).trim();

        if (query._unions.length > 0) {
            sql = `${this.wrapUnion(sql)} ${this.compileUnions(query)}`;
        }

        query._columns = original;

        return sql;
    }

    protected compileComponents(query: Builder): Record<string, unknown> {
        const sql: Record<string, unknown> = {};

        this.selectComponents.forEach((component) => {
            const componentValue = query[`_${component}`];
            if (componentValue !== undefined) {
                componentValue;
                if (Array.isArray(componentValue) && componentValue.length === 0) {
                    return;
                }

                const method: `compile${Capitalize<typeof component>}` = `compile${(component.charAt(0).toUpperCase() + component.slice(1)) as Capitalize<typeof component>}`;

                sql[component] = this[method](query, componentValue);
            }
        })

        return sql;
    }

    protected compileUnionAggregate(query: Builder): string {
        const sql = this.compileAggregate(query, query._aggregate);

        query._aggregate = undefined; //FIXME: source sets this to null, but nowhere is this "legal" from a type perspective, see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L994

        return `${sql} from (${this.compileSelect(query)}) as ${this.wrapTable('temp_table')}`;
    }

    protected concatenate(segments: Record<string, unknown>): string
    protected concatenate(segments: Array<unknown> | Record<string, unknown>): string {
        if (!Array.isArray(segments)) {
            segments = Object.values(segments);
        }

        return segments
            .filter(value => value !== "") //FIXME: source casts value to string, i currently don't!, see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L1338
            .join(' ');
    }

    protected wrapUnion(sql: string): string {
        return `(${sql})`;
    }

    protected compileUnions(query: Builder): string {
        let sql = '';

        query._unions.forEach(union => {
            sql += this.compileUnion(union);
        });

        if (query._unionOrders.length > 0) {
            sql += ` ${this.compileOrders(query, query._unionOrders)}`;
        }

        if (query._unionLimit !== undefined) {
            sql += ` ${this.compileLimit(query, query._unionLimit)}`;
        }

        if (query._unionOffset !== undefined) {
            sql += ` ${this.compileOffset(query, query._unionOffset)}`;
        }

        return sql.trimStart();
    }

    protected compileAggregate(query: Builder, aggregate: Aggregate): string {
        let column = this.columnize(aggregate.columns);

        if (Array.isArray(query._distinct)) {
            column = `distinct${this.columnize(query._distinct)}`;
        } else if (query._distinct === true && column !== '*') {
            column = `distinct ${column}`;
        }

        return `select ${aggregate.function}(${column}) as aggregate`;
    }

    protected compileOrders(query: Builder, orders: Order[]): string {
        if (orders.length > 0) {
            return `order by ${this.compileOrdersToArray(query, orders).join(', ')}`;
        }

        return '';
    }

    protected compileOrdersToArray(query: Builder, orders: Order[]): string[] {
        return orders.map(order => order?.sql ?? `${this.wrap(order.column)} ${order.direction}`);
    }

    protected compileColumns(query: Builder, columns: string[]): string | undefined {
        // If the query is actually performing an aggregating select, we will let that
        // compiler handle the building of the select clauses, as it will need some
        // more syntax that is best handled by that function to keep things neat.
        if (query._aggregate !== undefined) {
            return;
        }

        const select = query._distinct !== false ? 'select distinct ' : 'select ';
        
        return `${select}${this.columnize(columns)}`;
    }

    protected compileLimit(_query: Builder, limit: number): string {
        return `limit ${Math.round(limit)}`;//TODO: in source limit is casted to int, this would be best match in JS? see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L916
    }

    protected compileOffset(_query: Builder, offset: number): string {
        return `offset ${Math.round(offset)}`;//TODO: in source limit is casted to int, this would be best match in JS? see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L928
    }

    /** Compile the "from" portion of the query. */
    protected compileFrom(_query: Builder, table: string): string {
        return `from ${this.wrapTable(table)}`;
    }

    protected compileIndexHint(_query: Builder, _indexHint: IndexHint): string {
        throw new Error('The current grammar implementation does not support index hinting'); //FIXME: currently not implemented in source! child classes from source implements this, but could cause runtime exceptions for other 3rd party implementaions!
    }

    protected compileJoins(query: Builder, joins: JoinClause[]): string {
        return joins.map(join => {
            const table = this.wrapTable(join.table);

            const nestedJoins = join._joins.length === 0 ? '' : ` ${this.compileJoins(query, join._joins)}`;

            const tableAndNestedJoins = join._joins.length === 0 ? table : `(${table}${nestedJoins})`;

            return `${join.type} join ${tableAndNestedJoins} ${this.compileWheres(join)}`.trim();
        }).join(' ');
    }

    protected compileWheres(query: Builder, _?: unknown): string {
        // Each type of where clause has its own compiler function, which is responsible
        // for actually creating the where clauses SQL. This helps keep the code nice
        // and maintainable since each clause has a very small method that it uses.
        if (query._wheres.length === 0) {
            return '';
        }

        // If we actually have some where clauses, we will strip off the first boolean
        // operator, which is added by the query builders for convenience so we can
        // avoid checking for the first clauses in each of the compilers methods.
        const sql = this.compileWheresToArray(query);
        if (sql.length > 0) {
            return this.concatenateWhereClauses(query, sql);
        }

        return '';
    }

    protected compileGroups(_query: Builder, groups: Array<unknown>): string {
        return `group by ${this.columnize(groups)}`;
    }

    protected compileHavings(query: Builder, _?: unknown): string {
        return `having ${this.removeLeadingBoolean(query._havings.map(having => `${having.boolean} ${this.compileHaving(having)}`).join(' '))}`
    }

    protected compileLock(_query: Builder, value: boolean|string): string {
        return typeof value === "string" ? value : '';
    }

    protected compileUnion(union: Union): string {
        const conjunction = union.all ? ' union all ' : ' union ';

        return `${conjunction}${this.wrapUnion(union.query.toSql())}`;
    }

    protected compileWheresToArray(query: Builder): string[] {
        return query._wheres.map(where => `${where.boolean} ${this[`where${where.type}`](query, where)}`);
    }

    protected removeLeadingBoolean(value: string): string { 
        return value.replace(/and |or /i, ''); //FIXME: varify that this matches srouce preg_replace functionality. see: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Grammars/Grammar.php#L1350
    }

    public getBitwiseOperators() {
        return this.bitwiseOperators;
    }

    public getOperators() {
        return this.operators;
    }

    protected concatenateWhereClauses(query: Builder, sql: unknown[]): string {
        const conjunction = query instanceof JoinClause ? 'on' : 'where';

        return `${conjunction} ${this.removeLeadingBoolean(sql.join(' '))}`;
    }

    protected compileHaving(having: Having): string {
        // If the having clause is "raw", we can just return the clause straight away
        // without doing any more processing on it. Otherwise, we will compile the
        // clause into SQL based on the components that make it up from builder.
        switch (having.type) {
            case 'Raw':
                return having.sql;
            case 'between':
                return this.compileHavingBetween(having);
            case 'Null':
                return this.compileHavingNull(having);
            case 'NotNull':
                return this.compileHavingNotNull(having);
            case 'bit':
                return this.compileHavingBit(having);
            case 'Expression':
                return this.compileHavingExpression(having);
            case 'Nested':
                return this.compileNestedHavings(having);
            default:
                return this.compileBasicHaving(having);
        }
    }

    protected compileHavingBetween(having: HavingOfType<'between'>): string {
        const between = having.not ? 'not between' : 'between';

        const column = this.wrap(having.column);

        const min = this.parameter(having.values[0]);

        const max = this.parameter(having.values.at(-1));

        return `${column} ${between} ${min} and ${max}`;
    }

    protected compileHavingNull(having: HavingOfType<'Null'>): string {
        const column = this.wrap(having.column);

        return `${column} is null`;
    }

    protected compileHavingNotNull(having: HavingOfType<'NotNull'>): string {
        const column = this.wrap(having.column);

        return `${column} is not null`;
    }

    protected compileHavingBit(having: HavingOfType<'Bit'>): string {
        const column = this.wrap(having.column);

        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter}) != 0`;
    }

    protected compileHavingExpression(having: HavingOfType<'Expression'>): string {
        return having.column.getValue(this);
    }

    protected compileNestedHavings(having: HavingOfType<'Nested'>): string {
        return `(${this.compileHavings(having.query).substring(7)})`;
    }

    protected compileBasicHaving(having: HavingOfType<'Basic'>): string {
        const column = this.wrap(having.column);

        const parameter = this.parameter(having.value);

        return `${column} ${having.operator} ${parameter}`;
    }

    protected whereBasic(query: Builder, where: WhereOfType<'Basic'>): string {
        const value = this.parameter(where.value);

        const operator = where.operator.replace('?', '??');

        return `${this.wrap(where.column)} ${operator} ${value}`;
    }

    protected whereNested(query: Builder, where: WhereOfType<'Nested'>) {
        // Here we will calculate what portion of the string we need to remove. If this
        // is a join clause query, we need to remove the "on" portion of the SQL and
        // if it is a normal query we need to take the leading "where" of queries.
        const offset = where.query instanceof JoinClause ? 3 : 6;

        return `(${this.compileWheres(where.query), offset})`;
    }

    protected whereNull(query: Builder, where: WhereOfType<'Null'>): string {
        return `${this.wrap(where.column)} is null`;
    }

    protected whereSub(query: Builder, where: WhereOfType<'Sub'>): string {
        const select = this.compileSelect(where.query);

        return this.wrap(`${where.column} ${where.operator} (${select})`);
    }

    public whereExpression(query: Builder, where: WhereOfType<'Expression'>): string {
        return where.column.getValue(this);
    }

    protected whereBitwise(query: Builder, where: WhereOfType<'Bitwise'>): string {
        return this.whereBasic(query, where);
    }

    protected whereJsonBoolean(query: Builder, where: WhereOfType<'JsonBoolean'>): string { //FIXME: json related methods SHOULD be removed
        const column = this.wrapJsonBooleanSelector(where.column);

        const value = this.wrapJsonBooleanValue(this.parameter(where.value));

        return `${column} ${where.operator} ${value}`;
    }

    protected whereNotNull(query: Builder, where: WhereOfType<'NotNull'>): string {
        return `${this.wrap(where.column)} is not null`;
    }

    protected whereColumn(query: Builder, where: WhereOfType<'Column'>): string {
        return `${this.wrap(where.first)} ${where.operator} ${this.wrap(where.second)}`;
    }

    protected whereRaw(query: Builder, where: WhereOfType<'raw'>): string {
        return where.sql;
    }

    protected whereIn(query: Builder, where: WhereOfType<'In'>): string {
        if (where.values.length > 0) {
            return `${this.wrap(where.column)} in (${this.parameterize(where.values)})`;
        }

        return '0 = 1';
    }

    protected wrapJsonBooleanSelector(value: string): string { //FIXME: json related methods SHOULD be removed
        return this.wrapJsonSelector(value);
    }

    protected wrapJsonBooleanValue(value: string): string { //FIXME: json related methods SHOULD be removed
        return value;
    }

    
}
