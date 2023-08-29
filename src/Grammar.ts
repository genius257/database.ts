import Expression from "./Query/Expression";

export default abstract class Grammar {
    /** The grammar table prefix. */
    protected tablePrefix: string = '';

    /** Wrap an array of values. */
    public wrapArray(values: Array<string|Expression>): unknown[] {
        return values.map(value => this.wrap(value));
    }
    
    /** Wrap a table in keyword identifiers. */
    public wrapTable(table: Expression|string) {
        if (!this.isExpression(table)) {
            return this.wrap(`${this.tablePrefix}${table}`, true);
        }

        return this.getValue(table);
    }

    /** Wrap a value in keyword identifiers. */
    public wrap(value: Expression | number | string, prefixAlias: boolean = false) {
        if (this.isExpression(value)) {
            return this.getValue(value);
        }

        // If the value being wrapped has a column alias we will need to separate out
        // the pieces so we can wrap each of the segments of the expression on its
        // own, and then join these both back together using the "as" connector.
        value = value.toString();//FIXME: a custom fix to allow number for value parameter

        if (value.toLowerCase().includes(' as ')) {
            return this.wrapAliasedValue(value, prefixAlias);
        }

        // If the given value is a JSON selector we will wrap it differently than a
        // traditional value. We will need to split this path and wrap each part
        // wrapped, etc. Otherwise, we will simply wrap the value as a string.
        if (this.isJsonSelector(value)) {
            return this.wrapJsonSelector(value);
        }

        return this.wrapSegments(value.split('.'));
    }

    /** Wrap a value that has an alias. */
    public wrapAliasedValue(value: string, prefixAlias: boolean = false): string {
        const segments = value.split(/\s+as\s+/i);

        // If we are wrapping a table we need to prefix the alias with the table prefix
        // as well in order to generate proper syntax. If this is a column of course
        // no prefix is necessary. The condition will be true when from wrapTable.
        if (prefixAlias) {
            segments[1] = `${this.tablePrefix}${segments[1]}`;
        }

        return `${this.wrap(segments[0] ?? '')} as ${this.wrapValue(segments[1] ?? '')}`;//FIXME: should we throw or warn, if array length > 2?
    }

    /** Wrap the given value segments. */
    public wrapSegments(segments: Array<string>): string {
        return segments.map((value, index) => (index === 0 && segments.length > 1) ? this.wrapTable(value) : this.wrapValue(value)).join('.');
    }

    /** Wrap a single string in keyword identifiers. */
    protected wrapValue(value: string): string {
        return value === "*" ? value : `"${value.replace(/"/g, '""')}"`;
    }

    /** Wrap the given JSON selector. */
    protected wrapJsonSelector(_value: string): string {
        throw new Error('This database engine does not support JSON operations.');
    }

    /** Determine if the given string is a JSON selector. */
    protected isJsonSelector(value: string): boolean {
        return value.includes('->');
    }

    /** Convert an array of column names into a delimited string. */
    public columnize(values: Array<Expression | number | string>): string {
        return values.map(value => this.wrap(value)).join(', ');
    }

    /** Create query parameter place-holders for an array. */
    public parameterize(values: Array<Expression|string|number>): string {
        return values.map(value => this.parameter(value)).join(', ');
    }

    /** Get the appropriate query parameter place-holder for a value. */
    public parameter(value: Expression|string|number) {
        return this.isExpression(value) ? this.getValue(value) : '?';
    }

    /** Quote the given string literal. */
    public quoteString(value: string): string {
        return `'${value}'`;
    }

    /** Escapes a value for safe SQL embedding. */
    public escape(): string {
        throw new Error('grammar implementation does not support escaping values.');
    }

    /** Determine if the given value is a raw expression. */
    public isExpression(value: unknown): value is Expression {
        return value instanceof Expression;
    }

    /** Transforms expressions to their scalar types. */
    public getValue(expression: Expression|string|number): string|number {
        if (this.isExpression(expression)) {
            return this.getValue(expression.getValue(this));
        }

        return expression;
    }

    /** Get the format for database stored dates. */
    public getDateFormat(): string {
        return 'Y-m-d H:i:s';
    }

    /** Get the grammar's table prefix. */
    public getTablePrefix(): string {
        return this.tablePrefix;
    }

    /** Set the grammar's table prefix. */
    public setTablePrefix(prefix: string): this {
        this.tablePrefix = prefix;

        return this;
    }
}
