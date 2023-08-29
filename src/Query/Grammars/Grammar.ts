import { Bindings, HavingOfType, Where, WhereOfType } from "..";
import BaseGrammar from "../../Grammar";
import Builder, { Aggregate, Having, Order, Union } from "../Builder";
import Expression from "../Expression";
import IndexHint from "../IndexHint";
import JoinClause from "../JoinClause";

export default class Grammar extends BaseGrammar {
    /** The grammar specific operators. */
    protected operators: Readonly<string[]> = [] as const;
    /** The grammar specific bitwise operators. */
    protected bitwiseOperators: Readonly<string[]> = [] as const;
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

    /** Compile a select query into SQL. */
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

    /** Compile the components necessary for a select clause. */
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

    /** Compile a union aggregate query into SQL. */
    protected compileUnionAggregate(query: Builder): string {
        const sql = this.compileAggregate(query, query._aggregate!); //FIXME: assuming aggregate is never undefined, when this method is called

        query._aggregate = undefined; //FIXME: source sets this to null, but nowhere is this "legal" from a type perspective, see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L994

        return `${sql} from (${this.compileSelect(query)}) as ${this.wrapTable('temp_table')}`;
    }

    /** Compile an exists statement into SQL. */
    public compileExists(query: Builder): string {
        const select = this.compileSelect(query);

        return `select exists(${select}) as ${this.wrap('exists')}`;
    }

    /** Compile an insert statement into SQL. */
    public compileInsert(query: Builder, values: unknown[]): string {
        // Essentially we will force every insert to be treated as a batch insert which
        // simply makes creating the SQL easier for us since we can utilize the same
        // basic routine regardless of an amount of records given to us to insert.
        const table = this.wrapTable(query._from);

        if (values.length === 0) {
            return `insert into ${table} default values`;
        }

        if (! Array.isArray(values[0])) {
            values = [values];
        }

        const columns = this.columnize(Object.keys(values[0]));

        // We need to build a list of parameter place-holders of values that are bound
        // to the query. Each insert should have the exact same number of parameter
        // bindings so we will loop through the record and parameterize them all.
        const parameters = values.map((record) => {
            return `(${this.parameterize(record)})`;
        }).join(', ');

        return `insert into $table (${columns}) values ${parameters}`;
    }

    /** Compile an insert ignore statement into SQL. */
    public compileInsertOrIgnore(_query: Builder, _value: unknown[]): string {
        throw new Error('This database engine does not support inserting while ignoring errors.');
    }

    /** Compile an insert and get ID statement into SQL. */
    public compileInsertGetId(query: Builder, values: unknown[], _sequence: string): string {
        return this.compileInsert(query, values);
    }

    /** Compile an insert statement using a subquery into SQL. */
    public compileInsertUsing(query: Builder, columns: unknown[], sql: string): string {
        const table = this.wrapTable(query._from);

        if ((columns.length === 0) || columns === ['*']) {
            return `insert into ${table} $sql`;
        }

        return `insert into ${table} (${this.columnize(columns)}) ${sql}`;
    }

    /** Compile an update statement into SQL. */
    public compileUpdate(query: Builder, values: unknown[]): string {
        const table = this.wrapTable(query._from);

        const columns = this.compileUpdateColumns(query, values);

        const where = this.compileWheres(query);

        return (
            (query._joins.length > 0)
                ? this.compileUpdateWithJoins(query, table, columns, where)
                : this.compileUpdateWithoutJoins(query, table, columns, where)
        ).trim();
    }

    /** Compile an update statement without joins into SQL. */
    protected compileUpdateWithoutJoins(query: Builder, table: string, columns: string, where: string): string {
        return `update ${table} set ${columns} ${where}`;
    }

    /** Compile an update statement with joins into SQL. */
    protected compileUpdateWithJoins(query: Builder, table: string, columns: string, where: string): string {
        const joins = this.compileJoins(query, query._joins);

        return `update ${table} ${joins} set ${columns} ${where}`;
    }

    /** Compile an "upsert" statement into SQL. */
    public compileUpsert(query: Builder, values: unknown[], uniqueBy: unknown[], update: unknown[]): string {
        throw new Error('This database engine does not support upserts.');
    }

    /** Prepare the bindings for an update statement. */
    public prepareBindingsForUpdate(bindings: Bindings, values: Record<string, unknown>): unknown[] {
        const {select: _, join: __, ...cleanBindings} = bindings;

        return [...bindings.join, ...Object.values(values), ...Object.values(cleanBindings).flat()];//WARNING: this may be incorrect! see source for ref: https://github.com/laravel/framework/blob/f9812236cc64ecf51dc44f9834a46c7e66783f7a/src/Illuminate/Database/Query/Grammars/Grammar.php#L1186
    }

    /** Compile a delete statement into SQL. */
    public compileDelete(query: Builder): string {
        const table = this.wrapTable(query._from);

        const where = this.compileWheres(query);

        return (
            query._joins.length > 0
                ? this.compileDeleteWithJoins(query, table, where)
                : this.compileDeleteWithoutJoins(query, table, where)
        ).trim();
    }

    /** Compile a delete statement without joins into SQL. */
    protected compileDeleteWithoutJoins(query: Builder, table: string, where: string): string {
        return `delete from ${table} ${where}`;
    }

    /** Compile a delete statement with joins into SQL. */
    protected compileDeleteWithJoins(query: Builder, table: string, where: string): string {
        const alias = table.split(' as ').at(-1);

        const joins = this.compileJoins(query, query._joins);

        return `delete ${alias} from ${table} ${joins} ${where}`;
    }

    /**  Prepare the bindings for a delete statement. */
    public prepareBindingsForDelete(bindings: Bindings): unknown[] {
        const {select: _, ...except} = bindings;
        return Object.values(except).flat();
    }

    /** Compile a truncate table statement into SQL. */
    public compileTruncate(query: Builder): Record<string, unknown[]> {
        return {
            [`truncate table ${this.wrapTable(query._from)}`]: []
        }
    }

    /** Compile the columns for an update statement. */
    protected compileUpdateColumns(query: Builder, values: Record<string, unknown>): string {
        return Object.entries(values).map(([key, value]) => `${this.wrap(key)} = ${this.parameter(value)}`).join(', ');
    }

    /** Concatenate an array of segments, removing empties. */
    protected concatenate(segments: Record<string, unknown>): string
    protected concatenate(segments: Array<unknown> | Record<string, unknown>): string {
        if (!Array.isArray(segments)) {
            segments = Object.values(segments);
        }

        return segments
            .filter(value => value !== "") //FIXME: source casts value to string, i currently don't!, see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L1338
            .join(' ');
    }

    /** Wrap a union subquery in parentheses. */
    protected wrapUnion(sql: string): string {
        return `(${sql})`;
    }

    /** Compile the "union" queries attached to the main query. */
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

    /** Compile an aggregated select clause. */
    protected compileAggregate(query: Builder, aggregate: Aggregate): string {
        let column = this.columnize(aggregate.columns);

        if (Array.isArray(query._distinct)) {
            column = `distinct${this.columnize(query._distinct)}`;
        } else if (query._distinct === true && column !== '*') {
            column = `distinct ${column}`;
        }

        return `select ${aggregate.function}(${column}) as aggregate`;
    }

    /** Compile the "order by" portions of the query. */
    protected compileOrders(query: Builder, orders: Order[]): string {
        if (orders.length > 0) {
            return `order by ${this.compileOrdersToArray(query, orders).join(', ')}`;
        }

        return '';
    }

    /** Compile the query orders to an array. */
    protected compileOrdersToArray(_query: Builder, orders: Order[]): string[] {
        return orders.map(order => order?.sql ?? `${this.wrap(order.column)} ${order.direction}`);
    }

    /** Compile the "select *" portion of the query. */
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

    /** Compile the "limit" portions of the query. */
    protected compileLimit(_query: Builder, limit: number): string {
        return `limit ${Math.round(limit)}`;//TODO: in source limit is casted to int, this would be best match in JS? see: https://github.com/laravel/framework/blob/19b42097f542a837d3c0e6aad2abaf2b05a6cbee/src/Illuminate/Database/Query/Grammars/Grammar.php#L916
    }

    /** Compile the "offset" portions of the query. */
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

    /** Compile the "join" portions of the query. */
    protected compileJoins(query: Builder, joins: JoinClause[]): string {
        return joins.map(join => {
            const table = this.wrapTable(join.table);

            const nestedJoins = join._joins.length === 0 ? '' : ` ${this.compileJoins(query, join._joins)}`;

            const tableAndNestedJoins = join._joins.length === 0 ? table : `(${table}${nestedJoins})`;

            return `${join.type} join ${tableAndNestedJoins} ${this.compileWheres(join)}`.trim();
        }).join(' ');
    }

    /** Compile the "where" portions of the query. */
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

    /** Compile the "group by" portions of the query. */
    protected compileGroups(_query: Builder, groups: Array<Expression | number | string>): string {
        return `group by ${this.columnize(groups)}`;
    }

    /** Compile the "having" portions of the query. */
    protected compileHavings(query: Builder, _?: unknown): string {
        return `having ${this.removeLeadingBoolean(query._havings.map(having => `${having.boolean} ${this.compileHaving(having)}`).join(' '))}`
    }

    /** Compile the lock into SQL. */
    protected compileLock(_query: Builder, value: boolean|string): string {
        return typeof value === "string" ? value : '';
    }

    /** Determine if the grammar supports savepoints. */
    public supportsSavepoints(): boolean {
        return true;
    }

    /** Compile the SQL statement to define a savepoint. */
    public compileSavepoint(name: string): string {
        return `SAVEPOINT ${name}`;
    }

    /** Compile the SQL statement to execute a savepoint rollback. */
    public compileSavepointRollBack(name: string): string {
        return `ROLLBACK TO SAVEPOINT ${name}`;
    }

    /** Compile a single union statement. */
    protected compileUnion(union: Union): string {
        const conjunction = union.all ? ' union all ' : ' union ';

        return `${conjunction}${this.wrapUnion(union.query.toSql())}`;
    }

    /** Get an array of all the where clauses for the query. */
    protected compileWheresToArray(query: Builder): string[] {
        return query._wheres.map(where => `${where.boolean} ${this[`where${where.type}`](query, where)}`);
    }

    /** Remove the leading boolean from a statement. */
    protected removeLeadingBoolean(value: string): string { 
        return value.replace(/and |or /i, ''); //FIXME: varify that this matches srouce preg_replace functionality. see: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Grammars/Grammar.php#L1350
    }

    public substituteBindingsIntoRawSql(sql: string, bindings: Bindings): string {
        bindings = Object.fromEntries(Object.entries(bindings).map(([key, value]) => [key, this.escape(value)]));

        let query = '';

        let isStringLiteral = false;

        for (let i = 0; i < sql.length; i++) {
            const char = sql[i];
            const nextChar = sql[i + 1] ?? null;

            // Single quotes can be escaped as '' according to the SQL standard while
            // MySQL uses \'. Postgres has operators like ?| that must get encoded
            // in PHP like ??|. We should skip over the escaped characters here.
            if (["\'", "''", '??'].includes(`${char}${nextChar}`)) {
                query += `${char}${nextChar}`;
                i += 1;
            } else if (char === "'") { // Starting / leaving string literal...
                query += char;
                isStringLiteral = ! isStringLiteral;
            } else if (char === '?' && ! isStringLiteral) { // Substitutable binding...
                query += bindings.shift() ?? '?';
            } else { // Normal character...
                query += char;
            }
        }

        return query;
    }

    /** Get the grammar specific bitwise operators. */
    public getBitwiseOperators() {
        return this.bitwiseOperators;
    }

    /**  Get the grammar specific operators. */
    public getOperators() {
        return this.operators;
    }

    /** Format the where clause statements into one string. */
    protected concatenateWhereClauses(query: Builder, sql: unknown[]): string {
        const conjunction = query instanceof JoinClause ? 'on' : 'where';

        return `${conjunction} ${this.removeLeadingBoolean(sql.join(' '))}`;
    }

    /** Compile a single having clause. */
    protected compileHaving(having: Having): string {
        // If the having clause is "raw", we can just return the clause straight away
        // without doing any more processing on it. Otherwise, we will compile the
        // clause into SQL based on the components that make it up from builder.
        switch (having.type) {
            case 'Raw':
                return having.sql;
            // case 'between':
            case 'Between': //FIXME: souce deviation
                return this.compileHavingBetween(having);
            case 'Null':
                return this.compileHavingNull(having);
            case 'NotNull':
                return this.compileHavingNotNull(having);
            // case 'bit':
            case 'Bit': //FIXME: souce deviation
                return this.compileHavingBit(having);
            case 'Expression':
                return this.compileHavingExpression(having);
            case 'Nested':
                return this.compileNestedHavings(having);
            default:
                return this.compileBasicHaving(having);
        }
    }

    /** Compile a "between" having clause. */
    protected compileHavingBetween(having: HavingOfType<'Between'>): string {
        const between = having.not ? 'not between' : 'between';

        const column = this.wrap(having.column);

        const min = this.parameter(having.values[0]);

        const max = this.parameter(having.values.at(-1));

        return `${column} ${between} ${min} and ${max}`;
    }

    /** Compile a having null clause. */
    protected compileHavingNull(having: HavingOfType<'Null'>): string {
        const column = this.wrap(having.column);

        return `${column} is null`;
    }

    /** Compile a having not null clause. */
    protected compileHavingNotNull(having: HavingOfType<'NotNull'>): string {
        const column = this.wrap(having.column);

        return `${column} is not null`;
    }

    /** Compile a having clause involving a bit operator. */
    protected compileHavingBit(having: HavingOfType<'Bit'>): string {
        const column = this.wrap(having.column);

        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter}) != 0`;
    }

    /** Compile a having clause involving an expression. */
    protected compileHavingExpression(having: HavingOfType<'Expression'>): string {
        return having.column.getValue(this);
    }

    /** Compile a nested having clause. */
    protected compileNestedHavings(having: HavingOfType<'Nested'>): string {
        return `(${this.compileHavings(having.query).substring(7)})`;
    }

    /** Compile a basic having clause. */
    protected compileBasicHaving(having: HavingOfType<'Basic'>): string {
        const column = this.wrap(having.column);

        const parameter = this.parameter(having.value);

        return `${column} ${having.operator} ${parameter}`;
    }

    /** Compile a basic where clause. */
    protected whereBasic(query: Builder, where: WhereOfType<'Basic'>): string {
        const value = this.parameter(where.value);

        const operator = where.operator.replace('?', '??');//FIXME: should we replace all instead?

        return `${this.wrap(where.column)} ${operator} ${value}`;
    }

    /** Compile a nested where clause. */
    protected whereNested(query: Builder, where: WhereOfType<'Nested'>) {
        // Here we will calculate what portion of the string we need to remove. If this
        // is a join clause query, we need to remove the "on" portion of the SQL and
        // if it is a normal query we need to take the leading "where" of queries.
        const offset = where.query instanceof JoinClause ? 3 : 6;

        return `(${this.compileWheres(where.query).substring(offset)})`;
    }

    /** Compile a "where null" clause. */
    protected whereNull(query: Builder, where: WhereOfType<'Null'>): string {
        return `${this.wrap(where.column)} is null`;
    }

    /** Compile a where condition with a sub-select. */
    protected whereSub(query: Builder, where: WhereOfType<'Sub'>): string {
        const select = this.compileSelect(where.query);

        return `${this.wrap(where.column)} ${where.operator} (${select})`;
    }

    /** Compile a clause based on an expression. */
    public whereExpression(query: Builder, where: WhereOfType<'Expression'>): string {
        return where.column.getValue(this);
    }

    /** Compile a bitwise operator where clause. */
    protected whereBitwise(query: Builder, where: WhereOfType<'Bitwise'>): string {
        return this.whereBasic(query, where);
    }

    /** Compile a "where JSON boolean" clause. */
    protected whereJsonBoolean(query: Builder, where: WhereOfType<'JsonBoolean'>): string { //FIXME: json related methods SHOULD be removed
        const column = this.wrapJsonBooleanSelector(where.column);

        const value = this.wrapJsonBooleanValue(this.parameter(where.value));

        return `${column} ${where.operator} ${value}`;
    }

    /** Compile a "where not null" clause. */
    protected whereNotNull(query: Builder, where: WhereOfType<'NotNull'>): string {
        return `${this.wrap(where.column)} is not null`;
    }

    /** Compile a "between" where clause. */
    protected whereBetween(_query: Builder, where: WhereOfType<"Between">): string {
        const between = where.not ? 'not between' : 'between';

        const min = this.parameter(where.values[0]);

        const max = this.parameter(where.values[1]);

        return `${this.wrap(where.column)} ${between} ${min} and ${max}`;
    }

    /** Compile a "between" where clause. */
    protected whereBetweenColumns(_query: Builder, where: WhereOfType<"BetweenColumns">): string {
        const between = where.not ? 'not between' : 'between';

        const min = this.wrap(where.values[0]);

        const max = this.wrap(where.values[1]);

        return `${this.wrap(where.column)} ${between} ${min} and ${max}`;
    }

    /** Compile a where clause comparing two columns. */
    protected whereColumn(query: Builder, where: WhereOfType<'Column'>): string {
        return `${this.wrap(where.first)} ${where.operator} ${this.wrap(where.second)}`;
    }

    /** Compile a raw where clause. */
    protected whereRaw(query: Builder, where: WhereOfType<'Raw'>): string {
        return where.sql;
    }

    /** Compile a "where in" clause. */
    protected whereIn(query: Builder, where: WhereOfType<'In'>): string {
        if (where.values.length > 0) {
            return `${this.wrap(where.column)} in (${this.parameterize(where.values)})`;
        }

        return '0 = 1';
    }

    /** Wrap the given JSON selector for boolean values. */
    protected wrapJsonBooleanSelector(value: string): string { //FIXME: json related methods SHOULD be removed
        return this.wrapJsonSelector(value);
    }

    /** Wrap the given JSON boolean value. */
    protected wrapJsonBooleanValue(value: string): string { //FIXME: json related methods SHOULD be removed
        return value;
    }

    /** Compile a "where not in" clause. */
    protected whereNotIn(query: Builder, where: WhereOfType<"NotIn">): string {
        if (where.values.length > 0) {
            return `${this.wrap(where.column)} not in (${this.parameterize(where.values)})`;
        }

        return '1 = 1';
    }

    /** Compile a "where not in raw" clause. */
    protected whereNotInRaw(query: Builder, where: WhereOfType<"NotInRaw">): string {
        if (where.values.length > 0) {
            return `${this.wrap(where.column)} not in (${where.values.join(', ')})`;
        }

        return '1 = 1';
    }

    /** Compile a "where in raw" clause. */
    protected whereInRaw(query: Builder, where: WhereOfType<"InRaw">): string {
        if (where.values.length > 0) {
            return `${this.wrap(where.column)} in (${where.values.join(', ')})`;
        }

        return '0 = 1';
    }

    /** Compile a "where date" clause. */
    protected whereDate(query: Builder, where: WhereOfType<"Date">): string {
        return this.dateBasedWhere('date', query, where);
    }

    /** Compile a "where time" clause. */
    protected whereTime(query: Builder, where: WhereOfType<"Time">): string {
        return this.dateBasedWhere('time', query, where);
    }

    /** Compile a "where day" clause. */
    protected whereDay(query: Builder, where: WhereOfType<"Day">): string {
        return this.dateBasedWhere('day', query, where);
    }

    /** Compile a "where month" clause. */
    protected whereMonth(query: Builder, where: WhereOfType<"Month">): string {
        return this.dateBasedWhere('month', query, where);
    }

    /** Compile a "where year" clause. */
    protected whereYear(query: Builder, where: WhereOfType<"Year">): string {
        return this.dateBasedWhere('year', query, where);
    }

    /** Compile a date based where clause. */
    protected dateBasedWhere(type: string, query: Builder, where: WhereOfType<"Date"|"Time"|"Day"|"Month"|"Year">): string {//FIXME: add function signatures for type and where combinations
        const value = this.parameter(where.value);

        return `${type}(${this.wrap(where.column)}) ${where.operator} ${value}`;
    }

    /** Compile a where exists clause. */
    protected whereExists(query: Builder, where: WhereOfType<"Exists">): string {
        return `exists (${this.compileSelect(where.query)})`;
    }

    /** Compile a where exists clause. */
    protected whereNotExists(query: Builder, where: WhereOfType<"NotExists">): string {
        return `not exists (${this.compileSelect(where.query)})`;
    }

    /** Compile a where row values condition. */
    protected whereRowValues(query: Builder, where: WhereOfType<"RowValues">): string {
        const columns = this.columnize(where.columns);

        const values = this.parameterize(where.values);

        return `(${columns}) ${where.operator} (${values})`;
    }

    /** Compile a "where JSON contains" clause. */
    protected whereJsonContains(_query: Builder, where: WhereOfType<"JsonContains">): string {
        const not = where.not ? 'not ' : '';

        return `${not}${this.compileJsonContains(where.column, this.parameter(where.value))}`;
    }

    /** Compile a "where JSON contains key" clause. */
    protected whereJsonContainsKey(query: Builder, where: WhereOfType<"JsonContainsKey">): string {
        const not = where.not ? 'not ' : '';

        return `${not}${this.compileJsonContainsKey(where.column)}`;
    }

    /** Compile a "where JSON length" clause. */
    protected whereJsonLength(query: Builder, where: WhereOfType<"JsonLength">): string {
        return this.compileJsonLength(
            where.column,
            where.operator,
            this.parameter(where.value)
        );
    }

    /** Compile a "JSON length" statement into SQL. */
    protected compileJsonLength(_column: string, _operator: string, _value: string): string {
        throw new Error('This database engine does not support JSON length operations.');
    }

    /** Compile a "JSON value cast" statement into SQL. */
    public compileJsonValueCast(value: string): string {
        return value;
    }

    public whereFullText(_query: Builder, _where: WhereOfType<"Fulltext">): string {
        throw new Error('This database engine does not support fulltext search operations.');
    }

    /** Compile a "JSON contains key" statement into SQL. */
    protected compileJsonContainsKey(_column: string): string {
        throw new Error('This database engine does not support JSON contains key operations.');
    }

    /** Prepare the binding for a "JSON contains" statement. */
    public prepareBindingForJsonContains(binding: unknown): string {
        return JSON.stringify(binding);// source uses JSON_UNESCAPED_UNICODE flag: see source: https://github.com/laravel/framework/blob/256f4974a09e24170ceeeb9e573651fd5e1c703e/src/Illuminate/Database/Query/Grammars/Grammar.php#L623C38-L623C60
    }

    /** Compile a "JSON contains" statement into SQL. */
    protected compileJsonContains(_column: string, _value: string): string {
        throw new Error('This database engine does not support JSON contains operations.');
    }

    protected wrapJsonFieldAndPath(column: string): [string|number, string] {
        const [part1, ...part2] = column.split('->');//Fix for different behavior between PHP explode and JS string.prototype.split, when using limit parameter. see source: https://github.com/laravel/framework/blob/a76d8b2462bf06a8838f8b0838486d31bc497106/src/Illuminate/Database/Concerns/CompilesJsonPaths.php#L17

        const field = this.wrap(part1!);//part1 (index zero from string.prototype.split) will always contain a string.

        const path = part2.length > 0 ? `, ${this.wrapJsonPath(part2.join('->'), '->')}` : '';

        return [field, path];
    }

    protected wrapJsonPath(value: string, delimiter: string = '->'): string {
        value = value.replace(/([\\\\]+)?\\'/g, "''");

        const jsonPath = value.split(delimiter).map(segment => this.wrapJsonPathSegment(segment)).join('.');

        return `'$${jsonPath.startsWith('[') ? '' : '.'}${jsonPath}'`;
    }

    protected wrapJsonPathSegment(segment: string): string {
        const parts = segment.match(/(\[[^\]]+\])+$/);
        if (parts !== null) {
            const key = segment.lastIndexOf(parts[0]) === -1 ? segment : segment.substring(0, segment.lastIndexOf(parts[0]));

            if (key !== '') {
                return `"${key}"${parts[0]}`;
            }

            return parts[0];
        }

        return `"${segment}"`;
    }

    /** Compile the random statement into SQL. */
    public compileRandom(_seed: string|number): string {
        return 'RANDOM()';
    }
}
