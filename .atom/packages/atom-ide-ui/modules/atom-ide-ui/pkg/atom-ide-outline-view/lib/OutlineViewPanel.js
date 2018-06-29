'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OutlineViewPanelState = exports.WORKSPACE_VIEW_URI = undefined;

var _bindObservableAsProps;

function _load_bindObservableAsProps() {
  return _bindObservableAsProps = require('../../../../nuclide-commons-ui/bindObservableAsProps');
}

var _react = _interopRequireWildcard(require('react'));

var _observePaneItemVisibility;

function _load_observePaneItemVisibility() {
  return _observePaneItemVisibility = _interopRequireDefault(require('../../../../nuclide-commons-atom/observePaneItemVisibility'));
}

var _renderReactRoot;

function _load_renderReactRoot() {
  return _renderReactRoot = require('../../../../nuclide-commons-ui/renderReactRoot');
}

var _OutlineView;

function _load_OutlineView() {
  return _OutlineView = require('./OutlineView');
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const WORKSPACE_VIEW_URI = exports.WORKSPACE_VIEW_URI = 'atom://nuclide/outline-view'; /**
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

class OutlineViewPanelState {

  constructor(outlines) {
    this._outlines = outlines;
  }

  destroy() {}

  getTitle() {
    return 'Outline';
  }

  getIconName() {
    return 'list-unordered';
  }

  getPreferredWidth() {
    return 300;
  }

  getURI() {
    return WORKSPACE_VIEW_URI;
  }

  getDefaultLocation() {
    return 'right';
  }

  getElement() {
    const BoundOutlineView = (0, (_bindObservableAsProps || _load_bindObservableAsProps()).bindObservableAsProps)((0, (_observePaneItemVisibility || _load_observePaneItemVisibility()).default)(this).switchMap(visible => {
      const outlines = visible ? this._outlines : _rxjsBundlesRxMinJs.Observable.of({ kind: 'empty' });
      return outlines.map(outline => ({ outline, visible }));
    }), (_OutlineView || _load_OutlineView()).OutlineView);
    return (0, (_renderReactRoot || _load_renderReactRoot()).renderReactRoot)(_react.createElement(BoundOutlineView, null));
  }

  serialize() {
    return {
      deserializer: 'atom-ide-ui.OutlineViewPanelState'
    };
  }
}
exports.OutlineViewPanelState = OutlineViewPanelState;