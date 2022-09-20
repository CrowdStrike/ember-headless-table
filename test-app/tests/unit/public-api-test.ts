import { module, test } from 'qunit';

import * as headlessTable from 'ember-headless-table';
import * as plugins from 'ember-headless-table/plugins';

module('Public API', function () {
  /**
   * Note, before using embroider, there is an implicit default export
   * This is incorrect and it's not specified, and is a fault of the legacy ember-cli
   * system using an old version of ESM before standardization really become a thing
   *
   * As a result, we have to massage the assertions a bit to be compatible in a
   * pre and post-embroider world
   * (otherwise we'd just "deepEqual" an array)
   *
   */
  test('main API/exports is constrained', function (assert) {
    let exports = Object.keys(headlessTable);

    exports = exports.filter((ex) => ex !== 'default');

    assert.deepEqual(
      exports.sort(),
      ['headlessTable', 'TablePreferences', 'deserializeSorts', 'serializeSorts'].sort(),
    );
  });

  test('Plugin API/exports is constrained', function (assert) {
    let exports = Object.keys(plugins);

    exports = exports.filter((ex) => ex !== 'default');

    assert.deepEqual(
      exports.sort(),
      [
        // Utilities
        'BasePlugin',
        'meta',
        'options',
        'preferences',
      ].sort(),
    );
  });
});
