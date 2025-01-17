/*
 * @since 2024-10-17 11:48:53
 * @author junbao <junbao@moego.pet>
 */

import { action, type Box, box, type Dispatch, type Select } from 'amos-core';
import { isArray, must, type NextTicker, toArray } from 'amos-utils';
import type { PersistKey, PersistOptions } from './types';
import { toKey } from './utils';

export interface PersistState extends PersistOptions {
  init: () => Promise<void>;
  select: Select;
  getInitial: (box: Box) => [initial: any, preloaded: any];
  hydrated: Set<string>;
  persisted: Map<string, any>;
  hydrate: NextTicker<PersistKey<any>, void>;
  persist: NextTicker<void, void>;
}

export const persistBox = box<PersistState | null>('amos.persist', null);

/**
 * Make sure box or row is hydrated from persisted state.
 */
export const hydrate = action(
  async (dispatch: Dispatch, select: Select, keys: readonly PersistKey<any>[]): Promise<void> => {
    const state = select(persistBox);
    must(state, 'persist middleware is not enabled');
    await state.hydrate.wait(...keys);
  },
  {
    key: 'amos/hydrate',
    conflictPolicy: 'always',
    conflictKey: (select: Select, keys: PersistKey<any>[]) => {
      return keys
        .map((k) => {
          return isArray(k) ? toArray(k[1]).map((id) => toKey(k[0], id)) : [toKey(k)];
        })
        .flat();
    },
  },
);
