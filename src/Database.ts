import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

export const sqlJsStatic = await initSqlJs({
    "locateFile": () => wasmUrl
});

const database = new sqlJsStatic.Database();
export default database;
