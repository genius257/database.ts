import { expect, test } from 'vitest'
import Builder from "./Builder";
import Grammar from "./Grammars/Grammar";
import { JoinClause } from '.';

function getBuilder() {
    const grammar = new Grammar();

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
    expect('select * from "users"').toBe(builder.toSql());
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

    expect('select * from "users"').toBe(builder.toSql());
    $this.assertNull(builder.columns);
})

test('BasicSelectUseWritePdo', () =>
{
    builder = $this.getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with('select * from `users`', [], false);
    builder.useWritePdo().select(['*']).from('users').get();

    builder = $this.getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with('select * from `users`', [], true);
    builder.select(['*']).from('users').get();
})

test('BasicTableWrappingProtectsQuotationMarks', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('some"table');
    expect('select * from "some""table"').toBe(builder.toSql());
})

test('AliasWrappingAsWholeConstant', () =>
{
    const builder = getBuilder();
    builder.select('x.y as foo.bar').from('baz');
    expect('select "x"."y" as "foo.bar" from "baz"').toBe(builder.toSql());
})

test('AliasWrappingWithSpacesInDatabaseName', () =>
{
    const builder = getBuilder();
    builder.select('w x.y.z as foo.bar').from('baz');
    expect('select "w x"."y"."z" as "foo.bar" from "baz"').toBe(builder.toSql());
})

test('AddingSelects', () =>
{
    const builder = getBuilder();
    builder.select('foo').addSelect('bar').addSelect(['baz', 'boom']).addSelect('bar').from('users');
    expect('select "foo", "bar", "baz", "boom" from "users"').toBe(builder.toSql());
})

test('BasicSelectWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('users');
    expect('select * from "prefix_users"').toBe(builder.toSql());
})

test('BasicSelectDistinct', () =>
{
    const builder = getBuilder();
    builder.distinct().select('foo', 'bar').from('users');
    expect('select distinct "foo", "bar" from "users"').toBe(builder.toSql());
})

test('BasicSelectDistinctOnColumns', () =>
{
    const builder = getBuilder();
    builder.distinct('foo').select('foo', 'bar').from('users');
    expect('select distinct "foo", "bar" from "users"').toBe(builder.toSql());

    const builder = $this.getPostgresBuilder();
    builder.distinct('foo').select('foo', 'bar').from('users');
    expect('select distinct on ("foo") "foo", "bar" from "users"').toBe(builder.toSql());
})

test('BasicAlias', () =>
{
    const builder = getBuilder();
    builder.select('foo as bar').from('users');
    expect('select "foo" as "bar" from "users"').toBe(builder.toSql());
})
*/
/*
test('AliasWithPrefix', () => {
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('users as people');
    expect('select * from "prefix_users" as "prefix_people"').toBe(builder.toSql());
});
*/

/*
test('JoinAliasesWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.select(['*']).from('services').join('translations AS t', 't.item_id', '=', 'services.id');
    expect('select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"').toBe(builder.toSql());
})
*/
test('BasicTableWrapping', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('public.users');
    expect('select * from "public"."users"').toBe(builder.toSql());
})

test('WhenCallback', () =>
{
    const callback = function ($query: Builder, $condition) {
        $this.assertTrue($condition);

        $query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').when(true, callback).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').when(false, callback).where('email', 'foo');
    expect('select * from "users" where "email" = ?').toBe(builder.toSql());
})

test('WhenCallbackWithReturn', () =>
{
    const callback = function ($query, $condition) {
        $this.assertTrue($condition);

        return $query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').when(true, callback).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').when(false, callback).where('email', 'foo');
    expect('select * from "users" where "email" = ?').toBe(builder.toSql());
})

test('WhenCallbackWithDefault', () =>
{
    const callback = function ($query: Builder, condition: string) {
        expect(condition).toBe('truthy');

        $query.where('id', '=', 1);
    };

    const _default = function (query: Builder, condition: string) {
        expect(condition).toBe(0);

        query.where('id', '=', 2);  
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').when('truthy', callback, _default).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());
    expect(builder.getBindings()).toBe([1, 'foo']);

    builder = getBuilder();
    builder.select(['*']).from('users').when(0, callback, _default).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());
    expect(builder.getBindings()).toBe([2, 'foo']);
})

test('UnlessCallback', () =>
{
    const callback = function (query: Builder, condition: boolean) {
        expect(condition).toBe(false);

        query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').unless(false, callback).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').unless(true, callback).where('email', 'foo');
    expect('select * from "users" where "email" = ?').toBe(builder.toSql());
})

test('UnlessCallbackWithReturn', () =>
{
    const callback = function (query: Builder, condition: boolean) {
        expect(condition).toBe(false);

        return query.where('id', '=', 1);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').unless(false, callback).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').unless(true, callback).where('email', 'foo');
    expect('select * from "users" where "email" = ?').toBe(builder.toSql());
})

test('UnlessCallbackWithDefault', () =>
{
    const callback = function (query: Builder, condition: boolean) {
        expect(condition).toBe(0);

        query.where('id', '=', 1);
    };

    const $default = function ($query, $condition) {
        expect('truthy', $condition);

        $query.where('id', '=', 2);
    };

    let builder = getBuilder();
    builder.select(['*']).from('users').unless(0, $callback, $default).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());
    $this.assertEquals([1, 'foo'], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').unless('truthy', $callback, $default).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());
    $this.assertEquals([2, 'foo'], builder.getBindings());
})

test('TapCallback', () =>
{
    $callback = function ($query) {
        return $query.where('id', '=', 1);
    };

    const builder = getBuilder();
    builder.select(['*']).from('users').tap($callback).where('email', 'foo');
    expect('select * from "users" where "id" = ? and "email" = ?').toBe(builder.toSql());
})

test('BasicWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    expect('select * from "users" where "id" = ?').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('BasicWhereNot', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereNot('name', 'foo').whereNot('name', '<>', 'bar');
    expect('select * from "users" where not "name" = ? and not "name" <> ?').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('WheresWithArrayValue', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', [12]);
    expect('select * from "users" where "id" = ?').toBe(builder.toSql());
    $this.assertEquals([12], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', [12, 30]);
    expect('select * from "users" where "id" = ?').toBe(builder.toSql());
    $this.assertEquals([12], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '!=', [12, 30]);
    expect('select * from "users" where "id" != ?').toBe(builder.toSql());
    $this.assertEquals([12], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '<>', [12, 30]);
    expect('select * from "users" where "id" <> ?').toBe(builder.toSql());
    $this.assertEquals([12], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', [[12, 30]]);
    expect('select * from "users" where "id" = ?').toBe(builder.toSql());
    $this.assertEquals([12], builder.getBindings());
})

test('MySqlWrappingProtectsQuotationMarks', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).From('some`table');
    expect('select * from `some``table`').toBe(builder.toSql());
})

test('DateBasedWheresAcceptsTwoArguments', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereDate('created_at', 1);
    expect('select * from `users` where date(`created_at`) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereDay('created_at', 1);
    expect('select * from `users` where day(`created_at`) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', 1);
    expect('select * from `users` where month(`created_at`) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereYear('created_at', 1);
    expect('select * from `users` where year(`created_at`) = ?').toBe(builder.toSql());
})

test('DateBasedOrWheresAcceptsTwoArguments', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereDate('created_at', 1);
    expect('select * from `users` where `id` = ? or date(`created_at`) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereDay('created_at', 1);
    expect('select * from `users` where `id` = ? or day(`created_at`) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereMonth('created_at', 1);
    expect('select * from `users` where `id` = ? or month(`created_at`) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhereYear('created_at', 1);
    expect('select * from `users` where `id` = ? or year(`created_at`) = ?').toBe(builder.toSql());
})

test('DateBasedWheresExpressionIsNotBound', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()')).where('admin', true);
    $this.assertEquals([true], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereDay('created_at', new Raw('NOW()'));
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', new Raw('NOW()'));
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereYear('created_at', new Raw('NOW()'));
    $this.assertEquals([], builder.getBindings());
})

test('WhereDateMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect('select * from `users` where date(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals(['2015-12-21'], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', new Raw('NOW()'));
    expect('select * from `users` where date(`created_at`) = NOW()').toBe(builder.toSql());
})

test('WhereDayMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect('select * from `users` where day(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('OrWhereDayMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
    expect('select * from `users` where day(`created_at`) = ? or day(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('OrWhereDayPostgres', () =>
{
    const builder = getPostgresBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
    expect('select * from "users" where extract(day from "created_at") = ? or extract(day from "created_at") = ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('OrWhereDaySqlServer', () =>
{
    const builder = getSqlServerBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
    expect('select * from [users] where day([created_at]) = ? or day([created_at]) = ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('WhereMonthMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect('select * from `users` where month(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals([5], builder.getBindings());
})

test('OrWhereMonthMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
    expect('select * from `users` where month(`created_at`) = ? or month(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals([5, 6], builder.getBindings());
})

test('OrWhereMonthPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
    expect('select * from "users" where extract(month from "created_at") = ? or extract(month from "created_at") = ?').toBe(builder.toSql());
    $this.assertEquals([5, 6], builder.getBindings());
})

test('OrWhereMonthSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
    expect('select * from [users] where month([created_at]) = ? or month([created_at]) = ?').toBe(builder.toSql());
    $this.assertEquals([5, 6], builder.getBindings());
})

test('WhereYearMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect('select * from `users` where year(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals([2014], builder.getBindings());
})

test('OrWhereYearMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
    expect('select * from `users` where year(`created_at`) = ? or year(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals([2014, 2015], builder.getBindings());
})

test('OrWhereYearPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
    expect('select * from "users" where extract(year from "created_at") = ? or extract(year from "created_at") = ?').toBe(builder.toSql());
    $this.assertEquals([2014, 2015], builder.getBindings());
})

test('OrWhereYearSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
    expect('select * from [users] where year([created_at]) = ? or year([created_at]) = ?').toBe(builder.toSql());
    $this.assertEquals([2014, 2015], builder.getBindings());
})

test('WhereTimeMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '>=', '22:00');
    expect('select * from `users` where time(`created_at`) >= ?').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());
})

test('WhereTimeOperatorOptionalMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect('select * from `users` where time(`created_at`) = ?').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());
})

test('WhereTimeOperatorOptionalPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect('select * from "users" where "created_at"::time = ?').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());
})

test('WhereTimeSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect('select * from [users] where cast([created_at] as time) = ?').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', new Raw('NOW()'));
    expect('select * from [users] where cast([created_at] as time) = NOW()').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('OrWhereTimeMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '>=', '22:00');
    expect('select * from `users` where time(`created_at`) <= ? or time(`created_at`) >= ?').toBe(builder.toSql());
    $this.assertEquals(['10:00', '22:00'], builder.getBindings());
})

test('OrWhereTimePostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '>=', '22:00');
    expect('select * from "users" where "created_at"::time <= ? or "created_at"::time >= ?').toBe(builder.toSql());
    $this.assertEquals(['10:00', '22:00'], builder.getBindings());
})

test('OrWhereTimeSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '>=', '22:00');
    expect('select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) >= ?').toBe(builder.toSql());
    $this.assertEquals(['10:00', '22:00'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', new Raw('NOW()'));
    expect('select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) = NOW()').toBe(builder.toSql());
    $this.assertEquals(['10:00'], builder.getBindings());
})

test('WhereDatePostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect('select * from "users" where "created_at"::date = ?').toBe(builder.toSql());
    $this.assertEquals(['2015-12-21'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()'));
    expect('select * from "users" where "created_at"::date = NOW()').toBe(builder.toSql());
})

test('WhereDayPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect('select * from "users" where extract(day from "created_at") = ?').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereMonthPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect('select * from "users" where extract(month from "created_at") = ?').toBe(builder.toSql());
    $this.assertEquals([5], builder.getBindings());
})

test('WhereYearPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect('select * from "users" where extract(year from "created_at") = ?').toBe(builder.toSql());
    $this.assertEquals([2014], builder.getBindings());
})

test('WhereTimePostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '>=', '22:00');
    expect('select * from "users" where "created_at"::time >= ?').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());
})

test('WhereLikePostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'like', '1');
    expect('select * from "users" where "id"::text like ?').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'LIKE', '1');
    expect('select * from "users" where "id"::text LIKE ?').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'ilike', '1');
    expect('select * from "users" where "id"::text ilike ?').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'not like', '1');
    expect('select * from "users" where "id"::text not like ?').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', 'not ilike', '1');
    expect('select * from "users" where "id"::text not ilike ?').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());
})

test('WhereDateSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect('select * from "users" where strftime(\'%Y-%m-%d\', "created_at") = cast(? as text)').toBe(builder.toSql());
    $this.assertEquals(['2015-12-21'], builder.getBindings());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()'));
    expect('select * from "users" where strftime(\'%Y-%m-%d\', "created_at") = cast(NOW() as text)').toBe(builder.toSql());
})

test('WhereDaySqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect('select * from "users" where strftime(\'%d\', "created_at") = cast(? as text)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereMonthSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect('select * from "users" where strftime(\'%m\', "created_at") = cast(? as text)').toBe(builder.toSql());
    $this.assertEquals([5], builder.getBindings());
})

test('WhereYearSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect('select * from "users" where strftime(\'%Y\', "created_at") = cast(? as text)').toBe(builder.toSql());
    $this.assertEquals([2014], builder.getBindings());
})

test('WhereTimeSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '>=', '22:00');
    expect('select * from "users" where strftime(\'%H:%M:%S\', "created_at") >= cast(? as text)').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());
})

test('WhereTimeOperatorOptionalSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereTime('created_at', '22:00');
    expect('select * from "users" where strftime(\'%H:%M:%S\', "created_at") = cast(? as text)').toBe(builder.toSql());
    $this.assertEquals(['22:00'], builder.getBindings());
})

test('WhereDateSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-12-21');
    expect('select * from [users] where cast([created_at] as date) = ?').toBe(builder.toSql());
    $this.assertEquals(['2015-12-21'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereDate('created_at', new Raw('NOW()'));
    expect('select * from [users] where cast([created_at] as date) = NOW()').toBe(builder.toSql());
})

test('WhereDaySqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereDay('created_at', '=', 1);
    expect('select * from [users] where day([created_at]) = ?').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereMonthSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereMonth('created_at', '=', 5);
    expect('select * from [users] where month([created_at]) = ?').toBe(builder.toSql());
    $this.assertEquals([5], builder.getBindings());
})

test('WhereYearSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereYear('created_at', '=', 2014);
    expect('select * from [users] where year([created_at]) = ?').toBe(builder.toSql());
    $this.assertEquals([2014], builder.getBindings());
})

test('WhereBetweens', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [1, 2]);
    expect('select * from "users" where "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [[1, 2, 3]]);
    expect('select * from "users" where "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [[1], [2, 3]]);
    expect('select * from "users" where "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereNotBetween('id', [1, 2]);
    expect('select * from "users" where "id" not between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', [new Raw(1), new Raw(2)]);
    expect('select * from "users" where "id" between 1 and 2').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    $period = now().toPeriod(now().addDay());
    builder.select(['*']).from('users').whereBetween('created_at', $period);
    expect('select * from "users" where "created_at" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([$period.start, $period.end], builder.getBindings());

    // custom long carbon period date
    builder = getBuilder();
    $period = now().toPeriod(now().addMonth());
    builder.select(['*']).from('users').whereBetween('created_at', $period);
    expect('select * from "users" where "created_at" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([$period.start, $period.end], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetween('id', collect([1, 2]));
    expect('select * from "users" where "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('OrWhereBetween', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [3, 5]);
    expect('select * from "users" where "id" = ? or "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 5], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [[3, 4, 5]]);
    expect('select * from "users" where "id" = ? or "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 4], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [[3, 5]]);
    expect('select * from "users" where "id" = ? or "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 5], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [[4], [6, 8]]);
    expect('select * from "users" where "id" = ? or "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 4, 6], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', collect([3, 4]));
    expect('select * from "users" where "id" = ? or "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 4], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereBetween('id', [new Raw(3), new Raw(4)]);
    expect('select * from "users" where "id" = ? or "id" between 3 and 4').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('OrWhereNotBetween', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [3, 5]);
    expect('select * from "users" where "id" = ? or "id" not between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 5], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [[3, 4, 5]]);
    expect('select * from "users" where "id" = ? or "id" not between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 4], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [[3, 5]]);
    expect('select * from "users" where "id" = ? or "id" not between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 5], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [[4], [6, 8]]);
    expect('select * from "users" where "id" = ? or "id" not between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 4, 6], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', collect([3, 4]));
    expect('select * from "users" where "id" = ? or "id" not between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 3, 4], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotBetween('id', [new Raw(3), new Raw(4)]);
    expect('select * from "users" where "id" = ? or "id" not between 3 and 4').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereBetweenColumns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereBetweenColumns('id', ['users.created_at', 'users.updated_at']);
    expect('select * from "users" where "id" between "users"."created_at" and "users"."updated_at"').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereNotBetweenColumns('id', ['created_at', 'updated_at']);
    expect('select * from "users" where "id" not between "created_at" and "updated_at"').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereBetweenColumns('id', [new Raw(1), new Raw(2)]);
    expect('select * from "users" where "id" between 1 and 2').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('OrWhereBetweenColumns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereBetweenColumns('id', ['users.created_at', 'users.updated_at']);
    expect('select * from "users" where "id" = ? or "id" between "users"."created_at" and "users"."updated_at"').toBe(builder.toSql());
    $this.assertEquals([2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereBetweenColumns('id', ['created_at', 'updated_at']);
    expect('select * from "users" where "id" = ? or "id" between "created_at" and "updated_at"').toBe(builder.toSql());
    $this.assertEquals([2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereBetweenColumns('id', [new Raw(1), new Raw(2)]);
    expect('select * from "users" where "id" = ? or "id" between 1 and 2').toBe(builder.toSql());
    $this.assertEquals([2], builder.getBindings());
})

test('OrWhereNotBetweenColumns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereNotBetweenColumns('id', ['users.created_at', 'users.updated_at']);
    expect('select * from "users" where "id" = ? or "id" not between "users"."created_at" and "users"."updated_at"').toBe(builder.toSql());
    $this.assertEquals([2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereNotBetweenColumns('id', ['created_at', 'updated_at']);
    expect('select * from "users" where "id" = ? or "id" not between "created_at" and "updated_at"').toBe(builder.toSql());
    $this.assertEquals([2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', 2).orWhereNotBetweenColumns('id', [new Raw(1), new Raw(2)]);
    expect('select * from "users" where "id" = ? or "id" not between 1 and 2').toBe(builder.toSql());
    $this.assertEquals([2], builder.getBindings());
})

test('BasicOrWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhere('email', '=', 'foo');
    expect('select * from "users" where "id" = ? or "email" = ?').toBe(builder.toSql());
    $this.assertEquals([1, 'foo'], builder.getBindings());
})

test('BasicOrWhereNot', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').orWhereNot('name', 'foo').orWhereNot('name', '<>', 'bar');
    expect('select * from "users" where not "name" = ? or not "name" <> ?').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('RawWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereRaw('id = ? or email = ?', [1, 'foo']);
    expect('select * from "users" where id = ? or email = ?').toBe(builder.toSql());
    $this.assertEquals([1, 'foo'], builder.getBindings());
})

test('RawOrWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereRaw('email = ?', ['foo']);
    expect('select * from "users" where "id" = ? or email = ?').toBe(builder.toSql());
    $this.assertEquals([1, 'foo'], builder.getBindings());
})

test('BasicWhereIns', () => {
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [1, 2, 3]);
    expect('select * from "users" where "id" in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2, 3], builder.getBindings());

    // associative arrays as values:
    builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', {
        'issue': 45582,
        'id': 2,
        0 : 3,
    });
    expect('select * from "users" where "id" in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([45582, 2, 3], builder.getBindings());

    // can accept some nested arrays as values.
    builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [
        {'issue': 45582},
        {'id': 2},
        [3],
    ]);
    expect('select * from "users" where "id" in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([45582, 2, 3], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIn('id', [1, 2, 3]);
    expect('select * from "users" where "id" = ? or "id" in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([1, 1, 2, 3], builder.getBindings());
})

test('BasicWhereInsException', () =>
{
    //$this.expectException(InvalidArgumentException::class);
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [
        {
            'a': 1,
            'b': 1,
        },
        {'c': 2},
        [3],
    ]);
})

test('BasicWhereNotIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNotIn('id', [1, 2, 3]);
    expect('select * from "users" where "id" not in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2, 3], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotIn('id', [1, 2, 3]);
    expect('select * from "users" where "id" = ? or "id" not in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([1, 1, 2, 3], builder.getBindings());
})

test('RawWhereIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', [new Raw(1)]);
    expect('select * from "users" where "id" in (1)').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIn('id', [new Raw(1)]);
    expect('select * from "users" where "id" = ? or "id" in (1)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('EmptyWhereIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', []);
    expect('select * from "users" where 0 = 1').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIn('id', []);
    expect('select * from "users" where "id" = ? or 0 = 1').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('EmptyWhereNotIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNotIn('id', []);
    expect('select * from "users" where 1 = 1').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNotIn('id', []);
    expect('select * from "users" where "id" = ? or 1 = 1').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereIntegerInRaw', () => {
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerInRaw('id', ['1a', 2]);
    expect('select * from "users" where "id" in (1, 2)').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerInRaw('id', [
        {'id': '1a'},
        {'id': 2},
        {'any': '3'},
    ]);
    expect('select * from "users" where "id" in (1, 2, 3)').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('OrWhereIntegerInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIntegerInRaw('id', ['1a', 2]);
    expect('select * from "users" where "id" = ? or "id" in (1, 2)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereIntegerNotInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerNotInRaw('id', ['1a', 2]);
    expect('select * from "users" where "id" not in (1, 2)').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('OrWhereIntegerNotInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereIntegerNotInRaw('id', ['1a', 2]);
    expect('select * from "users" where "id" = ? or "id" not in (1, 2)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('EmptyWhereIntegerInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerInRaw('id', []);
    expect('select * from "users" where 0 = 1').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('EmptyWhereIntegerNotInRaw', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereIntegerNotInRaw('id', []);
    expect('select * from "users" where 1 = 1').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('BasicWhereColumn', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereColumn('first_name', 'last_name').orWhereColumn('first_name', 'middle_name');
    expect('select * from "users" where "first_name" = "last_name" or "first_name" = "middle_name"').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereColumn('updated_at', '>', 'created_at');
    expect('select * from "users" where "updated_at" > "created_at"').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('ArrayWhereColumn', () =>
{
    $conditions = [
        ['first_name', 'last_name'],
        ['updated_at', '>', 'created_at'],
    ];

    const builder = getBuilder();
    builder.select(['*']).from('users').whereColumn($conditions);
    expect('select * from "users" where ("first_name" = "last_name" and "updated_at" > "created_at")').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('WhereFulltextMySql', () =>
{
    builder = $this.getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World');
    expect('select * from `users` where match (`body`) against (? in natural language mode)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'expanded': true});
    expect('select * from `users` where match (`body`) against (? in natural language mode with query expansion)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', '+Hello -World', {'mode': 'boolean'});
    expect('select * from `users` where match (`body`) against (? in boolean mode)').toBe(builder.toSql());
    $this.assertEquals(['+Hello -World'], builder.getBindings());

    builder = $this.getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', '+Hello -World', {'mode': 'boolean', 'expanded': true});
    expect('select * from `users` where match (`body`) against (? in boolean mode)').toBe(builder.toSql());
    $this.assertEquals(['+Hello -World'], builder.getBindings());

    builder = $this.getMySqlBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext(['body', 'title'], 'Car,Plane');
    expect('select * from `users` where match (`body`, `title`) against (? in natural language mode)').toBe(builder.toSql());
    $this.assertEquals(['Car,Plane'], builder.getBindings());
})

test('WhereFulltextPostgres', () =>
{
    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World');
    expect('select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'language': 'simple'});
    expect('select * from "users" where (to_tsvector(\'simple\', "body")) @@ plainto_tsquery(\'simple\', ?)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'mode': 'plain'});
    expect('select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'mode': 'phrase'});
    expect('select * from "users" where (to_tsvector(\'english\', "body")) @@ phraseto_tsquery(\'english\', ?)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', '+Hello -World', {'mode': 'websearch'});
    expect('select * from "users" where (to_tsvector(\'english\', "body")) @@ websearch_to_tsquery(\'english\', ?)').toBe(builder.toSql());
    $this.assertEquals(['+Hello -World'], builder.getBindings());

    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext('body', 'Hello World', {'language': 'simple', 'mode': 'plain'});
    expect('select * from "users" where (to_tsvector(\'simple\', "body")) @@ plainto_tsquery(\'simple\', ?)').toBe(builder.toSql());
    $this.assertEquals(['Hello World'], builder.getBindings());

    builder = $this.getPostgresBuilderWithProcessor();
    builder.select(['*']).from('users').whereFulltext(['body', 'title'], 'Car Plane');
    expect('select * from "users" where (to_tsvector(\'english\', "body") || to_tsvector(\'english\', "title")) @@ plainto_tsquery(\'english\', ?)').toBe(builder.toSql());
    $this.assertEquals(['Car Plane'], builder.getBindings());
})

test('Unions', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 2));
    expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union($this.getMySqlBuilder().select(['*']).from('users').where('id', '=', 2));
    expect('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = $this.getMysqlBuilder();
    $expectedSql = '(select `a` from `t1` where `a` = ? and `b` = ?) union (select `a` from `t2` where `a` = ? and `b` = ?) order by `a` asc limit 10';
    $union = $this.getMysqlBuilder().select('a').from('t2').where('a', 11).where('b', 2);
    builder.select('a').from('t1').where('a', 10).where('b', 1).union($union).orderBy('a').limit(10);
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals([10, 1, 11, 2], builder.getBindings());

    builder = $this.getPostgresBuilder();
    $expectedSql = '(select "name" from "users" where "id" = ?) union (select "name" from "users" where "id" = ?)';
    builder.select('name').from('users').where('id', '=', 1);
    builder.union($this.getPostgresBuilder().select('name').from('users').where('id', '=', 2));
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = $this.getSQLiteBuilder();
    $expectedSql = 'select * from (select "name" from "users" where "id" = ?) union select * from (select "name" from "users" where "id" = ?)';
    builder.select('name').from('users').where('id', '=', 1);
    builder.union($this.getSQLiteBuilder().select('name').from('users').where('id', '=', 2));
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    $expectedSql = 'select * from (select [name] from [users] where [id] = ?) as [temp_table] union select * from (select [name] from [users] where [id] = ?) as [temp_table]';
    builder.select('name').from('users').where('id', '=', 1);
    builder.union($this.getSqlServerBuilder().select('name').from('users').where('id', '=', 2));
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    $eloquentBuilder = new EloquentBuilder(getBuilder());
    builder.select(['*']).from('users').where('id', '=', 1).union($eloquentBuilder.select(['*']).from('users').where('id', '=', 2));
    expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('UnionAlls', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 2));
    expect('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    $expectedSql = '(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)';
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 2));
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    $eloquentBuilder = new EloquentBuilder(getBuilder());
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll($eloquentBuilder.select(['*']).from('users').where('id', '=', 2));
    expect('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('MultipleUnions', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 3));
    expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2, 3], builder.getBindings());
})

test('MultipleUnionAlls', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.unionAll(getBuilder().select(['*']).from('users').where('id', '=', 3));
    expect('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2, 3], builder.getBindings());
})

test('UnionOrderBys', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union(getBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.orderBy('id', 'desc');
    expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?) order by "id" desc').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('UnionLimitsAndOffsets', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users');
    builder.union(getBuilder().select(['*']).from('dogs'));
    builder.skip(5).take(10);
    expect('(select * from "users") union (select * from "dogs") limit 10 offset 5').toBe(builder.toSql());

    $expectedSql = '(select * from "users") union (select * from "dogs") limit 10 offset 5';
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users');
    builder.union(getBuilder().select(['*']).from('dogs'));
    builder.skip(5).take(10);
    $this.assertEquals($expectedSql).toBe(builder.toSql());

    $expectedSql = '(select * from "users" limit 11) union (select * from "dogs" limit 22) limit 10 offset 5';
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').limit(11);
    builder.union(getBuilder().select(['*']).from('dogs').limit(22));
    builder.skip(5).take(10);
    $this.assertEquals($expectedSql).toBe(builder.toSql());
})

test('UnionWithJoin', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users');
    builder.union(getBuilder().select(['*']).from('dogs').join('breeds', function ($join) {
        $join.on('dogs.breed_id', '=', 'breeds.id')
            .where('breeds.is_native', '=', 1);
    }));
    expect('(select * from "users") union (select * from "dogs" inner join "breeds" on "dogs"."breed_id" = "breeds"."id" and "breeds"."is_native" = ?)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('MySqlUnionOrderBys', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1);
    builder.union($this.getMySqlBuilder().select(['*']).from('users').where('id', '=', 2));
    builder.orderBy('id', 'desc');
    expect('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?) order by `id` desc').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('MySqlUnionLimitsAndOffsets', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users');
    builder.union($this.getMySqlBuilder().select(['*']).from('dogs'));
    builder.skip(5).take(10);
    expect('(select * from `users`) union (select * from `dogs`) limit 10 offset 5').toBe(builder.toSql());
})

test('UnionAggregate', () =>
{
    $expected = 'select count(*) as aggregate from ((select * from `posts`) union (select * from `videos`)) as `temp_table`';
    const builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union($this.getMySqlBuilder().from('videos')).count();

    $expected = 'select count(*) as aggregate from ((select `id` from `posts`) union (select `id` from `videos`)) as `temp_table`';
    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').select('id').union($this.getMySqlBuilder().from('videos').select('id')).count();

    $expected = 'select count(*) as aggregate from ((select * from "posts") union (select * from "videos")) as "temp_table"';
    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union($this.getPostgresBuilder().from('videos')).count();

    $expected = 'select count(*) as aggregate from (select * from (select * from "posts") union select * from (select * from "videos")) as "temp_table"';
    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union($this.getSQLiteBuilder().from('videos')).count();

    $expected = 'select count(*) as aggregate from (select * from (select * from [posts]) as [temp_table] union select * from (select * from [videos]) as [temp_table]) as [temp_table]';
    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('select').once().with($expected, [], true);
    builder.getProcessor().shouldReceive('processSelect').once();
    builder.from('posts').union($this.getSqlServerBuilder().from('videos')).count();
})

test('HavingAggregate', () =>
{
    $expected = 'select count(*) as aggregate from (select (select `count(*)` from `videos` where `posts`.`id` = `videos`.`post_id`) as `videos_count` from `posts` having `videos_count` > ?) as `temp_table`';
    const builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('getDatabaseName');
    builder.getConnection().shouldReceive('select').once().with($expected, [1], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    builder.from('posts').selectSub(function ($query) {
        $query.from('videos').select('count(*)').whereColumn('posts.id', '=', 'videos.post_id');
    }, 'videos_count').having('videos_count', '>', 1);
    builder.count();
})

test('SubSelectWhereIns', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereIn('id', function ($q) {
        $q.select('id').from('users').where('age', '>', 25).take(3);
    });
    expect('select * from "users" where "id" in (select "id" from "users" where "age" > ? limit 3)').toBe(builder.toSql());
    $this.assertEquals([25], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereNotIn('id', function ($q) {
        $q.select('id').from('users').where('age', '>', 25).take(3);
    });
    expect('select * from "users" where "id" not in (select "id" from "users" where "age" > ? limit 3)').toBe(builder.toSql());
    $this.assertEquals([25], builder.getBindings());
})

test('BasicWhereNulls', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNull('id');
    expect('select * from "users" where "id" is null').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNull('id');
    expect('select * from "users" where "id" = ? or "id" is null').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('BasicWhereNullExpressionsMysql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereNull(new Raw('id'));
    expect('select * from `users` where id is null').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNull(new Raw('id'));
    expect('select * from `users` where `id` = ? or id is null').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('JsonWhereNullMysql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereNull('items.id');
    expect('select * from `users` where (json_extract(`items`, \'$."id"\') is null OR json_type(json_extract(`items`, \'$."id"\')) = \'NULL\')').toBe(builder.toSql());
})

test('JsonWhereNotNullMysql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereNotNull('items.id');
    expect('select * from `users` where (json_extract(`items`, \'$."id"\') is not null AND json_type(json_extract(`items`, \'$."id"\')) != \'NULL\')').toBe(builder.toSql());
})

test('JsonWhereNullExpressionMysql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereNull(new Raw('items.id'));
    expect('select * from `users` where (json_extract(`items`, \'$."id"\') is null OR json_type(json_extract(`items`, \'$."id"\')) = \'NULL\')').toBe(builder.toSql());
})

test('JsonWhereNotNullExpressionMysql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereNotNull(new Raw('items.id'));
    expect('select * from `users` where (json_extract(`items`, \'$."id"\') is not null AND json_type(json_extract(`items`, \'$."id"\')) != \'NULL\')').toBe(builder.toSql());
})

test('ArrayWhereNulls', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereNull(['id', 'expires_at']);
    expect('select * from "users" where "id" is null and "expires_at" is null').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereNull(['id', 'expires_at']);
    expect('select * from "users" where "id" = ? or "id" is null or "expires_at" is null').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('BasicWhereNotNulls', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereNotNull('id');
    expect('select * from "users" where "id" is not null').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '>', 1).orWhereNotNull('id');
    expect('select * from "users" where "id" > ? or "id" is not null').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('ArrayWhereNotNulls', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereNotNull(['id', 'expires_at']);
    expect('select * from "users" where "id" is not null and "expires_at" is not null').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('id', '>', 1).orWhereNotNull(['id', 'expires_at']);
    expect('select * from "users" where "id" > ? or "id" is not null or "expires_at" is not null').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('GroupBys', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email');
    expect('select * from "users" group by "email"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('id', 'email');
    expect('select * from "users" group by "id", "email"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy(['id', 'email']);
    expect('select * from "users" group by "id", "email"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy(new Raw('DATE(created_at)'));
    expect('select * from "users" group by DATE(created_at)').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupByRaw('DATE(created_at), ? DESC', ['foo']);
    expect('select * from "users" group by DATE(created_at), ? DESC').toBe(builder.toSql());
    $this.assertEquals(['foo'], builder.getBindings());

    builder = getBuilder();
    builder.havingRaw('?', ['havingRawBinding']).groupByRaw('?', ['groupByRawBinding']).whereRaw('?', ['whereRawBinding']);
    $this.assertEquals(['whereRawBinding', 'groupByRawBinding', 'havingRawBinding'], builder.getBindings());
})

test('OrderBys', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').orderBy('email').orderBy('age', 'desc');
    expect('select * from "users" order by "email" asc, "age" desc').toBe(builder.toSql());

    builder.orders = null;
    expect('select * from "users"').toBe(builder.toSql());

    builder.orders = [];
    expect('select * from "users"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').orderBy('email').orderByRaw('"age" ? desc', ['foo']);
    expect('select * from "users" order by "email" asc, "age" ? desc').toBe(builder.toSql());
    $this.assertEquals(['foo'], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').orderByDesc('name');
    expect('select * from "users" order by "name" desc').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('posts').where('public', 1)
        .unionAll(getBuilder().select(['*']).from('videos').where('public', 1))
        .orderByRaw('field(category, ?, ?) asc', ['news', 'opinion']);
    expect('(select * from "posts" where "public" = ?) union all (select * from "videos" where "public" = ?) order by field(category, ?, ?) asc').toBe(builder.toSql());
    $this.assertEquals([1, 1, 'news', 'opinion'], builder.getBindings());
})

test('Latest', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').latest();
    expect('select * from "users" order by "created_at" desc').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').latest().limit(1);
    expect('select * from "users" order by "created_at" desc limit 1').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').latest('updated_at');
    expect('select * from "users" order by "updated_at" desc').toBe(builder.toSql());
})

test('Oldest', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').oldest();
    expect('select * from "users" order by "created_at" asc').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').oldest().limit(1);
    expect('select * from "users" order by "created_at" asc limit 1').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').oldest('updated_at');
    expect('select * from "users" order by "updated_at" asc').toBe(builder.toSql());
})

test('InRandomOrderMySql', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').inRandomOrder();
    expect('select * from "users" order by RANDOM()').toBe(builder.toSql());
})

test('InRandomOrderPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').inRandomOrder();
    expect('select * from "users" order by RANDOM()').toBe(builder.toSql());
})

test('InRandomOrderSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').inRandomOrder();
    expect('select * from [users] order by NEWID()').toBe(builder.toSql());
})

test('OrderBysSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').orderBy('email').orderBy('age', 'desc');
    expect('select * from [users] order by [email] asc, [age] desc').toBe(builder.toSql());

    builder.orders = null;
    expect('select * from [users]').toBe(builder.toSql());

    builder.orders = [];
    expect('select * from [users]').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').orderBy('email');
    expect('select * from [users] order by [email] asc').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').orderByDesc('name');
    expect('select * from [users] order by [name] desc').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').orderByRaw('[age] asc');
    expect('select * from [users] order by [age] asc').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').orderBy('email').orderByRaw('[age] ? desc', ['foo']);
    expect('select * from [users] order by [email] asc, [age] ? desc').toBe(builder.toSql());
    $this.assertEquals(['foo'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').skip(25).take(10).orderByRaw('[email] desc');
    expect('select * from [users] order by [email] desc offset 25 rows fetch next 10 rows only').toBe(builder.toSql());
})

test('Reorder', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').orderBy('name');
    expect('select * from "users" order by "name" asc').toBe(builder.toSql());
    builder.reorder();
    expect('select * from "users"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').orderBy('name');
    expect('select * from "users" order by "name" asc').toBe(builder.toSql());
    builder.reorder('email', 'desc');
    expect('select * from "users" order by "email" desc').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('first');
    builder.union(getBuilder().select(['*']).from('second'));
    builder.orderBy('name');
    expect('(select * from "first") union (select * from "second") order by "name" asc').toBe(builder.toSql());
    builder.reorder();
    expect('(select * from "first") union (select * from "second")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').orderByRaw('?', [true]);
    $this.assertEquals([true], builder.getBindings());
    builder.reorder();
    $this.assertEquals([], builder.getBindings());
})

test('OrderBySubQueries', () =>
{
    $expected = 'select * from "users" order by (select "created_at" from "logins" where "user_id" = "users"."id" limit 1)';
    $subQuery = function ($query) {
        return $query.select('created_at').from('logins').whereColumn('user_id', 'users.id').limit(1);
    };

    builder = getBuilder().select(['*']).from('users').orderBy($subQuery);
    expect("$expected asc").toBe(builder.toSql());

    builder = getBuilder().select(['*']).from('users').orderBy($subQuery, 'desc');
    expect("$expected desc").toBe(builder.toSql());

    builder = getBuilder().select(['*']).from('users').orderByDesc($subQuery);
    expect("$expected desc").toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('posts').where('public', 1)
        .unionAll(getBuilder().select(['*']).from('videos').where('public', 1))
        .orderBy(getBuilder().selectRaw('field(category, ?, ?)', ['news', 'opinion']));
    expect('(select * from "posts" where "public" = ?) union all (select * from "videos" where "public" = ?) order by (select field(category, ?, ?)) asc').toBe(builder.toSql());
    $this.assertEquals([1, 1, 'news', 'opinion'], builder.getBindings());
})

test('OrderByInvalidDirectionParam', () =>
{
    //$this.expectException(InvalidArgumentException::class);

    const builder = getBuilder();
    builder.select(['*']).from('users').orderBy('age', 'asec');
})

test('Havings', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having('email', '>', 1);
    expect('select * from "users" having "email" > ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users')
        .orHaving('email', '=', 'test@example.com')
        .orHaving('email', '=', 'test2@example.com');
    expect('select * from "users" having "email" = ? or "email" = ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email').having('email', '>', 1);
    expect('select * from "users" group by "email" having "email" > ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select('email as foo_email').from('users').having('foo_email', '>', 1);
    expect('select "email" as "foo_email" from "users" having "foo_email" > ?').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').having('total', '>', new Raw('3'));
    expect('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').having('total', '>', 3);
    expect('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?').toBe(builder.toSql());
})

test('NestedHavings', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having('email', '=', 'foo').orHaving(function ($q) {
        $q.having('name', '=', 'bar').having('age', '=', 25);
    });
    expect('select * from "users" having "email" = ? or ("name" = ? and "age" = ?)').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar', 25], builder.getBindings());
})

test('NestedHavingBindings', () =>
{
    const builder = getBuilder();
    builder.having('email', '=', 'foo').having(function ($q) {
        $q.selectRaw('?', ['ignore']).having('name', '=', 'bar');
    });
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('HavingBetweens', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').havingBetween('id', [1, 2, 3]);
    expect('select * from "users" having "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').havingBetween('id', [[1, 2], [3, 4]]);
    expect('select * from "users" having "id" between ? and ?').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('HavingNull', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').havingNull('email');
    expect('select * from "users" having "email" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users')
        .havingNull('email')
        .havingNull('phone');
    expect('select * from "users" having "email" is null and "phone" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users')
        .orHavingNull('email')
        .orHavingNull('phone');
    expect('select * from "users" having "email" is null or "phone" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email').havingNull('email');
    expect('select * from "users" group by "email" having "email" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select('email as foo_email').from('users').havingNull('foo_email');
    expect('select "email" as "foo_email" from "users" having "foo_email" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNull('total');
    expect('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNull('total');
    expect('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is null').toBe(builder.toSql());
})

test('HavingNotNull', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').havingNotNull('email');
    expect('select * from "users" having "email" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users')
        .havingNotNull('email')
        .havingNotNull('phone');
    expect('select * from "users" having "email" is not null and "phone" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users')
        .orHavingNotNull('email')
        .orHavingNotNull('phone');
    expect('select * from "users" having "email" is not null or "phone" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').groupBy('email').havingNotNull('email');
    expect('select * from "users" group by "email" having "email" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select('email as foo_email').from('users').havingNotNull('foo_email');
    expect('select "email" as "foo_email" from "users" having "foo_email" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNotNull('total');
    expect('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['category', new Raw('count(*) as "total"')]).from('item').where('department', '=', 'popular').groupBy('category').havingNotNull('total');
    expect('select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is not null').toBe(builder.toSql());
})

test('HavingExpression', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having(
        new class
        {
            public getValue(grammar: Grammar)
            {
                return '1 = 1';
            }
        }
    );
    expect('select * from "users" having 1 = 1').toBe(builder.toSql());
    expect([], builder.getBindings());
})

test('HavingShortcut', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').having('email', 1).orHaving('email', 2);
    expect('select * from "users" having "email" = ? or "email" = ?').toBe(builder.toSql());
})

test('HavingFollowedBySelectGet', () =>
{
    const builder = getBuilder();
    $query = 'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?';
    builder.getConnection().shouldReceive('select').once().with($query, ['popular', 3], true).andReturn([{'category': 'rock', 'total': 5}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('item');
    $result = builder.select(['category', new Raw('count(*) as "total"')]).where('department', '=', 'popular').groupBy('category').having('total', '>', 3).get();
    $this.assertEquals([{'category': 'rock', 'total': 5}], $result.all());

    // Using \Raw value
    builder = getBuilder();
    $query = 'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3';
    builder.getConnection().shouldReceive('select').once().with($query, ['popular'], true).andReturn([{'category': 'rock', 'total': 5}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('item');
    $result = builder.select(['category', new Raw('count(*) as "total"')]).where('department', '=', 'popular').groupBy('category').having('total', '>', new Raw('3')).get();
    $this.assertEquals([{'category': 'rock', 'total': 5}], $result.all());
})

test('RawHavings', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').havingRaw('user_foo < user_bar');
    expect('select * from "users" having user_foo < user_bar').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').having('baz', '=', 1).orHavingRaw('user_foo < user_bar');
    expect('select * from "users" having "baz" = ? or user_foo < user_bar').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').havingBetween('last_login_date', ['2018-11-16', '2018-12-16']).orHavingRaw('user_foo < user_bar');
    expect('select * from "users" having "last_login_date" between ? and ? or user_foo < user_bar').toBe(builder.toSql());
})

test('LimitsAndOffsets', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').offset(5).limit(10);
    expect('select * from "users" limit 10 offset 5').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').limit(null);
    expect('select * from "users"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').limit(0);
    expect('select * from "users" limit 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').skip(5).take(10);
    expect('select * from "users" limit 10 offset 5').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').skip(0).take(0);
    expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').skip(-5).take(-10);
    expect('select * from "users" offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').skip(null).take(null);
    expect('select * from "users" offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').skip(5).take(null);
    expect('select * from "users" offset 5').toBe(builder.toSql());
})

test('ForPage', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').forPage(2, 15);
    expect('select * from "users" limit 15 offset 15').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(0, 15);
    expect('select * from "users" limit 15 offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(-2, 15);
    expect('select * from "users" limit 15 offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(2, 0);
    expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(0, 0);
    expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').forPage(-2, 0);
    expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());
})

test('GetCountForPaginationWithBindings', () =>
{
    const builder = getBuilder();
    builder.from('users').selectSub(function ($q) {
        $q.select('body').from('posts').where('id', 4);
    }, 'post');

    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    $count = builder.getCountForPagination();
    $this.assertEquals(1, $count);
    $this.assertEquals([4], builder.getBindings());
})

test('GetCountForPaginationWithColumnAliases', () =>
{
    const builder = getBuilder();
    $columns = ['body as post_body', 'teaser', 'posts.created as published'];
    builder.from('posts').select($columns);

    builder.getConnection().shouldReceive('select').once().with('select count("body", "teaser", "posts"."created") as aggregate from "posts"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    $count = builder.getCountForPagination($columns);
    $this.assertEquals(1, $count);
})

test('GetCountForPaginationWithUnion', () =>
{
    const builder = getBuilder();
    builder.from('posts').select('id').union(getBuilder().from('videos').select('id'));

    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from ((select "id" from "posts") union (select "id" from "videos")) as "temp_table"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });

    $count = builder.getCountForPagination();
    $this.assertEquals(1, $count);
})

test('WhereShortcut', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('id', 1).orWhere('name', 'foo');
    expect('select * from "users" where "id" = ? or "name" = ?').toBe(builder.toSql());
    $this.assertEquals([1, 'foo'], builder.getBindings());
})

test('WhereWithArrayConditions', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where([['foo', 1], ['bar', 2]]);
    expect('select * from "users" where ("foo" = ? and "bar" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where({'foo': 1, 'bar': 2});
    expect('select * from "users" where ("foo" = ? and "bar" = ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where([['foo', 1], ['bar', '<', 2]]);
    expect('select * from "users" where ("foo" = ? and "bar" < ?)').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('NestedWheres', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', '=', 'foo').orWhere(function ($q) {
        $q.where('name', '=', 'bar').where('age', '=', 25);
    });
    expect('select * from "users" where "email" = ? or ("name" = ? and "age" = ?)').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar', 25], builder.getBindings());
})

test('NestedWhereBindings', () =>
{
    const builder = getBuilder();
    builder.where('email', '=', 'foo').where(function ($q) {
        $q.selectRaw('?', ['ignore']).where('name', '=', 'bar');
    });
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('WhereNot', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').whereNot(function ($q) {
        $q.where('email', '=', 'foo');
    });
    expect('select * from "users" where not ("email" = ?)').toBe(builder.toSql());
    $this.assertEquals(['foo'], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'bar').whereNot(function ($q) {
        $q.where('email', '=', 'foo');
    });
    expect('select * from "users" where "name" = ? and not ("email" = ?)').toBe(builder.toSql());
    $this.assertEquals(['bar', 'foo'], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'bar').orWhereNot(function ($q) {
        $q.where('email', '=', 'foo');
    });
    expect('select * from "users" where "name" = ? or not ("email" = ?)').toBe(builder.toSql());
    $this.assertEquals(['bar', 'foo'], builder.getBindings());
})

test('IncrementManyArgumentValidation1', () =>
{
    //$this.expectException(InvalidArgumentException::class);
    $this.expectExceptionMessage('Non-numeric value passed as increment amount for column: \'col\'.');
    const builder = getBuilder();
    builder.from('users').incrementEach({'col': 'a'});
})

test('IncrementManyArgumentValidation2', () =>
{
    //$this.expectException(InvalidArgumentException::class);
    //$this.expectExceptionMessage('Non-associative array passed to incrementEach method.');
    const builder = getBuilder();
    builder.from('users').incrementEach([111]);
})

test('WhereNotWithArrayConditions', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').whereNot([['foo', 1], ['bar', 2]]);
    expect('select * from "users" where not (("foo" = ? and "bar" = ?))').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereNot({'foo': 1, 'bar': 2});
    expect('select * from "users" where not (("foo" = ? and "bar" = ?))').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').whereNot([['foo', 1], ['bar', '<', 2]]);
    expect('select * from "users" where not (("foo" = ? and "bar" < ?))').toBe(builder.toSql());
    $this.assertEquals([1, 2], builder.getBindings());
})

test('FullSubSelects', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', '=', 'foo').orWhere('id', '=', function ($q) {
        $q.select(new Raw('max(id)')).from('users').where('email', '=', 'bar');
    });

    expect('select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('WhereExists', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('orders').whereExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').whereNotExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect('select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect('select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereNotExists(function ($q) {
        $q.select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'));
    });
    expect('select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').whereExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').whereNotExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect('select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect('select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').where('id', '=', 1).orWhereNotExists(
        getBuilder().select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect('select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').whereExists(
        (new EloquentBuilder(getBuilder())).select(['*']).from('products').where('products.id', '=', new Raw('"orders"."id"'))
    );
    expect('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")').toBe(builder.toSql());
})

test('BasicJoins', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', 'users.id', 'contacts.id');
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', 'users.id', '=', 'contacts.id').leftJoin('photos', 'users.id', '=', 'photos.id');
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" left join "photos" on "users"."id" = "photos"."id"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').leftJoinWhere('photos', 'users.id', '=', 'bar').joinWhere('photos', 'users.id', '=', 'foo');
    expect('select * from "users" left join "photos" on "users"."id" = ? inner join "photos" on "users"."id" = ?').toBe(builder.toSql());
    $this.assertEquals(['bar', 'foo'], builder.getBindings());
})

test('CrossJoins', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('sizes').crossJoin('colors');
    expect('select * from "sizes" cross join "colors"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('tableB').join('tableA', 'tableA.column1', '=', 'tableB.column2', 'cross');
    expect('select * from "tableB" cross join "tableA" on "tableA"."column1" = "tableB"."column2"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('tableB').crossJoin('tableA', 'tableA.column1', '=', 'tableB.column2');
    expect('select * from "tableB" cross join "tableA" on "tableA"."column1" = "tableB"."column2"').toBe(builder.toSql());
})

test('CrossJoinSubs', () =>
{
    const builder = getBuilder();
    builder.selectRaw('(sale / overall.sales) * 100 AS percent_of_total').from('sales').crossJoinSub(getBuilder().selectRaw('SUM(sale) AS sales').from('sales'), 'overall');
    expect('select (sale / overall.sales) * 100 AS percent_of_total from "sales" cross join (select SUM(sale) AS sales from "sales") as "overall"').toBe(builder.toSql());
})

test('ComplexJoin', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orOn('users.name', '=', 'contacts.name');
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "users"."name" = "contacts"."name"').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.where('users.id', '=', 'foo').orWhere('users.name', '=', 'bar');
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = ? or "users"."name" = ?').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar'], builder.getBindings());

    // Run the assertions again
    expect('select * from "users" inner join "contacts" on "users"."id" = ? or "users"."name" = ?').toBe(builder.toSql());
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('JoinWhereNull', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereNull('contacts.deleted_at');
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."deleted_at" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereNull('contacts.deleted_at');
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."deleted_at" is null').toBe(builder.toSql());
})

test('JoinWhereNotNull', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereNotNull('contacts.deleted_at');
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."deleted_at" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereNotNull('contacts.deleted_at');
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."deleted_at" is not null').toBe(builder.toSql());
})

test('JoinWhereIn', () =>
{
    let builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereIn('contacts.name', [48, 'baz', null]);
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([48, 'baz', null], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereIn('contacts.name', [48, 'baz', null]);
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([48, 'baz', null], builder.getBindings());
})

test('JoinWhereInSubquery', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $q = getBuilder();
        $q.select('name').from('contacts').where('name', 'baz');
        $j.on('users.id', '=', 'contacts.id').whereIn('contacts.name', $q);
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" in (select "name" from "contacts" where "name" = ?)').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $q = getBuilder();
        $q.select('name').from('contacts').where('name', 'baz');
        $j.on('users.id', '=', 'contacts.id').orWhereIn('contacts.name', $q);
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" in (select "name" from "contacts" where "name" = ?)').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());
})

test('JoinWhereNotIn', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').whereNotIn('contacts.name', [48, 'baz', null]);
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" not in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([48, 'baz', null], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').join('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').orWhereNotIn('contacts.name', [48, 'baz', null]);
    });
    expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" not in (?, ?, ?)').toBe(builder.toSql());
    $this.assertEquals([48, 'baz', null], builder.getBindings());
})

test('JoinsWithNestedConditions', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', '=', 'contacts.id').where(function ($j) {
            $j.where('contacts.country', '=', 'US').orWhere('contacts.is_partner', '=', 1);
        });
    });
    expect('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and ("contacts"."country" = ? or "contacts"."is_partner" = ?)').toBe(builder.toSql());
    $this.assertEquals(['US', 1], builder.getBindings());

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
    expect('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and "contacts"."is_active" = ? or (("contacts"."country" = ? or "contacts"."type" = "users"."type") and ("contacts"."country" = ? or "contacts"."is_partner" is null))').toBe(builder.toSql());
    $this.assertEquals([1, 'UK', 'US'], builder.getBindings());
})

test('JoinsWithAdvancedConditions', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').where(function ($j) {
            $j.whereRole('admin')
                .orWhereNull('contacts.disabled')
                .orWhereRaw('year(contacts.created_at) = 2016');
        });
    });
    expect('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and ("role" = ? or "contacts"."disabled" is null or year(contacts.created_at) = 2016)').toBe(builder.toSql());
    $this.assertEquals(['admin'], builder.getBindings());
})

test('JoinsWithSubqueryCondition', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').whereIn('contact_type_id', function ($q) {
            $q.select('id').from('contact_types')
                .where('category_id', '1')
                .whereNull('deleted_at');
        });
    });
    expect('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and "contact_type_id" in (select "id" from "contact_types" where "category_id" = ? and "deleted_at" is null)').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());

    builder = getBuilder();
    builder.select(['*']).from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').whereExists(function ($q) {
            $q.selectRaw('1').from('contact_types')
                .whereRaw('contact_types.id = contacts.contact_type_id')
                .where('category_id', '1')
                .whereNull('deleted_at');
        });
    });
    expect('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and exists (select 1 from "contact_types" where contact_types.id = contacts.contact_type_id and "category_id" = ? and "deleted_at" is null)').toBe(builder.toSql());
    $this.assertEquals(['1'], builder.getBindings());
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
                    $q.select('id').from('levels')
                        .where('is_active', true);
                });
        });
    });
    expect('select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and exists (select 1 from "contact_types" where contact_types.id = contacts.contact_type_id and "category_id" = ? and "deleted_at" is null and "level_id" in (select "id" from "levels" where "is_active" = ?))').toBe(builder.toSql());
    $this.assertEquals(['1', true], builder.getBindings());
})

test('JoinsWithNestedJoins', () =>
{
    const builder = getBuilder();
    builder.select('users.id', 'contacts.id', 'contact_types.id').from('users').leftJoin('contacts', function ($j) {
        $j.on('users.id', 'contacts.id').join('contact_types', 'contacts.contact_type_id', '=', 'contact_types.id');
    });
    expect('select "users"."id", "contacts"."id", "contact_types"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id") on "users"."id" = "contacts"."id"').toBe(builder.toSql());
})

test('JoinsWithMultipleNestedJoins', () =>
{
    const builder = getBuilder();
    builder.select('users.id', 'contacts.id', 'contact_types.id', 'countrys.id', 'planets.id').from('users').leftJoin('contacts', function ($j) {
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
    expect('select "users"."id", "contacts"."id", "contact_types"."id", "countrys"."id", "planets"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id" left join ("countrys" inner join "planets" on "countrys"."planet_id" = "planet"."id" and "planet"."is_settled" = ? and "planet"."population" >= ?) on "contacts"."country" = "countrys"."country") on "users"."id" = "contacts"."id"').toBe(builder.toSql());
    $this.assertEquals(['1', 10000], builder.getBindings());
})

test('JoinsWithNestedJoinWithAdvancedSubqueryCondition', () =>
{
    const builder = getBuilder();
    builder.select('users.id', 'contacts.id', 'contact_types.id').from('users').leftJoin('contacts', function ($j) {
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
    expect('select "users"."id", "contacts"."id", "contact_types"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id") on "users"."id" = "contacts"."id" and exists (select * from "countrys" inner join "planets" on "countrys"."planet_id" = "planet"."id" and "planet"."is_settled" = ? where "contacts"."country" = "countrys"."country" and "planet"."population" >= ?)').toBe(builder.toSql());
    $this.assertEquals(['1', 10000], builder.getBindings());
})

test('JoinWithNestedOnCondition', () =>
{
    const builder = getBuilder();
    builder.select('users.id').from('users').join('contacts', function (j: JoinClause) {
        return j
            .on('users.id', 'contacts.id')
            .addNestedWhereQuery(getBuilder().where('contacts.id', 1));
    });
    expect('select "users"."id" from "users" inner join "contacts" on "users"."id" = "contacts"."id" and ("contacts"."id" = ?)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('JoinSub', () =>
{
    const builder = getBuilder();
    builder.from('users').joinSub('select * from "contacts"', 'sub', 'users.id', '=', 'sub.id');
    expect('select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"').toBe(builder.toSql());

    builder = getBuilder();
    builder.from('users').joinSub(function ($q) {
        $q.from('contacts');
    }, 'sub', 'users.id', '=', 'sub.id');
    expect('select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"').toBe(builder.toSql());

    builder = getBuilder();
    $eloquentBuilder = new EloquentBuilder(getBuilder().from('contacts'));
    builder.from('users').joinSub($eloquentBuilder, 'sub', 'users.id', '=', 'sub.id');
    expect('select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"').toBe(builder.toSql());

    builder = getBuilder();
    $sub1 = getBuilder().from('contacts').where('name', 'foo');
    $sub2 = getBuilder().from('contacts').where('name', 'bar');
    builder.from('users')
        .joinSub($sub1, 'sub1', 'users.id', '=', 1, 'inner', true)
        .joinSub($sub2, 'sub2', 'users.id', '=', 'sub2.user_id');
    $expected = 'select * from "users" ';
    $expected += 'inner join (select * from "contacts" where "name" = ?) as "sub1" on "users"."id" = ? ';
    $expected += 'inner join (select * from "contacts" where "name" = ?) as "sub2" on "users"."id" = "sub2"."user_id"';
    $this.assertEquals($expected).toBe(builder.toSql());
    $this.assertEquals(['foo', 1, 'bar'], builder.getRawBindings()['join']);

    //$this.expectException(InvalidArgumentException::class);
    builder = getBuilder();
    builder.from('users').joinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
})

test('JoinSubWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.from('users').joinSub('select * from "contacts"', 'sub', 'users.id', '=', 'sub.id');
    expect('select * from "prefix_users" inner join (select * from "contacts") as "prefix_sub" on "prefix_users"."id" = "prefix_sub"."id"').toBe(builder.toSql());
})

test('LeftJoinSub', () =>
{
    const builder = getBuilder();
    builder.from('users').leftJoinSub(getBuilder().from('contacts'), 'sub', 'users.id', '=', 'sub.id');
    expect('select * from "users" left join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"').toBe(builder.toSql());

    //$this.expectException(InvalidArgumentException::class);
    builder = getBuilder();
    builder.from('users').leftJoinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
})

test('RightJoinSub', () =>
{
    const builder = getBuilder();
    builder.from('users').rightJoinSub(getBuilder().from('contacts'), 'sub', 'users.id', '=', 'sub.id');
    expect('select * from "users" right join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"').toBe(builder.toSql());

    //$this.expectException(InvalidArgumentException::class);
    builder = getBuilder();
    builder.from('users').rightJoinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
})

test('RawExpressionsInSelect', () =>
{
    const builder = getBuilder();
    builder.select(new Raw('substr(foo, 6)')).from('users');
    expect('select substr(foo, 6) from "users"').toBe(builder.toSql());
})

test('FindReturnsFirstResultByID', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select * from "users" where "id" = ? limit 1', [1], true).andReturn([{'foo': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').find(1);
    $this.assertEquals({'foo': 'bar'}, $results);
})

test('FindOrReturnsFirstResultByID', () =>
{
    builder = $this.getMockQueryBuilder();
    //$data = m::mock(stdClass::class);
    builder.shouldReceive('first').andReturn($data).once();
    builder.shouldReceive('first').with(['column']).andReturn($data).once();
    builder.shouldReceive('first').andReturn(null).once();

    expect($data, builder.findOr(1, () => 'callback result'));
    expect($data, builder.findOr(1, ['column'], () => 'callback result'));
    expect('callback result', builder.findOr(1, () => 'callback result'));
})

test('FirstMethodReturnsFirstResult', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select * from "users" where "id" = ? limit 1', [1], true).andReturn([{'foo': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).first();
    $this.assertEquals({'foo': 'bar'}, $results);
})

test('PluckMethodGetsCollectionOfColumnValues', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'foo': 'bar'}, {'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}, {'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).pluck('foo');
    $this.assertEquals(['bar', 'baz'], $results.all());

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'id': 1, 'foo': 'bar'}, {'id': 10, 'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'id': 1, 'foo': 'bar'}, {'id': 10, 'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).pluck('foo', 'id');
    $this.assertEquals(['bar', 'baz'], $results.all());
})

test('Implode', () =>
{
    // Test without glue.
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'foo': 'bar'}, {'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}, {'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).implode('foo');
    expect('barbaz', $results);

    // Test with glue.
    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().andReturn([{'foo': 'bar'}, {'foo': 'baz'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}, {'foo': 'baz'}]).andReturnUsing(function ($query, $results) {
        return $results;
    });
    $results = builder.from('users').where('id', '=', 1).implode('foo', ',');
    expect('bar,baz', $results);
})

test('ValueMethodReturnsSingleColumn', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select "foo" from "users" where "id" = ? limit 1', [1], true).andReturn([{'foo': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'foo': 'bar'}]).andReturn([{'foo': 'bar'}]);
    $results = builder.from('users').where('id', '=', 1).value('foo');
    expect('bar', $results);
})

test('RawValueMethodReturnsSingleColumn', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select UPPER("foo") from "users" where "id" = ? limit 1', [1], true).andReturn([{'UPPER("foo")': 'BAR'}]);
    builder.getProcessor().shouldReceive('processSelect').once().with(builder, [{'UPPER("foo")': 'BAR'}]).andReturn([{'UPPER("foo")': 'BAR'}]);
    $results = builder.from('users').where('id', '=', 1).rawValue('UPPER("foo")');
    expect('BAR', $results);
})

test('AggregateFunctions', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').count();
    $this.assertEquals(1, $results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select exists(select * from "users") as "exists"', [], true).andReturn([{'exists': 1}]);
    $results = builder.from('users').exists();
    $this.assertTrue($results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select exists(select * from "users") as "exists"', [], true).andReturn([{'exists': 0}]);
    $results = builder.from('users').doesntExist();
    $this.assertTrue($results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select max("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').max('id');
    $this.assertEquals(1, $results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select min("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').min('id');
    $this.assertEquals(1, $results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select sum("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').sum('id');
    $this.assertEquals(1, $results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select avg("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').avg('id');
    $this.assertEquals(1, $results);

    builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select avg("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    $results = builder.from('users').average('id');
    $this.assertEquals(1, $results);
})

test('SqlServerExists', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('select').once().with('select top 1 1 [exists] from [users]', [], true).andReturn([{'exists': 1}]);
    $results = builder.from('users').exists();
    $this.assertTrue($results);
})

test('ExistsOr', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 1}]);
    $results = builder.from('users').doesntExistOr(function () {
        return 123;
    });
    expect(123, $results);
    builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 0}]);
    $results = builder.from('users').doesntExistOr(function () {
        throw new RuntimeException;
    });
    $this.assertTrue($results);
})

test('DoesntExistsOr', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 0}]);
    $results = builder.from('users').existsOr(function () {
        return 123;
    });
    expect(123, $results);
    builder = getBuilder();
    builder.getConnection().shouldReceive('select').andReturn([{'exists': 1}]);
    $results = builder.from('users').existsOr(function () {
        throw new RuntimeException;
    });
    $this.assertTrue($results);
})

test('AggregateResetFollowedByGet', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getConnection().shouldReceive('select').once().with('select sum("id") as aggregate from "users"', [], true).andReturn([{'aggregate': 2}]);
    builder.getConnection().shouldReceive('select').once().with('select "column1", "column2" from "users"', [], true).andReturn([{'column1': 'foo', 'column2': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users').select('column1', 'column2');
    $count = builder.count();
    $this.assertEquals(1, $count);
    $sum = builder.sum('id');
    $this.assertEquals(2, $sum);
    $result = builder.get();
    $this.assertEquals([{ 'column1': 'foo', 'column2': 'bar' }], $result.all());
})

test('AggregateResetFollowedBySelectGet', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count("column1") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getConnection().shouldReceive('select').once().with('select "column2", "column3" from "users"', [], true).andReturn([{'column2': 'foo', 'column3': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users');
    $count = builder.count('column1');
    $this.assertEquals(1, $count);
    $result = builder.select('column2', 'column3').get();
    $this.assertEquals([{'column2': 'foo', 'column3': 'bar'}], $result.all());
})

test('AggregateResetFollowedByGetWithColumns', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count("column1") as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getConnection().shouldReceive('select').once().with('select "column2", "column3" from "users"', [], true).andReturn([{'column2': 'foo', 'column3': 'bar'}]);
    builder.getProcessor().shouldReceive('processSelect').andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users');
    $count = builder.count('column1');
    $this.assertEquals(1, $count);
    $result = builder.get(['column2', 'column3']);
    $this.assertEquals([{'column2': 'foo', 'column3': 'bar'}], $result.all());
})

test('AggregateWithSubSelect', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select count(*) as aggregate from "users"', [], true).andReturn([{'aggregate': 1}]);
    builder.getProcessor().shouldReceive('processSelect').once().andReturnUsing(function (builder, $results) {
        return $results;
    });
    builder.from('users').selectSub(function ($query) {
        $query.from('posts').select('foo', 'bar').where('title', 'foo');
    }, 'post');
    $count = builder.count();
    $this.assertEquals(1, $count);
    expect('(select "foo", "bar" from "posts" where "title" = ?) as "post"', builder.getGrammar().getValue(builder.columns[0]));
    $this.assertEquals(['foo'], builder.getBindings());
})

test('SubqueriesBindings', () =>
{
    const builder = getBuilder();
    $second = getBuilder().select(['*']).from('users').orderByRaw('id = ?', 2);
    $third = getBuilder().select(['*']).from('users').where('id', 3).groupBy('id').having('id', '!=', 4);
    builder.groupBy('a').having('a', '=', 1).union($second).union($third);
    $this.assertEquals([1, 2, 3, 4], builder.getBindings());

    builder = getBuilder().select(['*']).from('users').where('email', '=', function ($q) {
        $q.select(new Raw('max(id)'))
          .from('users').where('email', '=', 'bar')
          .orderByRaw('email like ?', '%.com')
          .groupBy('id').having('id', '=', 4);
    }).orWhere('id', '=', 'foo').groupBy('id').having('id', '=', 5);
    $this.assertEquals(['bar', 4, '%.com', 'foo', 5], builder.getBindings());
})

test('InsertMethod', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (?)', ['foo']).andReturn(true);
    $result = builder.from('users').insert({'email': 'foo'});
    $this.assertTrue($result);
})

test('InsertUsingMethod', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "table1" ("foo") select "bar" from "table2" where "foreign_id" = ?', [5]).andReturn(1);

    $result = builder.from('table1').insertUsing(
        ['foo'],
        function ($query: Builder) {
            $query.select(['bar']).from('table2').where('foreign_id', '=', 5);
        }
    );

    $this.assertEquals(1, $result);
})

test('InsertUsingWithEmptyColumns', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "table1" select * from "table2" where "foreign_id" = ?', [5]).andReturn(1);

    $result = builder.from('table1').insertUsing(
        [],
        function ($query: Builder) {
            $query.from('table2').where('foreign_id', '=', 5);
        }
    );

    $this.assertEquals(1, $result);
})

test('InsertUsingInvalidSubquery', () =>
{
    //$this.expectException(InvalidArgumentException::class);
    const builder = getBuilder();
    builder.from('table1').insertUsing(['foo'], ['bar']);
})

test('InsertOrIgnoreMethod', () =>
{
    //$this.expectException(RuntimeException::class);
    //$this.expectExceptionMessage('does not support');
    const builder = getBuilder();
    builder.from('users').insertOrIgnore({'email': 'foo'});
})

test('MySqlInsertOrIgnoreMethod', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert ignore into `users` (`email`) values (?)', ['foo']).andReturn(1);
    $result = builder.from('users').insertOrIgnore({'email': 'foo'});
    $this.assertEquals(1, $result);
})

test('PostgresInsertOrIgnoreMethod', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email") values (?) on conflict do nothing', ['foo']).andReturn(1);
    $result = builder.from('users').insertOrIgnore({'email': 'foo'});
    $this.assertEquals(1, $result);
})

test('SQLiteInsertOrIgnoreMethod', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert or ignore into "users" ("email") values (?)', ['foo']).andReturn(1);
    $result = builder.from('users').insertOrIgnore({'email': 'foo'});
    $this.assertEquals(1, $result);
})

test('SqlServerInsertOrIgnoreMethod', () =>
{
    //$this.expectException(RuntimeException::class);
    //$this.expectExceptionMessage('does not support');
    const builder = $this.getSqlServerBuilder();
    builder.from('users').insertOrIgnore({'email': 'foo'});
})

test('InsertGetIdMethod', () =>
{
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email") values (?)', ['foo'], 'id').andReturn(1);
    $result = builder.from('users').insertGetId({'email': 'foo'}, 'id');
    $this.assertEquals(1, $result);
})

test('InsertGetIdMethodRemovesExpressions', () =>
{
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email", "bar") values (?, bar)', ['foo'], 'id').andReturn(1);
    $result = builder.from('users').insertGetId({'email': 'foo', 'bar': new Raw('bar')}, 'id');
    $this.assertEquals(1, $result);
})

test('InsertGetIdWithEmptyValues', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into `users` () values ()', [], null);
    builder.from('users').insertGetId([]);

    builder = $this.getPostgresBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" default values returning "id"', [], null);
    builder.from('users').insertGetId([]);

    builder = $this.getSQLiteBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" default values', [], null);
    builder.from('users').insertGetId([]);

    builder = $this.getSqlServerBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into [users] default values', [], null);
    builder.from('users').insertGetId([]);
})

test('InsertMethodRespectsRawBindings', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (CURRENT TIMESTAMP)', []).andReturn(true);
    $result = builder.from('users').insert({'email': new Raw('CURRENT TIMESTAMP')});
    $this.assertTrue($result);
})

test('MultipleInsertsWithExpressionValues', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (UPPER(\'Foo\')), (LOWER(\'Foo\'))', []).andReturn(true);
    $result = builder.from('users').insert([{'email': new Raw("UPPER('Foo')")}, {'email': new Raw("LOWER('Foo')")}]);
    $this.assertTrue($result);
})

test('UpdateMethod', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` set `email` = ?, `name` = ? where `id` = ? order by `foo` desc limit 5', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).orderBy('foo', 'desc').limit(5).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpsertMethod', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(false)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) on duplicate key update `email` = values(`email`), `name` = values(`name`)', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    $this.assertEquals(2, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(true)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) as laravel_upsert_alias on duplicate key update `email` = `laravel_upsert_alias`.`email`, `name` = `laravel_upsert_alias`.`name`', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    $this.assertEquals(2, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "email" = "excluded"."email", "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    $this.assertEquals(2, $result);

    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "email" = "excluded"."email", "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    $this.assertEquals(2, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [email] = [laravel_source].[email], [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name]);', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email');
    $this.assertEquals(2, $result);
})

test('UpsertMethodWithUpdateColumns', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(false)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) on duplicate key update `name` = values(`name`)', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    $this.assertEquals(2, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(true)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`, `name`) values (?, ?), (?, ?) as laravel_upsert_alias on duplicate key update `name` = `laravel_upsert_alias`.`name`', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    $this.assertEquals(2, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    $this.assertEquals(2, $result);

    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name"', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    $this.assertEquals(2, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name]);', ['foo', 'bar', 'foo2', 'bar2']).andReturn(2);
    $result = builder.from('users').upsert([{'email': 'foo', 'name': 'bar'}, {'name': 'bar2', 'email': 'foo2'}], 'email', ['name']);
    $this.assertEquals(2, $result);
})

test('UpdateMethodWithJoins', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" inner join "orders" on "users"."id" = "orders"."user_id" set "email" = ?, "name" = ? where "users"."id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ? set "email" = ?, "name" = ?', [1, 'foo', 'bar']).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodWithJoinsOnSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('update').once().with('update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] where [users].[id] = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('update').once().with('update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] and [users].[id] = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodWithJoinsOnMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` set `email` = ?, `name` = ? where `users`.`id` = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` and `users`.`id` = ? set `email` = ?, `name` = ?', [1, 'foo', 'bar']).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodWithJoinsOnSQLite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" where "users"."id" > ? order by "id" asc limit 3)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('users.id', '>', 1).limit(3).oldest('id').update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" where "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" as "u" set "email" = ?, "name" = ? where "rowid" in (select "u"."rowid" from "users" as "u" inner join "orders" as "o" on "u"."id" = "o"."user_id")', ['foo', 'bar']).andReturn(1);
    $result = builder.from('users as u').join('orders as o', 'u.id', '=', 'o.user_id').update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodWithJoinsAndAliasesOnSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('update').once().with('update [u] set [email] = ?, [name] = ? from [users] as [u] inner join [orders] on [u].[id] = [orders].[user_id] where [u].[id] = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users as u').join('orders', 'u.id', '=', 'orders.user_id').where('u.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodWithoutJoinsOnPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).update({'users.email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).selectRaw('?', ['ignore']).update({'users.email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users"."users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users.users').where('id', '=', 1).selectRaw('?', ['ignore']).update({'users.users.email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodWithJoinsOnPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" where "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ?)', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ? where "name" = ?)', ['foo', 'bar', 1, 'baz']).andReturn(1);
    $result = builder.from('users')
        .join('orders', function ($join) {
            $join.on('users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1);
        }).where('name', 'baz')
        .update({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateFromMethodWithJoinsOnPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = ? and "users"."id" = "orders"."user_id"', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).updateFrom({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = "orders"."user_id" and "users"."id" = ?', ['foo', 'bar', 1]).andReturn(1);
    $result = builder.from('users').join('orders', function ($join) {
        $join.on('users.id', '=', 'orders.user_id')
            .where('users.id', '=', 1);
    }).updateFrom({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ?, "name" = ? from "orders" where "name" = ? and "users"."id" = "orders"."user_id" and "users"."id" = ?', ['foo', 'bar', 'baz', 1]).andReturn(1);
    $result = builder.from('users')
        .join('orders', function ($join) {
            $join.on('users.id', '=', 'orders.user_id')
               .where('users.id', '=', 1);
        }).where('name', 'baz')
       .updateFrom({'email': 'foo', 'name': 'bar'});
    $this.assertEquals(1, $result);
})

test('UpdateMethodRespectsRaw', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = foo, "name" = ? where "id" = ?', ['bar', 1]).andReturn(1);
    $result = builder.from('users').where('id', '=', 1).update({ 'email': new Raw('foo'), 'name': 'bar' });
    $this.assertEquals(1, $result);
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

test('DeleteMethod', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "email" = ?', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').delete();
    $this.assertEquals(1, $result);

    builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "users"."id" = ?', [1]).andReturn(1);
    $result = builder.from('users').delete(1);
    $this.assertEquals(1, $result);

    builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "users"."id" = ?', [1]).andReturn(1);
    $result = builder.from('users').selectRaw('?', ['ignore']).delete(1);
    $this.assertEquals(1, $result);

    builder = $this.getSqliteBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "rowid" in (select "users"."rowid" from "users" where "email" = ? order by "id" asc limit 1)', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from `users` where `email` = ? order by `id` asc limit 1', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from [users] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').delete();
    $this.assertEquals(1, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete top (1) from [users] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete();
    $this.assertEquals(1, $result);
})

test('DeleteWithJoinMethod', () =>
{
    const builder = $this.getSqliteBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "rowid" in (select "users"."rowid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."email" = ? order by "users"."id" asc limit 1)', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('users.email', '=', 'foo').orderBy('users.id').limit(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getSqliteBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" as "u" where "rowid" in (select "u"."rowid" from "users" as "u" inner join "contacts" as "c" on "u"."id" = "c"."id")', []).andReturn(1);
    $result = builder.from('users as u').join('contacts as c', 'u.id', '=', 'c.id').delete();
    $this.assertEquals(1, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete `users` from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` where `email` = ?', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete `a` from `users` as `a` inner join `users` as `b` on `a`.`id` = `b`.`user_id` where `email` = ?', ['foo']).andReturn(1);
    $result = builder.from('users AS a').join('users AS b', 'a.id', '=', 'b.user_id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete `users` from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` where `users`.`id` = ?', [1]).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').orderBy('id').take(1).delete(1);
    $this.assertEquals(1, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete [users] from [users] inner join [contacts] on [users].[id] = [contacts].[id] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('email', '=', 'foo').delete();
    $this.assertEquals(1, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete [a] from [users] as [a] inner join [users] as [b] on [a].[id] = [b].[user_id] where [email] = ?', ['foo']).andReturn(1);
    $result = builder.from('users AS a').join('users AS b', 'a.id', '=', 'b.user_id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getSqlServerBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete [users] from [users] inner join [contacts] on [users].[id] = [contacts].[id] where [users].[id] = ?', [1]).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').delete(1);
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."email" = ?)', ['foo']).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').where('users.email', '=', 'foo').delete();
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" as "a" where "ctid" in (select "a"."ctid" from "users" as "a" inner join "users" as "b" on "a"."id" = "b"."user_id" where "email" = ? order by "id" asc limit 1)', ['foo']).andReturn(1);
    $result = builder.from('users AS a').join('users AS b', 'a.id', '=', 'b.user_id').where('email', '=', 'foo').orderBy('id').limit(1).delete();
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."id" = ? order by "id" asc limit 1)', [1]).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').orderBy('id').take(1).delete(1);
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."user_id" and "users"."id" = ? where "name" = ?)', [1, 'baz']).andReturn(1);
    $result = builder.from('users')
        .join('contacts', function ($join) {
            $join.on('users.id', '=', 'contacts.user_id')
                .where('users.id', '=', 1);
        }).where('name', 'baz')
        .delete();
    $this.assertEquals(1, $result);

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id")', []).andReturn(1);
    $result = builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').delete();
    $this.assertEquals(1, $result);
})

test('TruncateMethod', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('statement').once().with('truncate table "users"', []);
    builder.from('users').truncate();

    $sqlite = new SQLiteGrammar;
    builder = getBuilder();
    builder.from('users');
    $this.assertEquals({
        'delete from sqlite_sequence where name = ?': ['users'],
        'delete from "users"': [],
    }, $sqlite.compileTruncate(builder));
})

test('PreserveAddsClosureToArray', () =>
{
    const builder = getBuilder();
    builder.beforeQuery(function () {
    });
    $this.assertCount(1, builder.beforeQueryCallbacks);
    //$this.assertInstanceOf(Closure::class, builder.beforeQueryCallbacks[0]);
})

test('ApplyPreserveCleansArray', () =>
{
    const builder = getBuilder();
    builder.beforeQuery(function () {
    });
    $this.assertCount(1, builder.beforeQueryCallbacks);
    builder.applyBeforeQueryCallbacks();
    $this.assertCount(0, builder.beforeQueryCallbacks);
})

test('PreservedAreAppliedByToSql', () =>
{
    const builder = getBuilder();
    builder.beforeQuery(function (builder) {
        builder.where('foo', 'bar');
    });
    expect('select * where "foo" = ?').toBe(builder.toSql());
    $this.assertEquals(['bar'], builder.getBindings());
})

test('PreservedAreAppliedByInsert', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('insert').once().with('insert into "users" ("email") values (?)', ['foo']);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.insert({'email': 'foo'});
})

test('PreservedAreAppliedByInsertGetId', () =>
{
    $this.called = false;
    const builder = getBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email") values (?)', ['foo'], 'id');
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.insertGetId({'email': 'foo'}, 'id');
})

test('PreservedAreAppliedByInsertUsing', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('affectingStatement').once().with('insert into "users" ("email") select *', []);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.insertUsing(['email'], getBuilder());
})

test('PreservedAreAppliedByUpsert', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(false)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`) values (?) on duplicate key update `email` = values(`email`)', ['foo']);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.upsert({'email': 'foo'}, 'id');

    builder = $this.getMysqlBuilder();
    builder.getConnection()
        .shouldReceive('getConfig').with('use_upsert_alias').andReturn(true)
        .shouldReceive('affectingStatement').once().with('insert into `users` (`email`) values (?) as laravel_upsert_alias on duplicate key update `email` = `laravel_upsert_alias`.`email`', ['foo']);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.upsert({'email': 'foo'}, 'id');
})

test('PreservedAreAppliedByUpdate', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('update').once().with('update "users" set "email" = ? where "id" = ?', ['foo', 1]);
    builder.from('users').beforeQuery(function (builder) {
        builder.where('id', 1);
    });
    builder.update({'email': 'foo'});
})

test('PreservedAreAppliedByDelete', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('delete').once().with('delete from "users"', []);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.delete();
})

test('PreservedAreAppliedByTruncate', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('statement').once().with('truncate table "users"', []);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.truncate();
})

test('PreservedAreAppliedByExists', () =>
{
    const builder = getBuilder();
    builder.getConnection().shouldReceive('select').once().with('select exists(select * from "users") as "exists"', [], true);
    builder.beforeQuery(function (builder) {
        builder.from('users');
    });
    builder.exists();
})

test('PostgresInsertGetId', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getProcessor().shouldReceive('processInsertGetId').once().with(builder, 'insert into "users" ("email") values (?) returning "id"', ['foo'], 'id').andReturn(1);
    $result = builder.from('users').insertGetId({'email': 'foo'}, 'id');
    $this.assertEquals(1, $result);
})

test('MySqlWrapping', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users');
    expect('select * from `users`').toBe(builder.toSql());
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

    const builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` set `options` = json_set(`options`, \'$."size"\', ?)', [null]);
    builder.from('users').update(['options.size': null]);

    const builder = $this.getMysqlBuilder();
    builder.getConnection().shouldReceive('update').once().with('update `users` set `options` = json_set(`options`, \'$."size"\', 45)', []);
    builder.from('users').update(['options.size': new Raw('45')]);
    */
})

test('PostgresUpdateWrappingJson', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = jsonb_set("options"::jsonb, \'{"name","first_name"}\', ?)', ['"John"']);
    builder.from('users').update({'users.options.name.first_name': 'John'});

    builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = jsonb_set("options"::jsonb, \'{"language"}\', \'null\')', []);
    builder.from('users').update({'options.language': new Raw("'null'")});
})

test('PostgresUpdateWrappingJsonArray', () =>
{
    const builder = $this.getPostgresBuilder();
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
})

test('PostgresUpdateWrappingJsonPathArrayIndex', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = jsonb_set("options"::jsonb, \'{1,"2fa"}\', ?), "meta" = jsonb_set("meta"::jsonb, \'{"tags",0,2}\', ?) where ("options".1.\'2fa\')::jsonb = \'true\'::jsonb', [
            'false',
            '"large"',
        ]);

    builder.from('users').where('options.[1].2fa', true).update({
        'options.[1].2fa': false,
        'meta.tags[0][2]': 'large',
    });
})

test('SQLiteUpdateWrappingJsonArray', () =>
{
    builder = $this.getSQLiteBuilder();

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
})

test('SQLiteUpdateWrappingNestedJsonArray', () =>
{
    builder = $this.getSQLiteBuilder();
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
})

test('SQLiteUpdateWrappingJsonPathArrayIndex', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.getConnection().shouldReceive('update')
        .with('update "users" set "options" = json_patch(ifnull("options", json(\'{}\')), json(?)), "meta" = json_patch(ifnull("meta", json(\'{}\')), json(?)) where json_extract("options", \'$[1]."2fa"\') = true', [
            '{"[1]":{"2fa":false}}',
            '{"tags[0][2]":"large"}',
        ]);

    builder.from('users').where('options.[1].2fa', true).update({
        'options.[1].2fa': false,
        'meta.tags[0][2]': 'large',
    });
})

test('MySqlWrappingJsonWithString', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.sku', '=', 'foo-bar');
    expect('select * from `users` where json_unquote(json_extract(`items`, \'$."sku"\')) = ?').toBe(builder.toSql());
    $this.assertCount(1, builder.getRawBindings()['where']);
    expect('foo-bar', builder.getRawBindings()['where'][0]);
})

test('MySqlWrappingJsonWithInteger', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.price', '=', 1);
    expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?').toBe(builder.toSql());
})

test('MySqlWrappingJsonWithDouble', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.price', '=', 1.5);
    expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?').toBe(builder.toSql());
})

test('MySqlWrappingJsonWithBoolean', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.available', '=', true);
    expect('select * from `users` where json_extract(`items`, \'$."available"\') = true').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where(new Raw("items.'$.available'"), '=', true);
    expect("select * from `users` where items.'$.available' = true").toBe(builder.toSql());
})

test('MySqlWrappingJsonWithBooleanAndIntegerThatLooksLikeOne', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.available', '=', true).where('items.active', '=', false).where('items.number_available', '=', 0);
    expect('select * from `users` where json_extract(`items`, \'$."available"\') = true and json_extract(`items`, \'$."active"\') = false and json_unquote(json_extract(`items`, \'$."number_available"\')) = ?').toBe(builder.toSql());
})

test('JsonPathEscaping', () =>
{
    $expectedWithJsonEscaped = `select json_unquote(json_extract(\`json\`, '$."''))#"'))`;

    const builder = $this.getMysqlBuilder();
    builder.select("json.'))#");
    $this.assertEquals($expectedWithJsonEscaped).toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select("json.\'))#");
    $this.assertEquals($expectedWithJsonEscaped).toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select("json.\\'))#");
    $this.assertEquals($expectedWithJsonEscaped).toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select("json.\\\'))#");
    $this.assertEquals($expectedWithJsonEscaped).toBe(builder.toSql());
})

test('MySqlWrappingJson', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereRaw('items.\'$."price"\' = 1');
    expect('select * from `users` where items.\'$."price"\' = 1').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select('items.price').from('users').where('users.items.price', '=', 1).orderBy('items.price');
    expect('select json_unquote(json_extract(`items`, \'$."price"\')) from `users` where json_unquote(json_extract(`users`.`items`, \'$."price"\')) = ? order by json_unquote(json_extract(`items`, \'$."price"\')) asc').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1);
    expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ?').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1).where('items.age', '=', 2);
    expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ? and json_unquote(json_extract(`items`, \'$."age"\')) = ?').toBe(builder.toSql());
})

test('PostgresWrappingJson', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select('items.price').from('users').where('users.items.price', '=', 1).orderBy('items.price');
    expect('select "items".>\'price\' from "users" where "users"."items".>\'price\' = ? order by "items".>\'price\' asc').toBe(builder.toSql());

    
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1);
    expect('select * from "users" where "items".\'price\'.>\'in_usd\' = ?').toBe(builder.toSql());

    
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1).where('items.age', '=', 2);
    expect('select * from "users" where "items".\'price\'.>\'in_usd\' = ? and "items".>\'age\' = ?').toBe(builder.toSql());

    
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('items.prices.0', '=', 1).where('items.age', '=', 2);
    expect('select * from "users" where "items".\'prices\'.>0 = ? and "items".>\'age\' = ?').toBe(builder.toSql());

    
    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('items.available', '=', true);
    expect('select * from "users" where ("items".\'available\')::jsonb = \'true\'::jsonb').toBe(builder.toSql());
})

test('SqlServerWrappingJson', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select('items.price').from('users').where('users.items.price', '=', 1).orderBy('items.price');
    expect('select json_value([items], \'$."price"\') from [users] where json_value([users].[items], \'$."price"\') = ? order by json_value([items], \'$."price"\') asc').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1);
    expect('select * from [users] where json_value([items], \'$."price"."in_usd"\') = ?').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1).where('items.age', '=', 2);
    expect('select * from [users] where json_value([items], \'$."price"."in_usd"\') = ? and json_value([items], \'$."age"\') = ?').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('items.available', '=', true);
    expect('select * from [users] where json_value([items], \'$."available"\') = \'true\'').toBe(builder.toSql());
})

test('SqliteWrappingJson', () =>
{
    const builder = $this.getSQLiteBuilder();
    builder.select('items.price').from('users').where('users.items.price', '=', 1).orderBy('items.price');
    expect('select json_extract("items", \'$."price"\') from "users" where json_extract("users"."items", \'$."price"\') = ? order by json_extract("items", \'$."price"\') asc').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1);
    expect('select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ?').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('items.price.in_usd', '=', 1).where('items.age', '=', 2);
    expect('select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ? and json_extract("items", \'$."age"\') = ?').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('items.available', '=', true);
    expect('select * from "users" where json_extract("items", \'$."available"\') = true').toBe(builder.toSql());
})

test('SQLiteOrderBy', () =>
{
    const builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').orderBy('email', 'desc');
    expect('select * from "users" order by "email" desc').toBe(builder.toSql());
})

test('SqlServerLimitsAndOffsets', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').take(10);
    expect('select top 10 * from [users]').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').skip(10).orderBy('email', 'desc');
    expect('select * from [users] order by [email] desc offset 10 rows').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').skip(10).take(10);
    expect('select * from [users] order by (SELECT 0) offset 10 rows fetch next 10 rows only').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').skip(11).take(10).orderBy('email', 'desc');
    expect('select * from [users] order by [email] desc offset 11 rows fetch next 10 rows only').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    $subQuery = function ($query) {
        return $query.select('created_at').from('logins').where('users.name', 'nameBinding').whereColumn('user_id', 'users.id').limit(1);
    };
    builder.select(['*']).from('users').where('email', 'emailBinding').orderBy($subQuery).skip(10).take(10);
    expect('select * from [users] where [email] = ? order by (select top 1 [created_at] from [logins] where [users].[name] = ? and [user_id] = [users].[id]) asc offset 10 rows fetch next 10 rows only').toBe(builder.toSql());
    $this.assertEquals(['emailBinding', 'nameBinding'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').take('foo');
    expect('select * from [users]').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').take('foo').offset('bar');
    expect('select * from [users]').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').offset('bar');
    expect('select * from [users]').toBe(builder.toSql());
})

test('MySqlSoundsLikeOperator', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('name', 'sounds like', 'John Doe');
    expect('select * from `users` where `name` sounds like ?').toBe(builder.toSql());
    $this.assertEquals(['John Doe'], builder.getBindings());
})

test('BitwiseOperators', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('bar', '&', 1);
    expect('select * from "users" where "bar" & ?').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('bar', '#', 1);
    expect('select * from "users" where ("bar" # ?)::bool').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('range', '>>', '[2022-01-08 00:00:00,2022-01-09 00:00:00)');
    expect('select * from "users" where ("range" >> ?)::bool').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('bar', '&', 1);
    expect('select * from [users] where ([bar] & ?) != 0').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').having('bar', '&', 1);
    expect('select * from "users" having "bar" & ?').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').having('bar', '#', 1);
    expect('select * from "users" having ("bar" # ?)::bool').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').having('range', '>>', '[2022-01-08 00:00:00,2022-01-09 00:00:00)');
    expect('select * from "users" having ("range" >> ?)::bool').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').having('bar', '&', 1);
    expect('select * from [users] having ([bar] & ?) != 0').toBe(builder.toSql());
})

test('MergeWheresCanMergeWheresAndBindings', () =>
{
    const builder = getBuilder();
    builder.wheres = ['foo'];
    builder.mergeWheres(['wheres'], ['foo', 'bar']);
    $this.assertEquals(['foo', 'wheres'], builder.wheres);
    $this.assertEquals(['foo', 'bar'], builder.getBindings());
})

test('PrepareValueAndOperator', () =>
{
    const builder = getBuilder();
    [$value, $operator] = builder.prepareValueAndOperator('>', '20');
    expect('>', $value);
    expect('20', $operator);

    builder = getBuilder();
    [$value, $operator] = builder.prepareValueAndOperator('>', '20', true);
    expect('20', $value);
    expect('=', $operator);
})

test('PrepareValueAndOperatorExpectException', () =>
{
    //$this.expectException(InvalidArgumentException::class);
    $this.expectExceptionMessage('Illegal operator and value combination.');

    const builder = getBuilder();
    builder.prepareValueAndOperator(null, 'like');
})

test('ProvidingNullWithOperatorsBuildsCorrectly', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('foo', null);
    expect('select * from "users" where "foo" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').where('foo', '=', null);
    expect('select * from "users" where "foo" is null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').where('foo', '!=', null);
    expect('select * from "users" where "foo" is not null').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('users').where('foo', '<>', null);
    expect('select * from "users" where "foo" is not null').toBe(builder.toSql());
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

test('CallTriggersDynamicWhere', () =>
{
    const builder = getBuilder();

    $this.assertEquals(builder, builder.whereFooAndBar('baz', 'qux'));
    $this.assertCount(2, builder.wheres);
})

test('BuilderThrowsExpectedExceptionWithUndefinedMethod', () =>
{
    //$this.expectException(BadMethodCallException::class);

    const builder = getBuilder();
    builder.getConnection().shouldReceive('select');
    builder.getProcessor().shouldReceive('processSelect').andReturn([]);

    builder.noValidMethodHere();
})

test('MySqlLock', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock();
    expect('select * from `foo` where `bar` = ? for update').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false);
    expect('select * from `foo` where `bar` = ? lock in share mode').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock('lock in share mode');
    expect('select * from `foo` where `bar` = ? lock in share mode').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());
})

test('PostgresLock', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock();
    expect('select * from "foo" where "bar" = ? for update').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false);
    expect('select * from "foo" where "bar" = ? for share').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock('for key share');
    expect('select * from "foo" where "bar" = ? for key share').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());
})

test('SqlServerLock', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock();
    expect('select * from [foo] with(rowlock,updlock,holdlock) where [bar] = ?').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false);
    expect('select * from [foo] with(rowlock,holdlock) where [bar] = ?').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock('with(holdlock)');
    expect('select * from [foo] with(holdlock) where [bar] = ?').toBe(builder.toSql());
    $this.assertEquals(['baz'], builder.getBindings());
})

test('SelectWithLockUsesWritePdo', () =>
{
    /*
    builder = $this.getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with(m::any(), m::any(), false);
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock().get();

    builder = $this.getMySqlBuilderWithProcessor();
    builder.getConnection().shouldReceive('select').once()
        .with(m::any(), m::any(), false);
    builder.select(['*']).from('foo').where('bar', '=', 'baz').lock(false).get();
    */
})

test('BindingOrder', () =>
{
    $expectedSql = 'select * from "users" inner join "othertable" on "bar" = ? where "registered" = ? group by "city" having "population" > ? order by match ("foo") against(?)';
    $expectedBindings = ['foo', 1, 3, 'bar'];

    const builder = getBuilder();
    builder.select(['*']).from('users').join('othertable', function ($join) {
        $join.where('bar', '=', 'foo');
    }).where('registered', 1).groupBy('city').having('population', '>', 3).orderByRaw('match ("foo") against(?)', ['bar']);
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals($expectedBindings, builder.getBindings());

    // order of statements reversed
    builder = getBuilder();
    builder.select(['*']).from('users').orderByRaw('match ("foo") against(?)', ['bar']).having('population', '>', 3).groupBy('city').where('registered', 1).join('othertable', function ($join) {
        $join.where('bar', '=', 'foo');
    });
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals($expectedBindings, builder.getBindings());
})

test('AddBindingWithArrayMergesBindings', () =>
{
    const builder = getBuilder();
    builder.addBinding(['foo', 'bar']);
    builder.addBinding(['baz']);
    $this.assertEquals(['foo', 'bar', 'baz'], builder.getBindings());
})

test('AddBindingWithArrayMergesBindingsInCorrectOrder', () =>
{
    const builder = getBuilder();
    builder.addBinding(['bar', 'baz'], 'having');
    builder.addBinding(['foo'], 'where');
    $this.assertEquals(['foo', 'bar', 'baz'], builder.getBindings());
})

test('MergeBuilders', () =>
{
    const builder = getBuilder();
    builder.addBinding(['foo', 'bar']);
    $otherBuilder = getBuilder();
    $otherBuilder.addBinding(['baz']);
    builder.mergeBindings($otherBuilder);
    $this.assertEquals(['foo', 'bar', 'baz'], builder.getBindings());
})

test('MergeBuildersBindingOrder', () =>
{
    const builder = getBuilder();
    builder.addBinding('foo', 'where');
    builder.addBinding('baz', 'having');
    $otherBuilder = getBuilder();
    $otherBuilder.addBinding('bar', 'where');
    builder.mergeBindings($otherBuilder);
    $this.assertEquals(['foo', 'bar', 'baz'], builder.getBindings());
})

test('SubSelect', () =>
{
    $expectedSql = 'select "foo", "bar", (select "baz" from "two" where "subkey" = ?) as "sub" from "one" where "key" = ?';
    $expectedBindings = ['subval', 'val'];

    const builder = $this.getPostgresBuilder();
    builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
    builder.selectSub(function ($query) {
        $query.from('two').select('baz').where('subkey', '=', 'subval');
    }, 'sub');
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals($expectedBindings, builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
    const $subBuilder = $this.getPostgresBuilder();
    $subBuilder.from('two').select('baz').where('subkey', '=', 'subval');
    builder.selectSub($subBuilder, 'sub');
    $this.assertEquals($expectedSql).toBe(builder.toSql());
    $this.assertEquals($expectedBindings, builder.getBindings());

    //$this.expectException(InvalidArgumentException::class);
    builder = $this.getPostgresBuilder();
    builder.selectSub(['foo'], 'sub');
})

test('SubSelectResetBindings', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.from('one').selectSub(function ($query) {
        $query.from('two').select('baz').where('subkey', '=', 'subval');
    }, 'sub');

    expect('select (select "baz" from "two" where "subkey" = ?) as "sub" from "one"').toBe(builder.toSql());
    $this.assertEquals(['subval'], builder.getBindings());

    builder.select(['*']);

    expect('select * from "one"').toBe(builder.toSql());
    $this.assertEquals([], builder.getBindings());
})

test('SqlServerWhereDate', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereDate('created_at', '=', '2015-09-23');
    expect('select * from [users] where cast([created_at] as date) = ?').toBe(builder.toSql());
    $this.assertEquals(['2015-09-23'], builder.getBindings());
})

test('UppercaseLeadingBooleansAreRemoved', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'Taylor', 'AND');
    expect('select * from "users" where "name" = ?').toBe(builder.toSql());
})

test('LowercaseLeadingBooleansAreRemoved', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'Taylor', 'and');
    expect('select * from "users" where "name" = ?').toBe(builder.toSql());
})

test('CaseInsensitiveLeadingBooleansAreRemoved', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('name', '=', 'Taylor', 'And');
    expect('select * from "users" where "name" = ?').toBe(builder.toSql());
})

test('TableValuedFunctionAsTableInSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users()');
    expect('select * from [users]()').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users(1,2)');
    expect('select * from [users](1,2)').toBe(builder.toSql());
})

test('ChunkWithLastChunkComplete', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkWithLastChunkPartial', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkCanBeStoppedByReturningFalse', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkWithCountZero', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkByIdOnArrays', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkPaginatesUsingIdWithLastChunkComplete', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkPaginatesUsingIdWithLastChunkPartial', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkPaginatesUsingIdWithCountZero', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('ChunkPaginatesUsingIdWithAlias', () =>
{
    /*
    builder = $this.getMockQueryBuilder();
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

test('Paginate', () =>
{
    /*
    $perPage = 16;
    $columns = ['test'];
    $pageName = 'page-name';
    $page = 1;
    builder = $this.getMockQueryBuilder();
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

test('PaginateWithDefaultArguments', () =>
{
    /*
    $perPage = 15;
    $pageName = 'page';
    $page = 1;
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
    builder = $this.getMockQueryBuilder();
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
        new class /*implements ConditionExpression*/
        {
            public getValue($grammar: Grammar)
            {
                return '1 = 1';
            }
        }
    );
    expect('select * from "orders" where 1 = 1').toBe(builder.toSql());
    expect([], builder.getBindings());
})

test('WhereRowValues', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('orders').whereRowValues(['last_update', 'order_number'], '<', [1, 2]);
    expect('select * from "orders" where ("last_update", "order_number") < (?, ?)').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').where('company_id', 1).orWhereRowValues(['last_update', 'order_number'], '<', [1, 2]);
    expect('select * from "orders" where "company_id" = ? or ("last_update", "order_number") < (?, ?)').toBe(builder.toSql());

    builder = getBuilder();
    builder.select(['*']).from('orders').whereRowValues(['last_update', 'order_number'], '<', [1, new Raw('2')]);
    expect('select * from "orders" where ("last_update", "order_number") < (?, 2)').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereRowValuesArityMismatch', () =>
{
    //$this.expectException(InvalidArgumentException::class);
    $this.expectExceptionMessage('The number of columns must match the number of values');

    const builder = getBuilder();
    builder.select(['*']).from('orders').whereRowValues(['last_update'], '<', [1, 2]);
})

test('WhereJsonContainsMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContains('options', ['en']);
    expect('select * from `users` where json_contains(`options`, ?)').toBe(builder.toSql());
    $this.assertEquals(['["en"]'], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContains('users.options.languages', ['en']);
    expect('select * from `users` where json_contains(`users`.`options`, ?, \'$."languages"\')').toBe(builder.toSql());
    $this.assertEquals(['["en"]'], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContains('options.languages', new Raw("'[\"en\"]'"));
    expect('select * from `users` where `id` = ? or json_contains(`options`, \'["en"]\', \'$."languages"\')').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonContainsPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContains('options', ['en']);
    expect('select * from "users" where ("options")::jsonb @> ?').toBe(builder.toSql());
    $this.assertEquals(['["en"]'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContains('users.options.languages', ['en']);
    expect('select * from "users" where ("users"."options".\'languages\')::jsonb @> ?').toBe(builder.toSql());
    $this.assertEquals(['["en"]'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContains('options.languages', new Raw("'[\"en\"]'"));
    expect('select * from "users" where "id" = ? or ("options".\'languages\')::jsonb @> \'["en"]\'').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonContainsSqlite', () =>
{
    //$this.expectException(RuntimeException::class);

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContains('options.languages', ['en']).toSql();
})

test('WhereJsonContainsSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContains('options', true);
    expect('select * from [users] where ? in (select [value] from openjson([options]))').toBe(builder.toSql());
    $this.assertEquals(['true'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContains('users.options.languages', 'en');
    expect('select * from [users] where ? in (select [value] from openjson([users].[options], \'$."languages"\'))').toBe(builder.toSql());
    $this.assertEquals(['en'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContains('options.languages', new Raw("'en'"));
    expect('select * from [users] where [id] = ? or \'en\' in (select [value] from openjson([options], \'$."languages"\'))').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonDoesntContainMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options.languages', ['en']);
    expect('select * from `users` where not json_contains(`options`, ?, \'$."languages"\')').toBe(builder.toSql());
    $this.assertEquals(['["en"]'], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContain('options.languages', new Raw("'[\"en\"]'"));
    expect('select * from `users` where `id` = ? or not json_contains(`options`, \'["en"]\', \'$."languages"\')').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonDoesntContainPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options.languages', ['en']);
    expect('select * from "users" where not ("options".\'languages\')::jsonb @> ?').toBe(builder.toSql());
    $this.assertEquals(['["en"]'], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContain('options.languages', new Raw("'[\"en\"]'"));
    expect('select * from "users" where "id" = ? or not ("options".\'languages\')::jsonb @> \'["en"]\'').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonDoesntContainSqlite', () =>
{
    //$this.expectException(RuntimeException::class);

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options.languages', ['en']).toSql();
})

test('WhereJsonDoesntContainSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContain('options.languages', 'en');
    expect('select * from [users] where not ? in (select [value] from openjson([options], \'$."languages"\'))').toBe(builder.toSql());
    $this.assertEquals(['en'], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContain('options.languages', new Raw("'en'"));
    expect('select * from [users] where [id] = ? or not \'en\' in (select [value] from openjson([options], \'$."languages"\'))').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonContainsKeyMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options.languages');
    expect('select * from `users` where ifnull(json_contains_path(`users`.`options`, \'one\', \'$."languages"\'), 0)').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.language.primary');
    expect('select * from `users` where ifnull(json_contains_path(`options`, \'one\', \'$."language"."primary"\'), 0)').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options.languages');
    expect('select * from `users` where `id` = ? or ifnull(json_contains_path(`options`, \'one\', \'$."languages"\'), 0)').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.languages[0][1]');
    expect('select * from `users` where ifnull(json_contains_path(`options`, \'one\', \'$."languages"[0][1]\'), 0)').toBe(builder.toSql());
})

test('WhereJsonContainsKeyPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options.languages');
    expect('select * from "users" where coalesce(("users"."options")::jsonb ?? \'languages\', false)').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.language.primary');
    expect('select * from "users" where coalesce(("options".\'language\')::jsonb ?? \'primary\', false)').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options.languages');
    expect('select * from "users" where "id" = ? or coalesce(("options")::jsonb ?? \'languages\', false)').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.languages[0][1]');
    expect('select * from "users" where case when jsonb_typeof(("options".\'languages\'.0)::jsonb) = \'array\' then jsonb_array_length(("options".\'languages\'.0)::jsonb) >= 2 else false end').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.languages[-1]');
    expect('select * from "users" where case when jsonb_typeof(("options".\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options".\'languages\')::jsonb) >= 1 else false end').toBe(builder.toSql());
})

test('WhereJsonContainsKeySqlite', () =>
{
    const builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options.languages');
    expect('select * from "users" where json_type("users"."options", \'$."languages"\') is not null').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.language.primary');
    expect('select * from "users" where json_type("options", \'$."language"."primary"\') is not null').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options.languages');
    expect('select * from "users" where "id" = ? or json_type("options", \'$."languages"\') is not null').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.languages[0][1]');
    expect('select * from "users" where json_type("options", \'$."languages"[0][1]\') is not null').toBe(builder.toSql());
})

test('WhereJsonContainsKeySqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('users.options.languages');
    expect('select * from [users] where \'languages\' in (select [key] from openjson([users].[options]))').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.language.primary');
    expect('select * from [users] where \'primary\' in (select [key] from openjson([options], \'$."language"\'))').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonContainsKey('options.languages');
    expect('select * from [users] where [id] = ? or \'languages\' in (select [key] from openjson([options]))').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonContainsKey('options.languages[0][1]');
    expect('select * from [users] where 1 in (select [key] from openjson([options], \'$."languages"[0]\'))').toBe(builder.toSql());
})

test('WhereJsonDoesntContainKeyMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages');
    expect('select * from `users` where not ifnull(json_contains_path(`options`, \'one\', \'$."languages"\'), 0)').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options.languages');
    expect('select * from `users` where `id` = ? or not ifnull(json_contains_path(`options`, \'one\', \'$."languages"\'), 0)').toBe(builder.toSql());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages[0][1]');
    expect('select * from `users` where not ifnull(json_contains_path(`options`, \'one\', \'$."languages"[0][1]\'), 0)').toBe(builder.toSql());
})

test('WhereJsonDoesntContainKeyPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages');
    expect('select * from "users" where not coalesce(("options")::jsonb ?? \'languages\', false)').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options.languages');
    expect('select * from "users" where "id" = ? or not coalesce(("options")::jsonb ?? \'languages\', false)').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages[0][1]');
    expect('select * from "users" where not case when jsonb_typeof(("options".\'languages\'.0)::jsonb) = \'array\' then jsonb_array_length(("options".\'languages\'.0)::jsonb) >= 2 else false end').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages[-1]');
    expect('select * from "users" where not case when jsonb_typeof(("options".\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options".\'languages\')::jsonb) >= 1 else false end').toBe(builder.toSql());
})

test('WhereJsonDoesntContainKeySqlite', () =>
{
    const builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages');
    expect('select * from "users" where not json_type("options", \'$."languages"\') is not null').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options.languages');
    expect('select * from "users" where "id" = ? or not json_type("options", \'$."languages"\') is not null').toBe(builder.toSql());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options.languages[0][1]');
    expect('select * from "users" where "id" = ? or not json_type("options", \'$."languages"[0][1]\') is not null').toBe(builder.toSql());
})

test('WhereJsonDoesntContainKeySqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonDoesntContainKey('options.languages');
    expect('select * from [users] where not \'languages\' in (select [key] from openjson([options]))').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options.languages');
    expect('select * from [users] where [id] = ? or not \'languages\' in (select [key] from openjson([options]))').toBe(builder.toSql());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options.languages[0][1]');
    expect('select * from [users] where [id] = ? or not 1 in (select [key] from openjson([options], \'$."languages"[0]\'))').toBe(builder.toSql());
})

test('WhereJsonLengthMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect('select * from `users` where json_length(`options`) = ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options.languages', '>', 0);
    expect('select * from `users` where json_length(`users`.`options`, \'$."languages"\') > ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', new Raw('0'));
    expect('select * from `users` where `id` = ? or json_length(`options`, \'$."languages"\') = 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());

    builder = $this.getMysqlBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', '>', new Raw('0'));
    expect('select * from `users` where `id` = ? or json_length(`options`, \'$."languages"\') > 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonLengthPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect('select * from "users" where jsonb_array_length(("options")::jsonb) = ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options.languages', '>', 0);
    expect('select * from "users" where jsonb_array_length(("users"."options".\'languages\')::jsonb) > ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', new Raw('0'));
    expect('select * from "users" where "id" = ? or jsonb_array_length(("options".\'languages\')::jsonb) = 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', '>', new Raw('0'));
    expect('select * from "users" where "id" = ? or jsonb_array_length(("options".\'languages\')::jsonb) > 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonLengthSqlite', () =>
{
    const builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect('select * from "users" where json_array_length("options") = ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options.languages', '>', 0);
    expect('select * from "users" where json_array_length("users"."options", \'$."languages"\') > ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', new Raw('0'));
    expect('select * from "users" where "id" = ? or json_array_length("options", \'$."languages"\') = 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());

    builder = $this.getSQLiteBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', '>', new Raw('0'));
    expect('select * from "users" where "id" = ? or json_array_length("options", \'$."languages"\') > 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('WhereJsonLengthSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonLength('options', 0);
    expect('select * from [users] where (select count(*) from openjson([options])) = ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').whereJsonLength('users.options.languages', '>', 0);
    expect('select * from [users] where (select count(*) from openjson([users].[options], \'$."languages"\')) > ?').toBe(builder.toSql());
    $this.assertEquals([0], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', new Raw('0'));
    expect('select * from [users] where [id] = ? or (select count(*) from openjson([options], \'$."languages"\')) = 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());

    builder = $this.getSqlServerBuilder();
    builder.select(['*']).from('users').where('id', '=', 1).orWhereJsonLength('options.languages', '>', new Raw('0'));
    expect('select * from [users] where [id] = ? or (select count(*) from openjson([options], \'$."languages"\')) > 0').toBe(builder.toSql());
    $this.assertEquals([1], builder.getBindings());
})

test('From', () =>
{
    const builder = getBuilder();
    builder.from(getBuilder().from('users'), 'u');
    expect('select * from (select * from "users") as "u"').toBe(builder.toSql());

    builder = getBuilder();
    $eloquentBuilder = new EloquentBuilder(getBuilder());
    builder.from($eloquentBuilder.from('users'), 'u');
    expect('select * from (select * from "users") as "u"').toBe(builder.toSql());
})

test('FromSub', () =>
{
    const builder = getBuilder();
    builder.fromSub(function ($query) {
        $query.select(new Raw('max(last_seen_at) as last_seen_at')).from('user_sessions').where('foo', '=', '1');
    }, 'sessions').where('bar', '<', '10');
    expect('select * from (select max(last_seen_at) as last_seen_at from "user_sessions" where "foo" = ?) as "sessions" where "bar" < ?').toBe(builder.toSql());
    $this.assertEquals(['1', '10'], builder.getBindings());

    //$this.expectException(InvalidArgumentException::class);
    builder = getBuilder();
    builder.fromSub(['invalid'], 'sessions').where('bar', '<', '10');
})

test('FromSubWithPrefix', () =>
{
    const builder = getBuilder();
    builder.getGrammar().setTablePrefix('prefix_');
    builder.fromSub(function ($query) {
        $query.select(new Raw('max(last_seen_at) as last_seen_at')).from('user_sessions').where('foo', '=', '1');
    }, 'sessions').where('bar', '<', '10');
    expect('select * from (select max(last_seen_at) as last_seen_at from "prefix_user_sessions" where "foo" = ?) as "prefix_sessions" where "bar" < ?').toBe(builder.toSql());
    $this.assertEquals(['1', '10'], builder.getBindings());
})

test('FromSubWithoutBindings', () =>
{
    const builder = getBuilder();
    builder.fromSub(function ($query) {
        $query.select(new Raw('max(last_seen_at) as last_seen_at')).from('user_sessions');
    }, 'sessions');
    expect('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"').toBe(builder.toSql());

    //$this.expectException(InvalidArgumentException::class);
    builder = getBuilder();
    builder.fromSub(['invalid'], 'sessions');
})

test('FromRaw', () =>
{
    const builder = getBuilder();
    builder.fromRaw(new Raw('(select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"'));
    expect('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"').toBe(builder.toSql());
})

test('FromRawOnSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.fromRaw('dbo.[SomeNameWithRoundBrackets (test)]');
    expect('select * from dbo.[SomeNameWithRoundBrackets (test)]').toBe(builder.toSql());
})

test('FromRawWithWhereOnTheMainQuery', () =>
{
    const builder = getBuilder();
    builder.fromRaw(new Raw('(select max(last_seen_at) as last_seen_at from "sessions") as "last_seen_at"')).where('last_seen_at', '>', '1520652582');
    expect('select * from (select max(last_seen_at) as last_seen_at from "sessions") as "last_seen_at" where "last_seen_at" > ?').toBe(builder.toSql());
    $this.assertEquals(['1520652582'], builder.getBindings());
})

test('FromQuestionMarkOperatorOnPostgres', () =>
{
    const builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('roles', '?', 'superuser');
    expect('select * from "users" where "roles" ?? ?').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('roles', '?|', 'superuser');
    expect('select * from "users" where "roles" ??| ?').toBe(builder.toSql());

    builder = $this.getPostgresBuilder();
    builder.select(['*']).from('users').where('roles', '?&', 'superuser');
    expect('select * from "users" where "roles" ??& ?').toBe(builder.toSql());
})

test('UseIndexMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select('foo').from('users').useIndex('test_index');
    expect('select `foo` from `users` use index (test_index)').toBe(builder.toSql());
})

test('ForceIndexMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select('foo').from('users').forceIndex('test_index');
    expect('select `foo` from `users` force index (test_index)').toBe(builder.toSql());
})

test('IgnoreIndexMySql', () =>
{
    const builder = $this.getMysqlBuilder();
    builder.select('foo').from('users').ignoreIndex('test_index');
    expect('select `foo` from `users` ignore index (test_index)').toBe(builder.toSql());
})

test('UseIndexSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select('foo').from('users').useIndex('test_index');
    expect('select "foo" from "users"').toBe(builder.toSql());
})

test('ForceIndexSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select('foo').from('users').forceIndex('test_index');
    expect('select "foo" from "users" indexed by test_index').toBe(builder.toSql());
})

test('IgnoreIndexSqlite', () =>
{
    builder = $this.getSQLiteBuilder();
    builder.select('foo').from('users').ignoreIndex('test_index');
    expect('select "foo" from "users"').toBe(builder.toSql());
})

test('UseIndexSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select('foo').from('users').useIndex('test_index');
    expect('select [foo] from [users]').toBe(builder.toSql());
})

test('ForceIndexSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select('foo').from('users').forceIndex('test_index');
    expect('select [foo] from [users] with (index(test_index))').toBe(builder.toSql());
})

test('IgnoreIndexSqlServer', () =>
{
    const builder = $this.getSqlServerBuilder();
    builder.select('foo').from('users').ignoreIndex('test_index');
    expect('select [foo] from [users]').toBe(builder.toSql());
})

test('Clone', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users');
    $clone = builder.clone().where('email', 'foo');

    $this.assertNotSame(builder, $clone);
    expect('select * from "users"').toBe(builder.toSql());
    expect('select * from "users" where "email" = ?', $clone.toSql());
})

test('CloneWithout', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', 'foo').orderBy('email');
    $clone = builder.cloneWithout(['orders']);

    expect('select * from "users" where "email" = ? order by "email" asc').toBe(builder.toSql());
    expect('select * from "users" where "email" = ?', $clone.toSql());
})

test('CloneWithoutBindings', () =>
{
    const builder = getBuilder();
    builder.select(['*']).from('users').where('email', 'foo').orderBy('email');
    $clone = builder.cloneWithout(['wheres']).cloneWithoutBindings(['where']);

    expect('select * from "users" where "email" = ? order by "email" asc').toBe(builder.toSql());
    $this.assertEquals(['foo'], builder.getBindings());

    expect('select * from "users" order by "email" asc', $clone.toSql());
    $this.assertEquals([], $clone.getBindings());
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
