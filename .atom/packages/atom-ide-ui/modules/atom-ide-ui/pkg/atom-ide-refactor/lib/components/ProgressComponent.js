"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProgressComponent = void 0;

var React = _interopRequireWildcard(require("react"));

function _ProgressBar() {
  const data = require("../../../../../nuclide-commons-ui/ProgressBar");

  _ProgressBar = function () {
    return data;
  };

  return data;
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *  strict-local
 * @format
 */
class ProgressComponent extends React.Component {
  render() {
    const {
      message,
      value,
      max
    } = this.props.phase;
    return React.createElement("div", null, message, " (", value, " / ", max, ")", React.createElement("div", {
      className: "nuclide-refactorizer-progress"
    }, React.createElement(_ProgressBar().ProgressBar, {
      value: value,
      max: max
    })));
  }

}

exports.ProgressComponent = ProgressComponent;