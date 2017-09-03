"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.objectToReactElement = objectToReactElement;
exports.arrayToReactChildren = arrayToReactChildren;


/**
 * The original copy of this comes from
 * https://github.com/remarkablemark/REON/blob/1f126e71c17f96daad518abffdb2c53b66b8b792/lib/object-to-react.js
 *
 * MIT License
 *
 * Copyright (c) 2016 Menglin "Mark" Xu <mark@remarkablemark.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var React = require("react");

/**
 * Convert an object to React element(s).
 *
 * The object schema should be similar to React element's.
 * Note: The object passed in this function will be mutated.
 *
 * @param  {Object}       obj - The element object.
 * @return {ReactElement}
 */
function objectToReactElement(obj) {
  // Pack args for React.createElement
  var args = [];

  if (!obj.tagName || typeof obj.tagName !== "string") {
    throw new Error("Invalid tagName on " + JSON.stringify(obj, null, 2));
  }
  if (!obj.attributes || _typeof(obj.attributes) !== "object") {
    throw new Error("Attributes must exist on a VDOM Object");
  }

  // `React.createElement` 1st argument: type
  args[0] = obj.tagName;
  args[1] = obj.attributes;

  var children = obj.children;

  if (children) {
    if (Array.isArray(children)) {
      // to be safe (although this should never happen)
      if (args[1] === undefined) {
        args[1] = null;
      }
      args = args.concat(arrayToReactChildren(children));
    } else if (typeof children === "string") {
      args[2] = children;
    } else if ((typeof children === "undefined" ? "undefined" : _typeof(children)) === "object") {
      args[2] = objectToReactElement(children);
    } else {
      console.warn("invalid vdom data passed", children);
    }
  }

  // $FlowFixMe: React
  return React.createElement.apply({}, args);
}

/**
 * Convert an array of items to React children.
 *
 * @param  {Array} arr - The array.
 * @return {Array}     - The array of mixed values.
 */
function arrayToReactChildren(arr) {
  // similar to `props.children`
  var result = [];
  // child of `props.children`

  // iterate through the `children`
  for (var i = 0, len = arr.length; i < len; i++) {
    // child can have mixed values: text, React element, or array
    var item = arr[i];
    if (Array.isArray(item)) {
      result.push(arrayToReactChildren(item));
    } else if (typeof item === "string") {
      result.push(item);
    } else if ((typeof item === "undefined" ? "undefined" : _typeof(item)) === "object") {
      var keyedItem = item;
      item.key = i;
      result.push(objectToReactElement(keyedItem));
    } else {
      console.warn("invalid vdom data passed", item);
    }
  }

  return result;
}