'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.













pathToUri = pathToUri;exports.









uriToPath = uriToPath;var _url = _interopRequireDefault(require('url'));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function pathToUri(path) {// TODO(ljw): this is not a valid way of constructing URIs.
  // The format is "file://server/absolute%20path" where
  // percent-escaping is to be used inside the path for all unsafe characters.
  // This function fails to work with does-style paths "c:\path",
  // fails to work with UNC-style paths "\\server\path",
  // and fails to escape.
  return 'file://' + path;} /**
                             * Copyright (c) 2017-present, Facebook, Inc.
                             * All rights reserved.
                             *
                             * This source code is licensed under the BSD-style license found in the
                             * LICENSE file in the root directory of this source tree. An additional grant
                             * of patent rights can be found in the PATENTS file in the same directory.
                             *
                             *  strict
                             * @format
                             */function uriToPath(uri) {// TODO: this will think that "c:\file.txt" uses the protocol "c",
  // rather than being a local filename. It also fails to recognize the host,
  // e.g. "file://server/path" vs "file://localhost/path" vs "file:///path".
  const components = _url.default.parse(uri); // Some filename returned from hhvm does not have protocol.
  if (components.protocol !== 'file:' && components.protocol != null) {throw new Error(`unexpected file protocol. Got: ${components.protocol}`);}return (components.pathname || '') + (components.hash || '');}