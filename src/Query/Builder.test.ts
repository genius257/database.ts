//import { expect, test } from 'vitest'
import {/*describe, */expect, test} from '@jest/globals';
import Grammar from "./Grammars/Grammar";
import MySqlGrammar from './Grammars/MySqlGrammar';
import PostgresGrammar from './Grammars/PostgresGrammar';
import SQLiteGrammar from './Grammars/SQLiteGrammar';
import SqlServerGrammar from './Grammars/SqlServerGrammar';
import Builder from "./Builder";
import { JoinClause } from '.';
import Raw from './Expression';
import Expression from './Expression';

/*
function now() {
    return new Date();
}
*/

function getBuilder() {
    const grammar = new Grammar();

    return new Builder(grammar);
}

function getMySqlBuilder() {
    return getMysqlBuilder();//FIXME: function calls should not have a difference in letter casing!
}
function getMysqlBuilder() {
    const grammar = new MySqlGrammar();

    return new Builder(grammar);
}

function getPostgresBuilder() {
    const grammar = new PostgresGrammar();

    return new Builder(grammar);
}

function getSQLiteBuilder() {
    const grammar = new SQLiteGrammar();

    return new Builder(grammar);
}

function getSqlServerBuilder() {
    const grammar = new SqlServerGrammar();

    return new Builder(grammar);
}

test('Basic select', () => {
    const builder = getBuilder();
    builder.select(['*']).from('users');//TODO: test without the select, to verify that '*' is default.
    expect(builder.toSql()).toBe('select * from "users"');
});

test('Basic select with get columns', () => {
    const builder = getBuilder();
    builder.from('users');
    expect(builder.toSql()).toBe('select * from "users"');

    builder.from('users').select(['foo', 'bar']);
    expect(builder.toSql()).toBe('select "foo", "bar" from "users"');

    builder.from('users').select(['baz']);
    expect(builder.toSql()).toBe('select "baz" from "users"');
});

test('Basic table wrapping protects quotation marks', () => {
    const builder = getBuilder();
    builder.select(['*']).from('some"table');
    expect(builder.toSql()).toBe('select * from "some""table"');
});

test('Alias wrapping as whole constant', () => {
    const builder = getBuilder();
    builder.select(['x.y as foo.bar']).from('baz');
    expect(builder.toSql()).toBe('select "x"."y" as "foo.bar" from "baz"');
});

test('Alias wrapping with spaces in database name', () => {
    const builder = getBuilder();
    builder.select(['w x.y.z as foo.bar']).from('baz');
    expect(builder.toSql()).toBe('select "w x"."y"."z" as "foo.bar" from "baz"');
});

test('Adding selects', () => {
    const builder = getBuilder();
    builder.select(['foo']).addSelect(['bar']).addSelect(['baz', 'boom']).addSelect(['bar']).from('users');
    expect(builder.toSql()).toBe('select "foo", "bar", "baz", "boom" from "users"');
});

test.skip('Basic select with prefix', () => {
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('users');
    expect(builder.toSql()).toBe('select * from "prefix_users"');
});

test('BasicSelectDistinct', () => {
    const builder = getBuilder();
    builder.distinct().select(['foo', 'bar']).from('users');
    expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
});

test('BasicSelectDistinctOnColumns', () => {
    const builder = getBuilder();
    builder.distinct(['foo']).select(['foo', 'bar']).from('users');
    expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');

    // TODO: source also tests postgress grammar: https://github.com/laravel/framework/blob/c1e62815ada14aa1c4c8362572572a92bc3166b1/tests/Database/DatabaseQueryBuilderTest.php#L137
});

test('BasicAlias', () => {
    const builder = getBuilder();
    builder.select(['foo as bar']).from('users');
    expect(builder.toSql()).toBe('select "foo" as "bar" from "users"');
});


// --------------------------------------------------------------------------------------------------
/*
test('BasicSelect', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users');
    expect(builder.toSql()).toBe('select * from "users"');
})

test('BasicSelectWithGetColumns', () =>
{
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processSelect');
    builder.getConnection().shouldReceive('select').once().andReturnUsing(function ($sql) {
        expect('select * from "users"', $sql);
    });
    builder.getConnection().shouldReceive('select').once().andReturnUsing(function ($sql) {
        expect('select "foo", "bar" from "users"', $sql);
    });
    builder.getConnection().shouldReceive('select').once().andReturnUsing(function ($sql) {
        expect('select "baz" from "users"', $sql);
    });

    builder.from('users').get();
    $this.assertNull(builder.columns);

    builder.from('users').get(['foo', 'bar']);
    $this.assertNull(builder.columns);

    builder.from('users').get('baz');
    $this.assertNull(builder.columns);

    expect(builder.toSql()).toBe('select * from "users"');
    $this.assertNull(builder.columns);
})

test('BasicSelectUseWritePdo', () =>
{
    builder = getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with('select * from `users`', [], false);
    builder.useWritePdo().select(['*']).from('users').get();

    builder = getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with('select * from `users`', [], true);
    builder.select(['*']).from('users').get();
})

test('BasicTableWrappingProtectsQuotationMarks', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('some"table');
    expect(builder.toSql()).toBe('select * from "some""table"');
})

test('AliasWrappingAsWholeConstant', () =>
{
    const builder = getBuilder();
    builder.select('x.y as foo.bar').from('baz');
    expect(builder.toSql()).toBe('select "x"."y" as "foo.bar" from "baz"');
})

test('AliasWrappingWithSpacesInDatabaseName', () =>
{
    const builder = getBuilder();
    builder.select('w x.y.z as foo.bar').from('baz');
    expect(builder.toSql()).toBe('select "w x"."y"."z" as "foo.bar" from "baz"');
})

test('AddingSelects', () =>
{
    const builder = getBuilder();
    builder.select(['foo']).addSelect('bar').addSelect(['baz', 'boom']).addSelect('bar').from('users');
    expect(builder.toSql()).toBe('select "foo", "bar", "baz", "boom" from "users"');
})

test('BasicSelectWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('users');
    expect(builder.toSql()).toBe('select * from "prefix_users"');
})

test('BasicSelectDistinct', () =>
{
    const builder = getBuilder();
    builder.distinct().select('foo', 'bar').from('users');
    expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
})

test('BasicSelectDistinctOnColumns', () =>
{
    const builder = getBuilder();
    builder.distinct('foo').select('foo', 'bar').from('users');
    expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');

    const builder = getPostgresBuilder();
    builder.distinct('foo').select('foo', 'bar').from('users');
    expect(builder.toSql()).toBe('select distinct on ("foo") "foo", "bar" from "users"');
})

test('BasicAlias', () =>
{
    const builder = getBuilder();
    builder.select('foo as bar').from('users');
    expect(builder.toSql()).toBe('select "foo" as "bar" from "users"');
})
*/

test('AliasWithPrefix', () => {
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('users as people');
    expect(builder.toSql()).toBe('select * from "prefix_users" as "prefix_people"');
});

test('JoinAliasesWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('services').join('translations AS t', 't.item_id', '=', 'services.id');
    expect(builder.toSql()).toBe('select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"');
})

test('BasicTableWrapping', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('public.users');
    expect(builder.toSql()).toBe('select * from "public"."users"');
})

test('WhenCallback', () =>
{
    const callback = function ($query: Builder, condition: boolean) {
        expect(condition).toBe(true);

        $query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').when(true, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');

    builder = getBuilder();
    builder.select(['*']).from('users').when(false, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
})

test('WhenCallbackWithReturn', () =>
{
    const callback = function (query: Builder, condition: boolean) {
        expect(condition).toBe(true);

        return query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').when(true, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');

    builder = getBuilder();
    builder.select(['*']).from('users').when(false, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
})

test('WhenCallbackWithDefault', () =>
{
    const callback = function ($query: Builder, condition: string|number) {
        expect(condition).toBe('truthy');

        $query.where('id', '=', 1);
    };

    const _default = function (query: Builder, condition: string|number) {
        expect(condition).toBe(0);

        query.where('id', '=', 2);  
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').when('truthy', callback, _default).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    expect(builder.getBindings()).toStrictEqual([1, 'foo']);

    builder = getBuilder();
    builder.select(['*']).from('users').when(0, callback, _default).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    expect(builder.getBindings()).toStrictEqual([2, 'foo']);
})

test('UnlessCallback', () =>
{
    const callback = function (query: Builder, condition: boolean) {
        expect(condition).toBe(false);

        query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').unless(false, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');

    builder = getBuilder();
    builder.select(['*']).from('users').unless(true, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
})

test('UnlessCallbackWithReturn', () =>
{
    const callback = function (query: Builder, condition: boolean) {
        expect(condition).toBe(false);

        return query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').unless(false, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');

    builder = getBuilder();
    builder.select(['*']).from('users').unless(true, callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
})

test('UnlessCallbackWithDefault', () =>
{
    const callback = function (query: Builder, condition: number|string) {
        expect(condition).toBe(0);

        query.where('id', '=', 1);
    };

    const $default = function (query: Builder, condition: number|string) {
        expect(condition).toBe('truthy');

        query.where('id', '=', 2);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').unless(0, callback, $default).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    expect(builder.getBindings()).toStrictEqual([1, 'foo']);

    builder = getBuilder();
    builder.select(['*']).from('users').unless('truthy', callback, $default).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    expect(builder.getBindings()).toStrictEqual([2, 'foo']);
})

test('TapCallback', () =>
{
    const callback = function (query: Builder) {
        return query.where('id', '=', 1);
    };

    const builder = getBuilder();
    builder.select(['*']).from('users').tap(callback).where('email', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
})

test('BasicWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ?');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('BasicWhereNot', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereNot('name', 'foo').whereNot('name', '<>', 'bar');
    expect(builder.toSql()).toBe('select * from "users" where not "name" = ? and not "name" <> ?');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
})

/*
//allowing array as values is misleading, because only the first element from the array is accepted. So it will be omitted.
test('WheresWithArrayValue', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', [12]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ?');
    expect(builder.getBindings()).toStrictEqual([12]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', [12, 30]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ?');
    expect(builder.getBindings()).toStrictEqual([12]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '!=', [12, 30]);
    expect(builder.toSql()).toBe('select * from "users" where "id" != ?');
    expect(builder.getBindings()).toStrictEqual([12]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '<>', [12, 30]);
    expect(builder.toSql()).toBe('select * from "users" where "id" <> ?');
    expect(builder.getBindings()).toStrictEqual([12]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', [[12, 30]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ?');
    expect(builder.getBindings()).toStrictEqual([12]);
})
*/

test('MySqlWrappingProtectsQuotationMarks', () =>
{
    const builder = getMysqlBuilder();
    // builder.select(['*']).From('some`table');
    builder.select(['*']).from('some`table'); //FIXME: source deviation
    expect(builder.toSql()).toBe('select * from `some``table`');
})

test('DateBasedWheresAcceptsTwoArguments', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereDate('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereDay('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereYear('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ?');
})

test('DateBasedOrWheresAcceptsTwoArguments', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereDate('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or date(`created_at`) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereDay('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or day(`created_at`) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereMonth('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or month(`created_at`) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereYear('created_at', 1);
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or year(`created_at`) = ?');
})

test('DateBasedWheresExpressionIsNotBound', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()')).where('admin', true);
    expect(builder.getBindings()).toStrictEqual([true]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereDay('created_at', new Raw('NOW()'));
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', new Raw('NOW()'));
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereYear('created_at', new Raw('NOW()'));
    expect(builder.getBindings()).toStrictEqual([]);
})

test('WhereDateMySql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual(['2015-12-21']);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', new Raw('NOW()'));
    expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = NOW()');
})

test('WhereDayMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual(['01']);
})

test('OrWhereDayMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
    expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ? or day(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual(['01', '02']);
})

test('OrWhereDayPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
    expect(builder.toSql()).toBe('select * from "users" where extract(day from "created_at") = ? or extract(day from "created_at") = ?');
    expect(builder.getBindings()).toStrictEqual(['01', '02']);
})

test('OrWhereDaySqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
    expect(builder.toSql()).toBe('select * from [users] where day([created_at]) = ? or day([created_at]) = ?');
    expect(builder.getBindings()).toStrictEqual(['01', '02']);
})

test('WhereMonthMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual(['05']);
})

test('OrWhereMonthMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
    expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ? or month(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual(['05', '06']);
})

test('OrWhereMonthPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
    expect(builder.toSql()).toBe('select * from "users" where extract(month from "created_at") = ? or extract(month from "created_at") = ?');
    expect(builder.getBindings()).toStrictEqual(['05', '06']);
})

test('OrWhereMonthSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
    expect(builder.toSql()).toBe('select * from [users] where month([created_at]) = ? or month([created_at]) = ?');
    expect(builder.getBindings()).toStrictEqual(['05', '06']);
})

test('WhereYearMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual([2014]);
})

test('OrWhereYearMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
    expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ? or year(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual([2014, 2015]);
})

test('OrWhereYearPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
    expect(builder.toSql()).toBe('select * from "users" where extract(year from "created_at") = ? or extract(year from "created_at") = ?');
    expect(builder.getBindings()).toStrictEqual([2014, 2015]);
})

test('OrWhereYearSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
    expect(builder.toSql()).toBe('select * from [users] where year([created_at]) = ? or year([created_at]) = ?');
    expect(builder.getBindings()).toStrictEqual([2014, 2015]);
})

test('WhereTimeMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '>=', '22:00');
    expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) >= ?');
    expect(builder.getBindings()).toStrictEqual(['22:00']);
})

test('WhereTimeOperatorOptionalMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) = ?');
    expect(builder.getBindings()).toStrictEqual(['22:00']);
})

test('WhereTimeOperatorOptionalPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect(builder.toSql()).toBe('select * from "users" where "created_at"::time = ?');
    expect(builder.getBindings()).toStrictEqual(['22:00']);
})

test('WhereTimeSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as time) = ?');
    expect(builder.getBindings()).toStrictEqual(['22:00']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', new Raw('NOW()'));
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as time) = NOW()');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('OrWhereTimeMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '>=', '22:00');
    expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) <= ? or time(`created_at`) >= ?');
    expect(builder.getBindings()).toStrictEqual(['10:00', '22:00']);
})

test('OrWhereTimePostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '>=', '22:00');
    expect(builder.toSql()).toBe('select * from "users" where "created_at"::time <= ? or "created_at"::time >= ?');
    expect(builder.getBindings()).toStrictEqual(['10:00', '22:00']);
})

test('OrWhereTimeSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '>=', '22:00');
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) >= ?');
    expect(builder.getBindings()).toStrictEqual(['10:00', '22:00']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', new Raw('NOW()'));
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) = NOW()');
    expect(builder.getBindings()).toStrictEqual(['10:00']);
})

test('WhereDatePostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect(builder.toSql()).toBe('select * from "users" where "created_at"::date = ?');
    expect(builder.getBindings()).toStrictEqual(['2015-12-21']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()'));
    expect(builder.toSql()).toBe('select * from "users" where "created_at"::date = NOW()');
})

test('WhereDayPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect(builder.toSql()).toBe('select * from "users" where extract(day from "created_at") = ?');
    expect(builder.getBindings()).toStrictEqual(['01']);
})

test('WhereMonthPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect(builder.toSql()).toBe('select * from "users" where extract(month from "created_at") = ?');
    expect(builder.getBindings()).toStrictEqual(['05']);
})

test('WhereYearPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect(builder.toSql()).toBe('select * from "users" where extract(year from "created_at") = ?');
    expect(builder.getBindings()).toStrictEqual([2014]);
})

test('WhereTimePostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '>=', '22:00');
    expect(builder.toSql()).toBe('select * from "users" where "created_at"::time >= ?');
    expect(builder.getBindings()).toStrictEqual(['22:00']);
})

test('WhereLikePostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'like', '1');
    expect(builder.toSql()).toBe('select * from "users" where "id"::text like ?');
    expect(builder.getBindings()).toStrictEqual(['1']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'LIKE', '1');
    expect(builder.toSql()).toBe('select * from "users" where "id"::text LIKE ?');
    expect(builder.getBindings()).toStrictEqual(['1']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'ilike', '1');
    expect(builder.toSql()).toBe('select * from "users" where "id"::text ilike ?');
    expect(builder.getBindings()).toStrictEqual(['1']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'not like', '1');
    expect(builder.toSql()).toBe('select * from "users" where "id"::text not like ?');
    expect(builder.getBindings()).toStrictEqual(['1']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'not ilike', '1');
    expect(builder.toSql()).toBe('select * from "users" where "id"::text not ilike ?');
    expect(builder.getBindings()).toStrictEqual(['1']);
})

test('WhereDateSqlite', () =>
{
    let builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%Y-%m-%d\', "created_at") = cast(? as text)');
    expect(builder.getBindings()).toStrictEqual(['2015-12-21']);

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()'));
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%Y-%m-%d\', "created_at") = cast(NOW() as text)');
})

test('WhereDaySqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%d\', "created_at") = cast(? as text)');
    expect(builder.getBindings()).toStrictEqual(['01']);
})

test('WhereMonthSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%m\', "created_at") = cast(? as text)');
    expect(builder.getBindings()).toStrictEqual(['05']);
})

test('WhereYearSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%Y\', "created_at") = cast(? as text)');
    expect(builder.getBindings()).toStrictEqual([2014]);
})

test('WhereTimeSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '>=', '22:00');
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%H:%M:%S\', "created_at") >= cast(? as text)');
    expect(builder.getBindings()).toStrictEqual(['22:00']);
})

test('WhereTimeOperatorOptionalSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect(builder.toSql()).toBe('select * from "users" where strftime(\'%H:%M:%S\', "created_at") = cast(? as text)');
    expect(builder.getBindings()).toStrictEqual(['22:00']);
})

test('WhereDateSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as date) = ?');
    expect(builder.getBindings()).toStrictEqual(['2015-12-21']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()'));
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as date) = NOW()');
})

test('WhereDaySqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect(builder.toSql()).toBe('select * from [users] where day([created_at]) = ?');
    expect(builder.getBindings()).toStrictEqual(['01']);
})

test('WhereMonthSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect(builder.toSql()).toBe('select * from [users] where month([created_at]) = ?');
    expect(builder.getBindings()).toStrictEqual(['05']);
})

test('WhereYearSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect(builder.toSql()).toBe('select * from [users] where year([created_at]) = ?');
    expect(builder.getBindings()).toStrictEqual([2014]);
})

test('WhereBetweens', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [1, 2]);
    expect(builder.toSql()).toBe('select * from "users" where "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [[1, 2, 3]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [[1], [2, 3]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereNotBetween('id', [1, 2]);
    expect(builder.toSql()).toBe('select * from "users" where "id" not between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [new Raw(1), new Raw(2)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" between 1 and 2');
    expect(builder.getBindings()).toStrictEqual([]);

    // builder = getBuilder();
    // let $period = now().toPeriod(now().addDay()); //FIXME: toPeriod solution
    // builder.select(['*']).from('users').whereBetween('created_at', $period);
    // builder.toSql()).toBe(expect('select * from "users" where "created_at" between ? and ?');
    // expect(builder.getBindings()).toStrictEqual([$period.start, $period.end]);

    // custom long carbon period date
    // builder = getBuilder();
    // $period = now().toPeriod(now().addMonth()); //FIXME: toPeriod solution
    // builder.select(['*']).from('users').whereBetween('created_at', $period);
    // builder.toSql()).toBe(expect('select * from "users" where "created_at" between ? and ?');
    // expect(builder.getBindings()).toStrictEqual([$period.start, $period.end]);

    // builder = getBuilder();
    // builder.select(['*']).from('users').whereBetween('id', collect([1, 2]));// collections are not supported in my solution, so we outcomment this.
    // builder.toSql()).toBe(expect('select * from "users" where "id" between ? and ?');
    // expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('OrWhereBetween', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [3, 5]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 3, 5]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [[3, 4, 5]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 3, 4]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [[3, 5]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 3, 5]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [[4], [6, 8]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 4, 6]);

    // builder = getBuilder();
    // builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', collect([3, 4]));// collections are not supported in my solution, so we outcomment this.
    // builder.toSql()).toBe(expect('select * from "users" where "id" = ? or "id" between ? and ?');
    // expect(builder.getBindings()).toStrictEqual([1, 3, 4]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [new Raw(3), new Raw(4)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between 3 and 4');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('OrWhereNotBetween', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [3, 5]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 3, 5]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [[3, 4, 5]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 3, 4]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [[3, 5]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 3, 5]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [[4], [6, 8]]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 4, 6]);

    // builder = getBuilder();
    // builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', collect([3, 4]));// collections are not supported in my solution, so we outcomment this.
    // builder.toSql()).toBe(expect('select * from "users" where "id" = ? or "id" not between ? and ?');
    // expect(builder.getBindings()).toStrictEqual([1, 3, 4]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [new Raw(3), new Raw(4)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between 3 and 4');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereBetweenColumns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereBetweenColumns('id', ['users.created_at', 'users.updated_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" between "users"."created_at" and "users"."updated_at"');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereNotBetweenColumns('id', ['created_at', 'updated_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" not between "created_at" and "updated_at"');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetweenColumns('id', [new Raw(1), new Raw(2)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" between 1 and 2');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('OrWhereBetweenColumns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereBetweenColumns('id', ['users.created_at', 'users.updated_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between "users"."created_at" and "users"."updated_at"');
    expect(builder.getBindings()).toStrictEqual([2]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereBetweenColumns('id', ['created_at', 'updated_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between "created_at" and "updated_at"');
    expect(builder.getBindings()).toStrictEqual([2]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereBetweenColumns('id', [new Raw(1), new Raw(2)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between 1 and 2');
    expect(builder.getBindings()).toStrictEqual([2]);
})

test('OrWhereNotBetweenColumns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereNotBetweenColumns('id', ['users.created_at', 'users.updated_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between "users"."created_at" and "users"."updated_at"');
    expect(builder.getBindings()).toStrictEqual([2]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereNotBetweenColumns('id', ['created_at', 'updated_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between "created_at" and "updated_at"');
    expect(builder.getBindings()).toStrictEqual([2]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereNotBetweenColumns('id', [new Raw(1), new Raw(2)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between 1 and 2');
    expect(builder.getBindings()).toStrictEqual([2]);
})

test('BasicOrWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhere('email', '=', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "email" = ?');
    expect(builder.getBindings()).toStrictEqual([1, 'foo']);
})

test('BasicOrWhereNot', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').orWhereNot('name', 'foo').orWhereNot('name', '<>', 'bar');
    expect(builder.toSql()).toBe('select * from "users" where not "name" = ? or not "name" <> ?');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
})

test('RawWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereRaw('id = ? or email = ?', [1, 'foo']);
    expect(builder.toSql()).toBe('select * from "users" where id = ? or email = ?');
    expect(builder.getBindings()).toStrictEqual([1, 'foo']);
})

test('RawOrWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereRaw('email = ?', ['foo']);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or email = ?');
    expect(builder.getBindings()).toStrictEqual([1, 'foo']);
})

test('BasicWhereIns', () => {
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [1, 2, 3]);
    expect(builder.toSql()).toBe('select * from "users" where "id" in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2, 3]);

    // associative arrays as values:
    builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', { //FIXME: object should not be allowed, if the keys are useless anyways!
        'issue': 45582,
        'id': 2,
        0 : 3,
    });
    expect(builder.toSql()).toBe('select * from "users" where "id" in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([45582, 2, 3]);

    // can accept some nested arrays as values.
    /*
    builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [
        {'issue': 45582},
        {'id': 2},
        [3],
    ]);
    expect(builder.toSql()).toBe('select * from "users" where "id" in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([45582, 2, 3]);
    */

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIn('id', [1, 2, 3]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([1, 1, 2, 3]);
})

test.skip('BasicWhereInsException', () =>
{
    // https://github.com/laravel/framework/blob/7f287ed2ee8aa0067b66c002b582f8ff7eedc00c/tests/Database/DatabaseQueryBuilderTest.php#L976
    /*
    expect(() => {
        const builder = getBuilder();
        builder.select(['*']).from('users').whereIn('id', [
            {
                'a': 1,
                'b': 1,
            },
            {'c': 2},
            [3],
        ]);
    }).toThrow();
    */
})

test('BasicWhereNotIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNotIn('id', [1, 2, 3]);
    expect(builder.toSql()).toBe('select * from "users" where "id" not in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2, 3]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotIn('id', [1, 2, 3]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([1, 1, 2, 3]);
})

test('RawWhereIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [new Raw(1)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" in (1)');

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIn('id', [new Raw(1)]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" in (1)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('EmptyWhereIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', []);
    expect(builder.toSql()).toBe('select * from "users" where 0 = 1');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIn('id', []);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or 0 = 1');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('EmptyWhereNotIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNotIn('id', []);
    expect(builder.toSql()).toBe('select * from "users" where 1 = 1');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotIn('id', []);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or 1 = 1');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereIntegerInRaw', () => {
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerInRaw('id', ['1a', 2]);
    expect(builder.toSql()).toBe('select * from "users" where "id" in (1, 2)');
    expect(builder.getBindings()).toStrictEqual([]);

    //TS values type is updated to no longer allow objects like this, because it just made no sense.
    /*
    builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerInRaw('id', [//FIXME: bindings of objects where the key is discarded anwyways should not be allowed!
        {'id': '1a'},
        {'id': 2},
        {'any': '3'},
    ]);
    expect(builder.toSql()).toBe('select * from "users" where "id" in (1, 2, 3)');
    expect(builder.getBindings()).toStrictEqual([]);
    */
})

test('OrWhereIntegerInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIntegerInRaw('id', ['1a', 2]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" in (1, 2)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereIntegerNotInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerNotInRaw('id', ['1a', 2]);
    expect(builder.toSql()).toBe('select * from "users" where "id" not in (1, 2)');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('OrWhereIntegerNotInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIntegerNotInRaw('id', ['1a', 2]);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not in (1, 2)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('EmptyWhereIntegerInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerInRaw('id', []);
    expect(builder.toSql()).toBe('select * from "users" where 0 = 1');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('EmptyWhereIntegerNotInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerNotInRaw('id', []);
    expect(builder.toSql()).toBe('select * from "users" where 1 = 1');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('BasicWhereColumn', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereColumn('first_name', 'last_name').orWhereColumn('first_name', 'middle_name');
    expect(builder.toSql()).toBe('select * from "users" where "first_name" = "last_name" or "first_name" = "middle_name"');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereColumn('updated_at', '>', 'created_at');
    expect(builder.toSql()).toBe('select * from "users" where "updated_at" > "created_at"');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('ArrayWhereColumn', () =>
{
    const conditions = [
        ['first_name', 'last_name'],
        ['updated_at', '>', 'created_at'],
    ];

    const builder = getBuilder();
    builder.select(['*']).from('users').whereColumn(conditions);
    expect(builder.toSql()).toBe('select * from "users" where ("first_name" = "last_name" and "updated_at" > "created_at")');
    expect(builder.getBindings()).toStrictEqual([]);
})

test.skip('WhereFulltextMySql', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World');
    expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in natural language mode)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'expanded': true});
    expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in natural language mode with query expansion)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', '+Hello -World', {'mode': 'boolean'});
    expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in boolean mode)');
    expect(builder.getBindings()).toStrictEqual(['+Hello -World']);

    builder = getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', '+Hello -World', {'mode': 'boolean', 'expanded': true});
    expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in boolean mode)');
    expect(builder.getBindings()).toStrictEqual(['+Hello -World']);

    builder = getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext(['body', 'title'], 'Car,Plane');
    expect(builder.toSql()).toBe('select * from `users` where match (`body`, `title`) against (? in natural language mode)');
    expect(builder.getBindings()).toStrictEqual(['Car,Plane']);
    */
})

test.skip('WhereFulltextPostgres', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World');
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'language': 'simple'});
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'simple\', "body")) @@ plainto_tsquery(\'simple\', ?)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'mode': 'plain'});
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'mode': 'phrase'});
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'english\', "body")) @@ phraseto_tsquery(\'english\', ?)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', '+Hello -World', {'mode': 'websearch'});
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'english\', "body")) @@ websearch_to_tsquery(\'english\', ?)');
    expect(builder.getBindings()).toStrictEqual(['+Hello -World']);

    builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'language': 'simple', 'mode': 'plain'});
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'simple\', "body")) @@ plainto_tsquery(\'simple\', ?)');
    expect(builder.getBindings()).toStrictEqual(['Hello World']);

    builder = getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext(['body', 'title'], 'Car Plane');
    expect(builder.toSql()).toBe('select * from "users" where (to_tsvector(\'english\', "body") || to_tsvector(\'english\', "title")) @@ plainto_tsquery(\'english\', ?)');
    expect(builder.getBindings()).toStrictEqual(['Car Plane']);
    */
})

test('Unions', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getMySqlBuilder().select(['*']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getMysqlBuilder();
    let $expectedSql = '(select `a` from `t1` where `a` = ? and `b` = ?) union (select `a` from `t2` where `a` = ? and `b` = ?) order by `a` asc limit 10';
    const $union = getMySqlBuilder().select(['a']).from('t2').where('a', 11).where('b', 2);
    builder.select(['a']).from('t1').where('a', 10).where('b', 1).union($union).orderBy('a').limit(10);
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual([10, 1, 11, 2]);

    builder = getPostgresBuilder();
    $expectedSql = '(select "name" from "users" where "id" = ?) union (select "name" from "users" where "id" = ?)';
    builder.select(['name']).from('users').where('id', '=', 1);
    builder.union(getPostgresBuilder().select(['name']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getSQLiteBuilder();
    $expectedSql = 'select * from (select "name" from "users" where "id" = ?) union select * from (select "name" from "users" where "id" = ?)';
    builder.select(['name']).from('users').where('id', '=', 1);
    builder.union(getSQLiteBuilder().select(['name']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getSqlServerBuilder();
    $expectedSql = 'select * from (select [name] from [users] where [id] = ?) as [temp_table] union select * from (select [name] from [users] where [id] = ?) as [temp_table]';
    builder.select(['name']).from('users').where('id', '=', 1);
    builder.union(getSqlServerBuilder().select(['name']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    // builder = getBuilder();
    // const $eloquentBuilder = new EloquentBuilder(getBuilder());
    // builder.select(['*']).from('users').where('id', '=', 1).union($eloquentBuilder.select(['*']).from('users').where('id', '=', 2));
    // builder.toSql()).toBe(expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)');
    // expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('UnionAlls', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    const $expectedSql = '(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)';
    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 2));
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    // builder = getBuilder();
    // const $eloquentBuilder = new EloquentBuilder(getBuilder());
    // builder.select(['*']).from('users').where('id', '=', 1);
    // builder.unionAll($eloquentBuilder.select(['*']).from('users').where('id', '=', 2));
    // builder.toSql()).toBe(expect('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)');
    // expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('MultipleUnions', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 3));
    expect(builder.toSql()).toBe('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2, 3]);
})

test('MultipleUnionAlls', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 3));
    expect(builder.toSql()).toBe('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2, 3]);
})

test('UnionOrderBys', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.orderBy('id', 'desc');
    expect(builder.toSql()).toBe('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?) order by "id" desc');
    expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('UnionLimitsAndOffsets', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users');
    builder.union(getBuilder().select(['*']).from('dogs'));
    builder.skip(5).take(10);
    expect(builder.toSql()).toBe('(select * from "users") union (select * from "dogs") limit 10 offset 5');

    let $expectedSql = '(select * from "users") union (select * from "dogs") limit 10 offset 5';
    builder = getPostgresBuilder();
    builder.select(['*']).from('users');
    builder.union(getBuilder().select(['*']).from('dogs'));
    builder.skip(5).take(10);
    expect(builder.toSql()).toBe($expectedSql);

    $expectedSql = '(select * from "users" limit 11) union (select * from "dogs" limit 22) limit 10 offset 5';
    builder = getPostgresBuilder();
    builder.select(['*']).from('users').limit(11);
    builder.union(getBuilder().select(['*']).from('dogs').limit(22));
    builder.skip(5).take(10);
    expect(builder.toSql()).toBe($expectedSql);
})

test('UnionWithJoin', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users');
    builder.union(getBuilder().select(['*']).from('dogs').join('breeds', function ($join) {
        $join.on('dogs.breed_id', '=', 'breeds.id')
            .where('breeds.is_native', '=', 1);
    }));
    expect(builder.toSql()).toBe('(select * from "users") union (select * from "dogs" inner join "breeds" on "dogs"."breed_id" = "breeds"."id" and "breeds"."is_native" = ?)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('MySqlUnionOrderBys', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getMySqlBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.orderBy('id', 'desc');
    expect(builder.toSql()).toBe('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?) order by `id` desc');
    expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('MySqlUnionLimitsAndOffsets', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users');
    builder.union(getMySqlBuilder().select(['*']).from('dogs'));
    builder.skip(5).take(10);
    expect(builder.toSql()).toBe('(select * from `users`) union (select * from `dogs`) limit 10 offset 5');
})

test.skip('UnionAggregate', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let $expected = 'select count(*) as aggregate from ((select * from `posts`) union (select * from `videos`)) as `temp_table`';
    let builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union(getMySqlBuilder().from('videos')).count();

    $expected = 'select count(*) as aggregate from ((select `id` from `posts`) union (select `id` from `videos`)) as `temp_table`';
    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').select('id').union(getMySqlBuilder().from('videos').select('id')).count();

    $expected = 'select count(*) as aggregate from ((select * from "posts") union (select * from "videos")) as "temp_table"';
    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union(getPostgresBuilder().from('videos')).count();

    $expected = 'select count(*) as aggregate from (select * from (select * from "posts") union select * from (select * from "videos")) as "temp_table"';
    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union(getSQLiteBuilder().from('videos')).count();

    $expected = 'select count(*) as aggregate from (select * from (select * from [posts]) as [temp_table] union select * from (select * from [videos]) as [temp_table]) as [temp_table]';
    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union(getSqlServerBuilder().from('videos')).count();
    */
})

test.skip('HavingAggregate', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const $expected = 'select count(*) as aggregate from (select (select `count(*)` from `videos` where `posts`.`id` = `videos`.`post_id`) as `videos_count` from `posts` having `videos_count` > ?) as `temp_table`';
    const builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('getDatabaseName');
    builder.getConnection().shouldReceive('select').once().with($expected, [1], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    builder.from('posts').selectSub(function ($query) {
        $query.from('videos').select('count(*)').whereColumn('posts.id', '=', 'videos.post_id');
    }, 'videos_count').having('videos_count', '>', 1);
    builder.count();
    */
})

test('SubSelectWhereIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', function ($q) {
        $q.select(['id']).from('users').where('age', '>', 25).take(3);
    });
    expect(builder.toSql()).toBe('select * from "users" where "id" in (select "id" from "users" where "age" > ? limit 3)');
    expect(builder.getBindings()).toStrictEqual([25]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereNotIn('id', function ($q) {
        $q.select(['id']).from('users').where('age', '>', 25).take(3);
    });
    expect(builder.toSql()).toBe('select * from "users" where "id" not in (select "id" from "users" where "age" > ? limit 3)');
    expect(builder.getBindings()).toStrictEqual([25]);
})

test('BasicWhereNulls', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNull('id');
    expect(builder.toSql()).toBe('select * from "users" where "id" is null');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNull('id');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" is null');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('BasicWhereNullExpressionsMysql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereNull(new Raw('id'));
    expect(builder.toSql()).toBe('select * from `users` where id is null');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNull(new Raw('id'));
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or id is null');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('JsonWhereNullMysql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereNull('items->id');
    expect(builder.toSql()).toBe('select * from `users` where (json_extract(`items`, \'$."id"\') is null OR json_type(json_extract(`items`, \'$."id"\')) = \'NULL\')');
})

test('JsonWhereNotNullMysql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereNotNull('items->id');
    expect(builder.toSql()).toBe('select * from `users` where (json_extract(`items`, \'$."id"\') is not null AND json_type(json_extract(`items`, \'$."id"\')) != \'NULL\')');
})

test('JsonWhereNullExpressionMysql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereNull(new Raw('items->id'));
    expect(builder.toSql()).toBe('select * from `users` where (json_extract(`items`, \'$."id"\') is null OR json_type(json_extract(`items`, \'$."id"\')) = \'NULL\')');
})

test('JsonWhereNotNullExpressionMysql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereNotNull(new Raw('items->id'));
    expect(builder.toSql()).toBe('select * from `users` where (json_extract(`items`, \'$."id"\') is not null AND json_type(json_extract(`items`, \'$."id"\')) != \'NULL\')');
})

test('ArrayWhereNulls', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNull(['id', 'expires_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" is null and "expires_at" is null');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNull(['id', 'expires_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" is null or "expires_at" is null');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('BasicWhereNotNulls', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNotNull('id');
    expect(builder.toSql()).toBe('select * from "users" where "id" is not null');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '>', 1).orWhereNotNull('id');
    expect(builder.toSql()).toBe('select * from "users" where "id" > ? or "id" is not null');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('ArrayWhereNotNulls', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNotNull(['id', 'expires_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" is not null and "expires_at" is not null');
    expect(builder.getBindings()).toStrictEqual([]);

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '>', 1).orWhereNotNull(['id', 'expires_at']);
    expect(builder.toSql()).toBe('select * from "users" where "id" > ? or "id" is not null or "expires_at" is not null');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('GroupBys', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email');
    expect(builder.toSql()).toBe('select * from "users" group by "email"');

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('id', 'email');
    expect(builder.toSql()).toBe('select * from "users" group by "id", "email"');

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy(['id', 'email']);
    expect(builder.toSql()).toBe('select * from "users" group by "id", "email"');

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy(new Raw('DATE(created_at)'));
    expect(builder.toSql()).toBe('select * from "users" group by DATE(created_at)');

    builder = getBuilder();
    builder.select(['*']).from('users').groupByRaw('DATE(created_at), ? DESC', ['foo']);
    expect(builder.toSql()).toBe('select * from "users" group by DATE(created_at), ? DESC');
    expect(builder.getBindings()).toStrictEqual(['foo']);

    builder = getBuilder();
    builder.havingRaw('?', ['havingRawBinding']).groupByRaw('?', ['groupByRawBinding']).whereRaw('?', ['whereRawBinding']);
    expect(builder.getBindings()).toStrictEqual(['whereRawBinding', 'groupByRawBinding', 'havingRawBinding']);
})

test('OrderBys', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').orderBy('email').orderBy('age', 'desc');
    expect(builder.toSql()).toBe('select * from "users" order by "email" asc, "age" desc');

    // builder._orders = null;
    // builder.toSql()).toBe(expect('select * from "users"');

    builder._orders = [];
    expect(builder.toSql()).toBe('select * from "users"');

    builder = getBuilder();
    builder.select(['*']).from('users').orderBy('email').orderByRaw('"age" ? desc', ['foo']);
    expect(builder.toSql()).toBe('select * from "users" order by "email" asc, "age" ? desc');
    expect(builder.getBindings()).toStrictEqual(['foo']);

    builder = getBuilder();
    builder.select(['*']).from('users').orderByDesc('name');
    expect(builder.toSql()).toBe('select * from "users" order by "name" desc');

    builder = getBuilder();
    builder.select(['*']).from('posts').where('public', 1)
        .unionAll(getBuilder().select(['*']).from('videos').where('public', 1))
        .orderByRaw('field(category, ?, ?) asc', ['news', 'opinion']);
    expect(builder.toSql()).toBe('(select * from "posts" where "public" = ?) union all (select * from "videos" where "public" = ?) order by field(category, ?, ?) asc');
    expect(builder.getBindings()).toStrictEqual([1, 1, 'news', 'opinion']);
})

test('Latest', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').latest();
    expect(builder.toSql()).toBe('select * from "users" order by "created_at" desc');

    builder = getBuilder();
    builder.select(['*']).from('users').latest().limit(1);
    expect(builder.toSql()).toBe('select * from "users" order by "created_at" desc limit 1');

    builder = getBuilder();
    builder.select(['*']).from('users').latest('updated_at');
    expect(builder.toSql()).toBe('select * from "users" order by "updated_at" desc');
})

test('Oldest', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').oldest();
    expect(builder.toSql()).toBe('select * from "users" order by "created_at" asc');

    builder = getBuilder();
    builder.select(['*']).from('users').oldest().limit(1);
    expect(builder.toSql()).toBe('select * from "users" order by "created_at" asc limit 1');

    builder = getBuilder();
    builder.select(['*']).from('users').oldest('updated_at');
    expect(builder.toSql()).toBe('select * from "users" order by "updated_at" asc');
})

test('InRandomOrderMySql', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').inRandomOrder();
    expect(builder.toSql()).toBe('select * from "users" order by RANDOM()');
})

test('InRandomOrderPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').inRandomOrder();
    expect(builder.toSql()).toBe('select * from "users" order by RANDOM()');
})

test('InRandomOrderSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').inRandomOrder();
    expect(builder.toSql()).toBe('select * from [users] order by NEWID()');
})

test('OrderBysSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').orderBy('email').orderBy('age', 'desc');
    expect(builder.toSql()).toBe('select * from [users] order by [email] asc, [age] desc');

    // builder._orders = null;
    // builder.toSql()).toBe(expect('select * from [users]');

    builder._orders = [];
    expect(builder.toSql()).toBe('select * from [users]');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').orderBy('email');
    expect(builder.toSql()).toBe('select * from [users] order by [email] asc');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').orderByDesc('name');
    expect(builder.toSql()).toBe('select * from [users] order by [name] desc');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').orderByRaw('[age] asc');
    expect(builder.toSql()).toBe('select * from [users] order by [age] asc');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').orderBy('email').orderByRaw('[age] ? desc', ['foo']);
    expect(builder.toSql()).toBe('select * from [users] order by [email] asc, [age] ? desc');
    expect(builder.getBindings()).toStrictEqual(['foo']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').skip(25).take(10).orderByRaw('[email] desc');
    expect(builder.toSql()).toBe('select * from [users] order by [email] desc offset 25 rows fetch next 10 rows only');
})

test('Reorder', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').orderBy('name');
    expect(builder.toSql()).toBe('select * from "users" order by "name" asc');
    builder.reorder();
    expect(builder.toSql()).toBe('select * from "users"');

    builder = getBuilder();
    builder.select(['*']).from('users').orderBy('name');
    expect(builder.toSql()).toBe('select * from "users" order by "name" asc');
    builder.reorder('email', 'desc');
    expect(builder.toSql()).toBe('select * from "users" order by "email" desc');

    builder = getBuilder();
    builder.select(['*']).from('first');
    builder.union(getBuilder().select(['*']).from('second'));
    builder.orderBy('name');
    expect(builder.toSql()).toBe('(select * from "first") union (select * from "second") order by "name" asc');
    builder.reorder();
    expect(builder.toSql()).toBe('(select * from "first") union (select * from "second")');

    builder = getBuilder();
    builder.select(['*']).from('users').orderByRaw('?', [true]);
    expect(builder.getBindings()).toStrictEqual([true]);
    builder.reorder();
    expect(builder.getBindings()).toStrictEqual([]);
})

test('OrderBySubQueries', () =>
{
    const expected = 'select * from "users" order by (select "created_at" from "logins" where "user_id" = "users"."id" limit 1)';
    const $subQuery = function ($query: Builder) {
        return $query.select(['created_at']).from('logins').whereColumn('user_id', 'users.id').limit(1);
    };

    let builder = getBuilder().select(['*']).from('users').orderBy($subQuery);
    expect(builder.toSql()).toBe(`${expected} asc`);

    builder = getBuilder().select(['*']).from('users').orderBy($subQuery, 'desc');
    expect(builder.toSql()).toBe(`${expected} desc`);

    builder = getBuilder().select(['*']).from('users').orderByDesc($subQuery);
    expect(builder.toSql()).toBe(`${expected} desc`);

    builder = getBuilder();
    builder.select(['*']).from('posts').where('public', 1)
        .unionAll(getBuilder().select(['*']).from('videos').where('public', 1))
        .orderBy(getBuilder().selectRaw('field(category, ?, ?)', ['news', 'opinion']));
    expect(builder.toSql()).toBe('(select * from "posts" where "public" = ?) union all (select * from "videos" where "public" = ?) order by (select field(category, ?, ?)) asc');
    expect(builder.getBindings()).toStrictEqual([1, 1, 'news', 'opinion']);
})

test.skip('OrderByInvalidDirectionParam', () =>
{
    expect(() => {
        const builder = getBuilder();
        // @ts-expect-error Argument of type '"asec"' is not assignable to parameter of type '"asc" | "desc" | undefined'
        builder.select(['*']).from('users').orderBy('age', 'asec');// Typescript should typeguard this now, so the exceotion expected no longer exists.
    }).toThrow();
})

test('Havings', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').having('email', '>', 1);
    expect(builder.toSql()).toBe('select * from "users" having "email" > ?');

    builder = getBuilder();
    builder.select(['*']).from('users')
        .orHaving('email', '=', 'test@example.com')
        .orHaving('email', '=', 'test2@example.com');
    expect(builder.toSql()).toBe('select * from "users" having "email" = ? or "email" = ?');

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email').having('email', '>', 1);
    expect(builder.toSql()).toBe('select * from "users" group by "email" having "email" > ?');

    builder = getBuilder();
    builder.select(['email as foo_email']).from('users').having('foo_email', '>', 1);
    expect(builder.toSql()).toBe('select "email" as "foo_email" from "users" having "foo_email" > ?');

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').having('total', '>', new Raw('3'));
    expect(builder.toSql()).toBe('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3');

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').having('total', '>', 3);
    expect(builder.toSql()).toBe('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?');
})

test('NestedHavings', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having('email', '=', 'foo').orHaving(function ($q) {
        $q.having('name', '=', 'bar').having('age', '=', 25);
    });
    expect(builder.toSql()).toBe('select * from "users" having "email" = ? or ("name" = ? and "age" = ?)');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar', 25]);
})

test('NestedHavingBindings', () =>
{
    const builder = getBuilder();
    builder.having('email', '=', 'foo').having(function ($q) {
        $q.selectRaw('?', ['ignore']).having('name', '=', 'bar');
    });
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
})

test('HavingBetweens', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').havingBetween('id', [1, 2, 3]);
    expect(builder.toSql()).toBe('select * from "users" having "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').havingBetween('id', [[1, 2], [3, 4]]);
    expect(builder.toSql()).toBe('select * from "users" having "id" between ? and ?');
    expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('HavingNull', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').havingNull('email');
    expect(builder.toSql()).toBe('select * from "users" having "email" is null');

    builder = getBuilder();
    builder.select(['*']).from('users')
        .havingNull('email')
        .havingNull('phone');
    expect(builder.toSql()).toBe('select * from "users" having "email" is null and "phone" is null');

    builder = getBuilder();
    builder.select(['*']).from('users')
        .orHavingNull('email')
        .orHavingNull('phone');
    expect(builder.toSql()).toBe('select * from "users" having "email" is null or "phone" is null');

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email').havingNull('email');
    expect(builder.toSql()).toBe('select * from "users" group by "email" having "email" is null');

    builder = getBuilder();
    builder.select(['email as foo_email']).from('users').havingNull('foo_email');
    expect(builder.toSql()).toBe('select "email" as "foo_email" from "users" having "foo_email" is null');

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNull('total');
    expect(builder.toSql()).toBe('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is null');

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNull('total');
    expect(builder.toSql()).toBe('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is null');
})

test('HavingNotNull', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').havingNotNull('email');
    expect(builder.toSql()).toBe('select * from "users" having "email" is not null');

    builder = getBuilder();
    builder.select(['*']).from('users')
        .havingNotNull('email')
        .havingNotNull('phone');
    expect(builder.toSql()).toBe('select * from "users" having "email" is not null and "phone" is not null');

    builder = getBuilder();
    builder.select(['*']).from('users')
        .orHavingNotNull('email')
        .orHavingNotNull('phone');
    expect(builder.toSql()).toBe('select * from "users" having "email" is not null or "phone" is not null');

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email').havingNotNull('email');
    expect(builder.toSql()).toBe('select * from "users" group by "email" having "email" is not null');

    builder = getBuilder();
    builder.select(['email as foo_email']).from('users').havingNotNull('foo_email');
    expect(builder.toSql()).toBe('select "email" as "foo_email" from "users" having "foo_email" is not null');

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNotNull('total');
    expect(builder.toSql()).toBe('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is not null');

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNotNull('total');
    expect(builder.toSql()).toBe('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is not null');
})

test('HavingExpression', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having(
        new (class extends Expression
        {
            public override getValue(_grammar: Grammar)
            {
                return '1 = 1';
            }
        })('')
    );
    expect(builder.toSql()).toBe('select * from "users" having 1 = 1');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('HavingShortcut', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having('email', 1).orHaving('email', 2);
    expect(builder.toSql()).toBe('select * from "users" having "email" = ? or "email" = ?');
})

test.skip('HavingFollowedBySelectGet', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    let $query = 'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?';
    builder.getConnection().shouldReceive('select').once().with($query, ['popular', 3], true).andReturn([{'category': 'rock', 'total': 5}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('item');
    let $result = builder.select(['category', new Raw('count(*) as "total"')]).where('department', '=', 'popular').groupBy('category').having('total', '>', 3).get();
    expect($result.all()).toStrictEqual([{'category': 'rock', 'total': 5}]);

    // Using \Raw value
    builder = getBuilder();
    $query = 'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3';
    builder.getConnection().shouldReceive('select').once().with($query, ['popular'], true).andReturn([{'category': 'rock', 'total': 5}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('item');
    $result = builder.select(['category', new Raw('count(*) as "total"')]).where('department', '=', 'popular').groupBy('category').having('total', '>', new Raw('3')).get();
    expect($result.all()).toStrictEqual([{'category': 'rock', 'total': 5}]);
    */
})

test('RawHavings', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').havingRaw('user_foo < user_bar');
    expect(builder.toSql()).toBe('select * from "users" having user_foo < user_bar');

    builder = getBuilder();
    builder.select(['*']).from('users').having('baz', '=', 1).orHavingRaw('user_foo < user_bar');
    expect(builder.toSql()).toBe('select * from "users" having "baz" = ? or user_foo < user_bar');

    builder = getBuilder();
    builder.select(['*']).from('users').havingBetween('last_login_date', ['2018-11-16', '2018-12-16']).orHavingRaw('user_foo < user_bar');
    expect(builder.toSql()).toBe('select * from "users" having "last_login_date" between ? and ? or user_foo < user_bar');
})

test('LimitsAndOffsets', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').offset(5).limit(10);
    expect(builder.toSql()).toBe('select * from "users" limit 10 offset 5');

    builder = getBuilder();
    builder.select(['*']).from('users').limit(null);
    expect(builder.toSql()).toBe('select * from "users"');

    builder = getBuilder();
    builder.select(['*']).from('users').limit(0);
    expect(builder.toSql()).toBe('select * from "users" limit 0');

    builder = getBuilder();
    builder.select(['*']).from('users').skip(5).take(10);
    expect(builder.toSql()).toBe('select * from "users" limit 10 offset 5');

    builder = getBuilder();
    builder.select(['*']).from('users').skip(0).take(0);
    expect(builder.toSql()).toBe('select * from "users" limit 0 offset 0');

    builder = getBuilder();
    builder.select(['*']).from('users').skip(-5).take(-10);
    expect(builder.toSql()).toBe('select * from "users" offset 0');

    // builder = getBuilder();
    // builder.select(['*']).from('users').skip(null).take(null); // TODO: null is currently not a valid option for the methods
    // builder.toSql()).toBe(expect('select * from "users" offset 0');

    // builder = getBuilder();
    // builder.select(['*']).from('users').skip(5).take(null); // TODO: null is currently not a valid option for the method
    // builder.toSql()).toBe(expect('select * from "users" offset 5');
})

test('ForPage', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').forPage(2, 15);
    expect(builder.toSql()).toBe('select * from "users" limit 15 offset 15');

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(0, 15);
    expect(builder.toSql()).toBe('select * from "users" limit 15 offset 0');

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(-2, 15);
    expect(builder.toSql()).toBe('select * from "users" limit 15 offset 0');

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(2, 0);
    expect(builder.toSql()).toBe('select * from "users" limit 0 offset 0');

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(0, 0);
    expect(builder.toSql()).toBe('select * from "users" limit 0 offset 0');

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(-2, 0);
    expect(builder.toSql()).toBe('select * from "users" limit 0 offset 0');
})

test.skip('GetCountForPaginationWithBindings', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.from('users').selectSub(function ($q) {
        $q.select('body').from('posts').where('id', 4);
    }, 'post');

    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    const $count = builder.getCountForPagination();
    expect($count).toBe(1);
    expect(builder.getBindings()).toStrictEqual([4]);
    */
})

test('GetCountForPaginationWithColumnAliases', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    const $columns = ['body as post_body', 'teaser', 'posts.created as published'];
    builder.from('posts').select($columns);

    builder.getConnection().shouldReceive('select').once().with('select count("body", "teaser", "posts"."created") as aggregate from "posts"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    const $count = builder.getCountForPagination($columns);
    expect($count).toBe(1);
    */
})

test('GetCountForPaginationWithUnion', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.from('posts').select('id').union(getBuilder().from('videos').select('id'));

    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from ((select "id" from "posts") union (select "id" from "videos")) as "temp_table"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    const $count = builder.getCountForPagination();
    expect($count).toBe(1);
    */
})

test('WhereShortcut', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhere('name', 'foo');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "name" = ?');
    expect(builder.getBindings()).toStrictEqual([1, 'foo']);
})

test('WhereWithArrayConditions', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where([['foo', 1], ['bar', 2]]);
    expect(builder.toSql()).toBe('select * from "users" where ("foo" = ? and "bar" = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').where({'foo': 1, 'bar': 2});
    expect(builder.toSql()).toBe('select * from "users" where ("foo" = ? and "bar" = ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').where([['foo', 1], ['bar', '<', 2]]);
    expect(builder.toSql()).toBe('select * from "users" where ("foo" = ? and "bar" < ?)');
    expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('NestedWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', '=', 'foo').orWhere(function ($q) {
        $q.where('name', '=', 'bar').where('age', '=', 25);
    });
    expect(builder.toSql()).toBe('select * from "users" where "email" = ? or ("name" = ? and "age" = ?)');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar', 25]);
})

test('NestedWhereBindings', () =>
{
    const builder = getBuilder();
    builder.where('email', '=', 'foo').where(function ($q) {
        $q.selectRaw('?', ['ignore']).where('name', '=', 'bar');
    });
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
})

test('WhereNot', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNot(function ($q) {
        $q.where('email', '=', 'foo');
    });
    expect(builder.toSql()).toBe('select * from "users" where not ("email" = ?)');
    expect(builder.getBindings()).toStrictEqual(['foo']);

    builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'bar').whereNot(function ($q) {
        $q.where('email', '=', 'foo');
    });
    expect(builder.toSql()).toBe('select * from "users" where "name" = ? and not ("email" = ?)');
    expect(builder.getBindings()).toStrictEqual(['bar', 'foo']);

    builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'bar').orWhereNot(function ($q) {
        $q.where('email', '=', 'foo');
    });
    expect(builder.toSql()).toBe('select * from "users" where "name" = ? or not ("email" = ?)');
    expect(builder.getBindings()).toStrictEqual(['bar', 'foo']);
})

test.skip('IncrementManyArgumentValidation1', () =>
{
    // incrementEach method depends on update, wich is removed due to reduction of complexity
    /*
    //$this.expectException(InvalidArgumentException::class);
    //$this.expectExceptionMessage('Non-numeric value passed as increment amount for column: \'col\'.');//FIXME
    const builder = getBuilder();
    builder.from('users').incrementEach({'col': 'a'});
    */
})

test.skip('IncrementManyArgumentValidation2', () =>
{
    // incrementEach method depends on update, wich is removed due to reduction of complexity
    /*
    //$this.expectException(InvalidArgumentException::class);
    //$this.expectExceptionMessage('Non-associative array passed to incrementEach method.');
    const builder = getBuilder();
    builder.from('users').incrementEach([111]);
    */
})

test('WhereNotWithArrayConditions', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNot([['foo', 1], ['bar', 2]]);
    expect(builder.toSql()).toBe('select * from "users" where not (("foo" = ? and "bar" = ?))');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereNot({'foo': 1, 'bar': 2});
    expect(builder.toSql()).toBe('select * from "users" where not (("foo" = ? and "bar" = ?))');
    expect(builder.getBindings()).toStrictEqual([1, 2]);

    builder = getBuilder();
    builder.select(['*']).from('users').whereNot([['foo', 1], ['bar', '<', 2]]);
    expect(builder.toSql()).toBe('select * from "users" where not (("foo" = ? and "bar" < ?))');
    expect(builder.getBindings()).toStrictEqual([1, 2]);
})

test('FullSubSelects', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', '=', 'foo').orWhere('id', '=', function ($q) {
        $q.select([new Raw('max(id)')]).from('users').where('email', '=', 'bar');
    });

    expect(builder.toSql()).toBe('select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
})

test('WhereExists', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('orders').whereExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect(builder.toSql()).toBe('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').whereNotExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect(builder.toSql()).toBe('select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect(builder.toSql()).toBe('select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereNotExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect(builder.toSql()).toBe('select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').whereExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect(builder.toSql()).toBe('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').whereNotExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect(builder.toSql()).toBe('select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect(builder.toSql()).toBe('select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")');

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereNotExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect(builder.toSql()).toBe('select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")');

    /*
    builder = getBuilder();
    builder.select(['*']).from('orders').whereExists(
        (new EloquentBuilder(getBuilder())).select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect(builder.toSql()).toBe('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")');
    */
})

test('BasicJoins', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', 'users.id', 'contacts.id');
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id"');

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', 'users.id', '=', 'contacts.id').leftJoin('photos', 'users.id', '=', 'photos.id');
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" left join "photos" on "users"."id" = "photos"."id"');

    builder = getBuilder();
    builder.select(['*']).from('users').leftJoinWhere('photos', 'users.id', '=', 'bar').joinWhere('photos', 'users.id', '=', 'foo');
    expect(builder.toSql()).toBe('select * from "users" left join "photos" on "users"."id" = ? inner join "photos" on "users"."id" = ?');
    expect(builder.getBindings()).toStrictEqual(['bar', 'foo']);
})

test('CrossJoins', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('sizes').crossJoin('colors');
    expect(builder.toSql()).toBe('select * from "sizes" cross join "colors"');

    builder = getBuilder();
    builder.select(['*']).from('tableB').join('tableA', 'tableA.column1', '=', 'tableB.column2', 'cross');
    expect(builder.toSql()).toBe('select * from "tableB" cross join "tableA" on "tableA"."column1" = "tableB"."column2"');

    builder = getBuilder();
    builder.select(['*']).from('tableB').crossJoin('tableA', 'tableA.column1', '=', 'tableB.column2');
    expect(builder.toSql()).toBe('select * from "tableB" cross join "tableA" on "tableA"."column1" = "tableB"."column2"');
})

test('CrossJoinSubs', () =>
{
    const builder = getBuilder();
    builder.selectRaw('(sale / overall.sales) * 100 AS percent_of_total').from('sales').crossJoinSub(getBuilder().selectRaw('SUM(sale) AS sales').from('sales'), 'overall');
    expect(builder.toSql()).toBe('select (sale / overall.sales) * 100 AS percent_of_total from "sales" cross join (select SUM(sale) AS sales from "sales") as "overall"');
})

test('ComplexJoin', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orOn('users.name', '=', 'contacts.name');
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "users"."name" = "contacts"."name"');

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.where('users.id', '=', 'foo').orWhere('users.name', '=', 'bar');
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = ? or "users"."name" = ?');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);

    // Run the assertions again
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = ? or "users"."name" = ?');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
})

test('JoinWhereNull', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereNull('contacts.deleted_at');
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."deleted_at" is null');

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereNull('contacts.deleted_at');
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."deleted_at" is null');
})

test('JoinWhereNotNull', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereNotNull('contacts.deleted_at');
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."deleted_at" is not null');

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereNotNull('contacts.deleted_at');
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."deleted_at" is not null');
})

test('JoinWhereIn', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereIn('contacts.name', [48, 'baz', null]);
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([48, 'baz', null]);

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereIn('contacts.name', [48, 'baz', null]);
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([48, 'baz', null]);
})

test('JoinWhereInSubquery', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        const $q = getBuilder();
        $q.select(['name']).from('contacts').where('name', 'baz');
        $j.on('users.id', '=', 'contacts.id').whereIn('contacts.name', $q);
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" in (select "name" from "contacts" where "name" = ?)');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        const $q = getBuilder();
        $q.select(['name']).from('contacts').where('name', 'baz');
        $j.on('users.id', '=', 'contacts.id').orWhereIn('contacts.name', $q);
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" in (select "name" from "contacts" where "name" = ?)');
    expect(builder.getBindings()).toStrictEqual(['baz']);
})

test('JoinWhereNotIn', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereNotIn('contacts.name', [48, 'baz', null]);
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" not in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([48, 'baz', null]);

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereNotIn('contacts.name', [48, 'baz', null]);
    });
    expect(builder.toSql()).toBe('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" not in (?, ?, ?)');
    expect(builder.getBindings()).toStrictEqual([48, 'baz', null]);
})

test('JoinsWithNestedConditions', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').where(function ($j) {
            $j.where('contacts.country', '=', 'US').orWhere('contacts.is_partner', '=', 1);
        });
    });
    expect(builder.toSql()).toBe('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and ("contacts"."country" = ? or "contacts"."is_partner" = ?)');
    expect(builder.getBindings()).toStrictEqual(['US', 1]);

    builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').where('contacts.is_active', '=', 1).orOn(function ($j) {
            $j.orWhere(function ($j) {
                $j.where('contacts.country', '=', 'UK').orOn('contacts.type', '=', 'users.type');
            }).where(function ($j) {
                $j.where('contacts.country', '=', 'US').orWhereNull('contacts.is_partner');
            });
        });
    });
    expect(builder.toSql()).toBe('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and "contacts"."is_active" = ? or (("contacts"."country" = ? or "contacts"."type" = "users"."type") and ("contacts"."country" = ? or "contacts"."is_partner" is null))');
    expect(builder.getBindings()).toStrictEqual([1, 'UK', 'US']);
})

test.skip('JoinsWithAdvancedConditions', () =>
{
    //This test uses dynamic where column calls. This is not wanted in this lower complexity solution
    /*
    const builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').where(function ($j) {
            $j.whereRole('admin')
                .orWhereNull('contacts.disabled')
                .orWhereRaw('year(contacts.created_at) = 2016');
        });
    });
    expect(builder.toSql()).toBe('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and ("role" = ? or "contacts"."disabled" is null or year(contacts.created_at) = 2016)');
    expect(builder.getBindings()).toStrictEqual(['admin']);
    */
})

test('JoinsWithSubqueryCondition', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').whereIn('contact_type_id', function ($q) {
            $q.select(['id']).from('contact_types')
                .where('category_id', '1')
                .whereNull('deleted_at');
        });
    });
    expect(builder.toSql()).toBe('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and "contact_type_id" in (select "id" from "contact_types" where "category_id" = ? and "deleted_at" is null)');
    expect(builder.getBindings()).toStrictEqual(['1']);

    builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').whereExists(function ($q) {
            $q.selectRaw('1').from('contact_types')
                .whereRaw('contact_types.id = contacts.contact_type_id')
                .where('category_id', '1')
                .whereNull('deleted_at');
        });
    });
    expect(builder.toSql()).toBe('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and exists (select 1 from "contact_types" where contact_types.id = contacts.contact_type_id and "category_id" = ? and "deleted_at" is null)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('JoinsWithAdvancedSubqueryCondition', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').whereExists(function ($q) {
            $q.selectRaw('1').from('contact_types')
                .whereRaw('contact_types.id = contacts.contact_type_id')
                .where('category_id', '1')
                .whereNull('deleted_at')
                .whereIn('level_id', function ($q) {
                    $q.select(['id']).from('levels')
                        .where('is_active', true);
                });
        });
    });
    expect(builder.toSql()).toBe('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and exists (select 1 from "contact_types" where contact_types.id = contacts.contact_type_id and "category_id" = ? and "deleted_at" is null and "level_id" in (select "id" from "levels" where "is_active" = ?))');
    expect(builder.getBindings()).toStrictEqual(['1', true]);
})

test('JoinsWithNestedJoins', () =>
{
    const builder = getBuilder();
    builder.select(['users.id', 'contacts.id', 'contact_types.id']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').join('contact_types', 'contacts.contact_type_id', '=', 'contact_types.id');
    });
    expect(builder.toSql()).toBe('select "users"."id", "contacts"."id", "contact_types"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id") on "users"."id" = "contacts"."id"');
})

test('JoinsWithMultipleNestedJoins', () =>
{
    const builder = getBuilder();
    builder.select(['users.id', 'contacts.id', 'contact_types.id', 'countrys.id', 'planets.id']).from('users').leftJoin('contacts', function ($j: JoinClause) {
        $j.on('users.id', 'contacts.id')
            .join('contact_types', 'contacts.contact_type_id', '=', 'contact_types.id')
            .leftJoin('countrys', function ($q) {
                $q.on('contacts.country', '=', 'countrys.country')
                    .join('planets', function ($q) {
                        $q.on('countrys.planet_id', '=', 'planet.id')
                            .where('planet.is_settled', '=', 1)
                            .where('planet.population', '>=', 10000);
                    });
            });
    });
    expect(builder.toSql()).toBe('select "users"."id", "contacts"."id", "contact_types"."id", "countrys"."id", "planets"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id" left join ("countrys" inner join "planets" on "countrys"."planet_id" = "planet"."id" and "planet"."is_settled" = ? and "planet"."population" >= ?) on "contacts"."country" = "countrys"."country") on "users"."id" = "contacts"."id"');
    expect(builder.getBindings()).toStrictEqual([1, 10000]);
})

test('JoinsWithNestedJoinWithAdvancedSubqueryCondition', () =>
{
    const builder = getBuilder();
    builder.select(['users.id', 'contacts.id', 'contact_types.id']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id')
            .join('contact_types', 'contacts.contact_type_id', '=', 'contact_types.id')
            .whereExists(function ($q) {
                $q.select(['*']).from('countrys')
                    .whereColumn('contacts.country', '=', 'countrys.country')
                    .join('planets', function ($q) {
                        $q.on('countrys.planet_id', '=', 'planet.id')
                            .where('planet.is_settled', '=', 1);
                    })
                    .where('planet.population', '>=', 10000);
            });
    });
    expect(builder.toSql()).toBe('select "users"."id", "contacts"."id", "contact_types"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id") on "users"."id" = "contacts"."id" and exists (select * from "countrys" inner join "planets" on "countrys"."planet_id" = "planet"."id" and "planet"."is_settled" = ? where "contacts"."country" = "countrys"."country" and "planet"."population" >= ?)');
    expect(builder.getBindings()).toStrictEqual([1, 10000]);
})

test('JoinWithNestedOnCondition', () =>
{
    const builder = getBuilder();
    builder.select(['users.id']).from('users').join('contacts', function (j: JoinClause) {
        return j
            .on('users.id', 'contacts.id')
            .addNestedWhereQuery(getBuilder().where('contacts.id', 1));
    });
    expect(builder.toSql()).toBe('select "users"."id" from "users" inner join "contacts" on "users"."id" = "contacts"."id" and ("contacts"."id" = ?)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('JoinSub', () =>
{
    let builder = getBuilder();
    builder.from('users').joinSub('select * from "contacts"', 'sub', 'users.id', '=', 'sub.id');
    expect(builder.toSql()).toBe('select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"');

    builder = getBuilder();
    builder.from('users').joinSub(function ($q) {
        $q.from('contacts');
    }, 'sub', 'users.id', '=', 'sub.id');
    expect(builder.toSql()).toBe('select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"');

    /*
    builder = getBuilder();
    const $eloquentBuilder = new EloquentBuilder(getBuilder().from('contacts'));
    builder.from('users').joinSub($eloquentBuilder, 'sub', 'users.id', '=', 'sub.id');
    expect(builder.toSql()).toBe('select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"');
    */

    builder = getBuilder();
    const $sub1 = getBuilder().from('contacts').where('name', 'foo');
    const $sub2 = getBuilder().from('contacts').where('name', 'bar');
    builder.from('users')
        .joinSub($sub1, 'sub1', 'users.id', '=', 1, 'inner', true)
        .joinSub($sub2, 'sub2', 'users.id', '=', 'sub2.user_id');
    let $expected = 'select * from "users" ';
    $expected += 'inner join (select * from "contacts" where "name" = ?) as "sub1" on "users"."id" = ? ';
    $expected += 'inner join (select * from "contacts" where "name" = ?) as "sub2" on "users"."id" = "sub2"."user_id"';
    expect(builder.toSql()).toBe($expected);
    expect(builder.getRawBindings()['join']).toStrictEqual(['foo', 1, 'bar']);

    /*
    expect(() => { //TS check for this instead of a runtime throw
        builder = getBuilder();
        builder.from('users').joinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
    }).toThrow();
    */
})

test('JoinSubWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.from('users').joinSub('select * from "contacts"', 'sub', 'users.id', '=', 'sub.id');
    expect(builder.toSql()).toBe('select * from "prefix_users" inner join (select * from "contacts") as "prefix_sub" on "prefix_users"."id" = "prefix_sub"."id"');
})

test('LeftJoinSub', () =>
{
    const builder = getBuilder();
    builder.from('users').leftJoinSub(getBuilder().from('contacts'), 'sub', 'users.id', '=', 'sub.id');
    expect(builder.toSql()).toBe('select * from "users" left join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"');

    /*
    expect(() => { //TS types checks for this instead of throw in runtime
        builder = getBuilder();
        builder.from('users').leftJoinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
    }).toThrow();
    */
})

test('RightJoinSub', () =>
{
    const builder = getBuilder();
    builder.from('users').rightJoinSub(getBuilder().from('contacts'), 'sub', 'users.id', '=', 'sub.id');
    expect(builder.toSql()).toBe('select * from "users" right join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"');

    /*
    expect(() => { //TS types checks for this instead of throw in runtime
        builder = getBuilder();
        builder.from('users').rightJoinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
    }).toThrow();
    */
})

test('RawExpressionsInSelect', () =>
{
    const builder = getBuilder();
    builder.select([new Raw('substr(foo, 6)')]).from('users');
    expect(builder.toSql()).toBe('select substr(foo, 6) from "users"');
})

test.skip('FindReturnsFirstResultByID', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select * from "users" where "id" = ? limit 1', [1], true).andReturn([{'foo': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    const $results = builder.from('users').find(1);
    expect($results).toBe({'foo': 'bar'});
    */
})

test.skip('FindOrReturnsFirstResultByID', () =>
{
    //FIXME: setup mockery
    /*
    const builder = getMockQueryBuilder();
    //$data = m::mock(stdClass::class);
    builder.shouldReceive('first').andReturn($data).once();
    builder.shouldReceive('first').with(['column']).andReturn($data).once();
    builder.shouldReceive('first').andReturn(null).once();

    expect($data, builder.findOr(1, () => 'callback result'));
    expect($data, builder.findOr(1, ['column'], () => 'callback result'));
    expect('callback result', builder.findOr(1, () => 'callback result'));
    */
})

test.skip('FirstMethodReturnsFirstResult', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select * from "users" where "id" = ? limit 1', [1], true).andReturn([{'foo': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    const $results = builder.from('users').where('id', '=', 1).first();
    expect($results).toBe({'foo': 'bar'});
    */
})

test.skip('PluckMethodGetsCollectionOfColumnValues', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'foo': 'bar'}, {'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}, {'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    let $results = builder.from('users').where('id', '=', 1).pluck('foo');
    expect($results.all()).toStrictEqual(['bar', 'baz']);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'id': 1, 'foo': 'bar'}, {'id': 10, 'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'id': 1, 'foo': 'bar'}, {'id': 10, 'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).pluck('foo', 'id');
    expect($results.all()).toStrictEqual(['bar', 'baz']);
    */
})

test.skip('Implode', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    // Test without glue.
    let builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'foo': 'bar'}, {'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}, {'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    let $results = builder.from('users').where('id', '=', 1).implode('foo');
    expect('barbaz', $results);

    // Test with glue.
    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'foo': 'bar'}, {'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}, {'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).implode('foo', ',');
    expect('bar,baz', $results);
    */
})

test.skip('ValueMethodReturnsSingleColumn', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select "foo" from "users" where "id" = ? limit 1', [1], true).andReturn([{'foo': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}]).andReturn([{'foo': 'bar'}]);
    const $results = builder.from('users').where('id', '=', 1).value('foo');
    expect('bar', $results);
    */
})

test.skip('RawValueMethodReturnsSingleColumn', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select UPPER("foo") from "users" where "id" = ? limit 1', [1], true).andReturn([{'UPPER("foo")': 'BAR'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'UPPER("foo")': 'BAR'}]).andReturn([{'UPPER("foo")': 'BAR'}]);
    const $results = builder.from('users').where('id', '=', 1).rawValue('UPPER("foo")');
    expect('BAR', $results);
    */
})

test.skip('AggregateFunctions', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    let $results = builder.from('users').count();
    expect($results).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select exists(select * from "users") as "exists"', [], true).andReturn([{'exists': 1}]);
    $results = builder.from('users').exists();
    expect($results).toBe(true);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select exists(select * from "users") as "exists"', [], true).andReturn([{'exists': 0}]);
    $results = builder.from('users').doesntExist();
    expect($results).toBe(true);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select max("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').max('id');
    expect($results).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select min("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').min('id');
    expect($results).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select sum("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').sum('id');
    expect($results).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select avg("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').avg('id');
    expect($results).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select avg("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').average('id');
    expect($results).toBe(1);
    */
})

test.skip('SqlServerExists', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('select').once().with('select top 1 1 [exists] from [users]', [], true).andReturn([{'exists': 1}]);
    const $results = builder.from('users').exists();
    expect($results).toBe(true);
    */
})

test.skip('ExistsOr', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 1}]);
    let $results = builder.from('users').doesntExistOr(function () {
        return 123;
    });
    expect(123, $results);
    builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 0}]);
    $results = builder.from('users').doesntExistOr(function () {
        throw new RuntimeException;
    });
    expect($results).toBe(true);
    */
})

test.skip('DoesntExistsOr', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 0}]);
    let $results = builder.from('users').existsOr(function () {
        return 123;
    });
    expect($results).toBe(123);
    builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 1}]);
    $results = builder.from('users').existsOr(function () {
        throw new RuntimeException;
    });
    expect($results).toBe(true);
    */
})

test.skip('AggregateResetFollowedByGet', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getConnection().shouldReceive('select').once().with('select sum("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 2}]);
    builder.getConnection().shouldReceive('select').once().with('select "column1", "column2" from "users"', [], true).andReturn([{'column1': 'foo', 'column2': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users').select(['column1', 'column2']);
    const $count = builder.count();
    expect($count).toBe(1);
    const $sum = builder.sum('id');
    expect($sum).toBe(2);
    const $result = builder.get();
    expect($result.all()).toStrictEqual([{ 'column1': 'foo', 'column2': 'bar' }]);
    */
})

test.skip('AggregateResetFollowedBySelectGet', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count("column1") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getConnection().shouldReceive('select').once().with('select "column2", "column3" from "users"', [], true).andReturn([{'column2': 'foo', 'column3': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users');
    const $count = builder.count('column1');
    expect($count).toBe(1);
    const $result = builder.select(['column2', 'column3']).get();
    expect($result.all()).toStrictEqual([{'column2': 'foo', 'column3': 'bar'}]);
    */
})

test.skip('AggregateResetFollowedByGetWithColumns', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count("column1") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getConnection().shouldReceive('select').once().with('select "column2", "column3" from "users"', [], true).andReturn([{'column2': 'foo', 'column3': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users');
    const $count = builder.count('column1');
    expect($count).toBe(1);
    const $result = builder.get(['column2', 'column3']);
    expect($result.all()).toStrictEqual([{'column2': 'foo', 'column3': 'bar'}]);
    */
})

test.skip('AggregateWithSubSelect', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users').selectSub(function ($query) {
        $query.from('posts').select('foo', 'bar').where('title', 'foo');
    }, 'post');
    const $count = builder.count();
    expect($count).toBe(1);
    expect('(select "foo", "bar" from "posts" where "title" = ?) as "post"', builder.getGrammar().getValue(builder.columns[0]));
    expect(builder.getBindings()).toStrictEqual(['foo']);
    */
})

test('SubqueriesBindings', () =>
{
    let builder = getBuilder();
    const $second = getBuilder().select(['*']).from('users').orderByRaw('id = ?', 2);
    const $third = getBuilder().select(['*']).from('users').where('id', 3).groupBy('id').having('id', '!=', 4);
    builder.groupBy('a').having('a', '=', 1).union($second).union($third);
    expect(builder.getBindings()).toStrictEqual([1, 2, 3, 4]);

    builder = getBuilder().select(['*']).from('users').where('email', '=', function ($q) {
        $q.select([new Raw('max(id)')])
          .from('users').where('email', '=', 'bar')
          .orderByRaw('email like ?', '%.com')
          .groupBy('id').having('id', '=', 4);
    }).orWhere('id', '=', 'foo').groupBy('id').having('id', '=', 5);
    expect(builder.getBindings()).toStrictEqual(['bar', 4, '%.com', 'foo', 5]);
})

test.skip('InsertMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (?)', ['foo']).andReturn(true);
    const $result = builder.from('users').insert({'email': 'foo'});
    expect($result).toBe(true);
    */
})

test.skip('InsertUsingMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "table1" ("foo") select "bar" from "table2" where "foreign_id" = ?', [5]).andReturn(1);

    const $result = builder.from('table1').insertUsing(
        ['foo'],
        function ($query: Builder) {
            $query.select(['bar']).from('table2').where('foreign_id', '=', 5);
        }
    );

    expect($result).toBe(1);
    */
})

test.skip('InsertUsingWithEmptyColumns', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "table1" select * from "table2" where "foreign_id" = ?', [5]).andReturn(1);

    const $result = builder.from('table1').insertUsing(
        [],
        function ($query: Builder) {
            $query.from('table2').where('foreign_id', '=', 5);
        }
    );

    expect($result).toBe(1);
    */
})

test.skip('InsertUsingInvalidSubquery', () =>
{
    // $this.expectException(InvalidArgumentException::class); //FIXME
    // const builder = getBuilder();
    // builder.from('table1').insertUsing(['foo'], ['bar']);
})

test.skip('InsertOrIgnoreMethod', () =>
{
    // $this.expectException(RuntimeException::class); //FIXME
    // $this.expectExceptionMessage('does not support');
    // const builder = getBuilder();
    // builder.from('users').insertOrIgnore({'email': 'foo'});
})

test.skip('MySqlInsertOrIgnoreMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert ignore into `users` (`email`) values (?)', ['foo']).andReturn(1);
    const $result = builder.from('users').insertOrIgnore({'email': 'foo'});
    expect($result).toBe(1);
    */
})

test.skip('PostgresInsertOrIgnoreMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email") values (?) on conflict do nothing', ['foo']).andReturn(1);
    const $result = builder.from('users').insertOrIgnore({'email': 'foo'});
    expect($result).toBe(1);
    */
})

test.skip('SQLiteInsertOrIgnoreMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert or ignore into "users" ("email") values (?)', ['foo']).andReturn(1);
    const $result = builder.from('users').insertOrIgnore({'email': 'foo'});
    expect($result).toBe(1);
    */
})

test.skip('SqlServerInsertOrIgnoreMethod', () =>
{
    // $this.expectException(RuntimeException::class);
    // $this.expectExceptionMessage('does not support');//FIXME
    // const builder = getSqlServerBuilder();
    // builder.from('users').insertOrIgnore({'email': 'foo'});
})

test.skip('InsertGetIdMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email") values (?)', ['foo'], 'id').andReturn(1);
    const $result = builder.from('users').insertGetId({'email': 'foo'}, 'id');
    expect($result).toBe(1);
    */
})

test.skip('InsertGetIdMethodRemovesExpressions', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email", "bar") values (?, bar)', ['foo'], 'id').andReturn(1);
    const $result = builder.from('users').insertGetId({'email': 'foo', 'bar': new Raw('bar')}, 'id');
    expect($result).toBe(1);
    */
})

test.skip('InsertGetIdWithEmptyValues', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getMysqlBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into `users` () values ()', [], null);
    builder.from('users').insertGetId([]);

    builder = getPostgresBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" default values returning "id"', [], null);
    builder.from('users').insertGetId([]);

    builder = getSQLiteBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" default values', [], null);
    builder.from('users').insertGetId([]);

    builder = getSqlServerBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into [users] default values', [], null);
    builder.from('users').insertGetId([]);
    */
})

test.skip('InsertMethodRespectsRawBindings', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (CURRENT TIMESTAMP)', []).andReturn(true);
    const $result = builder.from('users').insert({'email': new Raw('CURRENT TIMESTAMP')});
    expect($result).toBe(true);
    */
})

test.skip('MultipleInsertsWithExpressionValues', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (UPPER(\'Foo\')), (LOWER(\'Foo\'))', []).andReturn(true);
    const $result = builder.from('users').insert([{'email': new Raw("UPPER('Foo')")}, {'email': new Raw("LOWER('Foo')")}]);
    expect($result).toBe(true);
    */
})

test.skip('UpdateMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').where('id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` set `email` = ?, `name` = ? where `id` = ? order by `foo` desc limit 5', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).orderBy('foo', 'desc').limit(5).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpsertMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(false)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) on duplicate key update `email` = values(`email`), `name` = values(`name`)', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    let $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    expect($result).toBe(2);

    builder = getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(true)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) as laravel_upsert_alias on duplicate key update `email` = `laravel_upsert_alias`.`email`, `name` = `laravel_upsert_alias`.`name`', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    expect($result).toBe(2);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "email" = "excluded"."email", "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    expect($result).toBe(2);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "email" = "excluded"."email", "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    expect($result).toBe(2);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [email] = [laravel_source].[email], [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name]);', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    expect($result).toBe(2);
    */
})

test.skip('UpsertMethodWithUpdateColumns', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(false)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) on duplicate key update `name` = values(`name`)', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    let $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    expect($result).toBe(2);

    builder = getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(true)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) as laravel_upsert_alias on duplicate key update `name` = `laravel_upsert_alias`.`name`', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    expect($result).toBe(2);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    expect($result).toBe(2);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    expect($result).toBe(2);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name]);', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    expect($result).toBe(2);
    */
})

test.skip('UpdateMethodWithJoins', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" inner join "orders" on "users"."id" = "orders"."user_id" set "email" = ?, "name" = ? where "users"."id" = ?', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ? set "email" = ?, "name" = ?', [1, 'foo', 'bar']).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodWithJoinsOnSqlServer', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('update').once().with('update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] where [users].[id] = ?', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('update').once().with('update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] and [users].[id] = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodWithJoinsOnMySql', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` set `email` = ?, `name` = ? where `users`.`id` = ?', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` and `users`.`id` = ? set `email` = ?, `name` = ?', [1, 'foo', 'bar']).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodWithJoinsOnSQLite', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" where "users"."id" > ? order by "id" asc limit 3)', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').where('users.id', '>', 1).limit(3).oldest('id').update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" where "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" as "u" set "email" = ?, "name" = ? where "rowid" in (select "u"."rowid" from "users" as "u" inner join "orders" as "o" on "u"."id" = "o"."user_id")', ['foo', 'bar']).andReturn(1);
    $result = builder.from('users as u').join('orders as o', 'u.id', '=', 'o.user_id').update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodWithJoinsAndAliasesOnSqlServer', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('update').once().with('update [u] set [email] = ?, [name] = ? from [users] as [u] inner join [orders] on [u].[id] = [orders].[user_id] where [u].[id] = ?', ['foo', 'bar', 1]).andReturn(1);
    const $result = builder.from('users as u').join('orders', 'u.id', '=', 'orders.user_id').where('u.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodWithoutJoinsOnPostgres', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').where('id', '=', 1).update({'users.email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).selectRaw('?', ['ignore']).update({'users.email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users"."users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users.users').where('id', '=', 1).selectRaw('?', ['ignore']).update({'users.users.email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodWithJoinsOnPostgres', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" where "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ? where "name" = ?)', ['foo', 'bar', 1, 'baz']).andReturn(1);
    $result = builder.from('users')
        .join('orders', function ($join) {
            $join.on('users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1);
        }).where('name', 'baz')
        .update({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateFromMethodWithJoinsOnPostgres', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = ? and "users"."id" = "orders"."user_id"', ['foo', 'bar', 1]).andReturn(1);
    let $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).updateFrom({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = "orders"."user_id" and "users"."id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).updateFrom({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? from "orders" where "name" = ? and "users"."id" = "orders"."user_id" and "users"."id" = ?', ['foo', 'bar', 'baz', 1]).andReturn(1);
    $result = builder.from('users')
        .join('orders', function ($join) {
            $join.on('users.id', '=', 'orders.user_id')
               .where('users.id', '=', 1);
        }).where('name', 'baz')
       .updateFrom({'email': 'foo', 'name': 'bar'});
    expect($result).toBe(1);
    */
})

test.skip('UpdateMethodRespectsRaw', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = foo, "name" = ? where "id" = ?', ['bar', 1]).andReturn(1);
    let $result = builder.from('users').where('id', '=', 1).update({ 'email': new Raw('foo'), 'name': 'bar' });
    expect($result).toBe(1);
    */
})

test('UpdateOrInsertMethod', () =>
{
    /*
    builder = m::mock(Builder::class.'[where,exists,insert]', [
        m::mock(ConnectionInterface::class),
        new Grammar,
        m::mock(Processor::class),
    ]);
    */

    /*
    builder.shouldReceive('where').once().with({'email': 'foo'}).andReturn(m::self());
    builder.shouldReceive('exists').once().andReturn(false);
    builder.shouldReceive('insert').once().with({'email': 'foo', 'name': 'bar'}).andReturn(true);

    $this.assertTrue(builder.updateOrInsert({'email': 'foo'}, ['name': 'bar']));

    builder = m::mock(Builder::class.'[where,exists,update]', [
        m::mock(ConnectionInterface::class),
        new Grammar,
        m::mock(Processor::class),
    ]);

    builder.shouldReceive('where').once().with({'email': 'foo'}).andReturn(m::self());
    builder.shouldReceive('exists').once().andReturn(true);
    builder.shouldReceive('take').andReturnSelf();
    builder.shouldReceive('update').once().with(['name': 'bar']).andReturn(1);

    $this.assertTrue(builder.updateOrInsert({'email': 'foo'}, ['name': 'bar']));
    */
})

test('UpdateOrInsertMethodWorksWithEmptyUpdateValues', () =>
{
    /*
    builder = m:: spy(Builder:: class.'[where,exists,update]', [
        m::mock(ConnectionInterface::class),
        new Grammar,
        m::mock(Processor::class),
    ]);

    builder.shouldReceive('where').once().with({'email': 'foo'}).andReturn(m::self());
    builder.shouldReceive('exists').once().andReturn(true);

    $this.assertTrue(builder.updateOrInsert({'email': 'foo'}));
    builder.shouldNotHaveReceived('update');
    */
})

test.skip('DeleteMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "email" = ?', ['foo']).andReturn(1);
    let $result = builder.from('users').where('email', '=', 'foo').delete();
    expect($result).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "users"."id" = ?', [1]).andReturn(1);
    $result = builder.from('users').delete(1);
    expect($result).toBe(1);

    builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "users"."id" = ?', [1]).andReturn(1);
    $result = builder.from('users').selectRaw('?', ['ignore']).delete(1);
    expect($result).toBe(1);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "rowid" in (select "users"."rowid" from "users" where "email" = ? order by "id" asc limit 1)', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete();
    expect($result).toBe(1);

    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from `users` where `email` = ? order by `id` asc limit 1', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete();
    expect($result).toBe(1);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from [users] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').delete();
    expect($result).toBe(1);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete top (1) from [users] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete();
    expect($result).toBe(1);
    */
})

test.skip('DeleteWithJoinMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "rowid" in (select "users"."rowid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."email" = ? order by "users"."id" asc limit 1)', ['foo']).andReturn(1);
    let $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('users.email', '=', 'foo').orderBy('users.id').limit(1).delete();
    expect($result).toBe(1);

    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" as "u" where "rowid" in (select "u"."rowid" from "users" as "u" inner join "contacts" as "c" on "u"."id" = "c"."id")', []).andReturn(1);
    $result = builder.from('users as u').join('contacts as c', 'u.id', '=', 'c.id').delete();
    expect($result).toBe(1);

    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete `users` from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` where `email` = ?', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    expect($result).toBe(1);

    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete `a` from `users` as `a` inner join `users` as `b` on `a`.`id` = `b`.`user_id` where `email` = ?', ['foo']).andReturn(1);
    $result = builder.from('users AS a').join('users AS b', 'a.id', '=', 'b.user_id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    expect($result).toBe(1);

    builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete `users` from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` where `users`.`id` = ?', [1]).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').orderBy('id').take(1).delete(1);
    expect($result).toBe(1);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete [users] from [users] inner join [contacts] on [users].[id] = [contacts].[id] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('email', '=', 'foo').delete();
    expect($result).toBe(1);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete [a] from [users] as [a] inner join [users] as [b] on [a].[id] = [b].[user_id] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users AS a').join('users AS b', 'a.id', '=', 'b.user_id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    expect($result).toBe(1);

    builder = getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete [users] from [users] inner join [contacts] on [users].[id] = [contacts].[id] where [users].[id] = ?', [1]).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').delete(1);
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."email" = ?)', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('users.email', '=', 'foo').delete();
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" as "a" where "ctid" in (select "a"."ctid" from "users" as "a" inner join "users" as "b" on "a"."id" = "b"."user_id" where "email" = ? order by "id" asc limit 1)', ['foo']).andReturn(1);
    $result = builder.from('users AS a').join('users AS b', 'a.id', '=', 'b.user_id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."id" = ? order by "id" asc limit 1)', [1]).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').orderBy('id').take(1).delete(1);
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."user_id" and "users"."id" = ? where "name" = ?)', [1, 'baz']).andReturn(1);
    $result = builder.from('users')
        .join('contacts', function ($join) {
            $join.on('users.id', '=', 'contacts.user_id')
                .where('users.id', '=', 1);
        }).where('name', 'baz')
        .delete();
    expect($result).toBe(1);

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id")', []).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').delete();
    expect($result).toBe(1);
    */
})

test.skip('TruncateMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getBuilder();
    builder.getConnection().shouldReceive('statement').once().with('truncate table "users"', []);
    builder.from('users').truncate();

    const $sqlite = new SQLiteGrammar;
    builder = getBuilder();
    builder.from('users');
    $this.assertEquals({
        'delete from sqlite_sequence where name = ?': ['users'],
        'delete from "users"': [],
    }, $sqlite.compileTruncate(builder));
    */
})

test('PreserveAddsClosureToArray', () =>
{
    const builder = getBuilder();
    builder.beforeQuery(function () {
    });
    expect(builder._beforeQueryCallbacks).toHaveLength(1);
    expect(typeof builder._beforeQueryCallbacks[0]).toBe('function');
})

test('ApplyPreserveCleansArray', () =>
{
    const builder = getBuilder();
    builder.beforeQuery(function () {
    });
    expect(builder._beforeQueryCallbacks).toHaveLength(1);
    builder.applyBeforeQueryCallbacks();
    expect(builder._beforeQueryCallbacks).toHaveLength(0);
})

test('PreservedAreAppliedByToSql', () =>
{
    const builder = getBuilder();
    builder.beforeQuery(function (builder) {
        builder.where('foo', 'bar');
    });
    expect(builder.toSql()).toBe('select * where "foo" = ?');
    expect(builder.getBindings()).toStrictEqual(['bar']);
})

test.skip('PreservedAreAppliedByInsert', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (?)', ['foo']);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.insert({'email': 'foo'});
    */
})

test.skip('PreservedAreAppliedByInsertGetId', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    $this.called = false;
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email") values (?)', ['foo'], 'id');
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.insertGetId({'email': 'foo'}, 'id');
    */
})

test.skip('PreservedAreAppliedByInsertUsing', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email") select *', []);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.insertUsing(['email'], getBuilder());
    */
})

test.skip('PreservedAreAppliedByUpsert', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(false)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`) values (?) on duplicate key update `email` = values(`email`)', ['foo']);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.upsert({'email': 'foo'}, 'id');

    builder = getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(true)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`) values (?) as laravel_upsert_alias on duplicate key update `email` = `laravel_upsert_alias`.`email`', ['foo']);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.upsert({'email': 'foo'}, 'id');
    */
})

test.skip('PreservedAreAppliedByUpdate', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ? where "id" = ?', ['foo', 1]);
    builder.from('users').beforeQuery(function (builder) {
        builder.where('id', 1);
    });
    builder.update({'email': 'foo'});
    */
})

test.skip('PreservedAreAppliedByDelete', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users"', []);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.delete();
    */
})

test.skip('PreservedAreAppliedByTruncate', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('statement').once().with('truncate table "users"', []);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.truncate();
    */
})

test.skip('PreservedAreAppliedByExists', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select exists(select * from "users") as "exists"', [], true);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.exists();
    */
})

test.skip('PostgresInsertGetId', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getPostgresBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email") values (?) returning "id"', ['foo'], 'id').andReturn(1);
    $result = builder.from('users').insertGetId({'email': 'foo'}, 'id');
    expect($result).toBe(1);
    */
})

test('MySqlWrapping', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users');
    expect(builder.toSql()).toBe('select * from `users`');
})

test('MySqlUpdateWrappingJson', () =>
{
    /*
    $grammar = new MySqlGrammar;
    $processor = m::mock(Processor::class);

    $connection = $this.createMock(ConnectionInterface::class);
    $connection.expects($this.once())
                .method('update')
                .with(
                    'update `users` set `name` = json_set(`name`, \'$."first_name"\', ?), `name` = json_set(`name`, \'$."last_name"\', ?) where `active` = ?',
                    ['John', 'Doe', 1]
                );

    builder = new Builder($connection, $grammar, $processor);

    builder.from('users').where('active', '=', 1).update(['name.first_name': 'John', 'name.last_name': 'Doe']);
    */
})

test('MySqlUpdateWrappingNestedJson', () =>
{
    /*
    $grammar = new MySqlGrammar;
    $processor = m::mock(Processor::class);

    $connection = $this.createMock(ConnectionInterface::class);
    $connection.expects($this.once())
                .method('update')
                .with(
                    'update `users` set `meta` = json_set(`meta`, \'$."name"."first_name"\', ?), `meta` = json_set(`meta`, \'$."name"."last_name"\', ?) where `active` = ?',
                    ['John', 'Doe', 1]
                );

    builder = new Builder($connection, $grammar, $processor);

    builder.from('users').where('active', '=', 1).update(['meta.name.first_name': 'John', 'meta.name.last_name': 'Doe']);
    */
})

test('MySqlUpdateWrappingJsonArray', () =>
{
    /*
    $grammar = new MySqlGrammar;
    $processor = m::mock(Processor::class);

    $connection = $this.createMock(ConnectionInterface::class);
    $connection.expects($this.once())
                .method('update')
                .with(
                    'update `users` set `options` = ?, `meta` = json_set(`meta`, \'$."tags"\', cast(? as json)), `group_id` = 45, `created_at` = ? where `active` = ?',
                    [
                        json_encode(['2fa': false, 'presets': ['laravel', 'vue']]),
                        json_encode(['white', 'large']),
                        new DateTime('2019-08-06'),
                        1,
                    ]
                );

    builder = new Builder($connection, $grammar, $processor);
    builder.from('users').where('active', 1).update([
        'options': ['2fa': false, 'presets': ['laravel', 'vue']],
        'meta.tags': ['white', 'large'],
        'group_id': new Raw('45'),
        'created_at': new DateTime('2019-08-06'),
    ]);
    */
})

test('MySqlUpdateWrappingJsonPathArrayIndex', () =>
{
    /*
    $grammar = new MySqlGrammar;
    $processor = m::mock(Processor::class);

    $connection = $this.createMock(ConnectionInterface::class);
    $connection.expects($this.once())
                .method('update')
                .with(
                    'update `users` set `options` = json_set(`options`, \'$[1]."2fa"\', false), `meta` = json_set(`meta`, \'$."tags"[0][2]\', ?) where `active` = ?',
                    [
                        'large',
                        1,
                    ]
                );

    builder = new Builder($connection, $grammar, $processor);
    builder.from('users').where('active', 1).update([
        'options.[1].2fa': false,
        'meta.tags[0][2]': 'large',
    ]);
    */
})

test('MySqlUpdateWithJsonPreparesBindingsCorrectly', () =>
{
    /*
    $grammar = new MySqlGrammar;
    $processor = m::mock(Processor::class);

    $connection = m::mock(ConnectionInterface::class);
    $connection.shouldReceive('update')
                .once()
                .with(
                    'update `users` set `options` = json_set(`options`, \'$."enable"\', false), `updated_at` = ? where `id` = ?',
                    ['2015-05-26 22:02:06', 0]
                );
    builder = new Builder($connection, $grammar, $processor);
    builder.from('users').where('id', '=', 0).update(['options.enable': false, 'updated_at': '2015-05-26 22:02:06']);

    $connection.shouldReceive('update')
        .once()
        .with(
            'update `users` set `options` = json_set(`options`, \'$."size"\', ?), `updated_at` = ? where `id` = ?',
            [45, '2015-05-26 22:02:06', 0]
        );
    builder = new Builder($connection, $grammar, $processor);
    builder.from('users').where('id', '=', 0).update(['options.size': 45, 'updated_at': '2015-05-26 22:02:06']);

    const builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` set `options` = json_set(`options`, \'$."size"\', ?)', [null]);
    builder.from('users').update(['options.size': null]);

    const builder = getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` set `options` = json_set(`options`, \'$."size"\', 45)', []);
    builder.from('users').update(['options.size': new Raw('45')]);
    */
})

test.skip('PostgresUpdateWrappingJson', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    let builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = jsonb_set("options"::jsonb, \'{"name","first_name"}\', ?)', ['"John"']);
    builder.from('users').update({'users.options.name.first_name': 'John'});

    builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = jsonb_set("options"::jsonb, \'{"language"}\', \'null\')', []);
    builder.from('users').update({'options.language': new Raw("'null'")});
    */
})

test.skip('PostgresUpdateWrappingJsonArray', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = ?, "meta" = jsonb_set("meta"::jsonb, \'{"tags"}\', ?), "group_id" = 45, "created_at" = ?', [
            json_encode({'2fa': false, 'presets': ['laravel', 'vue']}),
            json_encode(['white', 'large']),
            new DateTime('2019-08-06'),
        ]);

    builder.from('users').update({
        'options': {'2fa': false, 'presets': ['laravel', 'vue']},
        'meta.tags': ['white', 'large'],
        'group_id': new Raw('45'),
        'created_at': new DateTime('2019-08-06'),
    });
    */
})

test.skip('PostgresUpdateWrappingJsonPathArrayIndex', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    const builder = getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = jsonb_set("options"::jsonb, \'{1,"2fa"}\', ?), "meta" = jsonb_set("meta"::jsonb, \'{"tags",0,2}\', ?) where ("options".1.\'2fa\')::jsonb = \'true\'::jsonb', [
            'false',
            '"large"',
        ]);

    builder.from('users').where('options.[1].2fa', true).update({
        'options.[1].2fa': false,
        'meta.tags[0][2]': 'large',
    });
    */
})

test.skip('SQLiteUpdateWrappingJsonArray', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    builder = getSQLiteBuilder();

    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = ?, "group_id" = 45, "created_at" = ?', [
            json_encode({'2fa': false, 'presets': ['laravel', 'vue']}),
            new DateTime('2019-08-06'),
        ]);

    builder.from('users').update({
        'options': {'2fa': false, 'presets': ['laravel', 'vue']},
        'group_id': new Raw('45'),
        'created_at': new DateTime('2019-08-06'),
    });
    */
})

test.skip('SQLiteUpdateWrappingNestedJsonArray', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "group_id" = 45, "created_at" = ?, "options" = json_patch(ifnull("options", json(\'{}\')), json(?))', [
            new DateTime('2019-08-06'),
            json_encode({'name': 'Taylor', 'security': {'2fa': false, 'presets': ['laravel', 'vue']}, 'sharing': {'twitter': 'username'}}),
        ]);

    builder.from('users').update({
        'options.name': 'Taylor',
        'group_id': new Raw('45'),
        'options.security': {'2fa': false, 'presets': ['laravel', 'vue']},
        'options.sharing.twitter': 'username',
        'created_at': new DateTime('2019-08-06'),
    });
    */
})

test.skip('SQLiteUpdateWrappingJsonPathArrayIndex', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    builder = getSQLiteBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = json_patch(ifnull("options", json(\'{}\')), json(?)), "meta" = json_patch(ifnull("meta", json(\'{}\')), json(?)) where json_extract("options", \'$[1]."2fa"\') = true', [
            '{"[1]":{"2fa":false}}',
            '{"tags[0][2]":"large"}',
        ]);

    builder.from('users').where('options.[1].2fa', true).update({
        'options.[1].2fa': false,
        'meta.tags[0][2]': 'large',
    });
    */
})

test('MySqlWrappingJsonWithString', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->sku', '=', 'foo-bar');
    expect(builder.toSql()).toBe('select * from `users` where json_unquote(json_extract(`items`, \'$."sku"\')) = ?');
    expect(builder.getRawBindings()['where']).toHaveLength(1);
    expect(builder.getRawBindings()['where'][0]).toBe('foo-bar');
})

test('MySqlWrappingJsonWithInteger', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->price', '=', 1);
    expect(builder.toSql()).toBe('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?');
})

test('MySqlWrappingJsonWithDouble', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->price', '=', 1.5);
    expect(builder.toSql()).toBe('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?');
})

test('MySqlWrappingJsonWithBoolean', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->available', '=', true);
    expect(builder.toSql()).toBe('select * from `users` where json_extract(`items`, \'$."available"\') = true');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where(new Raw("items->'$.available'"), '=', true);
    expect(builder.toSql()).toBe("select * from `users` where items->'$.available' = true");
})

test('MySqlWrappingJsonWithBooleanAndIntegerThatLooksLikeOne', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->available', '=', true).where('items->active', '=', false).where('items->number_available', '=', 0);
    expect(builder.toSql()).toBe('select * from `users` where json_extract(`items`, \'$."available"\') = true and json_extract(`items`, \'$."active"\') = false and json_unquote(json_extract(`items`, \'$."number_available"\')) = ?');
})

test('JsonPathEscaping', () =>
{
    const $expectedWithJsonEscaped = `select json_unquote(json_extract(\`json\`, '$."''))#"'))`;

    let builder = getMysqlBuilder();
    builder.select(["json->'))#"]);
    expect(builder.toSql()).toBe($expectedWithJsonEscaped);

    /*
    builder = getMysqlBuilder();
    builder.select(["json->\'))#"]); // "\'" results in "\'" in php, but "'" in JS. equvilent to the next test below, if i in JS add an addition backslash
    expect(builder.toSql()).toBe($expectedWithJsonEscaped);
    */

    builder = getMysqlBuilder();
    builder.select(["json->\\'))#"]);
    expect(builder.toSql()).toBe($expectedWithJsonEscaped);

    builder = getMysqlBuilder();
    builder.select(["json->\\\\'))#"]); //WARNING original string was "json->\\\'))#" but PHP keeps two slashes, JS does not, so i updated input value to match.
    expect(builder.toSql()).toBe($expectedWithJsonEscaped);
})

test('MySqlWrappingJson', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereRaw('items->\'$."price"\' = 1');
    expect(builder.toSql()).toBe('select * from `users` where items->\'$."price"\' = 1');

    builder = getMysqlBuilder();
    builder.select(['items->price']).from('users').where('users.items->price', '=', 1).orderBy('items->price');
    expect(builder.toSql()).toBe('select json_unquote(json_extract(`items`, \'$."price"\')) from `users` where json_unquote(json_extract(`users`.`items`, \'$."price"\')) = ? order by json_unquote(json_extract(`items`, \'$."price"\')) asc');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1);
    expect(builder.toSql()).toBe('select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ?');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
    expect(builder.toSql()).toBe('select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ? and json_unquote(json_extract(`items`, \'$."age"\')) = ?');
})

test('PostgresWrappingJson', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['items->price']).from('users').where('users.items->price', '=', 1).orderBy('items->price');
    expect(builder.toSql()).toBe('select "items"->>\'price\' from "users" where "users"."items"->>\'price\' = ? order by "items"->>\'price\' asc');

    
    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1);
    expect(builder.toSql()).toBe('select * from "users" where "items"->\'price\'->>\'in_usd\' = ?');

    
    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
    expect(builder.toSql()).toBe('select * from "users" where "items"->\'price\'->>\'in_usd\' = ? and "items"->>\'age\' = ?');

    
    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('items->prices->0', '=', 1).where('items->age', '=', 2);
    expect(builder.toSql()).toBe('select * from "users" where "items"->\'prices\'->>0 = ? and "items"->>\'age\' = ?');

    
    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('items->available', '=', true);
    expect(builder.toSql()).toBe('select * from "users" where ("items"->\'available\')::jsonb = \'true\'::jsonb');
})

test('SqlServerWrappingJson', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['items->price']).from('users').where('users.items->price', '=', 1).orderBy('items->price');
    expect(builder.toSql()).toBe('select json_value([items], \'$."price"\') from [users] where json_value([users].[items], \'$."price"\') = ? order by json_value([items], \'$."price"\') asc');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1);
    expect(builder.toSql()).toBe('select * from [users] where json_value([items], \'$."price"."in_usd"\') = ?');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
    expect(builder.toSql()).toBe('select * from [users] where json_value([items], \'$."price"."in_usd"\') = ? and json_value([items], \'$."age"\') = ?');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('items->available', '=', true);
    expect(builder.toSql()).toBe('select * from [users] where json_value([items], \'$."available"\') = \'true\'');
})

test('SqliteWrappingJson', () =>
{
    let builder = getSQLiteBuilder();
    builder.select(['items->price']).from('users').where('users.items->price', '=', 1).orderBy('items->price');
    expect(builder.toSql()).toBe('select json_extract("items", \'$."price"\') from "users" where json_extract("users"."items", \'$."price"\') = ? order by json_extract("items", \'$."price"\') asc');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1);
    expect(builder.toSql()).toBe('select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ?');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
    expect(builder.toSql()).toBe('select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ? and json_extract("items", \'$."age"\') = ?');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('items->available', '=', true);
    expect(builder.toSql()).toBe('select * from "users" where json_extract("items", \'$."available"\') = true');
})

test('SQLiteOrderBy', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['*']).from('users').orderBy('email', 'desc');
    expect(builder.toSql()).toBe('select * from "users" order by "email" desc');
})

test('SqlServerLimitsAndOffsets', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').take(10);
    expect(builder.toSql()).toBe('select top 10 * from [users]');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').skip(10).orderBy('email', 'desc');
    expect(builder.toSql()).toBe('select * from [users] order by [email] desc offset 10 rows');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').skip(10).take(10);
    expect(builder.toSql()).toBe('select * from [users] order by (SELECT 0) offset 10 rows fetch next 10 rows only');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').skip(11).take(10).orderBy('email', 'desc');
    expect(builder.toSql()).toBe('select * from [users] order by [email] desc offset 11 rows fetch next 10 rows only');

    builder = getSqlServerBuilder();
    const $subQuery = function ($query: Builder) {
        return $query.select(['created_at']).from('logins').where('users.name', 'nameBinding').whereColumn('user_id', 'users.id').limit(1);
    };
    builder.select(['*']).from('users').where('email', 'emailBinding').orderBy($subQuery).skip(10).take(10);
    expect(builder.toSql()).toBe('select * from [users] where [email] = ? order by (select top 1 [created_at] from [logins] where [users].[name] = ? and [user_id] = [users].[id]) asc offset 10 rows fetch next 10 rows only');
    expect(builder.getBindings()).toStrictEqual(['emailBinding', 'nameBinding']);

    /*
    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').take('foo');
    expect(builder.toSql()).toBe('select * from [users]');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').take('foo').offset('bar');
    expect(builder.toSql()).toBe('select * from [users]');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').offset('bar');
    expect(builder.toSql()).toBe('select * from [users]');
    */
})

test('MySqlSoundsLikeOperator', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('name', 'sounds like', 'John Doe');
    expect(builder.toSql()).toBe('select * from `users` where `name` sounds like ?');
    expect(builder.getBindings()).toStrictEqual(['John Doe']);
})

test('BitwiseOperators', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('bar', '&', 1);
    expect(builder.toSql()).toBe('select * from "users" where "bar" & ?');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('bar', '#', 1);
    expect(builder.toSql()).toBe('select * from "users" where ("bar" # ?)::bool');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('range', '>>', '[2022-01-08 00:00:00,2022-01-09 00:00:00)');
    expect(builder.toSql()).toBe('select * from "users" where ("range" >> ?)::bool');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('bar', '&', 1);
    expect(builder.toSql()).toBe('select * from [users] where ([bar] & ?) != 0');

    builder = getBuilder();
    builder.select(['*']).from('users').having('bar', '&', 1);
    expect(builder.toSql()).toBe('select * from "users" having "bar" & ?');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').having('bar', '#', 1);
    expect(builder.toSql()).toBe('select * from "users" having ("bar" # ?)::bool');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').having('range', '>>', '[2022-01-08 00:00:00,2022-01-09 00:00:00)');
    expect(builder.toSql()).toBe('select * from "users" having ("range" >> ?)::bool');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').having('bar', '&', 1);
    expect(builder.toSql()).toBe('select * from [users] having ([bar] & ?) != 0');
})

test.skip('MergeWheresCanMergeWheresAndBindings', () =>
{
    // This test seems to makes no sense, setting data to properties with formats/types seen nowhere else, making the test moot.
    /*
    const builder = getBuilder();
    builder._wheres = ['foo'];
    builder.mergeWheres(['wheres'], ['foo', 'bar']);
    expect(builder._wheres).toStrictEqual(['foo', 'wheres']);
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar']);
    */
})

test('PrepareValueAndOperator', () =>
{
    let builder = getBuilder();
    let [value, operator] = builder.prepareValueAndOperator('>', '20');
    expect(value).toBe('>');
    expect(operator).toBe('20');

    builder = getBuilder();
    [value, operator] = builder.prepareValueAndOperator('>', '20', true);
    expect(value).toBe('20');
    expect(operator).toBe('=');
})

test.skip('PrepareValueAndOperatorExpectException', () =>
{
    /*
    expect(() => {//TS gives an error instead of a throw in runtime
        const builder = getBuilder();
        builder.prepareValueAndOperator(null, 'like');
    }).toThrow('Illegal operator and value combination.');
    */
})

test('ProvidingNullWithOperatorsBuildsCorrectly', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('foo', null);
    expect(builder.toSql()).toBe('select * from "users" where "foo" is null');

    builder = getBuilder();
    builder.select(['*']).from('users').where('foo', '=', null);
    expect(builder.toSql()).toBe('select * from "users" where "foo" is null');

    builder = getBuilder();
    builder.select(['*']).from('users').where('foo', '!=', null);
    expect(builder.toSql()).toBe('select * from "users" where "foo" is not null');

    builder = getBuilder();
    builder.select(['*']).from('users').where('foo', '<>', null);
    expect(builder.toSql()).toBe('select * from "users" where "foo" is not null');
})

test('DynamicWhere', () =>
{
    /*
    $method = 'whereFooBarAndBazOrQux';
    $parameters = ['corge', 'waldo', 'fred'];
    builder = m::mock(Builder::class).makePartial();

    builder.shouldReceive('where').with('foo_bar', '=', $parameters[0], 'and').once().andReturnSelf();
    builder.shouldReceive('where').with('baz', '=', $parameters[1], 'and').once().andReturnSelf();
    builder.shouldReceive('where').with('qux', '=', $parameters[2], 'or').once().andReturnSelf();

    $this.assertEquals(builder, builder.dynamicWhere($method, $parameters));
    */
})

test('DynamicWhereIsNotGreedy', () =>
{
    /*
    $method = 'whereIosVersionAndAndroidVersionOrOrientation';
    $parameters = ['6.1', '4.2', 'Vertical'];
    builder = m::mock(Builder::class).makePartial();

    builder.shouldReceive('where').with('ios_version', '=', '6.1', 'and').once().andReturnSelf();
    builder.shouldReceive('where').with('android_version', '=', '4.2', 'and').once().andReturnSelf();
    builder.shouldReceive('where').with('orientation', '=', 'Vertical', 'or').once().andReturnSelf();

    builder.dynamicWhere($method, $parameters);
    */
})

test.skip('CallTriggersDynamicWhere', () =>
{
    // dynamic where omitted from implementation, to reduce complexity
    /*
    const builder = getBuilder();

    $this.assertEquals(builder, builder.whereFooAndBar('baz', 'qux'));
    $this.assertCount(2, builder.wheres);
    */
})

test.skip('BuilderThrowsExpectedExceptionWithUndefinedMethod', () =>
{
    // no connection or processor available, so mocks arent possible.
    /*
    //$this.expectException(BadMethodCallException::class);

    const builder = getBuilder();
    builder.getConnection().shouldReceive('select');
    builder.getProcessor().shouldReceive('processSelect').andReturn([]);

    builder.noValidMethodHere();
    */
})

test('MySqlLock', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock();
    expect(builder.toSql()).toBe('select * from `foo` where `bar` = ? for update');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getMysqlBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false);
    expect(builder.toSql()).toBe('select * from `foo` where `bar` = ? lock in share mode');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getMysqlBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock('lock in share mode');
    expect(builder.toSql()).toBe('select * from `foo` where `bar` = ? lock in share mode');
    expect(builder.getBindings()).toStrictEqual(['baz']);
})

test('PostgresLock', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock();
    expect(builder.toSql()).toBe('select * from "foo" where "bar" = ? for update');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false);
    expect(builder.toSql()).toBe('select * from "foo" where "bar" = ? for share');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock('for key share');
    expect(builder.toSql()).toBe('select * from "foo" where "bar" = ? for key share');
    expect(builder.getBindings()).toStrictEqual(['baz']);
})

test('SqlServerLock', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock();
    expect(builder.toSql()).toBe('select * from [foo] with(rowlock,updlock,holdlock) where [bar] = ?');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false);
    expect(builder.toSql()).toBe('select * from [foo] with(rowlock,holdlock) where [bar] = ?');
    expect(builder.getBindings()).toStrictEqual(['baz']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock('with(holdlock)');
    expect(builder.toSql()).toBe('select * from [foo] with(holdlock) where [bar] = ?');
    expect(builder.getBindings()).toStrictEqual(['baz']);
})

test('SelectWithLockUsesWritePdo', () =>
{
    /*
    builder = getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with(m::any(), m::any(), false);
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock().get();

    builder = getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with(m::any(), m::any(), false);
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false).get();
    */
})

test('BindingOrder', () =>
{
    const $expectedSql = 'select * from "users" inner join "othertable" on "bar" = ? where "registered" = ? group by "city" having "population" > ? order by match ("foo") against(?)';
    const $expectedBindings = ['foo', 1, 3, 'bar'];

    let builder = getBuilder();
    builder.select(['*']).from('users').join('othertable', function ($join) {
        $join.where('bar', '=', 'foo');
    }).where('registered', 1).groupBy('city').having('population', '>', 3).orderByRaw('match ("foo") against(?)', ['bar']);
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual($expectedBindings);

    // order of statements reversed
    builder = getBuilder();
    builder.select(['*']).from('users').orderByRaw('match ("foo") against(?)', ['bar']).having('population', '>', 3).groupBy('city').where('registered', 1).join('othertable', function ($join) {
        $join.where('bar', '=', 'foo');
    });
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual($expectedBindings);
})

test('AddBindingWithArrayMergesBindings', () =>
{
    const builder = getBuilder();
    builder.addBinding(['foo', 'bar']);
    builder.addBinding(['baz']);
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar', 'baz']);
})

test('AddBindingWithArrayMergesBindingsInCorrectOrder', () =>
{
    const builder = getBuilder();
    builder.addBinding(['bar', 'baz'], 'having');
    builder.addBinding(['foo'], 'where');
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar', 'baz']);
})

test('MergeBuilders', () =>
{
    const builder = getBuilder();
    builder.addBinding(['foo', 'bar']);
    const $otherBuilder = getBuilder();
    $otherBuilder.addBinding(['baz']);
    builder.mergeBindings($otherBuilder);
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar', 'baz']);
})

test('MergeBuildersBindingOrder', () =>
{
    const builder = getBuilder();
    builder.addBinding(['foo'], 'where');
    builder.addBinding(['baz'], 'having');
    const $otherBuilder = getBuilder();
    $otherBuilder.addBinding(['bar'], 'where');
    builder.mergeBindings($otherBuilder);
    expect(builder.getBindings()).toStrictEqual(['foo', 'bar', 'baz']);
})

test('SubSelect', () =>
{
    const $expectedSql = 'select "foo", "bar", (select "baz" from "two" where "subkey" = ?) as "sub" from "one" where "key" = ?';
    const $expectedBindings = ['subval', 'val'];

    let builder = getPostgresBuilder();
    builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
    builder.selectSub(function ($query) {
        $query.from('two').select(['baz']).where('subkey', '=', 'subval');
    }, 'sub');
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual($expectedBindings);

    builder = getPostgresBuilder();
    builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
    const $subBuilder = getPostgresBuilder();
    $subBuilder.from('two').select(['baz']).where('subkey', '=', 'subval');
    builder.selectSub($subBuilder, 'sub');
    expect(builder.toSql()).toBe($expectedSql);
    expect(builder.getBindings()).toStrictEqual($expectedBindings);

    /*
    //$this.expectException(InvalidArgumentException::class);
    expect(() => {
        builder = getPostgresBuilder();
        builder.selectSub(['foo'], 'sub');
    }).toThrow();
    */
})

test('SubSelectResetBindings', () =>
{
    const builder = getPostgresBuilder();
    builder.from('one').selectSub(function ($query) {
        $query.from('two').select(['baz']).where('subkey', '=', 'subval');
    }, 'sub');

    expect(builder.toSql()).toBe('select (select "baz" from "two" where "subkey" = ?) as "sub" from "one"');
    expect(builder.getBindings()).toStrictEqual(['subval']);

    builder.select(['*']);

    expect(builder.toSql()).toBe('select * from "one"');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('SqlServerWhereDate', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-09-23');
    expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as date) = ?');
    expect(builder.getBindings()).toStrictEqual(['2015-09-23']);
})

test('UppercaseLeadingBooleansAreRemoved', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'Taylor', 'AND');
    expect(builder.toSql()).toBe('select * from "users" where "name" = ?');
})

test('LowercaseLeadingBooleansAreRemoved', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'Taylor', 'and');
    expect(builder.toSql()).toBe('select * from "users" where "name" = ?');
})

test('CaseInsensitiveLeadingBooleansAreRemoved', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'Taylor', 'And');
    expect(builder.toSql()).toBe('select * from "users" where "name" = ?');
})

test('TableValuedFunctionAsTableInSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users()');
    expect(builder.toSql()).toBe('select * from [users]()');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users(1,2)');
    expect(builder.toSql()).toBe('select * from [users](1,2)');
})

test.skip('ChunkWithLastChunkComplete', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders.push({'column': 'foobar', 'direction': 'asc'});

    $chunk1 = collect(['foo1', 'foo2']);
    $chunk2 = collect(['foo3', 'foo4']);
    $chunk3 = collect([]);
    builder.shouldReceive('forPage').once().with(1, 2).andReturnSelf();
    builder.shouldReceive('forPage').once().with(2, 2).andReturnSelf();
    builder.shouldReceive('forPage').once().with(3, 2).andReturnSelf();
    builder.shouldReceive('get').times(3).andReturn($chunk1, $chunk2, $chunk3);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk2);
    $callbackAssertor.shouldReceive('doSomething').never().with($chunk3);

    builder.chunk(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    });
    */
})

test.skip('ChunkWithLastChunkPartial', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk1 = collect(['foo1', 'foo2']);
    $chunk2 = collect(['foo3']);
    builder.shouldReceive('forPage').once().with(1, 2).andReturnSelf();
    builder.shouldReceive('forPage').once().with(2, 2).andReturnSelf();
    builder.shouldReceive('get').times(2).andReturn($chunk1, $chunk2);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk2);

    builder.chunk(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    });
    */
})

test.skip('ChunkCanBeStoppedByReturningFalse', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk1 = collect(['foo1', 'foo2']);
    $chunk2 = collect(['foo3']);
    builder.shouldReceive('forPage').once().with(1, 2).andReturnSelf();
    builder.shouldReceive('forPage').never().with(2, 2);
    builder.shouldReceive('get').times(1).andReturn($chunk1);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').never().with($chunk2);

    builder.chunk(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);

        return false;
    });
    */
})

test.skip('ChunkWithCountZero', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk = collect([]);
    builder.shouldReceive('forPage').once().with(1, 0).andReturnSelf();
    builder.shouldReceive('get').times(1).andReturn($chunk);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').never();

    builder.chunk(0, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    });
    */
})

test.skip('ChunkByIdOnArrays', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk1 = collect([['someIdField': 1], ['someIdField': 2]]);
    $chunk2 = collect([['someIdField': 10], ['someIdField': 11]]);
    $chunk3 = collect([]);
    builder.shouldReceive('forPageAfterId').once().with(2, 0, 'someIdField').andReturnSelf();
    builder.shouldReceive('forPageAfterId').once().with(2, 2, 'someIdField').andReturnSelf();
    builder.shouldReceive('forPageAfterId').once().with(2, 11, 'someIdField').andReturnSelf();
    builder.shouldReceive('get').times(3).andReturn($chunk1, $chunk2, $chunk3);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk2);
    $callbackAssertor.shouldReceive('doSomething').never().with($chunk3);

    builder.chunkById(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    }, 'someIdField');
    */
})

test.skip('ChunkPaginatesUsingIdWithLastChunkComplete', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk1 = collect([(object) ['someIdField': 1], (object) ['someIdField': 2]]);
    $chunk2 = collect([(object) ['someIdField': 10], (object) ['someIdField': 11]]);
    $chunk3 = collect([]);
    builder.shouldReceive('forPageAfterId').once().with(2, 0, 'someIdField').andReturnSelf();
    builder.shouldReceive('forPageAfterId').once().with(2, 2, 'someIdField').andReturnSelf();
    builder.shouldReceive('forPageAfterId').once().with(2, 11, 'someIdField').andReturnSelf();
    builder.shouldReceive('get').times(3).andReturn($chunk1, $chunk2, $chunk3);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk2);
    $callbackAssertor.shouldReceive('doSomething').never().with($chunk3);

    builder.chunkById(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    }, 'someIdField');
    */
})

test.skip('ChunkPaginatesUsingIdWithLastChunkPartial', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk1 = collect([(object) ['someIdField': 1], (object) ['someIdField': 2]]);
    $chunk2 = collect([(object) ['someIdField': 10]]);
    builder.shouldReceive('forPageAfterId').once().with(2, 0, 'someIdField').andReturnSelf();
    builder.shouldReceive('forPageAfterId').once().with(2, 2, 'someIdField').andReturnSelf();
    builder.shouldReceive('get').times(2).andReturn($chunk1, $chunk2);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk2);

    builder.chunkById(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    }, 'someIdField');
    */
})

test.skip('ChunkPaginatesUsingIdWithCountZero', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk = collect([]);
    builder.shouldReceive('forPageAfterId').once().with(0, 0, 'someIdField').andReturnSelf();
    builder.shouldReceive('get').times(1).andReturn($chunk);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').never();

    builder.chunkById(0, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    }, 'someIdField');
    */
})

test.skip('ChunkPaginatesUsingIdWithAlias', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    builder = getMockQueryBuilder();
    builder.orders[] = ['column': 'foobar', 'direction': 'asc'];

    $chunk1 = collect([(object) ['table_id': 1], (object) ['table_id': 10]]);
    $chunk2 = collect([]);
    builder.shouldReceive('forPageAfterId').once().with(2, 0, 'table.id').andReturnSelf();
    builder.shouldReceive('forPageAfterId').once().with(2, 10, 'table.id').andReturnSelf();
    builder.shouldReceive('get').times(2).andReturn($chunk1, $chunk2);

    $callbackAssertor = m::mock(stdClass::class);
    $callbackAssertor.shouldReceive('doSomething').once().with($chunk1);
    $callbackAssertor.shouldReceive('doSomething').never().with($chunk2);

    builder.chunkById(2, function ($results) use ($callbackAssertor) {
        $callbackAssertor.doSomething($results);
    }, 'table.id', 'table_id');
    */
})

test.skip('Paginate', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    $perPage = 16;
    $columns = ['test'];
    $pageName = 'page-name';
    $page = 1;
    builder = getMockQueryBuilder();
    $path = 'http://foo.bar?page=3';

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('getCountForPagination').once().andReturn(2);
    builder.shouldReceive('forPage').once().with($page, $perPage).andReturnSelf();
    builder.shouldReceive('get').once().andReturn($results);

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.paginate($perPage, $columns, $pageName, $page);

    $this.assertEquals(new LengthAwarePaginator($results, 2, $perPage, $page, [
        'path': $path,
        'pageName': $pageName,
    ]), $result);
    */
})

test.skip('PaginateWithDefaultArguments', () =>
{
    // collections are not supported in my solution, so we outcomment this.
    /*
    $perPage = 15;
    $pageName = 'page';
    $page = 1;
    builder = getMockQueryBuilder();
    $path = 'http://foo.bar?page=3';

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('getCountForPagination').once().andReturn(2);
    builder.shouldReceive('forPage').once().with($page, $perPage).andReturnSelf();
    builder.shouldReceive('get').once().andReturn($results);

    Paginator::currentPageResolver(function () {
        return 1;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.paginate();

    $this.assertEquals(new LengthAwarePaginator($results, 2, $perPage, $page, [
        'path': $path,
        'pageName': $pageName,
    ]), $result);
    */
})

test('PaginateWhenNoResults', () =>
{
    /*
    $perPage = 15;
    $pageName = 'page';
    $page = 1;
    builder = getMockQueryBuilder();
    $path = 'http://foo.bar?page=3';

    $results = [];

    builder.shouldReceive('getCountForPagination').once().andReturn(0);
    builder.shouldNotReceive('forPage');
    builder.shouldNotReceive('get');

    Paginator::currentPageResolver(function () {
        return 1;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.paginate();

    $this.assertEquals(new LengthAwarePaginator($results, 0, $perPage, $page, [
        'path': $path,
        'pageName': $pageName,
    ]), $result);
    */
})

test('PaginateWithSpecificColumns', () =>
{
    /*
    $perPage = 16;
    $columns = ['id', 'name'];
    $pageName = 'page-name';
    $page = 1;
    builder = getMockQueryBuilder();
    $path = 'http://foo.bar?page=3';

    $results = collect([['id': 3, 'name': 'Taylor'], ['id': 5, 'name': 'Mohamed']]);

    builder.shouldReceive('getCountForPagination').once().andReturn(2);
    builder.shouldReceive('forPage').once().with($page, $perPage).andReturnSelf();
    builder.shouldReceive('get').once().andReturn($results);

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.paginate($perPage, $columns, $pageName, $page);

    $this.assertEquals(new LengthAwarePaginator($results, 2, $perPage, $page, [
        'path': $path,
        'pageName': $pageName,
    ]), $result);
    */
})

test('PaginateWithTotalOverride', () =>
{
    /*
    $perPage = 16;
    $columns = ['id', 'name'];
    $pageName = 'page-name';
    $page = 1;
    builder = getMockQueryBuilder();
    $path = 'http://foo.bar?page=3';

    $results = collect([['id': 3, 'name': 'Taylor'], ['id': 5, 'name': 'Mohamed']]);

    builder.shouldReceive('getCountForPagination').never();
    builder.shouldReceive('forPage').once().with($page, $perPage).andReturnSelf();
    builder.shouldReceive('get').once().andReturn($results);

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.paginate($perPage, $columns, $pageName, $page, 10);

    $this.assertEquals(10, $result.total());
    */
})

test('CursorPaginate', () =>
{
    /*
    $perPage = 16;
    $columns = ['test'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['test': 'bar']);
    builder = getMockQueryBuilder();
    builder.from('foobar').orderBy('test');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select * from "foobar" where ("test" > ?) order by "test" asc limit 17',
            builder.toSql());
        $this.assertEquals(['bar'], builder.bindings['where']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test'],
    ]), $result);
    */
})

test('CursorPaginateMultipleOrderColumns', () =>
{
    /*
    $perPage = 16;
    $columns = ['test', 'another'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['test': 'bar', 'another': 'foo']);
    builder = getMockQueryBuilder();
    builder.from('foobar').orderBy('test').orderBy('another');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['test': 'foo', 'another': 1], ['test': 'bar', 'another': 2]]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select * from "foobar" where ("test" > ? or ("test" = ? and ("another" > ?))) order by "test" asc, "another" asc limit 17',
            builder.toSql()
        );
        $this.assertEquals(['bar', 'bar', 'foo'], builder.bindings['where']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test', 'another'],
    ]), $result);
    */
})

test('CursorPaginateWithDefaultArguments', () =>
{
    /*
    $perPage = 15;
    $cursorName = 'cursor';
    $cursor = new Cursor(['test': 'bar']);
    builder = getMockQueryBuilder();
    builder.from('foobar').orderBy('test');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select * from "foobar" where ("test" > ?) order by "test" asc limit 16',
            builder.toSql());
        $this.assertEquals(['bar'], builder.bindings['where']);

        return $results;
    });

    CursorPaginator::currentCursorResolver(function () use ($cursor) {
        return $cursor;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate();

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test'],
    ]), $result);
    */
})

test('CursorPaginateWhenNoResults', () =>
{
    /*
    $perPage = 15;
    $cursorName = 'cursor';
    builder = $this.getMockQueryBuilder().orderBy('test');
    $path = 'http://foo.bar?cursor=3';

    $results = [];

    builder.shouldReceive('get').once().andReturn($results);

    CursorPaginator::currentCursorResolver(function () {
        return null;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate();

    $this.assertEquals(new CursorPaginator($results, $perPage, null, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test'],
    ]), $result);
    */
})

test('CursorPaginateWithSpecificColumns', () =>
{
    /*
    $perPage = 16;
    $columns = ['id', 'name'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['id': 2]);
    builder = getMockQueryBuilder();
    builder.from('foobar').orderBy('id');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor=3';

    $results = collect([['id': 3, 'name': 'Taylor'], ['id': 5, 'name': 'Mohamed']]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select * from "foobar" where ("id" > ?) order by "id" asc limit 17',
            builder.toSql());
        $this.assertEquals([2], builder.bindings['where']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['id'],
    ]), $result);
    */
})

test('CursorPaginateWithMixedOrders', () =>
{
    /*
    $perPage = 16;
    $columns = ['foo', 'bar', 'baz'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['foo': 1, 'bar': 2, 'baz': 3]);
    builder = getMockQueryBuilder();
    builder.from('foobar').orderBy('foo').orderByDesc('bar').orderBy('baz');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['foo': 1, 'bar': 2, 'baz': 4], ['foo': 1, 'bar': 1, 'baz': 1]]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select * from "foobar" where ("foo" > ? or ("foo" = ? and ("bar" < ? or ("bar" = ? and ("baz" > ?))))) order by "foo" asc, "bar" desc, "baz" asc limit 17',
            builder.toSql()
        );
        $this.assertEquals([1, 1, 2, 2, 3], builder.bindings['where']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['foo', 'bar', 'baz'],
    ]), $result);
    */
})

test('CursorPaginateWithDynamicColumnInSelectRaw', () =>
{
    /*
    $perPage = 15;
    $cursorName = 'cursor';
    $cursor = new Cursor(['test': 'bar']);
    builder = getMockQueryBuilder();
    builder.from('foobar').select(['*']).selectRaw('(CONCAT(firstname, \' \', lastname)) as test').orderBy('test');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select *, (CONCAT(firstname, \' \', lastname)) as test from "foobar" where ((CONCAT(firstname, \' \', lastname)) > ?) order by "test" asc limit 16',
            builder.toSql());
        $this.assertEquals(['bar'], builder.bindings['where']);

        return $results;
    });

    CursorPaginator::currentCursorResolver(function () use ($cursor) {
        return $cursor;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate();

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test'],
    ]), $result);
    */
})

test('CursorPaginateWithDynamicColumnWithCastInSelectRaw', () =>
{
    /*
    $perPage = 15;
    $cursorName = 'cursor';
    $cursor = new Cursor(['test': 'bar']);
    builder = getMockQueryBuilder();
    builder.from('foobar').select(['*']).selectRaw('(CAST(CONCAT(firstname, \' \', lastname) as VARCHAR)) as test').orderBy('test');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select *, (CAST(CONCAT(firstname, \' \', lastname) as VARCHAR)) as test from "foobar" where ((CAST(CONCAT(firstname, \' \', lastname) as VARCHAR)) > ?) order by "test" asc limit 16',
            builder.toSql());
        $this.assertEquals(['bar'], builder.bindings['where']);

        return $results;
    });

    CursorPaginator::currentCursorResolver(function () use ($cursor) {
        return $cursor;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate();

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test'],
    ]), $result);
    */
})

test('CursorPaginateWithDynamicColumnInSelectSub', () =>
{
    /*
    $perPage = 15;
    $cursorName = 'cursor';
    $cursor = new Cursor(['test': 'bar']);
    builder = getMockQueryBuilder();
    builder.from('foobar').select(['*']).selectSub('CONCAT(firstname, \' \', lastname)', 'test').orderBy('test');
    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([['test': 'foo'], ['test': 'bar']]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results) {
        $this.assertEquals(
            'select *, (CONCAT(firstname, \' \', lastname)) as "test" from "foobar" where ((CONCAT(firstname, \' \', lastname)) > ?) order by "test" asc limit 16',
            builder.toSql());
        $this.assertEquals(['bar'], builder.bindings['where']);

        return $results;
    });

    CursorPaginator::currentCursorResolver(function () use ($cursor) {
        return $cursor;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate();

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['test'],
    ]), $result);
    */
})

test('CursorPaginateWithUnionWheres', () =>
{
    /*
    $ts = now().toDateTimeString();

    $perPage = 16;
    $columns = ['test'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['created_at': $ts]);
    builder = getMockQueryBuilder();
    builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
    builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
    builder.orderBy('created_at');

    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([
        ['id': 1, 'created_at': now(), 'type': 'video'],
        ['id': 2, 'created_at': now(), 'type': 'news'],
    ]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results, $ts) {
        $this.assertEquals(
            '(select "id", "start_time" as "created_at", \'video\' as type from "videos" where ("start_time" > ?)) union (select "id", "created_at", \'news\' as type from "news" where ("start_time" > ?)) order by "created_at" asc limit 17',
            builder.toSql());
        $this.assertEquals([$ts], builder.bindings['where']);
        $this.assertEquals([$ts], builder.bindings['union']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['created_at'],
    ]), $result);
    */
})

test('CursorPaginateWithUnionWheresWithRawOrderExpression', () =>
{
    /*
    $ts = now().toDateTimeString();

    $perPage = 16;
    $columns = ['test'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['created_at': $ts]);
    builder = getMockQueryBuilder();
    builder.select('id', 'is_published', 'start_time as created_at').selectRaw("'video' as type").where('is_published', true).from('videos');
    builder.union(getBuilder().select('id', 'is_published', 'created_at').selectRaw("'news' as type").where('is_published', true).from('news'));
    builder.orderByRaw('case when (id = 3 and type="news" then 0 else 1 end)').orderBy('created_at');

    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([
        ['id': 1, 'created_at': now(), 'type': 'video', 'is_published': true],
        ['id': 2, 'created_at': now(), 'type': 'news', 'is_published': true],
    ]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results, $ts) {
        $this.assertEquals(
            '(select "id", "is_published", "start_time" as "created_at", \'video\' as type from "videos" where "is_published" = ? and ("start_time" > ?)) union (select "id", "is_published", "created_at", \'news\' as type from "news" where "is_published" = ? and ("start_time" > ?)) order by case when (id = 3 and type="news" then 0 else 1 end), "created_at" asc limit 17',
            builder.toSql());
        $this.assertEquals([true, $ts], builder.bindings['where']);
        $this.assertEquals([true, $ts], builder.bindings['union']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['created_at'],
    ]), $result);
    */
})

test('CursorPaginateWithUnionWheresReverseOrder', () =>
{
    /*
    $ts = now().toDateTimeString();

    $perPage = 16;
    $columns = ['test'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['created_at': $ts], false);
    builder = getMockQueryBuilder();
    builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
    builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
    builder.orderBy('created_at');

    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([
        ['id': 1, 'created_at': now(), 'type': 'video'],
        ['id': 2, 'created_at': now(), 'type': 'news'],
    ]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results, $ts) {
        $this.assertEquals(
            '(select "id", "start_time" as "created_at", \'video\' as type from "videos" where ("start_time" < ?)) union (select "id", "created_at", \'news\' as type from "news" where ("start_time" < ?)) order by "created_at" desc limit 17',
            builder.toSql());
        $this.assertEquals([$ts], builder.bindings['where']);
        $this.assertEquals([$ts], builder.bindings['union']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['created_at'],
    ]), $result);
    */
})

test('CursorPaginateWithUnionWheresMultipleOrders', () =>
{
    /*
    $ts = now().toDateTimeString();

    $perPage = 16;
    $columns = ['test'];
    $cursorName = 'cursor-name';
    $cursor = new Cursor(['created_at': $ts, 'id': 1]);
    builder = getMockQueryBuilder();
    builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
    builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
    builder.orderByDesc('created_at').orderBy('id');

    builder.shouldReceive('newQuery').andReturnUsing(function () use (builder) {
        return new Builder(builder.connection, builder.grammar, builder.processor);
    });

    $path = 'http://foo.bar?cursor='.$cursor.encode();

    $results = collect([
        ['id': 1, 'created_at': now(), 'type': 'video'],
        ['id': 2, 'created_at': now(), 'type': 'news'],
    ]);

    builder.shouldReceive('get').once().andReturnUsing(function () use (builder, $results, $ts) {
        $this.assertEquals(
            '(select "id", "start_time" as "created_at", \'video\' as type from "videos" where ("start_time" < ? or ("start_time" = ? and ("id" > ?)))) union (select "id", "created_at", \'news\' as type from "news" where ("start_time" < ? or ("start_time" = ? and ("id" > ?)))) order by "created_at" desc, "id" asc limit 17',
            builder.toSql());
        $this.assertEquals([$ts, $ts, 1], builder.bindings['where']);
        $this.assertEquals([$ts, $ts, 1], builder.bindings['union']);

        return $results;
    });

    Paginator::currentPathResolver(function () use ($path) {
        return $path;
    });

    $result = builder.cursorPaginate($perPage, $columns, $cursorName, $cursor);

    $this.assertEquals(new CursorPaginator($results, $perPage, $cursor, [
        'path': $path,
        'cursorName': $cursorName,
        'parameters': ['created_at', 'id'],
    ]), $result);
    */
})

test('WhereExpression', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('orders').where(
        new (class extends Expression
        {
            public override getValue(_grammar: Grammar)
            {
                return '1 = 1';
            }
        })('')
    );
    expect(builder.toSql()).toBe('select * from "orders" where 1 = 1');
    expect(builder.getBindings()).toStrictEqual([]);
})

test('WhereRowValues', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('orders').whereRowValues(['last_update', 'order_number'], '<', [1, 2]);
    expect(builder.toSql()).toBe('select * from "orders" where ("last_update", "order_number") < (?, ?)');

    builder = getBuilder();
    builder.select(['*']).from('orders').where('company_id', 1).orWhereRowValues(['last_update', 'order_number'], '<', [1, 2]);
    expect(builder.toSql()).toBe('select * from "orders" where "company_id" = ? or ("last_update", "order_number") < (?, ?)');

    builder = getBuilder();
    builder.select(['*']).from('orders').whereRowValues(['last_update', 'order_number'], '<', [1, new Raw('2')]);
    expect(builder.toSql()).toBe('select * from "orders" where ("last_update", "order_number") < (?, 2)');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test.skip('WhereRowValuesArityMismatch', () =>
{
    /*
    expect(() => { //TS checks this now, instad of a throw at runtime
        const builder = getBuilder();
        builder.select(['*']).from('orders').whereRowValues(['last_update'], '<', [1, 2]);
    }).toThrowErrorMatchingInlineSnapshot('The number of columns must match the number of values');
    */
})

test('WhereJsonContainsMySql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContains('options', ['en']);
    expect(builder.toSql()).toBe('select * from `users` where json_contains(`options`, ?)');
    expect(builder.getBindings()).toStrictEqual(['["en"]']);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContains('users.options->languages', ['en']);
    expect(builder.toSql()).toBe('select * from `users` where json_contains(`users`.`options`, ?, \'$."languages"\')');
    expect(builder.getBindings()).toStrictEqual(['["en"]']);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContains('options->languages', new Raw("'[\"en\"]'"));
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or json_contains(`options`, \'["en"]\', \'$."languages"\')');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonContainsPostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContains('options', ['en']);
    expect(builder.toSql()).toBe('select * from "users" where ("options")::jsonb @> ?');
    expect(builder.getBindings()).toStrictEqual(['["en"]']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContains('users.options->languages', ['en']);
    expect(builder.toSql()).toBe('select * from "users" where ("users"."options"->\'languages\')::jsonb @> ?');
    expect(builder.getBindings()).toStrictEqual(['["en"]']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContains('options->languages', new Raw("'[\"en\"]'"));
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or ("options"->\'languages\')::jsonb @> \'["en"]\'');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonContainsSqlite', () =>
{
    expect(() => {
        const builder = getSQLiteBuilder();
        builder.select(['*']).from('users').whereJsonContains('options->languages', ['en']).toSql();
    }).toThrow();
})

test('WhereJsonContainsSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContains('options', true);
    expect(builder.toSql()).toBe('select * from [users] where ? in (select [value] from openjson([options]))');
    expect(builder.getBindings()).toStrictEqual(['true']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContains('users.options->languages', 'en');
    expect(builder.toSql()).toBe('select * from [users] where ? in (select [value] from openjson([users].[options], \'$."languages"\'))');
    expect(builder.getBindings()).toStrictEqual(['en']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContains('options->languages', new Raw("'en'"));
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or \'en\' in (select [value] from openjson([options], \'$."languages"\'))');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonDoesntContainMySql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options->languages', ['en']);
    expect(builder.toSql()).toBe('select * from `users` where not json_contains(`options`, ?, \'$."languages"\')');
    expect(builder.getBindings()).toStrictEqual(['["en"]']);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContain('options->languages', new Raw("'[\"en\"]'"));
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or not json_contains(`options`, \'["en"]\', \'$."languages"\')');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonDoesntContainPostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options->languages', ['en']);
    expect(builder.toSql()).toBe('select * from "users" where not ("options"->\'languages\')::jsonb @> ?');
    expect(builder.getBindings()).toStrictEqual(['["en"]']);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContain('options->languages', new Raw("'[\"en\"]'"));
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or not ("options"->\'languages\')::jsonb @> \'["en"]\'');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonDoesntContainSqlite', () =>
{
    expect(() => {
        const builder = getSQLiteBuilder();
        builder.select(['*']).from('users').whereJsonDoesntContain('options->languages', ['en']).toSql();
    }).toThrow();
})

test('WhereJsonDoesntContainSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options->languages', 'en');
    expect(builder.toSql()).toBe('select * from [users] where not ? in (select [value] from openjson([options], \'$."languages"\'))');
    expect(builder.getBindings()).toStrictEqual(['en']);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContain('options->languages', new Raw("'en'"));
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or not \'en\' in (select [value] from openjson([options], \'$."languages"\'))');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonContainsKeyMySql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options->languages');
    expect(builder.toSql()).toBe('select * from `users` where ifnull(json_contains_path(`users`.`options`, \'one\', \'$."languages"\'), 0)');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->language->primary');
    expect(builder.toSql()).toBe('select * from `users` where ifnull(json_contains_path(`options`, \'one\', \'$."language"."primary"\'), 0)');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or ifnull(json_contains_path(`options`, \'one\', \'$."languages"\'), 0)');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from `users` where ifnull(json_contains_path(`options`, \'one\', \'$."languages"[0][1]\'), 0)');
})

test('WhereJsonContainsKeyPostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options->languages');
    expect(builder.toSql()).toBe('select * from "users" where coalesce(("users"."options")::jsonb ?? \'languages\', false)');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->language->primary');
    expect(builder.toSql()).toBe('select * from "users" where coalesce(("options"->\'language\')::jsonb ?? \'primary\', false)');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or coalesce(("options")::jsonb ?? \'languages\', false)');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from "users" where case when jsonb_typeof(("options"->\'languages\'->0)::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\'->0)::jsonb) >= 2 else false end');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->languages[-1]');
    expect(builder.toSql()).toBe('select * from "users" where case when jsonb_typeof(("options"->\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\')::jsonb) >= 1 else false end');
})

test('WhereJsonContainsKeySqlite', () =>
{
    let builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options->languages');
    expect(builder.toSql()).toBe('select * from "users" where json_type("users"."options", \'$."languages"\') is not null');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->language->primary');
    expect(builder.toSql()).toBe('select * from "users" where json_type("options", \'$."language"."primary"\') is not null');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or json_type("options", \'$."languages"\') is not null');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from "users" where json_type("options", \'$."languages"[0][1]\') is not null');
})

test('WhereJsonContainsKeySqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options->languages');
    expect(builder.toSql()).toBe('select * from [users] where \'languages\' in (select [key] from openjson([users].[options]))');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->language->primary');
    expect(builder.toSql()).toBe('select * from [users] where \'primary\' in (select [key] from openjson([options], \'$."language"\'))');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or \'languages\' in (select [key] from openjson([options]))');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from [users] where 1 in (select [key] from openjson([options], \'$."languages"[0]\'))');
})

test('WhereJsonDoesntContainKeyMySql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from `users` where not ifnull(json_contains_path(`options`, \'one\', \'$."languages"\'), 0)');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or not ifnull(json_contains_path(`options`, \'one\', \'$."languages"\'), 0)');

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from `users` where not ifnull(json_contains_path(`options`, \'one\', \'$."languages"[0][1]\'), 0)');
})

test('WhereJsonDoesntContainKeyPostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from "users" where not coalesce(("options")::jsonb ?? \'languages\', false)');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or not coalesce(("options")::jsonb ?? \'languages\', false)');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from "users" where not case when jsonb_typeof(("options"->\'languages\'->0)::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\'->0)::jsonb) >= 2 else false end');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages[-1]');
    expect(builder.toSql()).toBe('select * from "users" where not case when jsonb_typeof(("options"->\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\')::jsonb) >= 1 else false end');
})

test('WhereJsonDoesntContainKeySqlite', () =>
{
    let builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from "users" where not json_type("options", \'$."languages"\') is not null');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or not json_type("options", \'$."languages"\') is not null');

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or not json_type("options", \'$."languages"[0][1]\') is not null');
})

test('WhereJsonDoesntContainKeySqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from [users] where not \'languages\' in (select [key] from openjson([options]))');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or not \'languages\' in (select [key] from openjson([options]))');

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages[0][1]');
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or not 1 in (select [key] from openjson([options], \'$."languages"[0]\'))');
})

test('WhereJsonLengthMySql', () =>
{
    let builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect(builder.toSql()).toBe('select * from `users` where json_length(`options`) = ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options->languages', '>', 0);
    expect(builder.toSql()).toBe('select * from `users` where json_length(`users`.`options`, \'$."languages"\') > ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or json_length(`options`, \'$."languages"\') = 0');
    expect(builder.getBindings()).toStrictEqual([1]);

    builder = getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', '>', new Raw('0'));
    expect(builder.toSql()).toBe('select * from `users` where `id` = ? or json_length(`options`, \'$."languages"\') > 0');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonLengthPostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect(builder.toSql()).toBe('select * from "users" where jsonb_array_length(("options")::jsonb) = ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options->languages', '>', 0);
    expect(builder.toSql()).toBe('select * from "users" where jsonb_array_length(("users"."options"->\'languages\')::jsonb) > ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or jsonb_array_length(("options"->\'languages\')::jsonb) = 0');
    expect(builder.getBindings()).toStrictEqual([1]);

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', '>', new Raw('0'));
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or jsonb_array_length(("options"->\'languages\')::jsonb) > 0');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonLengthSqlite', () =>
{
    let builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect(builder.toSql()).toBe('select * from "users" where json_array_length("options") = ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options->languages', '>', 0);
    expect(builder.toSql()).toBe('select * from "users" where json_array_length("users"."options", \'$."languages"\') > ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or json_array_length("options", \'$."languages"\') = 0');
    expect(builder.getBindings()).toStrictEqual([1]);

    builder = getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', '>', new Raw('0'));
    expect(builder.toSql()).toBe('select * from "users" where "id" = ? or json_array_length("options", \'$."languages"\') > 0');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('WhereJsonLengthSqlServer', () =>
{
    let builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect(builder.toSql()).toBe('select * from [users] where (select count(*) from openjson([options])) = ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options->languages', '>', 0);
    expect(builder.toSql()).toBe('select * from [users] where (select count(*) from openjson([users].[options], \'$."languages"\')) > ?');
    expect(builder.getBindings()).toStrictEqual([0]);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or (select count(*) from openjson([options], \'$."languages"\')) = 0');
    expect(builder.getBindings()).toStrictEqual([1]);

    builder = getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options->languages', '>', new Raw('0'));
    expect(builder.toSql()).toBe('select * from [users] where [id] = ? or (select count(*) from openjson([options], \'$."languages"\')) > 0');
    expect(builder.getBindings()).toStrictEqual([1]);
})

test('From', () =>
{
    const builder = getBuilder();
    builder.from(getBuilder().from('users'), 'u');
    expect(builder.toSql()).toBe('select * from (select * from "users") as "u"');

    // builder = getBuilder();
    // const $eloquentBuilder = new EloquentBuilder(getBuilder());
    // builder.from($eloquentBuilder.from('users'), 'u');
    // expect(builder.toSql()).toBe('select * from (select * from "users") as "u"');
})

test('FromSub', () =>
{
    const builder = getBuilder();
    builder.fromSub((query) => {
        query.select([new Raw('max(last_seen_at) as last_seen_at')]).from('user_sessions').where('foo', '=', '1');
    }, 'sessions').where('bar', '<', '10');
    expect(builder.toSql()).toBe('select * from (select max(last_seen_at) as last_seen_at from "user_sessions" where "foo" = ?) as "sessions" where "bar" < ?');
    expect(builder.getBindings()).toStrictEqual(['1', '10']);

    /*
    expect(() => {//TS does this check for us!
        builder = getBuilder();
        builder.fromSub(['invalid'], 'sessions').where('bar', '<', '10');
    }).toThrow();
    */
})

test('FromSubWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.fromSub(function ($query) {
        $query.select([new Raw('max(last_seen_at) as last_seen_at')]).from('user_sessions').where('foo', '=', '1');
    }, 'sessions').where('bar', '<', '10');
    expect(builder.toSql()).toBe('select * from (select max(last_seen_at) as last_seen_at from "prefix_user_sessions" where "foo" = ?) as "prefix_sessions" where "bar" < ?');
    expect(builder.getBindings()).toStrictEqual(['1', '10']);
})

test('FromSubWithoutBindings', () =>
{
    const builder = getBuilder();
    builder.fromSub(function ($query) {
        $query.select([new Raw('max(last_seen_at) as last_seen_at')]).from('user_sessions');
    }, 'sessions');
    expect(builder.toSql()).toBe('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"');

    /*
    expect(() => {//TS does this check for us!
        builder = getBuilder();
        builder.fromSub(['invalid'], 'sessions');
    }).toThrow();
    */
})

test('FromRaw', () =>
{
    const builder = getBuilder();
    builder.fromRaw(new Raw('(select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"'));
    expect(builder.toSql()).toBe('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"');
})

test('FromRawOnSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.fromRaw('dbo.[SomeNameWithRoundBrackets (test)]');
    expect(builder.toSql()).toBe('select * from dbo.[SomeNameWithRoundBrackets (test)]');
})

test('FromRawWithWhereOnTheMainQuery', () =>
{
    const builder = getBuilder();
    builder.fromRaw(new Raw('(select max(last_seen_at) as last_seen_at from "sessions") as "last_seen_at"')).where('last_seen_at', '>', '1520652582');
    expect(builder.toSql()).toBe('select * from (select max(last_seen_at) as last_seen_at from "sessions") as "last_seen_at" where "last_seen_at" > ?');
    expect(builder.getBindings()).toStrictEqual(['1520652582']);
})

test('FromQuestionMarkOperatorOnPostgres', () =>
{
    let builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('roles', '?', 'superuser');
    expect(builder.toSql()).toBe('select * from "users" where "roles" ?? ?');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('roles', '?|', 'superuser');
    expect(builder.toSql()).toBe('select * from "users" where "roles" ??| ?');

    builder = getPostgresBuilder();
    builder.select(['*']).from('users').where('roles', '?&', 'superuser');
    expect(builder.toSql()).toBe('select * from "users" where "roles" ??& ?');
})

test('UseIndexMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['foo']).from('users').useIndex('test_index');
    expect(builder.toSql()).toBe('select `foo` from `users` use index (test_index)');
})

test('ForceIndexMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['foo']).from('users').forceIndex('test_index');
    expect(builder.toSql()).toBe('select `foo` from `users` force index (test_index)');
})

test('IgnoreIndexMySql', () =>
{
    const builder = getMysqlBuilder();
    builder.select(['foo']).from('users').ignoreIndex('test_index');
    expect(builder.toSql()).toBe('select `foo` from `users` ignore index (test_index)');
})

test('UseIndexSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['foo']).from('users').useIndex('test_index');
    expect(builder.toSql()).toBe('select "foo" from "users"');
})

test('ForceIndexSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['foo']).from('users').forceIndex('test_index');
    expect(builder.toSql()).toBe('select "foo" from "users" indexed by test_index');
})

test('IgnoreIndexSqlite', () =>
{
    const builder = getSQLiteBuilder();
    builder.select(['foo']).from('users').ignoreIndex('test_index');
    expect(builder.toSql()).toBe('select "foo" from "users"');
})

test('UseIndexSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['foo']).from('users').useIndex('test_index');
    expect(builder.toSql()).toBe('select [foo] from [users]');
})

test('ForceIndexSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['foo']).from('users').forceIndex('test_index');
    expect(builder.toSql()).toBe('select [foo] from [users] with (index(test_index))');
})

test('IgnoreIndexSqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['foo']).from('users').ignoreIndex('test_index');
    expect(builder.toSql()).toBe('select [foo] from [users]');
})

test('Clone', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users');
    const clone = builder.clone().where('email', 'foo');

    expect(clone).not.toBe(builder);
    expect(builder.toSql()).toBe('select * from "users"');
    expect(clone.toSql()).toBe('select * from "users" where "email" = ?');
})

test('CloneWithout', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', 'foo').orderBy('email');
    const clone = builder.cloneWithout(['_orders']);

    expect(builder.toSql()).toBe('select * from "users" where "email" = ? order by "email" asc');
    expect(clone.toSql()).toBe('select * from "users" where "email" = ?');
})

test('CloneWithoutBindings', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', 'foo').orderBy('email');
    const clone = builder.cloneWithout(['_wheres']).cloneWithoutBindings(['where']);

    expect(builder.toSql()).toBe('select * from "users" where "email" = ? order by "email" asc');
    expect(builder.getBindings()).toStrictEqual(['foo']);

    expect(clone.toSql()).toBe('select * from "users" order by "email" asc');
    expect(clone.getBindings()).toStrictEqual([]);
})

test('ToRawSql', () =>
{
    /*
    $connection = m::mock(ConnectionInterface::class);
    $connection.shouldReceive('prepareBindings')
        .with(['foo'])
        .andReturn(['foo']);
    $grammar = m::mock(Grammar::class).makePartial();
    $grammar.shouldReceive('substituteBindingsIntoRawSql')
        .with('select * from "users" where "email" = ?', ['foo'])
        .andReturn('select * from "users" where "email" = \'foo\'');
    builder = new Builder($connection, $grammar, m::mock(Processor::class));
    builder.select(['*']).from('users').where('email', 'foo');

    expect('select * from "users" where "email" = \'foo\'', builder.toRawSql());
    */
})
/*
protected function getConnection()
{
    $connection = m::mock(ConnectionInterface::class);
    $connection.shouldReceive('getDatabaseName').andReturn('database');

    return $connection;
})

protected function getPostgresBuilder()
{
    $grammar = new PostgresGrammar;
    $processor = m::mock(Processor::class);

    return new Builder($this.getConnection(), $grammar, $processor);
})

protected function getMySqlBuilder()
{
    $grammar = new MySqlGrammar;
    $processor = m::mock(Processor::class);

    return new Builder(m::mock(ConnectionInterface::class), $grammar, $processor);
})

protected function getSQLiteBuilder()
{
    $grammar = new SQLiteGrammar;
    $processor = m::mock(Processor::class);

    return new Builder(m::mock(ConnectionInterface::class), $grammar, $processor);
})

protected function getSqlServerBuilder()
{
    $grammar = new SqlServerGrammar;
    $processor = m::mock(Processor::class);

    return new Builder($this.getConnection(), $grammar, $processor);
})

protected function getMySqlBuilderWithProcessor()
{
    $grammar = new MySqlGrammar;
    $processor = new MySqlProcessor;

    return new Builder(m::mock(ConnectionInterface::class), $grammar, $processor);
})

protected function getPostgresBuilderWithProcessor()
{
    $grammar = new PostgresGrammar;
    $processor = new PostgresProcessor;

    return new Builder(m::mock(ConnectionInterface::class), $grammar, $processor);
})*/
