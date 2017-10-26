'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getSignatureDatatip;

var _atom = require('atom');

/**
 * WIP: This is just what VSCode displays. We can likely make this more Atom-y.
 */
function getSignatureDatatip(signatureHelp, point) {
  // Note: empty signatures have already been filtered out above.
  const activeSignature = signatureHelp.signatures[signatureHelp.activeSignature || 0];
  const markedStrings = [{
    type: 'markdown',
    value: activeSignature.label
  }];
  if (activeSignature.parameters != null) {
    const activeParameter = activeSignature.parameters[signatureHelp.activeParameter || 0];
    if (activeParameter != null) {
      if (activeParameter.documentation != null && activeParameter.documentation !== '') {
        markedStrings.push({
          type: 'markdown',
          value: activeParameter.documentation
        });
      }
      // Find the label inside the signature label, and bolden it.
      if (activeParameter.label !== '') {
        const idx = activeSignature.label.indexOf(activeParameter.label);
        if (idx !== -1) {
          markedStrings[0].value = activeSignature.label.substr(0, idx) + '**' + activeParameter.label + '**' + activeSignature.label.substr(idx + activeParameter.label.length);
        }
      }
    }
  }
  if (activeSignature.documentation != null && activeSignature.documentation !== '') {
    markedStrings.push({
      type: 'markdown',
      value: activeSignature.documentation
    });
  }
  return {
    markedStrings,
    range: new _atom.Range(point, point)
  };
} /**
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