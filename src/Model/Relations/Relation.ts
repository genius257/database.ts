import Builder from "../../Query/Builder";

export default abstract class Relation {
    /** The Eloquent query builder instance. */
    protected query: Builder;

    /** The parent model instance. */
    protected parent: Model;

    /** The related model instance. */
    protected related: Model;

    /** Indicates whether the eagerly loaded relation should implicitly return an empty collection. */
    protected eagerKeysWereEmpty: boolean = false;

    /** Indicates if the relation is adding constraints. */
    protected constraints: boolean = true;

    /** An array to map class names to their morph names in the database. */
    public morphMap: unknown[] = [];

    /** Prevents morph relationships without a morph map. */
    protected requireMorphMap: boolean = false;

    /** The count of self joins. */
    protected selfJoinCount: number = 0;

    public constructor(query: Builder, parent: Model) {
        this.query = query;
        this.parent = parent;
        this.related = query.getModel();

        this.addConstraints();
    }

    public abstract addConstraints(): void
}

class Model {}
