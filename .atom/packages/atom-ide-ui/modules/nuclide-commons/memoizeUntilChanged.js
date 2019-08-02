"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _collection() {
  const data = require("./collection");

  _collection = function () {
    return data;
  };

  return data;
}

/**
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

/**
 * Create a memoized version of the provided function that caches only the latest result. This is
 * especially useful for optimizing React component methods without having to worry about
 * maintaining state explicitly. For example:
 *
 *     class MyComponent extends React.Component {
 *       constructor(props) {
 *         super(props);
 *         this._computeSomethingExpensive = memoizeUntilChanged(this._computeSomethingExpensive);
 *       }
 *       _computeSomethingExpensive(x) { ... }
 *       render() {
 *         const thingToRender = this._computeSomethingExpensive(this.props.value);
 *         return <div>{thingToRender}</div>;
 *       }
 *     }
 *
 * Sometimes, you need to customize how the arguments are compared. In this case you can pass a
 * key selector function (which derives a single value from the arguments), and an equality function
 * (which compares keys). For example:
 *
 *     class MyComponent extends React.Component {
 *       constructor(props) {
 *         super(props);
 *         this._computeSomethingExpensive = memoizeUntilChanged(
 *           this._computeSomethingExpensive,
 *           (x: Array<Object>, y: Array<Object>) => ({x, y}),
 *           (a, b) => arrayEqual(a.x, b.x) && arrayEqual(a.y, b.y),
 *         );
 *       }
 *       _computeSomethingExpensive(x: Array<Object>, y: Array<Object>) { ... }
 *       render() {
 *         const thingToRender = this._computeSomethingExpensive(this.props.value);
 *         return <div>{thingToRender}</div>;
 *       }
 *     }
 */
var _default = (func, keySelector_, compareKeys_) => {
  if (!!(keySelector_ == null && compareKeys_ != null)) {
    throw new Error("You can't provide a compare function without also providing a key selector.");
  }

  let prevKey = null;
  let prevResult;
  const keySelector = keySelector_ || DEFAULT_KEY_SELECTOR;

  const compareKeys = compareKeys_ || _collection().arrayEqual;

  return function (...args) {
    const key = keySelector(...args);

    if (!(key != null)) {
      throw new Error('Key cannot be null');
    }

    if (prevKey == null || !compareKeys(key, prevKey)) {
      prevKey = key;
      prevResult = func.apply(this, args);
    }

    return prevResult;
  };
};

exports.default = _default;

const DEFAULT_KEY_SELECTOR = (...args) => args;