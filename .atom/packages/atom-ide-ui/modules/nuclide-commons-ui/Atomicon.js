'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _invert2;

function _load_invert() {
  return _invert2 = _interopRequireDefault(require('lodash/invert'));
}

exports.default = Atomicon;
exports.getTypeFromIconName = getTypeFromIconName;

var _react = _interopRequireWildcard(require('react'));

var _string;

function _load_string() {
  return _string = require('../nuclide-commons/string');
}

var _classnames;

function _load_classnames() {
  return _classnames = _interopRequireDefault(require('classnames'));
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TYPE_TO_ICON_NAME = {
  array: 'type-array',
  boolean: 'type-boolean',
  class: 'type-class',
  constant: 'type-constant',
  constructor: 'type-constructor',
  enum: 'type-enum',
  field: 'type-field',
  file: 'type-file',
  function: 'type-function',
  interface: 'type-interface',
  method: 'type-method',
  module: 'type-module',
  namespace: 'type-namespace',
  number: 'type-number',
  package: 'type-package',
  property: 'type-property',
  string: 'type-string',
  variable: 'type-variable'
}; /**
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

const ICON_NAME_TO_TYPE = (0, (_invert2 || _load_invert()).default)(TYPE_TO_ICON_NAME);

function Atomicon({ type }) {
  const displayName = (0, (_string || _load_string()).capitalize)(type);
  return _react.createElement('span', {
    className: (0, (_classnames || _load_classnames()).default)('icon', 'icon-' + TYPE_TO_ICON_NAME[type]),
    role: 'presentation',
    title: displayName
  });
}

function getTypeFromIconName(iconName) {
  return ICON_NAME_TO_TYPE[iconName];
}