import { type SqlValue } from "sql.js";
import Builder from "../../Model/Builder";
import type QueryBuilder from "../../Query/Builder";
import { type Model } from "../../../Models/Model";
import { type AbstractAttributes } from "../../../Model";

export default class Relation /*extends Builder<Record<string, SqlValue>>*/ {
    protected query: QueryBuilder;
    protected parent: Model<AbstractAttributes>;
    protected related: Model<AbstractAttributes>;
}
