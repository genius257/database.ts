import Relation from "../Eloquent/Relations/Relation";
import Expression from "./Expression";
import type Grammar from "./Grammars/Grammar";
import IndexHint from "./IndexHint";
import structuredClone from '@ungap/structured-clone';

/**
 * @see https://stackoverflow.com/a/57227253 source
 */
function isPureObject(input: unknown): input is Record<string, unknown> {
    return null !== input && 
      typeof input === 'object' &&
      Object.getPrototypeOf(input).isPrototypeOf(Object);
}

type Unpacked<T> = T extends (infer U)[] ? U : T;

type SqlValue = number | string | Uint8Array | null | boolean;
type Value = SqlValue | Expression;

// eslint-disable-next-line @typescript-eslint/ban-types
export type TBoolean = 'and' | 'or' | (string & {});

type BindingKey = 'select'
    | 'from'
    | 'join'
    | 'where'
    | 'groupBy'
    | 'having'
    | 'order'
    | 'union'
    | 'unionOrder'

//export type Bindings<K extends BindingKey = BindingKey> = Record<K, Array<Value>>;
export type Bindings = {
    select: unknown[],
    from: unknown[],
    join: unknown[],
    where: unknown[],
    groupBy: unknown[],
    having: unknown[],
    order: unknown[],
    union: unknown[],
    unionOrder: unknown[],
};
export type BindingOfType<T extends keyof Bindings> = Bindings[T];


export type Aggregate = {
    columns: string[], //FIXME: it is unclear is string is needed, or if T extends string should be used, to allow Builder to pass valid columns. It depends if the selected fileds is guarenteed to only be from the table itself.
    function: string,
};

export type Union = {
    all: boolean,
    query: Builder,
}

export type Order = 
    {
        column: Expression|string,
        direction: 'asc'|'desc',
    }
    | {type: 'Raw', sql: string}
    | {sql: string}

export type Join = { //FIXME: remove? as Builder._joins inintially was expected to be this, but turns out might be JoinClause instances instead.
    table: unknown,
    joins: unknown[],
    type: unknown, //FIXME: this needs to be a fixed number of strings
}

export type WhereOfType<T extends Where['type']> = Where & { type: T };

export type Where = { type: 'Expression', column: ((query: Builder) => void) | string | unknown[] | Expression, boolean: TBoolean }
    | { type: 'Basic', column: string, operator: string, value: string | number | boolean | Expression | Uint8Array, boolean: TBoolean }
    | { type: 'JsonBoolean', column: string, operator: unknown, value: unknown, boolean: TBoolean } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'Bitwise', column: string, operator: string, value: string | number | boolean | Expression | Uint8Array, boolean: TBoolean }
    | { type: 'Column', first: string | unknown[], operator: string, second: string, boolean: TBoolean }
    | {
        //type: 'raw', 
        type: 'Raw', //FIXME: from source, correct replacement be
        sql: string, boolean: TBoolean
    }
    | { type: 'In', column: Expression|string, values: unknown, boolean: TBoolean }
    | { type: 'NotIn', column: Expression | string, values: unknown, boolean: TBoolean }
    | { type: 'InRaw', column: string, values: unknown[], boolean: TBoolean }
    | { type: 'NotInRaw', column: string, values: unknown[], boolean: TBoolean }
    | { type: 'Null', column: string | Expression, boolean: TBoolean }
    | { type: 'NotNull', column: string | Expression, boolean: TBoolean }
    // | { type: 'between', column: Expression | string, values: Array<unknown>, boolean: string, not: boolean }
    | { type: 'Between', column: Expression | string, values: Array<unknown>, boolean: TBoolean, not: boolean } //FIXME: souce deviation
    // | { type: 'betweenColumns', column: Expression | string, values: unknown[], boolean: string, not: boolean }
    | { type: 'BetweenColumns', column: Expression | string, values: unknown[], boolean: TBoolean, not: boolean } //FIXME: souce deviation
    | { type: 'Date'|'Time'|'Day'|'Month'|'Year', column: Expression | string, boolean: TBoolean, operator: string, value: unknown } //Type narrowed to list of finite possiblities, via calls to ambigius usage in method, see source: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L1601
    | { type: 'Nested', query: Builder, boolean: TBoolean }
    | { type: 'Sub', column: Expression | string, operator: string, query: Builder, boolean: TBoolean }
    | { type: 'Exists', query: Builder, boolean: TBoolean }
    | { type: 'NotExists', query: Builder, boolean: TBoolean }
    | { type: 'RowValues', columns: string[], operator: string, values: unknown[], boolean: TBoolean }
    | { type: 'JsonContains', column: string, boolean: TBoolean, not: boolean } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'JsonContainsKey', column: string, boolean: TBoolean, not: boolean } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'JsonLength', column: string, operator: string, value: unknown, boolean: TBoolean } //FIXME: all json related functionality SHOULD be removed.
    | { type: 'Fulltext', columns: string[], value: string, options: {mode: string, expanded?: string, language?: string}, boolean: TBoolean }

export type HavingOfType<T extends Having['type']> = Having & { type: T };

export type Having = { type: 'Expression', column: Expression, boolean: TBoolean }
    | { type: 'Basic', column: Expression | ((query: Builder) => void) | string, operator: unknown, value: unknown, boolean: TBoolean }
    | { type: 'Bitwise', column: Expression | ((query: Builder) => void) | string, operator: unknown, value: unknown, boolean: TBoolean }
    | { type: 'Nested', query: Builder, boolean: TBoolean }
    | { type: 'Null', column: string | unknown, boolean: TBoolean }
    | { type: 'NotNull', column: string | unknown, boolean: TBoolean }
    // | { type: 'between', column: string, values: unknown, boolean: string, not: boolean }
    | { type: 'Between', column: string, values: unknown, boolean: TBoolean, not: boolean } //FIXME: souce deviation
    | { type: 'Raw', sql: string, boolean: TBoolean }

export class Builder<T extends Record<string, unknown> = Record<string, unknown>> {
    public _columns: Array<(keyof T)|Expression> | ["*"] = ["*"];
    public _distinct: boolean | Array<keyof T> = false; //FIXME: PHP type is boolean | array. Look into the array type and relevance.
    public _from: string | Expression | undefined; //FIXME: Source diviation
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
    public _lock: string | boolean | undefined = undefined;
    public _unionOrders: Array<Order> = [];
    public _unionLimit: number | undefined;
    public _unionOffset: number | undefined;
    public _bindings: Bindings = { //TODO: i would like readonly on this, but mergeBindings method currently makes that impossible
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
    public _beforeQueryCallbacks: Array<(query: Builder) => void> = [];

    public constructor(grammar: Grammar/* = new Grammar()*/) {
        this.grammar = grammar;
    }

    /** Set the columns to be selected. */
    public select(columns: Builder<T>['_columns']| Unpacked<Builder<T>['_columns']>) {
        this._bindings.select = [];

        columns = Array.isArray(columns) ? columns : [columns];

        //WARNING: currently this method does not allow selecting something as an alias. see https://github.com/laravel/framework/blob/1212afe74742189b1f199383f87ec1d00a7e8d0e/src/Illuminate/Database/Query/Builder.php#L265 for more details.
        this._columns = [...columns];

        return this;
    }

    public selectSub(query: Builder | string | ((query: Builder)=>void), as: string) {
        let bindings: ReturnType<Builder['createSub']>[1];
        [query, bindings] = this.createSub(query);

        return this.selectRaw(
            `(${query}) as ${this.grammar.wrap(as)}`,
            bindings,
        );
    }

    public selectRaw(expression: string, bindings: BindingOfType<'select'> = []): this {
        this.addSelect([new Expression(expression)]);

        if (bindings.length > 0) {
            this.addBinding(bindings, 'select');
        }

        return this;
    }

    public fromSub(query: Builder | string | ((query: Builder) => void), as: string) {
        let bindings;
        [query, bindings] = this.createSub(query);

        return this.fromRaw(
            `(${query}) as ${this.grammar.wrapTable(as)}`,
            bindings,
        );
    }

    /** Add a raw from clause to the query. */
    public fromRaw(expression: string|Expression, bindings: BindingOfType<'from'> = []) {
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
    public from(table: string): this
    public from(table: Builder, as: string): this
    public from(table: string | Builder, as: string|undefined = undefined): this {
        if (this.isQueryable(table)) {
            return this.fromSub(table, as!);
        }

        this._from = as !== undefined ? `${table} as ${as}` : table;

        return this;
    }

    /** Add a join clause to the query. */

    public join(table: string | Expression, on: ((join: JoinClause) => void)): this
    public join(table: string | Expression, first: string, second: string): this
    public join(table: string | Expression, first: string, operator: string, second: string, type?: string, where?: boolean): this //FIXME: type parameter COULD be a type of finite join type strings (inner|outer|cross|...)
    public join(table: string | Expression, first: string | ((clause: JoinClause) => void), operator?: string, second?: string, type: string = 'inner', where: boolean = false): this {
        const join = this.newJoinClause(this as Builder, type, table);

        if (typeof first === "function") {
            first(join);

            this._joins.push(join);

            this.addBinding(join.getBindings(), 'join');
        } else {
            const method = where ? 'where' : 'on';

            this._joins.push(join[method](first, operator!, second!));

            this.addBinding(join.getBindings(), 'join');
        }

        return this; //FIXME: return ts instance of Builder where columns (and column tables) are extended based on the join, if possible? like: return this as Builder<T & JoinColumns> the column type must be modified, to allow columns that can be "column", but also "table.column"
    }

    /** Add a "join where" clause to the query. */
    public joinWhere(table: Expression | string, first: string | ((clause: JoinClause) => void), operator: string, second: string, type: string = 'inner'): this {
        return this.join(table, first, operator, second, type, true);
    }

    public where(values: Array<[column: string, value: Value]|[column: string, operator: string, value: Value]>|Record<string, Value>|Expression): this
    public where(callback: (query: Builder) => void): this
    public where(column: keyof T | Expression, value: Value|boolean|Expression): this//FIXME: Source diviation
    public where(column: keyof T |  Expression, operator: string, value: Value|Expression|((query: this)=>void), boolean?: TBoolean): this//FIXME: Source diviation
    public where(column: keyof T | ((query: Builder) => void) | Expression, operator: Value | null = null, value: Value | null = null, boolean = 'and'): this { //FIXME: boolean property type narrowing to known valid query boolean operators
        if (column instanceof Expression) {
            const type: Where['type'] = 'Expression';

            this._wheres.push({
                type,
                column,
                boolean
            });

            return this;
        }

        // If the column is an array, we will assume it is an array of key-value pairs
        // and can add them each as a where clause. We will maintain the boolean we
        // received when the method was called and pass it into the nested where.
        if (Array.isArray(column) || isPureObject(column)) {
            return this.addArrayOfWheres(column, boolean);
        }

        // Here we will make some assumptions about the operator. If only 2 values are
        // passed to the method, we will assume that the operator is an equals sign
        // and keep going. Otherwise, we'll require the operator to be passed in.
        [value, operator] = this.prepareValueAndOperator(
            value, operator, arguments.length === 2
        );

        // If the column is actually a Closure instance, we will assume the developer
        // wants to begin a nested where statement which is wrapped in parentheses.
        // We will add that Closure to the query and return back out immediately.
        if (typeof column === "function" && operator === null) {
            return this.whereNested(column, boolean);
        }

        // If the column is a Closure instance and there is an operator value, we will
        // assume the developer wants to run a subquery and then compare the result
        // of that subquery with the given value that was provided to the method.
        if (this.isQueryable(column) && operator !== null) {
            const [sub, bindings] = this.createSub(column);

            return this.addBinding(bindings, 'where')
                .where(new Expression('(' + sub + ')'), operator, value, boolean);
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (this.invalidOperator(operator)) {
            [value, operator] = [operator, '='];
        }

        // If the value is a Closure, it means the developer is performing an entire
        // sub-select within the query and we will need to compile the sub-select
        // within the where clause to get the appropriate query record results.
        if (this.isQueryable(value)) {
            return this.whereSub(column, operator, value, boolean);
        }

        // If the value is "null", we will just assume the developer wants to add a
        // where null clause to the query. So, we will allow a short-cut here to
        // that method for convenience so the developer doesn't have to check.
        if (value === null) {
            return this.whereNull(column, boolean, operator !== '=');
        }

        let type: Where['type'] = 'Basic';

        const columnString = (column instanceof Expression)
            ? this.grammar.getValue(column)
            : column;

        // If the column is making a JSON reference we'll check to see if the value
        // is a boolean. If it is, we'll add the raw boolean string as an actual
        // value to the query to ensure this is properly handled by the query.
        if (columnString.includes('->') && typeof value === "boolean") {
            value = new Expression(value ? 'true' : 'false');

            if (typeof column === "string") {
                type = 'JsonBoolean';
            }
        }

        if (this.isBitwiseOperator(operator)) {
            type = 'Bitwise';
        }

        // Now that we are working with just a simple query we can put the elements
        // in our array and add the query binding to our array of bindings that
        // will be bound to each SQL statements when it is finally executed.
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

    /*public addBinding<
        K extends keyof Builder<T>["_bindings"] = "where",
        V extends Builder<T>["_bindings"][K] = Builder<T>["_bindings"][K]
    >(value: V, type: K = "where"): this {*/
    public addBinding(value: Unpacked<Bindings['where']>|Unpacked<Bindings['where']>[]): this
    public addBinding<K extends keyof Bindings>(value: Unpacked<Bindings[K]>|Unpacked<Bindings[K]>[], type: K): this
    public addBinding<K extends keyof Bindings = "where">(value: Unpacked<Bindings[K]>|Unpacked<Bindings[K]>[], type: K|'where' = 'where'): this {
        if (Array.isArray(value)) {
            this._bindings[type] = [...this._bindings[type], ...value]
                .map(value => this.castBinding(value));
        } else {
            this._bindings[type].push(value);
        }

        return this;
    }

    public toSql(): string {
        this.applyBeforeQueryCallbacks();

        return this.grammar.compileSelect(this as Builder);
    }

    protected createSub(query: ((query: Builder) => void) | Builder | string): [string, SqlValue[]] {
        if (typeof query === "function") {
            const callback = query;

            callback(query = this.forSubQuery());
        }

        return this.parseSub(query);
    }

    public addSelect(columns: Array<string|Expression> | Record<string, string|Expression>): this {
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

    protected newJoinClause(parentQuery: Builder, type: string, table: string | Expression): JoinClause {
        return new JoinClause(parentQuery, type, table);
    }

    protected isQueryable(value: unknown): value is (Builder | Relation | Function) {
        return value instanceof Builder
            || value instanceof Relation
            || typeof value === "function";
    }

    protected addArrayOfWheres(column: unknown[] | Record<string, unknown>, boolean: TBoolean, method: string = "where"): this {
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

    public prepareValueAndOperator<V, O>(value: V, operator: O, useDefault: boolean = false): [O, '='] | [V, O] {
        if (useDefault) {
            return [operator, '='];
        } else if (this.invalidOperatorAndValue(operator, value)) {
            throw new Error('Illegal operator and value combination.');
        }

        return [value, operator];
    }

    public whereNested(callback: ((query: Builder) => void), boolean: TBoolean = 'and'): this {
        const query = this.forNestedWhere();
        callback(query);

        return this.addNestedWhereQuery(query, boolean);
    }

    protected invalidOperatorAndValue(operator: unknown, value: unknown): value is null|Exclude<this['_operators'], '='|'<>'|'!='> {
        return value === null
            && (this._operators as ReadonlyArray<string>).some(v => v === operator)
            && !['=', '<>', '!='].some(v => v === operator);
    }

    public forNestedWhere(): Builder {
        return this.newQuery().from(this._from);
    }

    protected whereSub(column: Expression | string, operator: string, callback: (subQuery: Builder) => void, boolean: TBoolean): this {
        const type: Where['type'] = 'Sub';

        // Once we have the query instance we can simply execute it so it can add all
        // of the sub-select's conditions to itself, and then we can cache it off
        // in the array of where clauses for the "main" parent query instance.
        const query = this.forSubQuery();
        callback(query);

        //FIXME: source has a conditional branch for Eloquent Builder instance case. This MAY not be relevant! Source: https://github.com/laravel/framework/blob/c779c11e266371524ef72092179187ad66a8e796/src/Illuminate/Database/Query/Builder.php#L1675

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

    protected invalidOperator<T>(operator: T): operator is Exclude<T, string> {
        return typeof operator !== "string" || !(this._operators as ReadonlyArray<string>).includes(operator.toLowerCase())
            && !this.grammar.getOperators().includes(operator.toLowerCase());
    }

    public whereNull(columns: string | Array<string|Expression> | Expression, boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = not ? 'NotNull' : 'Null';

        columns = Array.isArray(columns) ? columns : [columns]; //FIXME: when all is green, change columns paramter to array only and force all calls to wrap single values in array

        columns.forEach(column => this._wheres.push({
            type,
            column,
            boolean
        }));

        return this;
    }

    public orWhereNull(column: string|Array<string|Expression>|Expression): this {
        return this.whereNull(column, 'or');
    }

    public whereNotNull(columns: string|Array<string|Expression>|Expression, boolean: TBoolean = 'and'): this {
        return this.whereNull(columns, boolean, true);
    }

    public orWhereNotNull(column: Expression|string|Array<string|Expression>): this {
        return this.whereNotNull(column, 'or');
    }

    protected isBitwiseOperator(operator: string): boolean {
        return (this._bitwiseOperators as Readonly<Array<string>>).includes(operator.toLowerCase())
            || this.grammar.getBitwiseOperators().includes(operator.toLowerCase());
    }

    protected flattenValue<T>(value: T): T extends ReadonlyArray<unknown> ? T[0] : T {
        return Array.isArray(value) ? value[0] : value;
    }

    protected forSubQuery(): Builder {
        return this.newQuery();
    }

    protected parseSub(query: Builder | Relation | string): [string, SqlValue[]] {
        if (query instanceof Builder || query instanceof Relation) {
            query = this.prependDatabaseNameIfCrossDatabaseQuery(query);

            return [query.toSql(), query.getBindings()];
        }

        return [query, []];
    }

    public addNestedWhereQuery(query: Builder, boolean: TBoolean = 'and'): this {
        if (query._wheres.length > 0) {
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

    public getBindings() {
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

    public having(column: Expression | ((query: Builder) => void) | string, operator: string | number | null = null, value: string | number | Expression | null = null, boolean: TBoolean = 'and'): this {
        let type: Having["type"] = 'Basic';

        if (column instanceof Expression) {
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

    public addNestedHavingQuery(query: Builder, boolean: TBoolean): this {
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

    public havingNull(columns: string | unknown[], boolean: TBoolean = 'and', not: boolean = false): this {
        const type = not ? 'NotNull' : 'Null';

        columns = Array.isArray(columns) ? columns : [columns];

        columns.forEach(column => this._havings.push({
            type,
            column,
            boolean,
        }));

        return this;
    }

    public havingBetween(column: string, values: Array<unknown>, boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Having['type'] = 'Between';//FIXME: souce deviation

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

    public havingRaw(sql: string, bindings: BindingOfType<'having'> = [], boolean: TBoolean = 'and'): this {
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


    public whereIn(column: Expression|keyof T, values: Builder|((query: Builder) => void)|Array<Value|Expression>, boolean?: string, not?: boolean): this

    public whereIn(column: Expression|keyof T, values: Builder|((query: Builder) => void)|Array<Value|Expression>, boolean: TBoolean = 'and', not: boolean = false): this {
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

    public orWhereIn(column: Expression|string, values: unknown): this {
        return this.whereIn(column, values, 'or');
    }

    public whereNotIn(column: Expression|string, values: ((query: Builder) => void)|Array<Value>, boolean?: string): this

    public whereNotIn(column: Expression|string, values: unknown, boolean: TBoolean = 'and'): this {
        return this.whereIn(column, values, boolean, true);
    }

    public orWhereNotIn(column: Expression|string, values: unknown): this {
        return this.whereNotIn(column, values, 'or');
    }

    public whereIntegerInRaw(column: string, values: (number|string)[], boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = not ? 'NotInRaw' : 'InRaw';

        values = values.flat();

        values = values.map(value => Number.parseInt(value));

        this._wheres.push({
            type,
            column,
            values,
            boolean
        });

        return this;
    }

    public orWhereIntegerInRaw(column: string, values: unknown[]): this {
        return this.whereIntegerInRaw(column, values, 'or');
    }

    public whereIntegerNotInRaw(column: string, values: unknown[], boolean: TBoolean = 'and'): this {
        return this.whereIntegerInRaw(column, values, boolean, true);
    }

    public orWhereIntegerNotInRaw(column: string, values: unknown[]): this {
        return this.whereIntegerNotInRaw(column, values, 'or');
    }

    public cleanBindings(bindings: Array<SqlValue | Expression>): Array<SqlValue> {
        return bindings
            .filter((binding): binding is Exclude<typeof binding, Expression> => !(binding instanceof Expression)) //WARNING: Source uses reject method from the collection class, acts as an inverted fitler method, so i inverted the conditional in JS. See soruce: https://github.com/laravel/framework/blob/5a7f2b4742b3dc7ce43acc698f400a9395801c7b/src/Illuminate/Database/Query/Builder.php#L3775
            .map(binding => this.castBinding(binding));
    }

    public castBinding(value: SqlValue|BackedEnum): SqlValue {
        return value instanceof BackedEnum ? value.value : value;
    }

    public havingNested(callback: (query: Builder) => void, boolean: TBoolean = 'and'): this {
        const query = this.forNestedWhere();
        callback(query);

        return this.addNestedHavingQuery(query, boolean);
    }

    public take(value: number): this {
        return this.limit(value);
    }

    public limit(value: number|null): this {
        const property = this._unions.length > 0 ? 'unionLimit' : 'limit' as const;

        if (value === null || value >= 0) {
            this[`_${property}`] = value !== null ? Math.round(value) : undefined;
        }

        return this;
    }

    public whereColumn(first: string | unknown[], operator: string | unknown[] = null, second: string | null = null, boolean: TBoolean | null = 'and'): this {
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

    public whereBetween(column: Expression | string, values: Array<unknown>, boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = 'Between'; //FIXME: souce deviation

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

    public whereNotBetween(column: Expression|string, values: unknown[], boolean: TBoolean = 'and'): this {
        return this.whereBetween(column, values, boolean, true);
    }

    public whereBetweenColumns(column: Expression|string, values: unknown[], boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = 'BetweenColumns'; //FIXME: souce deviation

        this._wheres.push({
            type,
            column,
            values,
            boolean,
            not
        });

        return this;
    }

    public whereNotBetweenColumns(column: Expression|string, values: unknown[], boolean: TBoolean = 'and'): this {
        return this.whereBetweenColumns(column, values, boolean, true);
    }

    public orWhereBetweenColumns(column: Expression|string, values: unknown[]): this {
        return this.whereBetweenColumns(column, values, 'or');
    }

    public orWhereNotBetweenColumns(column: Expression|string, values: unknown[]): this {
        return this.whereNotBetweenColumns(column, values, 'or');
    }

    //FIXME: add method override signatures, based on usage in unit tests.
    public orWhere(column: ((query: this) => void)|string|unknown[]|Expression, operator: unknown = null, value: Value|((query: Builder)=>void) = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.where(column, operator, value, 'or');
    }

    public orWhereNot(column: ((query: Builder) => void)|string|unknown[]|Expression, operator: unknown = null, value: unknown = null): this {
        return this.whereNot(column, operator, value, 'or');
    }

    public whereNot(column: ((query: Builder)=>void)|string|unknown[]|Record<string, Value>|Expression, operator: unknown = null, value: unknown = null, boolean: TBoolean = 'and'): this {
        if (Array.isArray(column)) {
            return this.whereNested((query: Builder) => query.where(column, operator, value, boolean), `${boolean} not`);
        }

        return this.where(column, operator, value, `${boolean} not`);
    }

    public whereDate(column: Expression|string, value: Date|string|number|Expression): this //FIXME: Source diviation
    public whereDate(column: Expression|string, operator: string, value: Date|string|number|Expression): this //FIXME: Source diviation

    public whereDate(column: Expression|string, operator: string, value: Date|string|null = null, boolean: TBoolean = 'and'): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            //value = value.format('Y-m-d'); //FIXME: A Date formatter helper should be found or made.
            value = `${value.getFullYear()} ${value.getMonth().toString().padStart(2, '0')} ${value.getDate().toString().padStart(2, '0')}`;
        }

        return this.addDateBasedWhere('Date', column, operator, value, boolean);
    }

    public orWhereDate(column: Expression|string, value: Date|string|number): this //FIXME: Source diviation

    public orWhereDate(column: Expression|string, operator: string, value: Date|string|null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDate(column, operator, value, 'or');
    }

    public whereDay(column: Expression|string, value: Date|string|number|Expression): this//FIXME: Source diviation
    public whereDay(column: Expression|string, operator: string, value: Date|string|number|Expression, boolean?: string): this//FIXME: Source diviation

    public whereDay(column: Expression|string, operator: string, value: Date|string|number|null = null, boolean: TBoolean = 'and'): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.format('d');
        }

        if (!(value instanceof Expression)) {
            value = value.toString().padStart(2, '0');
        }

        return this.addDateBasedWhere('Day', column, operator, value, boolean);
    }

    public orWhereDay(column: Expression|string, value: Date|string|number): this //FIXME: Source diviation
    public orWhereDay(column: Expression|string, operator: string, value: Date|string|number): this

    public orWhereDay(column: Expression|string, operator: string, value: Date|string|number|null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDay(column, operator, value, 'or');
    }

    public whereMonth(column: Expression|string, value: Date|string|number|Expression):this //FIXME: Source diviation
    public whereMonth(column: Expression|string, operator: string, value: Date|string|number|Expression): this //FIXME: Source diviation

    public whereMonth(column: Expression|string, operator: string, value: Date|string|number|null = null, boolean: TBoolean = 'and'): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.format('m');
        }

        if (!(value instanceof Expression)) {
            value = value.toString().padStart(2, '0');
        }

        return this.addDateBasedWhere('Month', column, operator, value, boolean);
    }

    public orWhereMonth(column: Expression|string, value: Date|string|number|Expression): this //FIXME: Source diviation
    public orWhereMonth(column: Expression|string, operator: string, value: Date|string|number|Expression): this //FIXME: Source diviation

    public orWhereMonth(column: Expression|string, operator: string, value: Date|string|number|null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereMonth(column, operator, value, 'or');
    }

    public whereYear(column: Expression|string, value: Date|string|number|Expression): this//FIXME: Source diviation
    public whereYear(column: Expression|string, operator: string, value: Date|string|number|Expression, boolean?: string): this //FIXME: Source diviation

    public whereYear(column: Expression|string, operator: string, value: Date|string|number|null = null, boolean: TBoolean = 'and'): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value.format('Y');
        }

        return this.addDateBasedWhere('Year', column, operator, value, boolean)
    }

    public orWhereYear(column: Expression|string, value: Date|string|number|Expression): this //FIXME: Source diviation
    public orWhereYear(column: Expression|string, operator: string, value: Date|string|number|Expression): this //FIXME: Source diviation

    public orWhereYear(column: Expression|string, operator: string, value: Date|string|number|null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereYear(column, operator, value, 'or');
    }

    protected addDateBasedWhere(type: 'Date'|'Day'|'Month'|'Year'|'Time', column: Expression|string, operator: string, value: BindingOfType<'where'>, boolean: TBoolean = 'and'): this {
        this._wheres.push({
            column,
            type,
            boolean,
            operator,
            value
        });

        if (!(value instanceof Expression)) {
            this.addBinding(value, 'where');
        }

        return this;
    }

    public whereRaw(sql: string, bindings: BindingOfType<'where'> = [], boolean: TBoolean = 'and'): this {
        this._wheres.push({
            //type: 'raw', //FIXME: original from source
            type: 'Raw',
            sql,
            boolean
        });

        this.addBinding(bindings, 'where');

        return this;
    }

    public orWhereRaw(sql: string, bindings: unknown[]): this {
        return this.whereRaw(sql, bindings, 'or');
    }

    public orWhereColumn(first: keyof T, operator: string|null = null, second: string|null = null): this {
        return this.whereColumn(first, operator, second, 'or');
    }

    public union(query: Builder|((query: Builder)=>void), all: boolean = false): this {
        if (typeof query === "function") {
            query(query = this.newQuery());
        }

        this._unions.push({
            query,
            all
        });

        this.addBinding(query.getBindings(), 'union');

        return this;
    }

    public unionAll(query: Builder): this {
        return this.union(query, true);
    }

    public orderBy(column: ((query: Builder)=>void)|Builder|Expression|string, direction: 'asc'|'desc' = 'asc'): this {
        if (this.isQueryable(column)) {
            const [query, bindings] = this.createSub(column);

            column = new Expression(`(${query})`);

            this.addBinding(bindings, this._unions.length > 0 ? 'unionOrder' : 'order');
        }

        //direction = direction.toLowerCase(); //TS makes sure direction is always lowercase

        this[this._unions.length > 0 ? '_unionOrders' : '_orders'].push({
            column,
            direction,
        });

        return this;
    }

    public skip(value: number): this {
        return this.offset(value);
    }

    public offset(value: number): this {
        const property = this._unions.length > 0 ? '_unionOffset' : '_offset';

        this[property] = Math.max(0, Math.round(value));

        return this;
    }

    //TODO: should this method require only one parameter of type array with valid types?
    public groupBy(...groups: Array<Expression|string|unknown[]>): this {
        groups.forEach(group => {
            this._groups = [...this._groups, ...Array.isArray(group) ? group : [group]]
        });

        return this;
    }

    public groupByRaw(sql: string, bindings: BindingOfType<'groupBy'>): this {
        this._groups.push(new Expression(sql));

        this.addBinding(bindings, 'groupBy');

        return this;
    }

    public orderByDesc(column: ((query: Builder)=>void)|Builder|Expression|string): this {
        return this.orderBy(column, 'desc');
    }

    public latest(column: string = 'created_at'): this {
        return this.orderBy(column, 'desc');
    }

    public oldest(column: string = 'created_at'): this {
        return this.orderBy(column, 'asc');
    }

    public inRandomOrder(seed: string = ''): this {
        return this.orderByRaw(this.grammar.compileRandom(seed));
    }

    public orderByRaw(sql: string, bindings: BindingOfType<'unionOrder'|'order'> = []): this {
        const type: Order['type'] = 'Raw';

        this[this._unions.length > 0 ? '_unionOrders' : '_orders'].push({
            type,
            sql,
        });

        this.addBinding(bindings, this._unions.length > 0 ? 'unionOrder' : 'order');

        return this;
    }

    public reorder(column: ((query: Builder)=>void)|Builder|Expression|string|null = null, direction: string = 'asc'): this {
        this._orders = [];
        this._unionOrders = [];
        this._bindings.order = [];
        this._bindings.unionOrder = [];

        if (column) {
            return this.orderBy(column, direction);
        }

        return this;
    }

    public orHaving(column: Expression|((query: Builder) => void)|string, operator: string|number|null = null, value: string|number|null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.having(column, operator, value, 'or');
    }

    public orHavingNull(column: string): this {
        return this.havingNull(column, 'or');
    }

    public havingNotNull(column: string|unknown[], boolean: TBoolean = 'and'): this {
        return this.havingNull(column, boolean, true);
    }

    public orHavingNotNull(column: string): this {
        return this.havingNotNull(column, 'or');
    }

    public orHavingRaw(sql: string, bindings: unknown[] = []): this {
        return this.havingRaw(sql, bindings, 'or');
    }

    public leftJoin(table: Expression|string, first: ((query: JoinClause) => void)|string, operator: string|null = null, second: string|null = null): this {
        return this.join(table, first, operator, second, 'left');
    }

    public forPage(page: number, perPage: number): this {
        return this.offset((page - 1) * perPage).limit(perPage);
    }

    public joinSub(query: ((query: Builder)=>void)|Builder|string, as: string, first: ((join: JoinClause) => void)|string, operator: string|null = null, second: string|number|null = null, type: string = 'inner', where: boolean = false): this {
        let bindings;
        [query, bindings] = this.createSub(query);

        const expression = `(${query}) as ${this.grammar.wrapTable(as)}`;

        this.addBinding(bindings, 'join');

        return this.join(new Expression(expression), first, operator, second, type, where);
    }

    public tap(callback: (query: this) => void): this {
        callback(this);

        return this;
    }

    public whereExists(callback: ((query: Builder)=>void)|Builder, boolean: TBoolean = 'and', not: boolean = false): this {
        let query;
        if (typeof callback === "function") {
            query = this.forSubQuery();

            // Similar to the sub-select clause, we will create a new query instance so
            // the developer may cleanly specify the entire exists query and we will
            // compile the whole thing in the grammar and insert it into the SQL.
            callback(query);
        } else {
            query = callback;
        }

        return this.addWhereExistsQuery(query, boolean, not);
    }

    public orWhereExists(callback: ((query: Builder)=>void)|Builder, not: boolean = false): this {
        return this.whereExists(callback, 'or', not);
    }

    public whereNotExists(callback: ((query: Builder)=>void)|Builder, boolean: TBoolean = 'and'): this {
        return this.whereExists(callback, boolean, true);
    }

    public orWhereNotExists(callback: ((query: Builder)=>void)|Builder): this {
        return this.orWhereExists(callback, true);
    }

    public leftJoinWhere(table: Expression|string, first: ((clause: JoinClause) => void)|string, operator: string, second: string): this {
        return this.joinWhere(table, first, operator, second, 'left');
    }

    public crossJoin(table: Expression|string, first: ((join: JoinClause) => void)|string|null = null, operator: string|null = null, second: string|null = null): this {
        if (first !== null) {
            return this.join(table, first, operator, second, 'cross');
        }

        this._joins.push(this.newJoinClause(this, 'cross', table));

        return this;
    }

    public whereRowValues<
        T extends readonly [] | readonly string[]
    >(columns: T, operator: string, values: { [K in keyof T]: Value }, boolean?: string): this //https://stackoverflow.com/a/62206961
    public whereRowValues(columns: string[], operator: string, values: Value[], boolean: TBoolean = 'and'): this {
        /*if (columns.length !== values.length) {
            throw new InvalidArgumentException('The number of columns must match the number of values');//FIXME: implement this as a type check instead.
        }*/

        const type: Where['type'] = 'RowValues';

        this._wheres.push({
            type,
            columns,
            operator,
            values,
            boolean
        });

        this.addBinding(this.cleanBindings(values));

        return this;
    }

    public orWhereRowValues<
        T extends readonly [] | readonly string[]
    >(columns: T, operator: string, values: { [K in keyof T]: Value }): this //https://stackoverflow.com/a/62206961
    public orWhereRowValues(columns: string[], operator: string, values: Value[]): this {
        return this.whereRowValues(columns, operator, values, 'or');
    }

    public clone(): this {
        //const clone = structuredClone(this, {lossy: false});
        const clone: this = Object.assign(Object.create(Object.getPrototypeOf(this)), this);// https://stackoverflow.com/a/44782052

        //FIXME: structuredClone does not clone Class instances correctly!
        //TODO: implement helper to clone arrays and basic objects, but carry over rerference for class and class instance references.
        clone._aggregate = structuredClone(clone._aggregate);
        clone._beforeQueryCallbacks = structuredClone(clone._beforeQueryCallbacks);
        clone._bindings = structuredClone(clone._bindings);
        //clone._bitwiseOperators = structuredClone(clone._bitwiseOperators);
        clone._columns = structuredClone(clone._columns);
        clone._distinct = structuredClone(clone._distinct);
        clone._from = structuredClone(clone._from);
        clone._groups = structuredClone(clone._groups);
        clone._havings = structuredClone(clone._havings);
        clone._indexHint = structuredClone(clone._indexHint);
        clone._joins = structuredClone(clone._joins);
        clone._limit = structuredClone(clone._limit);
        clone._lock = structuredClone(clone._lock);
        clone._offset = structuredClone(clone._offset);
        //clone._operators = structuredClone(clone._operators);
        clone._orders = structuredClone(clone._orders);
        clone._unionLimit = structuredClone(clone._unionLimit);
        clone._unionOffset = structuredClone(clone._unionOffset);
        clone._unionOrders = structuredClone(clone._unionOrders);
        clone._unions = structuredClone(clone._unions);
        clone._wheres = structuredClone(clone._wheres);

        return clone;
    }

    public cloneWithout(properties: Array<keyof ({[T in keyof Builder as Builder[T] extends Array<unknown> ? T : (undefined extends Builder[T] ? T : never)]: Builder[T]})>): this {
        const clone = this.clone();

        //properties = ["_wheres", "_limit"];

        //this._from
        //    ^?
        // @eslint-disable
        //let _x: keyof ({[K in keyof Builder as undefined extends Builder[K] ? K : never]: Builder[K]});
        //  ^?

        properties.forEach(property => {
            clone[property] = Array.isArray(clone[property]) ? [] : undefined;
        });

        return clone;
    }

    public whereTime(column: Expression|string, operator: string|Date|Expression): this//FIXME: Source diviation
    public whereTime(column: Expression|string, operator: string, value?: Date|string|null|Expression, boolean?: string): this//FIXME: Source diviation

    public whereTime(column: Expression|string, operator: string, value: Date|string|null = null, boolean: TBoolean = 'and'): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            // value = value.format('H:i:s'); //FIXME: datetime format helper
            value = `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}:${value.getSeconds().toString().padStart(2, '0')}`;
        }

        return this.addDateBasedWhere('Time', column, operator, value, boolean);
    }

    public orWhereTime(column: Expression|string, operator: string|Date|Expression): this//FIXME: Source diviation
    public orWhereTime(column: Expression|string, operator: string, value: Date|string|null, boolean?: string): this//FIXME: Source diviation

    public orWhereTime(column: Expression|string, operator: string, value: Date|string|null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereTime(column, operator, value, 'or');
    }

    public crossJoinSub(query: ((query: Builder) => void)|Builder|string, as: string): this {
        let bindings;
        [query, bindings] = this.createSub(query);

        const expression = `(${query}) as ${this.grammar.wrapTable(as)}`;

        this.addBinding(bindings, 'join');

        this._joins.push(this.newJoinClause(this as Builder, 'cross', new Expression(expression)));

        return this;
    }

    public leftJoinSub(query: ((query: Builder)=>void)|Builder|string, as: string, first: ((join: JoinClause) => void)|string, operator: string|null, second: string|null): this {
        return this.joinSub(query, as, first, operator, second, 'left');
    }

    public rightJoinSub(query: ((query: Builder)=>void)|Builder|string, as: string, first: ((join: JoinClause) => void)|string, operator: string|null = null, second: string|null = null): this {
        return this.joinSub(query, as, first, operator, second, 'right');
    }

    public beforeQuery(callback: (query: Builder)=>void): this {
        this._beforeQueryCallbacks.push(callback);

        return this;
    }

    public useIndex(index: string): this {
        this._indexHint = new IndexHint('hint', index);

        return this;
    }

    public mergeBindings(query: Builder): this {
        const bindings = {...this._bindings};
        for (const key in query._bindings) {
            if (Object.prototype.hasOwnProperty.call(query._bindings, key)) {
                if (Object.prototype.hasOwnProperty.call(bindings, key)) {
                    bindings[key] = [...bindings[key], ...query._bindings[key]];
                } else {
                    bindings[key] = [...query._bindings[key]];
                }
            }
        }
        this._bindings = bindings;

        return this;
    }

    public whereJsonContains(column: string, value: unknown, boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = 'JsonContains';

        this._wheres.push({
            type,
            column,
            value,
            boolean,
            not,
        });

        if (!(value instanceof Expression)) {
            this.addBinding(this.grammar.prepareBindingForJsonContains(value));
        }

        return this;
    }

    public orWhereJsonContains(column: string, value: unknown): this {
        return this.whereJsonContains(column, value, 'or');
    }

    public whereJsonDoesntContain(column: string, value: unknown, boolean: TBoolean = 'and'): this {
        return this.whereJsonContains(column, value, boolean, true);
    }

    public orWhereJsonDoesntContain(column: string, value: unknown): this {
        return this.whereJsonDoesntContain(column, value, 'or');
    }

    public whereJsonContainsKey(column: string, boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = 'JsonContainsKey';

        this._wheres.push({
            type,
            column,
            boolean,
            not,
        });

        return this;
    }

    public orWhereJsonContainsKey(column: string): this {
        return this.whereJsonContainsKey(column, 'or');
    }

    public whereJsonDoesntContainKey(column: string, boolean: TBoolean = 'and'): this {
        return this.whereJsonContainsKey(column, boolean, true);
    }

    public orWhereJsonDoesntContainKey(column: string): this {
        return this.whereJsonDoesntContainKey(column, 'or');
    }

    public whereJsonLength(column: string, operator: string|Value, value: Value = null, boolean: TBoolean = 'and'): this {
        const type: Where['type'] = 'JsonLength';

        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        this._wheres.push({
            type,
            column,
            operator,
            value,
            boolean,
        });

        if (!(value instanceof Expression)) {
            this.addBinding(Number.parseInt(this.flattenValue(value)));
        }

        return this;
    }

    public orWhereJsonLength(column: string, operator: unknown, value: unknown = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLength(column, operator, value, 'or');
    }

    public forceIndex(index: string): this {
        this._indexHint = new IndexHint('force', index);

        return this;
    }

    public ignoreIndex(index: string): this {
        this._indexHint = new IndexHint('ignore', index);

        return this;
    }

    public applyBeforeQueryCallbacks(): void {
        this._beforeQueryCallbacks.forEach(callback => callback(this))

        this._beforeQueryCallbacks = [];
    }

    public addWhereExistsQuery(query: Builder, boolean: TBoolean = 'and', not: boolean = false): this {
        const type: Where['type'] = not ? 'NotExists' : 'Exists';

        this._wheres.push({
            type,
            query,
            boolean,
        })

        this.addBinding(query.getBindings(), 'where');

        return this;
    }

    public lock(value: string|boolean = true): this {
        this._lock = value;

        //Source calls useWritePdo if this.lock attribute is null. See: https://github.com/laravel/framework/blob/81ae53fcdb1a552237ef73f65f1f3faac8236641/src/Illuminate/Database/Query/Builder.php#L2572

        return this;
    }

    public cloneWithoutBindings(except: Array<keyof this['_bindings']>): this {
        const clone = this.clone();

        except.forEach(type => clone._bindings[type] = []);

        return clone;
    }
}

export class JoinClause extends Builder {
    public type: string;
    public table: string | Expression;
    //protected parentConnection: ConnectionInterface;
    protected parentGrammar: Grammar;
    //protected parentProcessor: Processor;
    protected parentClass: typeof Builder;

    public constructor(parentQuery: Builder, type: string, table: string | Expression) {
        const grammar = parentQuery.getGrammar();

        super(grammar);

        this.type = type;
        this.table = table;
        this.parentClass = parentQuery.constructor as typeof Builder;
        this.parentGrammar = grammar;
        // this.parentProcessor = parentQuery.getProcessor();
        // this.parentConnection = parentQuery.getConnection();
    }

    public on(first: ((query: Builder) => void) | string, operator: string | null = null, second: Expression | string | null = null, boolean: TBoolean = 'and'): this {
        if (typeof first === "function") {
            return this.whereNested(first, boolean);
        }

        return this.whereColumn(first, operator, second, boolean);
    }

    public orOn(first: ((query: JoinClause) => void) | string, operator: string | null = null, second: Expression | string | null = null): this {
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
