import { assert } from '@ember/debug';
import { camelize, underscore } from '@ember/string';

import { SortDirection } from './plugins/data-sorting/types';

import type { Sort, SortsOptions } from './plugins/data-sorting/types';

/**
 * @example
 *
 * ```ts
 * deserializeSorts('first_name.asc', { separator: '.', transform: 'camelize' });
 * // => [{ property: 'firstName', direction: 'ascending' }]
 *
 * deserializeSorts('last_name.desc', { separator: '.', transform: 'camelize' });
 * // => [{ property: 'lastName', direction: 'descending' }]
 * ```
 */

export const deserializeSorts = (
  sortString: string,
  options: SortsOptions = { separator: '.', transform: 'camelize' }
): Sort[] => {
  if (!sortString) {
    return [];
  }

  let { transform, separator } = options;
  let [key, direction] = sortString.split(separator);

  assert(`No key found for input: \`${sortString}\` using \`${separator}\` as a separator`, key);

  if (transform === 'camelize') {
    key = camelize(key);
  } else if (transform === 'underscore') {
    key = underscore(key);
  }

  return [
    {
      property: key,
      direction: direction === 'asc' ? SortDirection.Ascending : SortDirection.Descending,
    },
  ];
};

/**
 * @example
 *
 * ```ts
 * serializeSorts([{ property: 'firstName', direction: 'ascending' }],{ separator: '.', transform: 'camelize' });
 * // => 'first_name.asc'
 *
 * serializeSorts([{ property: 'lastName', direction: 'descending' }],{ separator: '.', transform: 'camelize' });
 * // => 'last_name.desc'
 * ```
 */
export function serializeSorts(
  sorts: Sort[],
  options: SortsOptions = { separator: '.', transform: 'underscore' }
): string {
  const { transform, separator } = options;

  let sortParameters = sorts.map(({ direction, property }) => {
    let shortDirection = direction === 'ascending' ? 'asc' : 'desc';

    let sortField = property;

    if (transform === 'underscore') {
      sortField = underscore(property);
    } else if (transform === 'camelize') {
      sortField = camelize(property);
    }

    return `${sortField}${separator}${shortDirection}`;
  });

  return sortParameters.join('+');
}
