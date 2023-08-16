import Grammar from "../Grammar";

export default class Expression<Value extends string | number = string|number> {
    protected value: Value;

    public constructor(value: Value) {
        this.value = value;
    }

    public getValue(_grammar: Grammar): Value {
        return this.value;
    }
}
