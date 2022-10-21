```hbs template

FPS: {{this.fps}}<br>
<div data-container class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.table.columns as |column|}}
          <th {{this.table.modifiers.columnHeader column}}>
            {{column.name}}
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each this.table.rows as |row|}}
        <tr class="{{row.countClassName}}">
          {{#each this.table.columns as |column|}}
            <td>
              {{#if column.Cell}}
                <column.Cell @row={{row}} @column={{column}} />
              {{else}}
                {{column.getValueForRow row}}
              {{/if}}
            </td>
          {{/each}}
        </tr>
      {{/each}}
    </tbody>
  </table>
</div>
<style>
  [data-container] {
    height: 500px;
    overflow: scroll;
    position: relative;
  }
  [data-container] thead {
    position: sticky;
    top: 0;
    background: var(--basement);
  }
  [data-container] .label {
    padding: 0.2rem 0.6rem 0.3rem;
    font-size: 75%;
    color: white;
    border-radius: 0.25rem;
  }
  [data-container] th {
    /* styling the table isn't the focus of this demo (perf is the focus) */
    width: calc(100% / 7);
  }
  [data-container] th:first-child {
    min-width: 190px;
  }
  [data-container] .label-success { background-color: #5cb85c; }
  [data-container] .label-warning { background-color:#f0ad4e; }
  [data-container] .label-danger  { background-color:#d9534f; }
</style>
```
```js component
import Component from '@glimmer/component';
import { tracked, cached } from '@glimmer/tracking';
import { cell, use, resource, resourceFactory } from 'ember-resources';
import { map } from 'ember-resources/util/map';

import { headlessTable } from 'ember-headless-table';

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'dbname', key: 'db.id' },
      { name: 'query count', key: 'queries.length', Cell: QueryStatus },
      { name: '', key: 'topFiveQueries.0.elapsed' },
      { name: '', key: 'topFiveQueries.1.elapsed' },
      { name: '', key: 'topFiveQueries.2.elapsed' },
      { name: '', key: 'topFiveQueries.3.elapsed' },
      { name: '', key: 'topFiveQueries.4.elapsed' },
    ],
    data: () => this.data,
  });

  @use dbData = DBMonitor;

  @use fps = FPS.of(() => this.dbData.databases);

  get data() {
    return this.mappedData.values();
  }

  mappedData = map(this, {
    data: () => this.dbData.databases,
    map: (databaseData) => new Database(databaseData),
  })
}

const FPS = {
  of: resourceFactory((ofWhat) => {
    let updateInterval = 500; // ms
    let multiplier = 1000 / updateInterval;
    let framesSinceUpdate = 0;

    return resource(({ on }) => {
      let value = cell(0);
      let interval = setInterval(() => {
        value.current = framesSinceUpdate * multiplier;
        framesSinceUpdate = 0;
      }, updateInterval);

      on.cleanup(() => clearInterval(interval));

      return () => {
        ofWhat();
        framesSinceUpdate++;

        return value.current;
      }
    });
  })
}

const DBMonitor = resource(({ on }) => {
  let value = cell(getData(20));
  let frame;
  let generateData = () => {
    // simulate receiving data as fast as possible
    frame = requestAnimationFrame(() => {
      value.current = getData(20);
      generateData();
    });
  }

  on.cleanup(() => cancelAnimationFrame(frame));

  // Start the infinite requestAnimationFrame chain
  generateData();

  return () => value.current;
});

class Database {
  constructor(db) {
    this.db = db;
  }

  get queries() {
    return this.db.queries;
  }

  @cached
  get topFiveQueries() {
    let queries = this.queries || [];
    let topFiveQueries = queries.slice(0, 5);

    while (topFiveQueries.length < 5) {
      topFiveQueries.push({ query: '' });
    }

    return topFiveQueries.map(function(query, index) {
      return {
        key: String(index),
        query: query.query,
        elapsed: query.elapsed ? formatElapsed(query.elapsed) : '',
        className: elapsedClass(query.elapsed)
      };
    });
  }

  @cached
  get countClassName() {
    let queries = this.queries || [];
    let countClassName = 'label';

    if (queries.length >= 20) {
      countClassName += ' label-important';
    } else if (queries.length >= 10) {
      countClassName += ' label-warning';
    } else {
      countClassName += ' label-success';
    }

    return countClassName;
  }


}

function elapsedClass(elapsed) {
  if (elapsed >= 10.0) {
    return 'elapsed warn_long';
  } else if (elapsed >= 1.0) {
    return 'elapsed warn';
  } else {
    return 'elapsed short';
  }
}

function leftPad(str, padding, toLength) {
  return padding.repeat((toLength - str.length) / padding.length).concat(str);
};

function formatElapsed(value) {
  let str = parseFloat(value).toFixed(2);

  if (value > 60) {
    const minutes = Math.floor(value / 60);
    const comps = (value % 60).toFixed(2).split('.');
    const seconds = leftPad(comps[0], '0', 2);
    str = `${minutes}:${seconds}.${comps[1]}`;
  }

  return str;
}

/**
 * Temporary work-around because docfy.dev doesn't support gjs
 */
import { setComponentTemplate } from '@ember/component';
import templateOnly from '@ember/component/template-only';
import { hbs } from 'ember-cli-htmlbars';

const QueryStatus = templateOnly();
setComponentTemplate(hbs`
  <td>
    <span class="{{@row.data.countClassName}}">
      {{@row.data.queries.length}}
    </span>
  </td>
`, QueryStatus);

/**
 * dbmon code copied from
 * https://github.com/html-next/vertical-collection/blob/master/tests/dummy/app/lib/get-data.js
 */
const DEFAULT_ROWS = 20;

function getData(ROWS) {
  ROWS = ROWS || DEFAULT_ROWS;

  // generate some dummy data
  const data = {
    start_at: new Date().getTime() / 1000,
    databases: []
  };

  for (let i = 1; i <= ROWS; i++) {

    data.databases.push({
      id: `cluster${i}`,
      queries: []
    });

    data.databases.push({
      id: ` ↳ cluster${i}-secondary`,
      queries: []
    });

  }

  data.databases.forEach(function(info) {
    const r = Math.floor((Math.random() * 10) + 1);

    for (let i = 0; i < r; i++) {
      const q = {
        canvas_action: null,
        canvas_context_id: null,
        canvas_controller: null,
        canvas_hostname: null,
        canvas_job_tag: null,
        canvas_pid: null,
        elapsed: Math.random() * 15,
        query: 'SELECT blah FROM something',
        waiting: Math.random() < 0.5
      };

      if (Math.random() < 0.2) {
        q.query = '<IDLE> in transaction';
      }

      if (Math.random() < 0.1) {
        q.query = 'vacuum';
      }

      info.queries.push(q);
    }

    info.queries = info.queries.sort(function(a, b) {
      return b.elapsed - a.elapsed;
    });
  });

  return data;
}
```

