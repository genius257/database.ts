import { WhereOfType, type Builder, Having, HavingOfType } from "..";
import Expression from "../Expression";
import Grammar from "./Grammar";

export default class PostgresGrammar extends Grammar {
    protected override operators = [
        "=",
        "<",
        ">",
        "<=",
        ">=",
        "<>",
        "!=",
        "like",
        "not like",
        "between",
        "ilike",
        "not ilike",
        "~",
        "&",
        "|",
        "#",
        "<<",
        ">>",
        "<<=",
        ">>=",
        "&&",
        "@>",
        "<@",
        "?",
        "?|",
        "?&",
        "||",
        "-",
        "@?",
        "@@",
        "#-",
        "is distinct from",
        "is not distinct from",
    ] as const;

    protected override bitwiseOperators = [
        "~",
        "&",
        "|",
        "#",
        "<<",
        ">>",
        "<<=",
        ">>=",
    ] as const;

    /** Compile a basic where clause. */
    protected override whereBasic(query: Builder, where: WhereOfType<"Basic">): string {
        if (where.operator.toLowerCase().includes('like')) {
            return `${this.wrap(where.column)}::text ${where.operator} ${this.parameter(where.value)}`;
        }

        return super.whereBasic(query, where);
    }

    /** Compile a bitwise operator where clause. */
    protected override whereBitwise(query: Builder, where: WhereOfType<'Bitwise'>): string {
        const value = this.parameter(where.value);

        const operator = where.operator.replaceAll('?', '??');

        return `(${this.wrap(where.column)} ${operator} ${value})::bool`;
    }

    /** Compile a "where date" clause. */
    protected override whereDate(query: Builder, where: WhereOfType<"Date">): string {
        const value = this.parameter(where.value);

        return `${this.wrap(where.column)}::date ${where.operator} ${value}`;
    }

    /** Compile a "where time" clause. */
    protected override whereTime(query: Builder, where: WhereOfType<"Time">): string {
        const value = this.parameter(where.value);

        return `${this.wrap(where.column)}::time ${where.operator} ${value}`;
    }

    /**
     * Compile a date based where clause.
     */
    protected override dateBasedWhere(type: string, query: Builder, where: WhereOfType<"Date"|"Time"|"Day"|"Month"|"Year">): string
    {
        const value = this.parameter(where.value);

        return `extract(${type} from ${this.wrap(where.column)}) ${where.operator} ${value}`;
    }

    /**
     * Compile a "where fulltext" clause.
     */
    public override whereFullText(query: Builder, where: WhereOfType<"Fulltext">): string
    {
        let language = where.options.language ?? 'english';

        if (! (language in this.validFullTextLanguages())) {
            language = 'english';
        }

        const columns = where.columns.map((column) => {
            return `to_tsvector('${language}', ${this.wrap(column)})`;
        }).join(' || ');

        let mode = 'plainto_tsquery';

        if ((where.options.mode ?? []) === 'phrase') {
            mode = 'phraseto_tsquery';
        }

        if ((where.options.mode ?? []) === 'websearch') {
            mode = 'websearch_to_tsquery';
        }

        return `(${columns}) @@ ${mode}('${language}', ${this.parameter(where.value)})`;
    }

    /**
     * Get an array of valid full text languages.
     */
    protected override validFullTextLanguages(): string[]
    {
        return [
            'simple',
            'arabic',
            'danish',
            'dutch',
            'english',
            'finnish',
            'french',
            'german',
            'hungarian',
            'indonesian',
            'irish',
            'italian',
            'lithuanian',
            'nepali',
            'norwegian',
            'portuguese',
            'romanian',
            'russian',
            'spanish',
            'swedish',
            'tamil',
            'turkish',
        ];
    }

    /**
     * Compile the "select *" portion of the query.
     */
    protected override compileColumns(query: Builder, columns: string[]): string|undefined
    {
        // If the query is actually performing an aggregating select, we will let that
        // compiler handle the building of the select clauses, as it will need some
        // more syntax that is best handled by that function to keep things neat.
        if (! (query._aggregate === undefined)) {
            return;
        }

        let select: string;
        if (Array.isArray(query._distinct)) {
            select = `select distinct on (${this.columnize(query._distinct)}) `;
        } else if (query._distinct) {
            select = 'select distinct ';
        } else {
            select = 'select ';
        }

        return `${select}${this.columnize(columns)}`;
    }

    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected override compileJsonContains(column: string, value: string): string
    {
        column = this.wrap(column).replaceAll('->>', '->');

        return `(${column})::jsonb @> ${value}`;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected override compileJsonContainsKey(column: string): string
    {
        const segments = column.split('->');

        const lastSegment = segments.pop()!;

        let i:number|undefined = undefined;
        if (!isNaN(Number.parseInt(lastSegment)) && isFinite(Number.parseInt(lastSegment))) {
            i = Number.parseInt(lastSegment);
        } else if (/\[(-?[0-9]+)\]$/.test(lastSegment)) {
            const matches = lastSegment.match(/\[(-?[0-9]+)\]$/)!;
            segments.push(lastSegment.substring(0, lastSegment.lastIndexOf(matches[0]!)));

            i = Number.parseInt(matches[1]!);
        }

        column = this.wrap(segments.join('->')).replaceAll('->>', '->');

        if (i !== undefined) {
            return `case when ${`jsonb_typeof((${column})::jsonb) = 'array'`} then ${`jsonb_array_length((${column})::jsonb) >= ${(i < 0 ? Math.abs(i) : i + 1)}`} else false end`;
        }

        const key = `'${lastSegment.replaceAll("'", "''")}'`;

        return `coalesce((${column})::jsonb ?? ${key}, false)`;
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected override compileJsonLength(column: string, operator: string, value: string): string
    {
        column = this.wrap(column).replaceAll('->>', '->');

        return `jsonb_array_length((${column})::jsonb) ${operator} ${value}`;
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
    protected override compileHavingBitwise(having: HavingOfType<"Bitwise">): string
    {
        const column = this.wrap(having.column);

        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter})::bool`;
    }

    /**
     * Compile the lock into SQL.
     */
    protected override compileLock(_query: Builder, value: boolean|string): string
    {
        if (typeof value !== "string") {
            return value ? 'for update' : 'for share';
        }

        return value;
    }

    /**
     * Compile an insert ignore statement into SQL.
     */
    public override compileInsertOrIgnore(query: Builder, values: unknown[]): string
    {
        return `${this.compileInsert(query, values)} on conflict do nothing`;
    }

    /**
     * Compile an insert and get ID statement into SQL.
     */
    public override compileInsertGetId(query: Builder, values: unknown[], sequence: string): string
    {
        return `${this.compileInsert(query, values)} returning ${this.wrap(sequence ? sequence : 'id')}`;
    }

    /**
     * Compile an update statement into SQL.
     */
    public override compileUpdate(query: Builder, values: unknown[]): string
    {
        if ((query._joins.length > 0) || (query._limit !== undefined)) {
            return this.compileUpdateWithJoinsOrLimit(query, values);
        }

        return super.compileUpdate(query, values);
    }

    /**
     * Compile the columns for an update statement.
     */
    protected override compileUpdateColumns(query: Builder, values: unknown[]): string
    {
        return values.map((value, key) => {
            const column = key.split('.').at(-1);

            if (this.isJsonSelector(key)) {
                return this.compileJsonUpdateColumn(column, value);
            }

            return `${this.wrap(column)} = ${this.parameter(value)}`;
        }).join(', ');
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public override compileUpsert(query: Builder, values: unknown[], uniqueBy: string[], update: unknown[]): string
    {
        let sql = this.compileInsert(query, values);

        sql += ` on conflict (${this.columnize(uniqueBy)}) do update set `;

        /*
        const columns = update.map((value, key) => {
            return is_numeric($key)
                ? $this->wrap($value).' = '.$this->wrapValue('excluded').'.'.$this->wrap($value)
                : $this->wrap($key).' = '.$this->parameter($value);
        })->implode(', ');
        */ //FIXME: look into later

        return `${sql}${columns}`;
    }

    /**
     * Prepares a JSON column being updated using the JSONB_SET function.
     */
    protected override compileJsonUpdateColumn(key: string, value: unknown): string
    {
        const segments = key.split('->');

        const field = this.wrap(segments.shift()!);

        const path = `'{${this.wrapJsonPathAttributes(segments, '"').join(',')}}'`;

        return `${field} = jsonb_set(${field}::jsonb, ${path}, ${this.parameter(value)})`;
    }

    /**
     * Compile an update from statement into SQL.
     */
    public override compileUpdateFrom(query: Builder, values: unknown[]): string
    {
        const table = this.wrapTable(query._from);

        // Each one of the columns in the update statements needs to be wrapped in the
        // keyword identifiers, also a place-holder needs to be created for each of
        // the values in the list of bindings so we can make the sets statements.
        const columns = this.compileUpdateColumns(query, values);

        let from = '';

        if (query._joins.length > 0) {
            // When using Postgres, updates with joins list the joined tables in the from
            // clause, which is different than other systems like MySQL. Here, we will
            // compile out the tables that are joined and add them to a from clause.
            const froms = query._joins.map((join) => {
                return this.wrapTable(join.table);
            });

            if (froms.length > 0) {
                from = ` from ${froms.join(', ')}`;
            }
        }

        const where = this.compileUpdateWheres(query);

        return `update ${table} set ${columns}${from} ${where}`.trim();
    }

    /**
     * Compile the additional where clauses for updates with joins.
     */
    protected override compileUpdateWheres(query: Builder): string
    {
        const baseWheres = this.compileWheres(query);

        if (query._joins.length === 0) {
            return baseWheres;
        }

        // Once we compile the join constraints, we will either use them as the where
        // clause or append them to the existing base where clauses. If we need to
        // strip the leading boolean we will do so when using as the only where.
        const joinWheres = this.compileUpdateJoinWheres(query);

        if (baseWheres.trim() === '') {
            return `where ${this.removeLeadingBoolean(joinWheres)}`;
        }

        return `${baseWheres} ${joinWheres}`;
    }

    /**
     * Compile the "join" clause where clauses for an update.
     */
    protected override compileUpdateJoinWheres(query: Builder): string
    {
        const joinWheres: string[] = [];

        // Here we will just loop through all of the join constraints and compile them
        // all out then implode them. This should give us "where" like syntax after
        // everything has been built and then we will join it to the real wheres.
        query._joins.forEach(join => {
            join.wheres.forEach(where => {
                const method = `where${where.type}` as const;

                joinWheres.push(`${where.boolean} ${this[method](query, where)}`)
            });
        });

        return joinWheres.join(' ');
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public override prepareBindingsForUpdateFrom(bindings: Record<string, unknown>, values: unknown[]): unknown[]
    {
        values = values.map((value, column) => {
            return Array.isArray(value) || (this.isJsonSelector(column) && ! this.isExpression(value))
                ? JSON.stringify(value)
                : value;
        });

        const {select: _, where: __, ...bindingsWithoutWhere} = bindings;

        return Object.values({...values, ...bindings.where, ...bindingsWithoutWhere.flat()});
    }

    /**
     * Compile an update statement with joins or limit into SQL.
     */
    protected override compileUpdateWithJoinsOrLimit(query: Builder, values: unknown[]): string
    {
        const table = this.wrapTable(query._from);

        const columns = this.compileUpdateColumns(query, values);

        const alias = query._from.split(/\s+as\s+/i).at(-1);

        const selectSql = this.compileSelect(query.select(`${alias}.ctid`));

        return `update ${table} set ${columns} where ${this.wrap('ctid')} in (${selectSql})`;
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public override prepareBindingsForUpdate(bindings: unknown[], values: unknown[]): unknown[]
    {
        values = values.map((value, column) => {
            return Array.isArray(value) || (this.isJsonSelector(column) && ! this.isExpression(value))
                ? JSON.stringify(value)
                : value;
        });

        const {select: _, ...cleanBindings} = bindings;

        return array_values(
            array_merge($values, $cleanBindings.flat())
        );
    }

    /**
     * Compile a delete statement into SQL.
     */
    public override compileDelete(query: Builder): string
    {
        if ((query._joins.length > 0) || (query._limit !== undefined)) {
            return this.compileDeleteWithJoinsOrLimit(query);
        }

        return super.compileDelete(query);
    }

    /**
     * Compile a delete statement with joins or limit into SQL.
     */
    protected override compileDeleteWithJoinsOrLimit(query: Builder): string
    {
        const table = this.wrapTable(query._from);

        const alias = query._from.split(/\s+as\s+/i).at(-1);

        const selectSql = this.compileSelect(query.select(`${alias}.ctid`));

        return `delete from ${table} where ${this.wrap('ctid')} in (${selectSql})`;
    }

    /**
     * Compile a truncate table statement into SQL.
     */
    public override compileTruncate(query: Builder): {[key: string]: Array<unknown>}
    {
        return {[`truncate ${this.wrapTable(query._from)} restart identity cascade`]: []};
    }

    /**
     * Wrap the given JSON selector.
     */
    protected override wrapJsonSelector(value: string): string
    {
        const path = value.split('->');

        const field = this.wrapSegments(path.shift()!.split('.'));

        const wrappedPath = this.wrapJsonPathAttributes(path);

        const attribute = wrappedPath.pop();

        if (wrappedPath.length > 0) {
            return `${field}->${wrappedPath.join('->')}->>${attribute}`;
        }

        return `${field}->>${attribute}`;
    }

    /**
     * Wrap the given JSON selector for boolean values.
     */
    protected override wrapJsonBooleanSelector(value: string): string
    {
        const selector = this.wrapJsonSelector(value).replaceAll('->>', '->');

        return `(${selector})::jsonb`;
    }

    /**
     * Wrap the given JSON boolean value.
     */
    protected override wrapJsonBooleanValue(value: string): string
    {
        return `'${value}'::jsonb`;
    }

    /**
     * Wrap the attributes of the given JSON path.
     */
    protected override wrapJsonPathAttributes(path: unknown[]): unknown[]
    {
        const quote = arguments.length === 2 ? arguments[1] : "'";

        return path.map((attribute) => {
            return this.parseJsonPathArrayKeys(attribute);
        }).flat().map((attribute) => {
            return (!isNaN(parseInt(attribute))) && (isFinite(parseInt(attribute)))
                        ? attribute
                        : `${quote}${attribute}${quote}`;
        });
    }

    /**
     * Parse the given JSON path attribute for array keys.
     */
    protected override parseJsonPathArrayKeys(attribute: string): string[]
    {
        if (/(\[[^\]]+\])+$/.test(attribute)) {
            const parts = attribute.match(/(\[[^\]]+\])+$/)!;
            const key = attribute.substring(0, attribute.lastIndexOf(parts[0]!));

            const keys = Array.from(parts[0]!.matchAll(/\[([^\]]+)\]/));

            return [key, ...keys[1]!]
                .filter(v => v !== '');
        }

        return [attribute];
    }

    /**
     * Substitute the given bindings into the given raw SQL query.
     */
    public override substituteBindingsIntoRawSql(sql: string, bindings: unknown[]): string
    {
        let query = super.substituteBindingsIntoRawSql(sql, bindings);

        this.operators.forEach(operator => {
            if (!operator.includes('?')) {
                return;
            }

            query = query.replaceAll(operator.replaceAll('?', '??'), operator);
        });

        return query;
    }
}
