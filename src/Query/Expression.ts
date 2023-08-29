import Grammar from "../Grammar";

export default class Expression {
    protected value: string|number|Expression;

    public constructor(value: string|number|Expression) {
        this.value = value;
    }

    public getValue(_grammar: Grammar): string|number|Expression {
        return this.value;
    }
}
