"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVSCodeDebuggerAdapterServiceByNuclideUri = getVSCodeDebuggerAdapterServiceByNuclideUri;

function VSCodeDebuggerAdapterServiceLocal() {
  const data = _interopRequireWildcard(require("./VSCodeDebuggerAdapterService"));

  VSCodeDebuggerAdapterServiceLocal = function () {
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
function getVSCodeDebuggerAdapterServiceByNuclideUri(uri) {
  let rpcService = null; // Atom's service hub is synchronous.

  atom.packages.serviceHub.consume('nuclide-rpc-services', '0.0.0', provider => {
    rpcService = provider;
  }).dispose();

  if (rpcService != null) {
    return rpcService.getServiceByNuclideUri('VSCodeDebuggerAdapterService', uri);
  } else {
    return VSCodeDebuggerAdapterServiceLocal();
  }
}