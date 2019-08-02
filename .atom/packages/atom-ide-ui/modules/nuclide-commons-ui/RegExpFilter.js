"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFilterPattern = getFilterPattern;
exports.default = void 0;

function _AtomInput() {
  const data = require("./AtomInput");

  _AtomInput = function () {
    return data;
  };

  return data;
}

function _classnames() {
  const data = _interopRequireDefault(require("classnames"));

  _classnames = function () {
    return data;
  };

  return data;
}

function _Button() {
  const data = require("./Button");

  _Button = function () {
    return data;
  };

  return data;
}

function _ButtonGroup() {
  const data = require("./ButtonGroup");

  _ButtonGroup = function () {
    return data;
  };

  return data;
}

function _escapeStringRegexp() {
  const data = _interopRequireDefault(require("escape-string-regexp"));

  _escapeStringRegexp = function () {
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
 *  strict-local
 * @format
 */
class RegExpFilter extends React.Component {
  constructor(props) {
    super(props);

    this._handleReToggleButtonClick = () => {
      this.props.onChange({
        text: this._currentValue.text,
        isRegExp: !this._currentValue.isRegExp
      });
    };

    this._handleTextChange = text => {
      if (text === this._currentValue.text) {
        return;
      }

      this.props.onChange({
        text,
        isRegExp: this._currentValue.isRegExp
      });
    };

    this._currentValue = props.value;
  }

  UNSAFE_componentWillReceiveProps(props) {
    // We need to store this so that we can use it in the event handlers.
    this._currentValue = props.value;
  }

  render() {
    const {
      value: {
        text,
        isRegExp,
        invalid
      }
    } = this.props;
    const size = this.props.size || 'sm';
    const buttonSize = getButtonSize(size);
    const inputWidth = this.props.inputWidth == null ? 200 : this.props.inputWidth;
    const inputClassName = (0, _classnames().default)('nuclide-ui-regexp-filter-input', this.props.inputClassName);
    return React.createElement(_ButtonGroup().ButtonGroup, {
      className: "inline-block"
    }, React.createElement(_AtomInput().AtomInput, {
      ref: el => {
        this._input = el;
      },
      invalid: invalid,
      className: inputClassName,
      size: size,
      width: inputWidth,
      placeholderText: "Filter",
      onDidChange: this._handleTextChange,
      value: text
    }), React.createElement(_Button().Button, {
      className: "nuclide-ui-regexp-filter-button",
      size: buttonSize,
      selected: isRegExp,
      onClick: this._handleReToggleButtonClick,
      tooltip: {
        title: 'Use Regex'
      }
    }, ".*"));
  }

  focus() {
    if (this._input == null) {
      return;
    }

    this._input.focus();
  }

}

exports.default = RegExpFilter;

function getButtonSize(size) {
  switch (size) {
    case 'xs':
      return _Button().ButtonSizes.EXTRA_SMALL;

    case 'sm':
      return _Button().ButtonSizes.SMALL;

    case 'lg':
      return _Button().ButtonSizes.LARGE;

    default:
      size;
      throw new Error(`Invalid size: ${size}`);
  }
}

function getFilterPattern(text, isRegExp) {
  if (text === '') {
    return {
      pattern: null,
      invalid: false
    };
  }

  const source = isRegExp ? text : (0, _escapeStringRegexp().default)(text);

  try {
    return {
      pattern: new RegExp(source, 'i'),
      invalid: false
    };
  } catch (err) {
    return {
      pattern: null,
      invalid: true
    };
  }
}