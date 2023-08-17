import Expression from "./Query/Expression";

export default abstract class Grammar {
    public wrapArray(values: Array<string|Expression>): unknown[] {
        return values.map(value => this.wrap(value));
    }
    
    /** Wrap a table in keyword identifiers. */
    public wrapTable(table: Expression|string) {
        if (!this.isExpression(table)) {
            return this.wrap(table);
        }

        return this.getValue(table);
    }

    /** Wrap a value in keyword identifiers. */
    public wrap(value: Expression | string) {
        if (this.isExpression(value)) {
            return this.getValue(value);
        }

        if (value.includes(' as ')) {
            return this.wrapAliasedValue(value);
        }

        return this.wrapSegments(value.split('.'));
    }

    public wrapAliasedValue(value: string): string {
        const segments = value.split(/\s+as\s+/i);

        return `${this.wrap(segments[0])} as ${this.wrapValue(segments[1])}`;
    }

    public wrapSegments(segments: Array<string>): string {
        return segments.map((value, index) => (index === 0 && segments.length > 1) ? this.wrapTable(value) : this.wrapValue(value)).join('.');
    }
    
    protected wrapValue(value: string): string {
        return value === "*" ? value : `"${value.replace(/"/g, '""')}"`;
    }

    protected wrapJsonSelector(_value: string): string {
        throw new Error('This database engine does not support JSON operations.');
    }

    /** Convert an array of column names into a delimited string. */
    public columnize(values: Array<string>): string {
        return values.map(value => this.wrap(value)).join(', ');
    }

    /** Create query parameter place-holders for an array. */
    public parameterize(values: Array<Expression|string|number>): string {
        return values.map(value => this.parameter(value)).join(',');
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
        //FIXME: implement, or remove
    }

    /** Determine if the given value is a raw expression. */
    public isExpression(value: unknown): value is Expression {
        return value instanceof Expression;
    }

    /** Transforms expressions to their scalar types. */
    public getValue(expression: Expression|string|number) {
        if (this.isExpression(expression)) {
            this.getValue(expression.getValue(this));
        }

        return expression;
    }

    /** Get the format for database stored dates. */
    public getDateFormat(): string {
        return 'Y-m-d H:i:s';
    }
}
