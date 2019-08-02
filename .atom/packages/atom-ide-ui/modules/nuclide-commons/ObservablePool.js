"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _RxMin = require("rxjs/bundles/Rx.min.js");

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *  strict
 * @format
 */

/**
 * ObservablePool allows you to execute Observables or functions that return
 * Observable inputs (i.e. Observables, Promises, or Iterables)
 * with a concurrency limit.
 *
 * Execution requests are queued and unsubscriptions are forwarded through
 * (if a request is still on the queue, its execution will be cancelled.)
 *
 * For requests that return a Promise, the ObservablePool is pessimistic
 * and assumes that the operation is uncancellable - it will not remove
 * the execution from the pool until it resolves or rejects. However
 * `schedule()` will still return an Observable to enable the use case
 * of cancelling requests while they're in the queue.
 *
 * Example:
 *
 *   const pool = new ObservablePool(2);
 *   pool
 *     .schedule(Observable.timer(1000).mapTo(1))
 *     .subscribe(console.log);
 *   Observable.timer(1000)
 *     .mapTo(2)
 *     .let(pool.schedule.bind(pool))
 *     .subscribe(console.log);
 *   pool
 *     .schedule(Observable.timer(100).mapTo(3))
 *     .subscribe(console.log);
 *
 * The output here is 1, 2, then 3. Despite the fact that the third observable
 * finishes more quickly, its execution is postponed until the first two finish.
 */
class ObservablePool {
  constructor(concurrency) {
    this._requests = new _RxMin.Subject();
    this._responseListeners = new Map();
    this._subscription = this._handleEvents(concurrency);
  }

  schedule(executor) {
    return _RxMin.Observable.create(observer => {
      const unsubscribed = new _RxMin.Subject();
      const tag = {}; // Just a unique object.

      this._responseListeners.set(tag, {
        observer,
        unsubscribed
      });

      this._requests.next({
        tag,
        executor
      });

      return () => {
        this._responseListeners.delete(tag);

        unsubscribed.next();
      };
    });
  }
  /**
   * Warning: calling dispose() will error all executing requests.
   */


  dispose() {
    this._responseListeners.forEach(({
      observer
    }) => {
      observer.error(Error('ObservablePool was disposed'));
    });

    this._subscription.unsubscribe();
  }

  _handleEvents(concurrency) {
    return this._requests.mergeMap(event => {
      const {
        executor,
        tag
      } = event;

      const listener = this._responseListeners.get(tag); // unsubscribed before we could even get to it!


      if (listener == null) {
        return _RxMin.Observable.empty();
      }

      const {
        observer,
        unsubscribed
      } = listener;
      let result;

      if (executor instanceof _RxMin.Observable) {
        result = executor;
      } else {
        try {
          result = executor();
        } catch (err) {
          // Catch errors from executor().
          observer.error(err);
          return _RxMin.Observable.empty();
        }
      }

      if (result instanceof _RxMin.Observable) {
        // We can safely forward unsubscriptions!
        return result.takeUntil(unsubscribed) // $FlowFixMe: Flow doesn't like this.
        .do(observer).catch(() => _RxMin.Observable.empty());
      } else {
        // In the absence of cancellation, assume the worst.
        return _RxMin.Observable.from(result) // $FlowFixMe: Flow doesn't like this.
        .do(observer).catch(() => _RxMin.Observable.empty());
      }
    }, concurrency).subscribe();
  }

}

exports.default = ObservablePool;