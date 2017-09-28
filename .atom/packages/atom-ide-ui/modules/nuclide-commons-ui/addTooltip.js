'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addTooltip;

var _react = _interopRequireWildcard(require('react'));

var _reactDom = _interopRequireDefault(require('react-dom'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
* Adds a self-disposing Atom's tooltip to a react element.
*
* Typical usage:
* <div ref={addTooltip({title: 'My awesome tooltip', delay: 100, placement: 'top'})} />
* or, if the ref needs to be preserved:
* <div ref={c => {
*   addTooltip({title: 'My awesome tooltip', delay: 100, placement: 'top'})(c);
*   this._myDiv = c;
* }} />
*/
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

function addTooltip(options) {
  let prevRefDisposable;

  let immediate = null;
  return elementRef => {
    clearImmediate(immediate);
    if (prevRefDisposable != null) {
      prevRefDisposable.dispose();
      prevRefDisposable = null;
    }

    if (elementRef != null) {
      const node = _reactDom.default.findDOMNode(elementRef);

      const initializeTooltip = () => {
        prevRefDisposable = atom.tooltips.add(
        // $FlowFixMe
        node,
        // $FlowFixMe
        Object.assign({
          keyBindingTarget: node
        }, options));
      };

      if (options.keyBindingTarget) {
        // If the user has supplied their own `keyBindingTarget`, we must ensure
        // the CSS slectors are evaluated _before_ the next event loop, since
        // the DOM state may change between now and then.
        initializeTooltip();
      } else {
        // Sooooo... Atom tooltip does the keybinding lookup at creation time
        // instead of display time. And, it uses a CSS selector to figure out
        // if the current element matches the selector. The problem is that at
        // this point, the element is created but not yet mounted in the DOM,
        // so it's not going to match the selector and will not return a
        // keybinding. By deferring it to the end of the event loop, it is now
        // in the DOM and has the proper keybinding.
        immediate = setImmediate(initializeTooltip);
      }
    }
  };
}