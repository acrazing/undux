/*
 * @since 2020-11-04 12:43:20
 * @author acrazing <joking.young@gmail.com>
 */

import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import React, { FC, memo } from 'react';
import { createStore, Select, Selectable, selector, Snapshot, Store } from '..';
import { countBox, incrCount, mergeUser } from '../core/box.spec';
import { selectCount, selectDoubleCount, selectMultipleCount } from '../core/selector.spec';
import { Provider } from './context';
import { MapSelector, useDispatch, useSelector, useStore } from './hooks';
import fn = jest.fn;

export const TestCount = memo(() => {
  const [count, count2] = useSelector(selectCount, selectDoubleCount);
  return <div>{count + '-' + count2}</div>;
});

describe('useStore & useDispatch', () => {
  const store = createStore();
  const wrapper: FC = (props) => <Provider store={store}>{props.children}</Provider>;
  it('should use store & dispatch', async () => {
    const renderStore = renderHook(() => useStore(), { wrapper });
    expect(renderStore.result.current).toBe(store);
    const renderDispatch = renderHook(() => useDispatch(), { wrapper });
    expect(renderDispatch.result.current).toBe(store.dispatch);
    const renderEmpty = renderHook(() => useStore());
    expect(renderEmpty.result.error).toBeInstanceOf(Error);
  });
});

function renderUseSelector<P, Rs extends readonly Selectable[]>(
  fn: (props: P) => Rs,
  preloaded?: Snapshot,
  initialProps?: P,
): RenderHookResult<P, MapSelector<Rs>> & Store {
  const store = createStore(preloaded);
  const hook = renderHook((props: P) => useSelector(...fn(props)), {
    wrapper: (props) => <Provider store={store}>{props.children}</Provider>,
    initialProps,
  });
  return Object.assign(hook, store);
}

describe('useSelector', () => {
  it('should select state', () => {
    const { result } = renderUseSelector(
      () => [countBox, selectCount, selectDoubleCount, selectMultipleCount(3)] as const,
      { count: 1, test: { greets: ['PRELOAD'], count: 1 } },
    );
    expect(result.current).toEqual([1, 1, 2, 3]);
  });
  it('should update', async () => {
    const { result, waitForNextUpdate, dispatch, rerender } = renderUseSelector(
      (props: { multiply: number }) => [selectDoubleCount, selectMultipleCount(props.multiply)],
      { count: 1, test: { greets: ['PRELOAD'], count: 1 } },
      { multiply: 3 },
    );
    expect(result.current).toEqual([2, 3]);
    dispatch(mergeUser({ firstName: 'TEST UPDATE' }));
    await waitForNextUpdate();
    expect(result.current).toEqual([4, 6]);
    rerender({ multiply: 4 });
    expect(result.current).toEqual([4, 8]);
  });

  it('should update - box', async () => {
    const { result, dispatch } = renderUseSelector(() => [countBox] as const);
    expect(result.current).toEqual([0]);
    act(() => dispatch(incrCount()));
    expect(result.current).toEqual([1]);
  });

  it('should respect deps', async () => {
    const defaultFn = fn((select: Select, times: number) => select(countBox) * times);
    const strictFn = fn((select: Select, times: number) => select(countBox) * times);
    const defaultSelector = selector(defaultFn);
    const strictSelector = selector(strictFn, (select, times) => [select(countBox), times]);
    const inlineFn = fn((select: Select) => select(countBox));
    const expectCalled = (isDefault: boolean, isStrict: boolean, isInline: boolean) => {
      expect(defaultFn).toBeCalledTimes(isDefault ? 1 : 0);
      defaultFn.mockClear();
      expect(strictFn).toBeCalledTimes(isStrict ? 1 : 0);
      strictFn.mockClear();
      expect(inlineFn).toBeCalledTimes(isInline ? 1 : 0);
      inlineFn.mockClear();
    };
    const { result, dispatch, rerender, waitForNextUpdate } = renderUseSelector(
      (props: { multiply: number }) =>
        [
          defaultSelector(props.multiply),
          strictSelector(props.multiply),
          inlineFn,
          countBox,
        ] as const,
      { count: 1, test: { count: 1, greets: ['PRELOAD'] } },
      { multiply: 1 },
    );
    expectCalled(true, true, true);
    expect(result.current).toEqual([1, 1, 1, 1]);
    dispatch(mergeUser({ id: 2 }));
    await waitForNextUpdate();
    expectCalled(true, true, true);
    expect(result.current).toEqual([2, 2, 2, 1]);
    rerender({ multiply: 2 });
    expectCalled(true, true, true);
    expect(result.current).toEqual([4, 4, 2, 1]);
    act(() => dispatch(incrCount()));
    expectCalled(false, false, false);
    expect(result.current).toEqual([4, 4, 2, 2]);
  });
});
