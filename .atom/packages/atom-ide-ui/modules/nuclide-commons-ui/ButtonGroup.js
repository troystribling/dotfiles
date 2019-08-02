"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ButtonGroup = exports.ButtonGroupSizes = void 0;

function _classnames() {
  const data = _interopRequireDefault(require("classnames"));

  _classnames = function () {
    return data;
  };

  return data;
}

var React = _interopRequireWildcard(require("react"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const ButtonGroupSizes = Object.freeze({
  EXTRA_SMALL: 'EXTRA_SMALL',
  SMALL: 'SMALL',
  LARGE: 'LARGE'
});
exports.ButtonGroupSizes = ButtonGroupSizes;
const ButtonGroupSizeClassnames = Object.freeze({
  EXTRA_SMALL: 'btn-group-xs',
  SMALL: 'btn-group-sm',
  LARGE: 'btn-group-lg'
});
/**
 * Visually groups Buttons passed in as children.
 */

const ButtonGroup = props => {
  const {
    size,
    children,
    className
  } = props;
  const sizeClassName = size == null ? '' : ButtonGroupSizeClassnames[size] || '';
  const newClassName = (0, _classnames().default)(className, 'btn-group', 'nuclide-btn-group', {
    [sizeClassName]: size != null
  });
  return (// $FlowFixMe(>=0.53.0) Flow suppress
    React.createElement("div", {
      className: newClassName
    }, children)
  );
};

exports.ButtonGroup = ButtonGroup;