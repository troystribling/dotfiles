"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyUpdateToEditor = applyUpdateToEditor;

function _classnames() {
  const data = _interopRequireDefault(require("classnames"));

  _classnames = function () {
    return data;
  };

  return data;
}

var _atom = require("atom");

function _UniversalDisposable() {
  const data = _interopRequireDefault(require("../../../../nuclide-commons/UniversalDisposable"));

  _UniversalDisposable = function () {
    return data;
  };

  return data;
}

var React = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

function _event() {
  const data = require("../../../../nuclide-commons/event");

  _event = function () {
    return data;
  };

  return data;
}

function _observable() {
  const data = require("../../../../nuclide-commons/observable");

  _observable = function () {
    return data;
  };

  return data;
}

function _goToLocation() {
  const data = require("../../../../nuclide-commons-atom/go-to-location");

  _goToLocation = function () {
    return data;
  };

  return data;
}

function _range() {
  const data = require("../../../../nuclide-commons-atom/range");

  _range = function () {
    return data;
  };

  return data;
}

function _analytics() {
  const data = _interopRequireDefault(require("../../../../nuclide-commons/analytics"));

  _analytics = function () {
    return data;
  };

  return data;
}

function _bindObservableAsProps() {
  const data = require("../../../../nuclide-commons-ui/bindObservableAsProps");

  _bindObservableAsProps = function () {
    return data;
  };

  return data;
}

var _RxMin = require("rxjs/bundles/Rx.min.js");

function _DiagnosticsPopup() {
  const data = require("./ui/DiagnosticsPopup");

  _DiagnosticsPopup = function () {
    return data;
  };

  return data;
}

function GroupUtils() {
  const data = _interopRequireWildcard(require("./GroupUtils"));

  GroupUtils = function () {
    return data;
  };

  return data;
}

function _aim() {
  const data = require("./aim");

  _aim = function () {
    return data;
  };

  return data;
}

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
 * 
 * @format
 */
const GUTTER_ID = 'diagnostics-gutter'; // TODO(mbolin): Make it so that when mousing over an element with this CSS class (or specifically,
// the child element with the "region" CSS class), we also do a showPopupFor(). This seems to be
// tricky given how the DOM of a TextEditor works today. There are div.tile elements, each of which
// has its own div.highlights element and many div.line elements. The div.highlights element has 0
// or more children, each child being a div.highlight with a child div.region. The div.region
// element is defined to be {position: absolute; pointer-events: none; z-index: -1}. The absolute
// positioning and negative z-index make it so it isn't eligible for mouseover events, so we
// might have to listen for mouseover events on TextEditor and then use its own APIs, such as
// decorationsForScreenRowRange(), to see if there is a hit target instead. Since this will be
// happening onmousemove, we also have to be careful to make sure this is not expensive.

const HIGHLIGHT_CSS = 'diagnostics-gutter-ui-highlight';
const HIGHLIGHT_CSS_LEVELS = {
  Error: 'diagnostics-gutter-ui-highlight-error',
  Warning: 'diagnostics-gutter-ui-highlight-warning',
  Info: 'diagnostics-gutter-ui-highlight-info',
  Hint: ''
};
const GUTTER_CSS_GROUPS = {
  review: 'diagnostics-gutter-ui-gutter-review',
  errors: 'diagnostics-gutter-ui-gutter-error',
  warnings: 'diagnostics-gutter-ui-gutter-warning',
  info: 'diagnostics-gutter-ui-gutter-info',
  action: 'diagnostics-gutter-ui-gutter-action',
  hidden: ''
};
const editorToMarkers = new WeakMap();
const itemToEditor = new WeakMap();
const handleMouseEnterSpawnPopupEvents = new _RxMin.Subject();
const handleMouseEnterSpawnPopupEventsObservable = handleMouseEnterSpawnPopupEvents.switchMap(({
  messages,
  diagnosticUpdater,
  gutter,
  item
}) => {
  return spawnPopup(messages, diagnosticUpdater, gutter, item).let((0, _observable().completingSwitchMap)(popupElement => {
    const innerPopupElement = popupElement.firstChild;

    if (!(innerPopupElement instanceof HTMLElement)) {
      throw new Error("Invariant violation: \"innerPopupElement instanceof HTMLElement\"");
    } // Events which should cause the popup to close.


    return _RxMin.Observable.merge((0, _aim().hoveringOrAiming)(item, innerPopupElement), // This makes sure that the popup disappears when you ctrl+tab to switch tabs.
    (0, _event().observableFromSubscribeFunction)(cb => atom.workspace.onDidChangeActivePaneItem(cb)).mapTo(false));
  })).takeWhile(Boolean);
}).share();

function applyUpdateToEditor(editor, update, diagnosticUpdater) {
  let gutter = editor.gutterWithName(GUTTER_ID);

  if (!gutter) {
    // TODO(jessicalin): Determine an appropriate priority so that the gutter:
    // (1) Shows up to the right of the line numbers.
    // (2) Shows the items that are added to it right away.
    // Using a value of 10 fixes (1), but breaks (2). This seems like it is likely a bug in Atom.
    // By default, a gutter will be destroyed when its editor is destroyed,
    // so there is no need to register a callback via onDidDestroy().
    gutter = editor.addGutter({
      name: GUTTER_ID,
      visible: false,
      // Priority is -200 by default and 0 is the line number
      priority: -1000
    });
  }

  let marker;
  let markers = editorToMarkers.get(editor); // TODO: Consider a more efficient strategy that does not blindly destroy all of the
  // existing markers.

  if (markers) {
    for (marker of markers) {
      marker.destroy();
    }

    markers.clear();
  } else {
    markers = new Set();
  }

  const rowToMessage = new Map();

  function addMessageForRow(message, row) {
    let messages = rowToMessage.get(row);

    if (!messages) {
      messages = [];
      rowToMessage.set(row, messages);
    }

    messages.push(message);
  }

  for (const message of update.messages) {
    const wordRange = message.range != null && message.range.isEmpty() ? (0, _range().wordAtPosition)(editor, message.range.start) : null;
    const range = wordRange != null ? wordRange.range : message.range;
    const highlightCssClass = (0, _classnames().default)(HIGHLIGHT_CSS, HIGHLIGHT_CSS_LEVELS[message.type]);
    let highlightMarker;

    if (range) {
      addMessageForRow(message, range.start.row); // There is no API in Atom to say: I want to put an underline on all the
      // lines in this range. The closest is "highlight" which splits your range
      // into three boxes: the part of the first line, all the lines in between
      // and the part of the last line.
      //
      // This means that some lines in the middle are going to be dropped and
      // they are going to extend all the way to the right of the buffer.
      //
      // To fix this, we can manually split it line by line and give to atom
      // those ranges.

      for (let line = range.start.row; line <= range.end.row; line++) {
        let start;
        let end;
        const lineText = editor.getTextInBufferRange(new _atom.Range([line, 0], [line + 1, 0]));

        if (line === range.start.row) {
          start = range.start.column;
        } else {
          start = (lineText.match(/^\s*/) || [''])[0].length;
        }

        if (line === range.end.row) {
          end = range.end.column;
        } else {
          // Note: this is technically off by 1 (\n) or 2 (\r\n) but Atom will
          // not extend the range past the actual characters displayed on the
          // line
          end = lineText.length;
        }

        highlightMarker = editor.markBufferRange(new _atom.Range([line, start], [line, end]));
        editor.decorateMarker(highlightMarker, {
          type: 'highlight',
          class: highlightCssClass
        });
        markers.add(highlightMarker);
      }
    } else {
      addMessageForRow(message, 0);
    }
  } // Find all of the gutter markers for the same row and combine them into one marker/popup.


  for (const [row, messages] of rowToMessage.entries()) {
    // This marker adds some UI to the gutter.
    const {
      item,
      dispose
    } = createGutterItem(messages, diagnosticUpdater, gutter);
    itemToEditor.set(item, editor);
    const gutterMarker = editor.markBufferPosition([row, 0]);
    gutter.decorateMarker(gutterMarker, {
      item
    });
    gutterMarker.onDidDestroy(dispose);
    markers.add(gutterMarker);
  }

  editorToMarkers.set(editor, markers); // Once the gutter is shown for the first time, it is displayed for the lifetime of the
  // TextEditor.

  if (update.messages.length > 0) {
    gutter.show();

    _analytics().default.track('diagnostics-show-editor-diagnostics');
  }
}

function createGutterItem(messages, diagnosticUpdater, gutter) {
  // Determine which group to display.
  const messageGroups = new Set();
  messages.forEach(msg => messageGroups.add(GroupUtils().getGroup(msg)));
  const group = GroupUtils().getHighestPriorityGroup(messageGroups);
  const item = document.createElement('span');
  const groupClassName = GUTTER_CSS_GROUPS[group];
  item.className = `diagnostics-gutter-ui-item ${groupClassName || ''}`; // Add the icon

  const icon = document.createElement('span');
  icon.className = `icon icon-${GroupUtils().getIcon(group)}`;
  item.appendChild(icon);
  const disposable = new (_UniversalDisposable().default)(handleMouseEnterSpawnPopupEventsObservable.subscribe(), _RxMin.Observable.fromEvent(item, 'mouseenter').subscribe(() => {
    handleMouseEnterSpawnPopupEvents.next({
      messages,
      diagnosticUpdater,
      gutter,
      item
    });
  }));
  return {
    item,

    dispose() {
      disposable.dispose();
    }

  };
}

function spawnPopup(messages, diagnosticUpdater, gutter, item) {
  return _RxMin.Observable.create(observer => {
    const goToLocation = (path, line) => {
      // Before we jump to the location, we want to close the popup.
      const column = 0;
      (0, _goToLocation().goToLocation)(path, {
        line,
        column
      });
      observer.complete();
    };

    const popupElement = showPopupFor(messages, item, goToLocation, diagnosticUpdater, gutter);
    observer.next(popupElement);
    return () => {
      _reactDom.default.unmountComponentAtNode(popupElement);

      if (!(popupElement.parentNode != null)) {
        throw new Error("Invariant violation: \"popupElement.parentNode != null\"");
      }

      popupElement.parentNode.removeChild(popupElement);
    };
  });
}
/**
 * Shows a popup for the diagnostic just below the specified item.
 */


function showPopupFor(messages, item, goToLocation, diagnosticUpdater, gutter) {
  // The popup will be an absolutely positioned child element of <atom-workspace> so that it appears
  // on top of everything.
  const workspaceElement = atom.views.getView(atom.workspace);
  const hostElement = document.createElement('div');
  hostElement.classList.add('diagnostics-gutter-popup'); // $FlowFixMe check parentNode for null

  workspaceElement.parentNode.appendChild(hostElement);
  const {
    bottom: itemBottom,
    top: itemTop,
    height: itemHeight
  } = item.getBoundingClientRect(); // $FlowFixMe atom$Gutter.getElement is not a documented API, but it beats using a query selector.

  const gutterContainer = gutter.getElement();
  const {
    right: gutterRight
  } = gutterContainer.getBoundingClientRect();

  const trackedFixer = (...args) => {
    diagnosticUpdater.applyFix(...args);

    _analytics().default.track('diagnostics-gutter-autofix');
  };

  const trackedGoToLocation = (filePath, line) => {
    goToLocation(filePath, line);

    _analytics().default.track('diagnostics-gutter-goto-location');
  };

  const editor = itemToEditor.get(item);

  if (!(editor != null)) {
    throw new Error("Invariant violation: \"editor != null\"");
  }

  diagnosticUpdater.fetchCodeActions(editor, messages);
  const popupTop = itemBottom;
  const BoundPopup = (0, _bindObservableAsProps().bindObservableAsProps)((0, _event().observableFromSubscribeFunction)(cb => diagnosticUpdater.observeCodeActionsForMessage(cb)).map(codeActionsForMessage => ({
    style: {
      left: gutterRight,
      top: popupTop,
      position: 'absolute'
    },
    messages,
    fixer: trackedFixer,
    goToLocation: trackedGoToLocation,
    codeActionsForMessage
  })), _DiagnosticsPopup().DiagnosticsPopup);

  _reactDom.default.render(React.createElement(BoundPopup, null), hostElement); // Check to see whether the popup is within the bounds of the TextEditor. If not, display it above
  // the glyph rather than below it.


  const editorElement = atom.views.getView(editor);
  const {
    top: editorTop,
    height: editorHeight
  } = editorElement.getBoundingClientRect();
  const popupElement = hostElement.firstElementChild;

  if (!(popupElement instanceof HTMLElement)) {
    throw new Error("Invariant violation: \"popupElement instanceof HTMLElement\"");
  }

  const popupHeight = popupElement.clientHeight;

  if (itemTop + itemHeight + popupHeight > editorTop + editorHeight) {
    popupElement.style.top = `${popupTop - popupHeight - itemHeight}px`;
  }

  try {
    return hostElement;
  } finally {
    messages.forEach(message => {
      _analytics().default.track('diagnostics-gutter-show-popup', {
        'diagnostics-provider': message.providerName,
        // flowlint-next-line sketchy-null-string:off
        'diagnostics-message': message.text || message.html || ''
      });
    });
  }
}