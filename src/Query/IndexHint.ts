export default class IndexHint {
    /** The type of query hint. */
    public type: string;//FIXME: a string uinon of known values?

    /** The name of the index. */
    public index: string;

    public constructor(type: string, index: string) {
        this.type = type;
        this.index = index;
    }
}
