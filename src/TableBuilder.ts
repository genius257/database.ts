import { Database } from "sql.js";
import Builder from "./Model/Builder";
import { Model } from "../Models/Model";
import Grammar from "./Query/Grammars/Grammar";
//import { Model } from "../Model";

export type StorageClass = keyof TypeNamesAffinity
export type TypeNamesAffinity = {
    "NULL": [],
    "INTEGER": [
        "INT",
        "INTEGER",
        "TINYINT",
        "SMALLINT",
        "MEDIUMINT",
        "BIGINT",
        "UNSIGNED BIG INT",
        "INT2",
        "INT8",
    ],
    "TEXT": [
        "CHARACTER",
        "VARCHAR",
        //"VARYING CHARACTER",
        "NCHAR",
        //"NATIVE CHARACTER",
        "NVARCHAR",
        "TEXT",
        "CLOB",
    ],
    "BLOB": [
        "BLOB",
    ],
    "REAL": [
        "REAL",
        "DOUBLE",
        //"DOUBLE PRECISION",
        "FLOAT",
    ],
    "NUMERIC": [
        "NUMERIC",
        "DECIMAL",
        "BOOLEAN",
        "DATE",
        "DATETIME",
    ]
}

type DataType = KeyOfSelf<TypeNamesAffinity>[number];

type KeyOfSelf<T> = T[keyof T];

//type PrimativeToTypeName<T> = T extends string ? "TEXT" : ();
/*
type PrimativeToTypeName<T> = T extends number
    ? TypeNamesAffinity["INTEGER"][number]|TypeNamesAffinity["REAL"][number]
    : (
        T extends string
            ? TypeNamesAffinity["TEXT"][number]
            : (
                T extends Array<number> | Int8Array
                    ? TypeNamesAffinity["BLOB"]
                    : (
                        T extends Date | boolean
                            ? TypeNamesAffinity["NUMERIC"]
                            : never
                    )
            )
    );*/

type TypeToAffinity<T, Type, Affinity extends keyof TypeNamesAffinity, Fallback = never> = T extends Type ? TypeNamesAffinity[Affinity][number] : Fallback;
type IntegerAffinity<T> = TypeToAffinity<T, number, "INTEGER">;
type TextAffinity<T> = TypeToAffinity<T, string, "TEXT">;
type BlobAffinity<T> = TypeToAffinity<T, Array<number>|Uint8Array, "BLOB">;
type RealAffinity<T> = TypeToAffinity<T, number, "REAL">;
type NumericAffinity<T> = TypeToAffinity<T, number | boolean, "NUMERIC">;
type TypeAffinity<T> = IntegerAffinity<T> | TextAffinity<T> | BlobAffinity<T> | RealAffinity<T> | NumericAffinity<T>;

type TableSpec<T extends object> = {
    [K in keyof T]: { type: TypeAffinity<T[K]> } & (null extends T[K] ? {nullable: true} : {nullable?: false})
}

export function column(name: string, type: DataType) {
    return `${name} ${type}`;
}

//column("something", "BIGINT")

export default class TableBuilder {
    //public static
}

interface Stringable {
    toString(): string;
}

type SourceType = {
    [key: string]
    : any //eslint-disable-line @typescript-eslint/no-explicit-any
};

export class Table<T extends SourceType, Model extends typeof Model<T>, Structure extends TableSpec<T> = TableSpec<T>> implements Stringable {
    protected name: string;
    protected columns: Column[] = [];
    protected database: Database;
    protected model: Model;

    public constructor(database: Database, name: string, structure: Structure, model: Model) {
        this.database = database;
        this.name = name;
        this.model = model;

        Object.entries(structure).forEach(columnSpec => {
            const column = this.column(columnSpec[0], columnSpec[1].type);
            if (columnSpec[1]?.nullable === true) {
                column.nullable();
            }
        })
    }

    public create() {
        this.database.run(`CREATE TABLE \`${this.name}\` (${this.columns.join(',')})`);
    }

    public insert(rows: T[]) {
        const statement = this.database.prepare(`INSERT INTO \`${this.name}\` (${this.columns.map(column => column.getName()).join(',')}) VALUES (${this.columns.map(() => '?').join(',')})`);
        for (let index = 0; index < rows.length; index++) {
            statement.run(this.columns.map(column => rows[index]![column.name]));
        }
        statement.free();
    }

    public index() {
        throw new Error("Not implemented, yet"); //FIXME: implement
    }

    protected column<T extends DataType>(name: string, type: T) {
        const column = new Column<T>(name, type);
        this.columns.push(column);
        return column;
    }

    public trigger() {
        throw new Error("Not implemented, yet"); //FIXME: implement
    }

    public query() {
        return new Builder<T>(new Grammar(), this.database).from(this.name);
    }

    public toString() {
        return `CREATE TABLE \`${this.name}\` (${this.columns.join(',')})`;
    }

    public getModel() {
        return this.model;
    }
}

class Column<T extends DataType = DataType> implements Stringable {
    public readonly name: string;
    protected type: T;
    protected _nullable: boolean = false;

    public constructor(name: string, type: T) {
        this.name = name;
        this.type = type;
    }

    nullable() {
        this._nullable = true;
        return this;
    }

    public static columnize(name: string) {
        return `\`${name}\``;
    }

    public getName() {
        return Column.columnize(this.name);
    }

    public toString(): string {

        const columnDef: string[] = [
            Column.columnize(this.name),
            this.type,
            this._nullable ? 'NULL' : 'NOT NULL',
        ];

        return columnDef.filter(v => typeof v === "string" && v.length > 0).join(' ');
    }
}
