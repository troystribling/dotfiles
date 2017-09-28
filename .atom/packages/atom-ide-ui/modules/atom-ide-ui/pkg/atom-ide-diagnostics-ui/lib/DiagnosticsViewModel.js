'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DiagnosticsViewModel = exports.WORKSPACE_VIEW_URI = undefined;

var _goToLocation;

function _load_goToLocation() {
  return _goToLocation = require('nuclide-commons-atom/go-to-location');
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('nuclide-commons/UniversalDisposable'));
}

var _react = _interopRequireDefault(require('react'));

var _DiagnosticsUi;

function _load_DiagnosticsUi() {
  return _DiagnosticsUi = _interopRequireDefault(require('./ui/DiagnosticsUi'));
}

var _analytics;

function _load_analytics() {
  return _analytics = _interopRequireDefault(require('nuclide-commons-atom/analytics'));
}

var _Model;

function _load_Model() {
  return _Model = _interopRequireDefault(require('nuclide-commons/Model'));
}

var _observePaneItemVisibility;

function _load_observePaneItemVisibility() {
  return _observePaneItemVisibility = _interopRequireDefault(require('nuclide-commons-atom/observePaneItemVisibility'));
}

var _renderReactRoot;

function _load_renderReactRoot() {
  return _renderReactRoot = require('nuclide-commons-ui/renderReactRoot');
}

var _observable;

function _load_observable() {
  return _observable = require('nuclide-commons/observable');
}

var _bindObservableAsProps;

function _load_bindObservableAsProps() {
  return _bindObservableAsProps = require('nuclide-commons-ui/bindObservableAsProps');
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _RegExpFilter;

function _load_RegExpFilter() {
  return _RegExpFilter = require('nuclide-commons-ui/RegExpFilter');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const WORKSPACE_VIEW_URI = exports.WORKSPACE_VIEW_URI = 'atom://nuclide/diagnostics'; /**
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

class DiagnosticsViewModel {

  constructor(globalStates) {
    _initialiseProps.call(this);

    const { pattern, invalid } = (0, (_RegExpFilter || _load_RegExpFilter()).getFilterPattern)('', false);
    this._model = new (_Model || _load_Model()).default({
      // TODO: Get this from constructor/serialization.
      hiddenTypes: new Set(),
      textFilter: { text: '', isRegExp: false, pattern, invalid },
      selectedMessage: null
    });
    const visibility = (0, (_observePaneItemVisibility || _load_observePaneItemVisibility()).default)(this).distinctUntilChanged();
    this._disposables = new (_UniversalDisposable || _load_UniversalDisposable()).default(visibility.debounceTime(1000).distinctUntilChanged().filter(Boolean).subscribe(() => {
      (_analytics || _load_analytics()).default.track('diagnostics-show-table');
    }));

    // Combine the state that's shared between instances, the state that's unique to this instance,
    // and unchanging callbacks, to get the props for our component.
    const props = _rxjsBundlesRxMinJs.Observable.combineLatest(globalStates, this._model.toObservable(), (globalState, instanceState) => Object.assign({}, globalState, instanceState, {
      diagnostics: this._filterDiagnostics(globalState.diagnostics, instanceState.textFilter.pattern, instanceState.hiddenTypes),
      onTypeFilterChange: this._handleTypeFilterChange,
      onTextFilterChange: this._handleTextFilterChange,
      selectMessage: this._selectMessage,
      gotoMessageLocation: goToDiagnosticLocation,
      supportedMessageKinds: globalState.supportedMessageKinds
    }));

    // "Mute" the props stream when the view is hidden so we don't do unnecessary updates.
    this._props = (0, (_observable || _load_observable()).toggle)(props, visibility);
  }

  destroy() {
    this._disposables.dispose();
  }

  getTitle() {
    return 'Diagnostics';
  }

  getIconName() {
    return 'law';
  }

  getURI() {
    return WORKSPACE_VIEW_URI;
  }

  getDefaultLocation() {
    return 'bottom';
  }

  serialize() {
    const { hiddenTypes } = this._model.state;
    return {
      deserializer: 'atom-ide-ui.DiagnosticsViewModel',
      state: {
        hiddenTypes: [...hiddenTypes]
      }
    };
  }

  getElement() {
    if (this._element == null) {
      const Component = (0, (_bindObservableAsProps || _load_bindObservableAsProps()).bindObservableAsProps)(this._props, (_DiagnosticsUi || _load_DiagnosticsUi()).default);
      const element = (0, (_renderReactRoot || _load_renderReactRoot()).renderReactRoot)(_react.default.createElement(Component, null));
      element.classList.add('diagnostics-ui');
      this._element = element;
    }
    return this._element;
  }

  /**
   * Toggle the filter.
   */


  // TODO: Memoize this.
  _filterDiagnostics(diagnostics, pattern, hiddenTypes) {
    return diagnostics.filter(message => {
      if (hiddenTypes.has(getMessageFilterType(message))) {
        return false;
      }
      if (pattern == null) {
        return true;
      }
      return message.text != null && pattern.test(message.text) || message.html != null && pattern.test(message.html) || pattern.test(message.providerName) || message.scope === 'file' && pattern.test(message.filePath);
    });
  }

}

exports.DiagnosticsViewModel = DiagnosticsViewModel;

var _initialiseProps = function () {
  this._handleTypeFilterChange = type => {
    const { hiddenTypes } = this._model.state;
    const hidden = hiddenTypes.has(type);
    const nextHiddenTypes = new Set(hiddenTypes);
    if (hidden) {
      nextHiddenTypes.delete(type);
    } else {
      nextHiddenTypes.add(type);
    }
    this._model.setState({ hiddenTypes: nextHiddenTypes });
  };

  this._handleTextFilterChange = value => {
    const { text, isRegExp } = value;
    // TODO: Fuzzy if !isRegExp?
    const { invalid, pattern } = (0, (_RegExpFilter || _load_RegExpFilter()).getFilterPattern)(text, isRegExp);
    this._model.setState({
      textFilter: { text, isRegExp, invalid, pattern }
    });
  };

  this._selectMessage = message => {
    this._model.setState({ selectedMessage: message });
  };
};

function getMessageFilterType(message) {
  const { kind } = message;
  switch (kind) {
    case 'lint':
    case null:
    case undefined:
      // We have a separate button for each severity.
      switch (message.type) {
        case 'Error':
          return 'errors';
        case 'Warning':
          return 'warnings';
        case 'Info':
          return 'warnings';
        default:
          message.type;
          throw new Error(`Invalid message severity: ${message.type}`);
      }
    case 'review':
      return 'review';
    default:
      kind;
      throw new Error(`Invalid message kind: ${kind}`);
  }
}

function goToDiagnosticLocation(message, options) {
  if (message.scope !== 'file' || message.filePath == null) {
    return;
  }

  (_analytics || _load_analytics()).default.track('diagnostics-panel-goto-location');

  const uri = message.filePath;
  // If initialLine is N, Atom will navigate to line N+1.
  // Flow sometimes reports a row of -1, so this ensures the line is at least one.
  const line = Math.max(message.range ? message.range.start.row : 0, 0);
  const column = 0;
  (0, (_goToLocation || _load_goToLocation()).goToLocation)(uri, {
    line,
    column,
    activatePane: options.focusEditor,
    pending: true
  });
}