import { module, test } from 'qunit';

import { deserializeSorts, serializeSorts } from 'ember-headless-table';

import type { Sort } from 'ember-headless-table/plugins/data-sorting';

module('Unit | Utils | sort utils', function () {
  module('deserializeSorts', function () {
    test('deserializing nested property paths sort params', function (assert) {
      let output = [
        {
          property: 'foo',
          direction: 'descending',
        },
      ];
      let input = 'foo.desc';
      let actual = deserializeSorts(input);

      assert.deepEqual(actual, output);

      output = [
        {
          property: 'foo',
          direction: 'ascending',
        },
      ];
      input = 'foo.asc';
      actual = deserializeSorts(input);

      assert.deepEqual(actual, output);
    });

    test('options.separator', function (assert) {
      let output = [{ property: 'fooBar', direction: 'descending' }] as Sort[];
      let input = 'foo_bar.desc';
      let actual = deserializeSorts(input);

      assert.deepEqual(actual, output, 'default separator is "."');

      output = [{ property: 'foo_bar', direction: 'ascending' }] as Sort[];
      input = 'foo_bar|asc';
      actual = deserializeSorts(input, { separator: '|', transform: null });

      assert.deepEqual(actual, output, 'custom separator is used');
    });

    test('options.transform', function (assert) {
      let output = [{ property: 'foo_bar', direction: 'descending' }] as Sort[];
      let input = 'fooBar|desc';
      let actual = deserializeSorts(input, { separator: '|', transform: 'underscore' });

      assert.deepEqual(
        actual,
        output,
        'custom underscore transform is used and separator is used '
      );

      output = [{ property: 'fooBar', direction: 'ascending' }] as Sort[];
      input = 'foo_bar|asc';
      actual = deserializeSorts(input, { separator: '|', transform: 'camelize' });

      assert.deepEqual(actual, output, 'custom transform is used');

      output = [{ property: 'foo_bar', direction: 'descending' }] as Sort[];
      input = 'fooBar.desc';
      actual = deserializeSorts(input, { separator: '.', transform: 'underscore' });

      assert.deepEqual(actual, output, 'custom underscore transform and separator "." is used');
    });
  });

  module('serializeSorts', function () {
    test('serializeSorts nested property paths sort params', function (assert) {
      let input = [
        {
          property: 'foo',
          direction: 'descending',
        },
      ] as Sort[];

      let output = 'foo.desc';

      let actual = serializeSorts(input);

      assert.strictEqual(actual, output);

      input = [
        {
          property: 'foo',
          direction: 'ascending',
        },
      ] as Sort[];

      output = 'foo.asc';

      actual = serializeSorts(input);

      assert.strictEqual(actual, output);
    });

    test('options.separator', function (assert) {
      let input = [{ property: 'fooBar', direction: 'descending' }] as Sort[];
      let output = 'foo_bar.desc';
      let actual = serializeSorts(input);

      assert.strictEqual(actual, output, 'default separator is "."');

      input = [{ property: 'foo_bar', direction: 'ascending' }] as Sort[];
      output = 'foo_bar|asc';
      actual = serializeSorts(input, { separator: '|', transform: null });

      assert.strictEqual(actual, output, 'custom separator is used');
    });

    test('options.transform', function (assert) {
      let input = [{ property: 'fooBar', direction: 'descending' }] as Sort[];
      let output = 'foo_bar|desc';
      let actual = serializeSorts(input, { separator: '|', transform: 'underscore' });

      assert.strictEqual(
        actual,
        output,
        'custom underscore transform is used and separator is used '
      );

      input = [{ property: 'foo_bar', direction: 'ascending' }] as Sort[];
      output = 'fooBar|asc';
      actual = serializeSorts(input, { separator: '|', transform: 'camelize' });

      assert.strictEqual(actual, output, 'custom transform is used');

      input = [{ property: 'fooBar', direction: 'descending' }] as Sort[];
      output = 'foo_bar.desc';
      actual = serializeSorts(input, { separator: '.', transform: 'underscore' });

      assert.strictEqual(actual, output, 'custom underscore transform and separator "." is used');
    });
  });
});
