/*
 * @since 2024-10-17 20:04:24
 * @author junbao <junbao@moego.pet>
 */

import { Box, Mutation, ShapeBox } from 'amos-core';
import { deleteElement, type ValueOrFunc } from 'amos-utils';

export interface ArrayBox<E>
  extends Box<readonly E[]>,
    ShapeBox<readonly E[], 'slice' | 'filter', 'at' | 'includes' | 'indexOf' | 'lastIndexOf', Array<any>> {
  map(fn: (value: E, index: number, array: readonly E[]) => E): Mutation<readonly E[]>;
  push(...items: E[]): Mutation<readonly E[]>;
  pop(): Mutation<readonly E[]>;
  unshift(...items: E[]): Mutation<readonly E[]>;
  shift(): Mutation<readonly E[]>;
  splice(start: number, count: number, ...items: E[]): Mutation<readonly E[]>;
  sort(compare?: (a: E, b: E) => number): Mutation<readonly E[]>;
  delete(...items: E[]): Mutation<readonly E[]>;
}

export const ArrayBox = Box.extends<ArrayBox<any>>({
  name: 'ArrayBox',
  mutations: {
    map: null,
    push: (state, ...items) => state.concat(items),
    pop: (state) => state.slice(0, state.length - 1),
    unshift: (state, ...items) => items.concat(state),
    shift: (state) => state.slice(1),
    slice: null,
    splice: (state, start, deleteCount, ...items) => {
      const value = state.slice();
      value.splice(start, deleteCount, ...items);
      return value;
    },
    sort: (state, compare) => state.slice().sort(compare),
    filter: null,
    delete: (state, ...items) => deleteElement(state.slice(), ...items),
  },
  selectors: {
    at: null,
    includes: null,
    indexOf: null,
    lastIndexOf: null,
  },
});

export function arrayBox<E>(key: string, initialState: ValueOrFunc<readonly E[]> = []): ArrayBox<E> {
  return new ArrayBox(key, initialState);
}
