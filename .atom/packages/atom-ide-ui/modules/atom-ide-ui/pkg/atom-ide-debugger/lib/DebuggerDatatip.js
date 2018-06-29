'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.debuggerDatatip = debuggerDatatip;

var _bindObservableAsProps;

function _load_bindObservableAsProps() {
  return _bindObservableAsProps = require('../../../../nuclide-commons-ui/bindObservableAsProps');
}

var _evaluationExpression;

function _load_evaluationExpression() {
  return _evaluationExpression = require('./evaluationExpression');
}

var _constants;

function _load_constants() {
  return _constants = require('./constants');
}

var _DebuggerDatatipComponent;

function _load_DebuggerDatatipComponent() {
  return _DebuggerDatatipComponent = _interopRequireDefault(require('./ui/DebuggerDatatipComponent'));
}

var _utils;

function _load_utils() {
  return _utils = require('./utils');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function debuggerDatatip(service, editor, position) {
  if (service.getDebuggerMode() !== (_constants || _load_constants()).DebuggerMode.PAUSED) {
    return null;
  }
  const activeEditor = atom.workspace.getActiveTextEditor();
  if (activeEditor == null) {
    return null;
  }
  const evaluationExpression = (0, (_evaluationExpression || _load_evaluationExpression()).getDefaultEvaluationExpression)(editor, position);
  if (evaluationExpression == null) {
    return null;
  }
  const { expression, range } = evaluationExpression;
  const { focusedProcess, focusedStackFrame } = service.viewModel;
  if (expression == null || focusedProcess == null) {
    // TODO respect session.capabilities.supportsEvaluateForHovers
    // and fallback to scopes variables resolution.
    return null;
  }
  const propStream = (0, (_utils || _load_utils()).expressionAsEvaluationResultStream)(service.createExpression(expression), focusedProcess, focusedStackFrame, 'hover').map(evaluationResult => ({
    expression,
    evaluationResult
  }));
  return {
    component: (0, (_bindObservableAsProps || _load_bindObservableAsProps()).bindObservableAsProps)(propStream, (_DebuggerDatatipComponent || _load_DebuggerDatatipComponent()).default),
    range
  };
} /**
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