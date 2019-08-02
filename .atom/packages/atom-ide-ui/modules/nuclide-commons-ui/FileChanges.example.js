"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileChangesExamples = void 0;

var React = _interopRequireWildcard(require("react"));

function _diffparser() {
  const data = _interopRequireDefault(require("diffparser"));

  _diffparser = function () {
    return data;
  };

  return data;
}

function _FileChanges() {
  const data = _interopRequireDefault(require("./FileChanges"));

  _FileChanges = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const sampleUnifiedDiff = `
diff --git a/some/folder/filename.js b/some/folder/filename.js
index abc123..cde456 100644
--- a/some/folder/filename.js
+++ b/some/folder/filename.js
@@ -36,6 +36,7 @@ export type SomeContext = {
   foo: bar,
 };

+import newdep from 'newdep';
 import {bla} from 'bla';
 import {qwe} from 'qwe';
 import {ertyu} from 'ertyu';
@@ -97,11 +98,11 @@ export default class MoreContext extends Something {
   props: Props;
   state: State;

-  thing: Thing;
+  thing: ?Thing;

   constructor(a, b) {
     super(a, b);
-    this.thing = new Thing();
+    this.thing = null;

     const foobar =
       barfoo;
@@ -144,8 +145,20 @@ export default class MoreContext extends Something {
   /**
    * Public API
    */
-  focus(): void {
-    this._getFoo().bar();
+  // comment comment
+  // comment comment
+  // comment comment
+  // comment comment
+  // comment comment
+  setup(): void {
+    invariant(1 === 1);
+    this.foobar();
+  }
+
+  teardown(): void {
+    invariant(this.thing != null);
+    this.thing.foo();
+    this.thing = null;
   }

   // end of hunk
`;

class FileChangesExample extends React.Component {
  render() {
    const diff = (0, _diffparser().default)(sampleUnifiedDiff);
    const changes = diff.map(file => React.createElement(_FileChanges().default, {
      diff: file,
      key: `${file.from}:${file.to}`
    }));
    return React.createElement("div", null, changes);
  }

}

const FileChangesExamples = {
  sectionName: 'FileChanges',
  description: 'Displays unified diffs in separate, per-hunk TextEditor instances',
  examples: [{
    title: 'Basic example',
    component: FileChangesExample
  }]
};
exports.FileChangesExamples = FileChangesExamples;