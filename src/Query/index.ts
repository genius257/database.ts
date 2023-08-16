import Relation from "../Eloquent/Relations/Relation";
import Expression from "./Expression";
import type Grammar from "./Grammars/Grammar";
import IndexHint from "./IndexHint";

type SqlValue = number | string | Uint8Array | null;
type Value = SqlValue;

type BindingKey = 'select'
    | 'from'
    | 'join'
    | 'where'
    | 'groupBy'
    | 'having'
    | 'order'
    | 'union'
    | 'unionOrder'

type Bindings<K extends BindingKey = BindingKey> = Record<K, Array<Value>>;

export type Aggregate = {
    columns: string[], //FIXME: it is unclear is string is needed, or if T extends string should be used, to allow Builder to pass valid columns. It depends if the selected fileds is guarenteed to only be from the table itself.
    function: unknown,
};

export type Union = {
    all: unknown,
    query: Builder,
}

export type Order = {
    sql?: unknown,
    column: unknown,
    direction: unknown,
}

export type Join = { //FIXME: remove? as Builder._joins inintially was expected to be this, but turns out might be JoinClause instances instead.
    table: unknown,
    joins: unknown[],
    type: unknown, //FIXME: this needs to be a fixed number of strings
}

export type WhereOfType<T extends Where['type']> = Where & { type: T };

export type Where = { type: 'Expression', column: Function | string | unknown[] | Expression, boolean: string }
    | { type: 'Basic', column: unknown, operator: unknown, value: unknown, boolean: string }
    | { type: 'JsonBoolean', column: unknown, operator: unknown, value: unknown, boolean: string } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'Bitwise', column: unknown, operator: unknown, value: unknown, boolean: string }
    | { type: 'Column', first: string | unknown[], operator: string, second: string, boolean: string }
    | { type: 'raw', sql: string, boolean: string }
    | { type: 'In', column: Expression|string, values: unknown, boolean: string }
    | { type: 'NotIn', column: Expression | string, values: unknown, boolean: string }
    | { type: 'InRaw', column: string, values: unknown[], boolean: string }
    | { type: 'NotInRaw', column: string, values: unknown[], boolean: string }
    | { type: 'Null', column: string | unknown | Expression, boolean: string }
    | { type: 'NotNull', column: string | unknown | Expression, boolean: string }
    | { type: 'between', column: Expression | string, values: Iterable<unknown>, boolean: string, not: boolean }
    | { type: 'betweenColumns', column: Expression | string, values: unknown[], boolean: string, not: boolean }
    | { type: 'Date'|'Time'|'Day'|'Month'|'Year', column: Expression | string, boolean: string, operator: string, value: unknown } //Type narrowed to list of finite possiblities, via calls to ambigius usage in method, see source: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L1601
    | { type: 'Nested', query: Builder, boolean: string }
    | { type: 'Sub', column: Expression | string, operator: string, query: unknown, boolean: string }
    | { type: 'Exists', query: Builder, boolean: string }
    | { type: 'NotExists', query: Builder, boolean: string }
    | { type: 'RowValues', columns: unknown[], operator: string, values: unknown[], boolean: string }
    | { type: 'JsonContains', column: string, boolean: string, not: boolean } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'JsonContainsKey', column: string, boolean: string, not: boolean } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'JsonLength', column: string, operator: unknown, value: unknown, boolean: string } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'Fulltext', columns: string[], value: string, options: unknown[], boolean: string }

export type HavingOfType<T extends Having['type']> = Having & { type: T };

export type Having = { type: 'Expression', column: ConditionExpression, boolean: string }
    | { type: 'Basic', column: Expression | Function | string, operator: unknown, value: unknown, boolean: string }
    | { type: 'Bitwise', column: Expression | Function | string, operator: unknown, value: unknown, boolean: string }
    | { type: 'Nested', query: Builder, boolean: string }
    | { type: 'Null', column: string | unknown, boolean: string }
    | { type: 'NotNull', column: string | unknown, boolean: string }
    | { type: 'between', column: string, values: unknown, boolean: string, not: boolean }
    | { type: 'Raw', sql: string, boolean: string }

export class Builder<T extends Record<string, any> = Record<string, any>> {
    public _columns: (keyof T)[] | ["*"] = ["*"];
    public _distinct: boolean | Array<keyof T> = false; //FIXME: PHP type is boolean | array. Look into the array type and relevance.
    public _from: string | undefined;
    public _joins: JoinClause[] = [];
    public _wheres: Where[] = [];
    public _orders: Order[] = [];
    public _limit: number | undefined;
    public _offset: number | undefined;
    public _unions: Union[] = [];
    public _havings: Having[] = [];
    public _aggregate: Aggregate | undefined;
    public _indexHint: IndexHint | undefined;
    public _groups: unknown[] = [];
    public _lock: string | boolean = false;
    public _unionOrders: Array<Order> = [];
    public _unionLimit: number | undefined;
    public _unionOffset: number | undefined;
    public readonly _bindings: Bindings = {
        select: [],
        from: [],
        join: [],
        where: [],
        groupBy: [],
        having: [],
        order: [],
        union: [],
        unionOrder: [],
    };
    public readonly grammar: Grammar;
    public readonly _operators = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '<>',
        '!=',
        '<=>',
        'like',
        'like binary',
        'not like',
        'ilike',
        '&',
        '|',
        '^',
        '<<',
        '>>',
        '&~',
        'is',
        'is not',
        'rlike',
        'not rlike',
        'regexp',
        'not regexp',
        '~',
        '~*',
        '!~',
        '!~*',
        'similar to',
        'not similar to',
        'not ilike',
        '~~*',
        '!~~*',
    ] as const;
    public readonly _bitwiseOperators = [
        '&',
        '|',
        '^',
        '<<',
        '>>',
        '&~',
    ] as const;

    public constructor(grammar: Grammar/* = new Grammar()*/) {
        this.grammar = grammar;
    }

    /** Set the columns to be selected. */
    public select(columns: Builder<T>['_columns']) {
        this._bindings.select = [];

        //WARNING: currently this method does not allow selecting something as an alias. see https://github.com/laravel/framework/blob/1212afe74742189b1f199383f87ec1d00a7e8d0e/src/Illuminate/Database/Query/Builder.php#L265 for more details.
        this._columns = [...columns];

        return this;
    }

    public selectSub(query: Builder | string, as: string) {
        let bindings;
        [query, bindings] = this.createSub(query);

        return this.selectRaw(
            `(${query}) as ${this.grammar.wrap(as)}`,
            bindings,
        );
    }

    public selectRaw(expression: string, bindings: Array<Value> = []): this {
        this.addSelect(new Expression(expression));

        if (bindings.length > 0) {
            this.addBinding(bindings, 'select');
        }

        return this;
    }

    public fromSub(query: Builder | string, as: string) {
        let bindings;
        [query, bindings] = this.createSub(query);

        return this.fromRaw(
            `(${query}) as ${this.grammar.wrapTable(as)}`,
            bindings,
        );
    }

    /** Add a raw from clause to the query. */
    public fromRaw(expression: string, bindings: Array<Value> = []) {
        this._from = new Expression(expression);

        this.addBinding(bindings, 'from');

        return this;
    }

    /** Force the query to only return distinct results. */
    public distinct(): this;
    public distinct(distinct: boolean): this;
    public distinct(columns: Array<keyof T>): this;
    public distinct(columns: Array<keyof T> | boolean = true) {

        if (typeof columns === "boolean") {
            this._distinct = columns;
        } else {
            this._distinct = columns;
        }

        return this;
    }

    /** Set the table which the query is targeting. */
    public from(table: string | Builder, as?: string): this {
        if (this.isQueryable(table)) {
            return this.fromSub(table, as);
        }

        this._from = as !== undefined ? `${table} as ${as}` : table;

        return this;
    }

    /** Add a join clause to the query. */

    public join(table: string | Expression, on: ((join: JoinClause) => void)): this
    public join(table: string | Expression, first: string, second: string): this
    public join(table: string | Expression, first: string, operator: string, second: string, type?: string, where?: boolean): this //FIXME: type parameter COULD be a type of finite join type strings (inner|outer|cross|...)
    public join(table: string | Expression, first: string | ((clause: JoinClause) => void), operator?: string, second?: string, type: string = 'inner', where: boolean = false): this {
        const join = this.newJoinClause(this, type, table);

        if (typeof first === "function") {
            first(join);

            this._joins.push(join);

            this.addBinding(join.getBindings(), 'join');
        } else {
            const method = where ? 'where' : 'on';

            this._joins.push(join[method](first, operator, second));

            this.addBinding(join.getBindings(), 'join');
        }

        return this; //FIXME: return ts instance of Builder where columns (and column tables) are extended based on the join, if possible? like: return this as Builder<T & JoinColumns> the column type must be modified, to allow columns that can be "column", but also "table.column"
    }

    /** Add a "join where" clause to the query. */
    public joinWhere(table: Expression | string, first: string | ((clause: JoinClause) => void), operator: string, second: string, type: string = 'inner'): this {
        return this.join(table, first, operator, second, type);
    }

    public where(column: keyof T, value: Value): this
    public where(column: keyof T, operator: string, value: Value, boolean?: string): this
    public where(column: keyof T, operator: Value | null = null, value: Value | null = null, boolean = 'and'): this { //FIXME: boolean property type narrowing to known valid query boolean operators
        if (column instanceof ConditionExpression) {
            const type: Where['type'] = 'Expression';

            this._wheres.push({
                type,
                column,
                boolean
            });

            return this;
        }

        if (Array.isArray(column)) {
            return this.addArrayOfWheres(column, boolean);
        }

        [value, operator] = this.prepareValueAndOperator(
            value, operator, arguments.length === 2
        );

        if (typeof column === "function" && operator === null) {
            return this.whereNested(column, boolean);
        }

        if (this.isQueryable(column) && operator !== null) {
            const [sub, bindings] = this.createSub(column);

            return this.addBinding(bindings, 'where')
                .where(new Expression('(' + sub + ')'), operator, value, boolean);
        }

        if (this.invalidOperator(operator)) {
            [value, operator] = [operator, '='];
        }

        if (typeof value === "function") {
            return this.whereSub(column, operator, value, boolean);
        }

        if (value === null) {
            return this.whereNull(column, operator, value, boolean);
        }

        let type: Where['type'] = 'Basic';

        const columnString = /*(column instanceof ExpressionContract)
            ? this.grammar.getValue
            :*/ column;

        if (columnString.includes('->') && typeof value === "boolean") {
            value = new Expression(value ? 'true' : 'false');

            if (typeof column === "string") {
                type = 'JsonBoolean';
            }
        }

        if (this.isBitwiseOperator(operator)) {
            type = 'Bitwise';
        }

        this._wheres.push({
            type,
            column,
            operator,
            value,
            boolean,
        });

        if (!(value instanceof Expression)) {
            this.addBinding(this.flattenValue(value), 'where');
        }

        return this;
    }

    public addBinding(value: Value|Array<Value|BackedEnum>, type: keyof Builder<T>["_bindings"] = "where"): this {
        if (Array.isArray(value)) {
            this._bindings[type] = [...this._bindings[type], ...value]
                .map(value => this.castBinding(value));
        } else {
            this._bindings[type].push(value);
        }

        return this;
    }

    public toSql(): string {
        //FIXME: applyBeforeQueryCallbacks currently not invoked here. It does not seem needed, but may be, if lazy loading uses it. Check on this later!
        return this.grammar.compileSelect(this);
    }

    protected createSub(query: Function | Builder | string): unknown[] {
        if (typeof query === "function") {
            const callback = query;

            callback(query = this.forSubQuery());
        }

        return this.parseSub(query);
    }

    public addSelect(columns: unknown[] | Record<string, unknown>): this {
        if (Array.isArray(columns)) {
            columns.forEach(column => {
                if (this._columns.includes(column)) {
                    return;
                }

                this._columns.push(column);
            });
        } else {
            for (const [as, column] of Object.entries(columns)) {
                if (this.isQueryable(column)) {
                    if (this._columns.length === 1 && this._columns[0] === "*") {
                        this.select(`${this._from}.*`);
                    }

                    this.selectSub(column, as);
                } else {
                    if (this._columns.includes(column)) {
                        continue;
                    }

                    this._columns.push(column);
                }
            }
        }

        return this;
    }

    protected newJoinClause(parentQuery: Builder, type: string, table: string): JoinClause {
        return new JoinClause(parentQuery, type, table);
    }

    protected isQueryable(value: unknown): value is (Builder | Relation | Function) {
        return value instanceof Builder
            || value instanceof Relation
            || typeof value === "function";
    }

    protected addArrayOfWheres(column: unknown[] | Record<string, unknown>, boolean: string, method: string = "where"): this {
        return this.whereNested(query => {
            if (Array.isArray(column)) {
                column.forEach(value => query[method](...value));
            } else {
                for (const [key, value] of Object.entries(column)) {
                    query[method](key, '=', value, boolean);
                }
            }
        }, boolean);
    }

    public prepareValueAndOperator(value: string, operator: string, useDefault: boolean = false): [string, string] {
        if (useDefault) {
            return [operator, '='];
        } else if (this.invalidOperatorAndValue(operator, value)) {
            throw new Error('Illegal operator and value combination.');
        }

        return [value, operator];
    }

    public whereNested(callback: ((query: ReturnToType<this['forNestedWhere']>) => void), boolean: string = 'and'): this {
        const query = this.forNestedWhere();
        callback(query);

        return this.addNestedWhereQuery(query, boolean);
    }

    protected invalidOperatorAndValue(operator: string, value: unknown): boolean {
        return value === null
            && (this._operators as Readonly<Array<string>>).includes(operator)
            && !['=', '<>', '!='].includes(operator);
    }

    public forNestedWhere(): Builder {
        return this.newQuery().from(this._from);
    }

    protected whereSub(column: Expression | string, operator: string, callback: Function, boolean: string): this {
        const type: Where['type'] = 'Sub';

        // Once we have the query instance we can simply execute it so it can add all
        // of the sub-select's conditions to itself, and then we can cache it off
        // in the array of where clauses for the "main" parent query instance.
        const query = this.forSubQuery();
        callback(query);

        this._wheres.push({
            type,
            column,
            operator,
            query,
            boolean,
        });

        this.addBinding(query.getBindings(), 'where');

        return this;
    }

    protected invalidOperator(operator: string | null): boolean {
        return typeof operator !== "string" || !this._operators.includes(operator.toLowerCase())
            && !this.grammar.getOperators().includes(operator.toLowerCase());
    }

    public whereNull(columns: string | unknown[] | Expression, boolean: string = 'and', not: boolean = false): this {
        const type: Where['type'] = not ? 'NotNull' : 'Null';

        columns = Array.isArray(columns) ? columns : [columns]; //FIXME: when all is green, change columns paramter to array only and force all calls to wrap single values in array

        columns.forEach(column => this._wheres.push({
            type,
            column,
            boolean
        }));

        return this;
    }

    protected isBitwiseOperator(operator): boolean {
        return this._bitwiseOperators.includes(operator.toLowerCase())
            || this.grammar.getBitwiseOperators().includes(operator.toLowerCase());
    }

    protected flattenValue(value: unknown): unknown {
        return Array.isArray(value) ? value[0] : value;
    }

    protected forSubQuery(): Builder {
        this.newQuery();
    }

    protected parseSub(query: Builder | Relation | string): [string, unknown[]] {
        if (query instanceof Builder || query instanceof Relation) {
            query = this.prependDatabaseNameIfCrossDatabaseQuery(query);

            return [query.toSql(), query.getBindings()];
        }

        return [query, []];
    }

    public addNestedWhereQuery(query: Builder, boolean: string = 'and'): this {
        if (this._wheres.length > 0) {
            const type: Where['type'] = 'Nested';

            this._wheres.push({
                type,
                query,
                boolean,
            });

            this.addBinding(query.getRawBindings().where, 'where');
        }

        return this;
    }

    public newQuery(): Builder {
        return new Builder(this.grammar); //FIXME: source uses new static, instead of Builder. See: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L3639
    }

    public getBindings(): SqlValue[] {
        return Object.values(this._bindings).flat();
    }

    protected prependDatabaseNameIfCrossDatabaseQuery(query: Builder): Builder {
        //FIXME: cross database queries currently not supported, as a result of the reduced complexity choosen for the query builder (no database or processor available). see: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L393

        return query;
    }

    public getRawBindings(): this['_bindings'] {
        return this._bindings;
    }

    public getGrammar(): Grammar {
        return this.grammar;
    }

    public having(column: Expression | Function | string, operator: string | number | null = null, value: string | number | null = null, boolean: string = 'and'): this {
        let type: Having["type"] = 'Basic';

        if (column instanceof ConditionExpression) {
            type = 'Expression';

            this._havings.push({
                type,
                column,
                boolean,
            });

            return this;
        }

        // Here we will make some assumptions about the operator. If only 2 values are
        // passed to the method, we will assume that the operator is an equals sign
        // and keep going. Otherwise, we'll require the operator to be passed in.
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        if (typeof column === "function" && operator === null) {
            return this.havingNested(column, boolean);
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (this.invalidOperator(operator)) {
            [value, operator] = [operator, '='];
        }

        if (this.isBitwiseOperator(operator)) {
            type = 'Bitwise';
        }

        this._havings.push({
            type,
            column,
            operator,
            value,
            boolean
        });

        if (!(value instanceof Expression)) {
            this.addBinding(this.flattenValue(value), 'having');
        }

        return this;
    }

    public addNestedHavingQuery(query: Builder, boolean: string): this {
        if (query._havings.length > 0) {
            const type: Having['type'] = 'Nested';

            this._havings.push({
                type,
                query,
                boolean
            });

            this.addBinding(query.getRawBindings().having, 'having');
        }

        return this;
    }

    public havingNull(columns: string | unknown[], boolean: string = 'and', not: boolean = false): this {
        const type = not ? 'NotNull' : 'Null';

        columns = Array.isArray(columns) ? columns : [columns];

        columns.forEach(column => this._havings.push({
            type,
            column,
            boolean,
        }));

        return this;
    }

    public havingBetween(column: string, values: Array<unknown>, boolean: string = 'and', not: boolean = false): this {
        const type: Having['type'] = 'between';

        /*
        //FIXME: Currently nothing seems available that matches the srouce type of CarbonPeriod, in terms of functionality!
        if (values instanceof CarbonPeriod) {
            values = [values.start, values.end];
        }
        */
        
        this._havings.push({
            type,
            column,
            values,
            boolean,
            not,
        });

        this.addBinding(this.cleanBindings(values.flat()).slice(0, 2), 'having');

        return this;
    }

    public havingRaw(sql: string, bindings: unknown[], boolean: string = 'and'): this {
        const type: Having['type'] = 'Raw';

        this._havings.push({
            type,
            sql,
            boolean,
        });

        this.addBinding(bindings, 'having');

        return this;
    }

    public mergeWheres(wheres: Where[], bindings: unknown[]): this {
        this._wheres = [...this._wheres, ...wheres];

        this._bindings.where = [...this._bindings.where, ...bindings];

        return this;
    }

    public whereIn(column: Expression|keyof T, values: unknown, boolean: string = 'and', not: boolean = false): this {
        const type: Where['type'] = not ? 'NotIn' : 'In';

        // If the value is a query builder instance we will assume the developer wants to
        // look for any values that exist within this given query. So, we will add the
        // query accordingly so that this query is properly executed when it is run.
        if (this.isQueryable(values)) {
            const [query, bindings] = this.createSub(values);

            values = [new Expression(query)];

            this.addBinding(bindings, 'where');
        }

        // Next, if the value is Arrayable we need to cast it to its raw array form so we
        // have the underlying array value instead of an Arrayable object which is not
        // able to be added as a binding, etc. We will then add to the wheres array.
        // WARNING: here source checks for classes that implement the Arrayable interface, interfaces does not work like this in JS and Arrayable is not currently being implemented, due to a required reduction in complexity and obscurity. See source: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L1089

        this._wheres.push({
            type,
            column,
            values,
            boolean
        });

        this.addBinding(this.cleanBindings(values), 'where');

        return this;
    }

    public cleanBindings(bindings: Array<SqlValue | Expression>): Array<SqlValue> {
        return bindings
            .filter((binding): binding is Exclude<typeof binding, Expression> => !(binding instanceof Expression)) //WARNING: Source uses reject method from the collection class, acts as an inverted fitler method, so i inverted the conditional in JS. See soruce: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L3775
            .map(binding => this.castBinding(binding));
    }

    public castBinding(value: SqlValue|BackedEnum): SqlValue {
        return value instanceof BackedEnum ? value.value : value;
    }

    public havingNested(callback: Function, boolean: string = 'and'): this {
        const query = this.forNestedWhere();
        callback(query);

        return this.addNestedHavingQuery(query, boolean);
    }

    public take(value: number): this {
        return this.limit(value);
    }

    public limit(value: number): this {
        const property = this._unions.length > 0 ? 'unionLimit' : 'limit' as const;

        if (value >= 0) {
            this[`_${property}`] = value !== null ? Math.round(value) : undefined;
        }

        return this;
    }

    public whereColumn(first: string | unknown[], operator: string | unknown[] = null, second: string | null = null, boolean: string | null = 'and'): this {
        // If the column is an array, we will assume it is an array of key-value pairs
        // and can add them each as a where clause. We will maintain the boolean we
        // received when the method was called and pass it into the nested where.
        if (Array.isArray(first)) {
            return this.addArrayOfWheres(first, boolean, 'whereColumn');
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (this.invalidOperator(operator)) {
            [second, operator] = [operator, '='];
        }

        // Finally, we will add this where clause into this array of clauses that we
        // are building for the query. All of them will be compiled via a grammar
        // once the query is about to be executed and run against the database.
        const type: Where['type'] = 'Column';

        this._wheres.push({
            type,
            first,
            operator,
            second,
            boolean,
        });

        return this;
    }

    public whereBetween(column: Expression | string, values: Array<unknown>, boolean: string = 'and', not: boolean = false): this {
        const type: Where['type'] = 'between';

        //FIXME: CarbonPeriod or eqivilent not available currently. See source: https://github.com/laravel/framework/blob/8bea6888cce328cfbf1ffeef623aa6abbbc1059b/src/Illuminate/Database/Query/Builder.php#L1264C32-L1264C44
        /*
        if (values instanceof CarbonPeriod) {
            values = [values.start, values.end];
        }
        */
        
        this._wheres.push({
            type,
            column,
            values,
            boolean,
            not
        });

        this.addBinding(this.cleanBindings(values.flat()).slice(0, 2), 'where');

        return this;
    }

    public when(): HigherOrderWhenProxy<this>
    public when<T>(value: ((query: this) => T)|T): HigherOrderWhenProxy<this>
    public when<V, T>(value:((query: this) => V)|V, callback:((query: this, value: V)=>T), $default?:((query: this, value: V)=> T)): this|Exclude<T, null|undefined|void>
    public when<V, T>(value:((query: this) => V)|V|null = null, callback:((query: this, value: V)=>T)|null = null, $default:((query: this, value: V)=> T)|null = null): this|Exclude<T, null|undefined|void> {
        value = typeof value === "function" ? value(this) : value;

        if (value === null) {
            return new HigherOrderWhenProxy(this);
        }

        if (callback === null) {
            return (new HigherOrderWhenProxy(this)).condition(value);
        }

        if (value) {
            return callback(this, value) ?? this;
        } else if ($default) {
            return $default(this, value) ?? this;
        }

        return this;
    }

    //FIXME: add method overloads based on usage in unit tests.
    public unless<T, V>(
        value: ((query: this) => T)|T|null = null,
        callback: ((query: this, value: T) => V)|null = null,
        $default: ((query: this, value: T) => V)|null = null
    ): this|Exclude<V, null|undefined|void> {
        value = typeof value === "function" ? value(this) : value;

        if (value === null) {
            return (new HigherOrderWhenProxy(this)).negateConditionOnCapture();
        }

        if (callback === null) {
            return (new HigherOrderWhenProxy(this)).condition(!value);
        }

        if (!value) {
            return callback(this, value) ?? this;
        } else if ($default !== null) {
            return $default(this, value) ?? this;
        }

        return this;
    }

    public orWhereBetween(column: Expression|string, values: unknown[]): this {
        return this.whereBetween(column, values, 'or');
    }

    public orWhereNotBetween(column: Expression|string, values: unknown[]): this {
        return this.whereNotBetween(column, values, 'or');
    }

    public whereNotBetween(column: Expression|string, values: unknown[], boolean: string = 'and'): this {
        return this.whereBetween(column, values, boolean, true);
    }

    public whereBetweenColumns(column: Expression|string, values: unknown[], boolean: string = 'and', not: boolean = false): this {
        const type: Where['type'] = 'betweenColumns';

        this._wheres.push({
            type,
            column,
            values,
            boolean,
            not
        });

        return this;
    }

    public whereNotBetweenColumns(column: Expression|string, values: unknown[], boolean: string = 'and'): this {
        return this.whereBetweenColumns(column, values, boolean, true);
    }

    public orWhereBetweenColumns(column: Expression|string, values: unknown[]): this {
        return this.whereBetweenColumns(column, values, 'or');
    }

    public orWhereNotBetweenColumns(column: Expression|string, values: unknown[]): this {
        return this.whereBetweenColumns(column, values, 'or');
    }

    //FIXME: add method override signatures, based on usage in unit tests.
    public orWhere(column: Function|string|unknown[]|Expression, operator: unknown = null, value: unknown = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.where(column, operator, value, 'or');
    }

    public orWhereNot(column: Function|string|unknown[]|Expression, operator: unknown = null, value: unknown = null): this {
        return this.whereNot(column, operator, value, 'or');
    }

    public whereNot(column: Function|string|unknown[]|Expression, operator: unknown = null, value: unknown = null, boolean: string = 'and'): this {
        if (Array.isArray(column)) {
            return this.whereNested((query: Builder) => query.where(column, operator, value, boolean), `${boolean} not`);
        }

        return this.where(column, operator, value, `${boolean} not`);
    }
}

class ConditionExpression {
    //FIXME: implement and move to own file.
}

export class JoinClause extends Builder {
    public type: string;
    public table: string;
    //protected parentConnection: ConnectionInterface;
    protected parentGrammar: Grammar;
    //protected parentProcessor: Processor;
    protected parentClass: typeof Builder;

    public constructor(parentQuery: Builder, type: string, table: string) {
        const grammar = parentQuery.getGrammar();

        super(grammar);

        this.type = type;
        this.table = table;
        this.parentClass = parentQuery.constructor as typeof Builder;
        this.parentGrammar = grammar;
        // this.parentProcessor = parentQuery.getProcessor();
        // this.parentConnection = parentQuery.getConnection();
    }

    public on(first: Function | string, operator: string | null = null, second: Expression | string | null = null, boolean: string = 'and'): this {
        if (typeof first === "function") {
            return this.whereNested(first, boolean);
        }

        return this.whereColumn(first, operator, second, boolean);
    }

    public orOn(first: Function | string, operator: string | null = null, second: Expression | string | null = null): this {
        return this.on(first, operator, second, 'or');
    }

    public override newQuery(): JoinClause {
        return new JoinClause(this.newParentQuery(), this.type, this.table); //FIXME: source uses new static indsted, see: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/JoinClause.php#L122C34-L122C48
    }

    protected override forSubQuery(): Builder {
        return this.newParentQuery().newQuery();
    }

    protected newParentQuery(): Builder {
        const $class = this.parentClass;

        return new $class(this.parentGrammar);
    }
}

class BackedEnum {
    public value: SqlValue;
    //FIXME: implement
}
