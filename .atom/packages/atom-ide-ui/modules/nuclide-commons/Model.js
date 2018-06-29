'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('./UniversalDisposable'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Exposes a simple API for a stateful model. This is similar to React's `state`/`setState()` API
 * except achieved via composition and easily convertible to observables so you can do awesome
 * stuff. It's really a super-thin wrapper around `BehaviorSubject`; wrapping `BehaviorSubject`
 * instead of extending it was done to minimize the API surface area. Ideally, this would implement
 * `Symbol.observable` instead of having a `toObservable()` method, but since Flow doesn't
 * understand that, it causes more trouble than it's worth.
 *
 * While you can extend this class, composition is recommended.
 *
 * Example:
 *
 *     class MyThing {
 *       _model = new Model({count: 0});
 *       increment(): void {
 *         const {count} = this._model.state;
 *         this._model.setState({count: count + 1});
 *       }
 *     }
 *
 * BEST PRACTICES
 *
 * Don't pass your model instance around! Instead, create a new object with the properties you want
 * and explicit setters:
 *
 *     const props = {
 *       count: model.state.count,
 *       increment: () => {
 *         const {count} = model.state;
 *         model.setState({count: count + 1})
 *       },
 *     };
 *
 * You'll notice that this is very similar to Flux/Redux, with the setters corresponding to bound
 * action creators. That's awesome! It means that, should the state grow and require new
 * capabilities, we can always switch to full-blown Redux without having to refactor a ton of stuff.
 */
class Model {

  constructor(initialState) {
    this._states = new _rxjsBundlesRxMinJs.BehaviorSubject(initialState);
  }

  setState(newState) {
    const nextState = Object.assign({}, this.state, newState);
    this._states.next(nextState);
  }

  get state() {
    return this._states.getValue();
  }

  subscribe(cb) {
    return new (_UniversalDisposable || _load_UniversalDisposable()).default(this.toObservable().subscribe({ next: cb }));
  }

  toObservable() {
    return this._states.distinctUntilChanged();
  }
}
exports.default = Model; /**
                          * Copyright (c) 2017-present, Facebook, Inc.
                          * All rights reserved.
                          *
                          * This source code is licensed under the BSD-style license found in the
                          * LICENSE file in the root directory of this source tree. An additional grant
                          * of patent rights can be found in the PATENTS file in the same directory.
                          *
                          * 
                          * @format
                          */