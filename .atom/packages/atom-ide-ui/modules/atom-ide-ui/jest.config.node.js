"use strict";

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

/* eslint-disable nuclide-internal/no-commonjs */

/* eslint-disable nuclide-internal/modules-dependencies */
const nodeConfig = require("../../jest/jest.config.node");

module.exports = Object.assign({}, nodeConfig, {
  rootDir: './',
  roots: ['<rootDir>']
});