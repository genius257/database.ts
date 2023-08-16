import { Database, SqlValue } from "sql.js";
import { Model } from "../../Models/Model";
import QueryBuilder from "../Query/Builder";
import Grammar from "../Query/Grammars/Grammar";
import { AbstractAttributes } from "../../Model";

export default class Builder<T extends Record<string, SqlValue>, TModel extends Model<AbstractAttributes> = Model<AbstractAttributes>> extends QueryBuilder<T> {
    protected scopes: unknown[] = [];
    protected removedScopes: unknown[] = [];
    protected connection: Database;

    constructor(grammar: Grammar, database: Database) {
        super(grammar);

        this.connection = database;
    }

    public get(): {[K in keyof T]: T[K]}[] {
        /*
        const builder = this.applyScopes();

        let models = builder.getModels();

        if (models.length) {
            models = builder.eagerLoadRelations(models);
        }

        return builder.getModel().newCollection(models);
        */
        return this.runSelect();
    }

    public getModels(): TModel[] {
        //
    }

    public runSelect(): {[K in keyof T]: T[K]}[] {
        const statement = this.connection.prepare(this.toSql(), this.getBindings());
        const columns = statement.getColumnNames() as unknown as Array<keyof T>;
        const results = [];
        try {
            while (statement.step()) {
                const values = statement.get();
                results.push(columns.reduce((previous, current, currentIndex) => {
                    previous[current] = values[currentIndex]! as T[keyof T];
                    return previous;
                }, {} as Partial<{[K in keyof T]: T[K]}>) as {[K in keyof T]: T[K]});
            }
        } finally {
            statement.free();
        }

        return results;
    }

    public first(): { [K in keyof T]: T[K] } | undefined {
        return this.take(1).get()[0];
    }

    public firstOrFail(): { [K in keyof T]: T[K] } | never {
        const model = this.first();
        if (model !== undefined) {
            return model;
        }

        throw new Error(`No query results for query: ${this.toSql()}`);// FIXME: source uses custom exception type ModelNotFoundException. see source: https://github.com/laravel/framework/blob/e5e7704f07b3d0df6dc0c650c362000d602646c5/src/Illuminate/Database/Eloquent/Builder.php#L602C20-L602C42
    }
}
