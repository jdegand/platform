import { describe, test } from 'tstyche';

describe('regression component-store', () => {
  test('https://github.com/ngrx/platform/issues/3482', () => {
    console.log(`
      import { ComponentStore } from '@ngrx/component-store';
      import { of, EMPTY, Observable } from 'rxjs';
      import { concatMap } from 'rxjs/operators';

      interface SomeType {
        name: string;
        prop: string;
      }

      export abstract class MyStore<
        QueryVariables extends SomeType
      > extends ComponentStore<any> {
        protected abstract readonly query$: Observable<Omit<QueryVariables, 'name'>>;

        readonly load = this.effect(
          (origin$: Observable<Omit<QueryVariables, 'name'> | null>) => origin$
        );

        protected constructor() {
          super();
        }

        protected initializeLoad() {
          // 👇 this should work
          this.load(this.query$);
        }
      }
    `);
  });
});
