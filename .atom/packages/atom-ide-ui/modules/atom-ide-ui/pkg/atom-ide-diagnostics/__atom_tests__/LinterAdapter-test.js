"use strict";

var _atom = require("atom");

function _nuclideUri() {
  const data = _interopRequireDefault(require("../../../../nuclide-commons/nuclideUri"));

  _nuclideUri = function () {
    return data;
  };

  return data;
}

var _RxMin = require("rxjs/bundles/Rx.min.js");

function _UniversalDisposable() {
  const data = _interopRequireDefault(require("../../../../nuclide-commons/UniversalDisposable"));

  _UniversalDisposable = function () {
    return data;
  };

  return data;
}

function _waits_for() {
  const data = _interopRequireDefault(require("../../../../../jest/waits_for"));

  _waits_for = function () {
    return data;
  };

  return data;
}

function _LinterAdapter() {
  const data = require("../lib/services/LinterAdapter");

  _LinterAdapter = function () {
    return data;
  };

  return data;
}

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
const grammar = 'testgrammar';

const sleep = n => new Promise(r => setTimeout(r, n));

function makePromise(ret, timeout) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(ret);
    }, timeout);
  });
}

describe('LinterAdapter', () => {
  let fakeLinter;
  let linterAdapter;
  let linterReturn;
  let fakeEditor;
  let bufferDestroyCallback;
  let textEventSubject;
  let textEventSpy;
  let busySpy;
  let busyDisposeSpy;

  function newLinterAdapter(linter) {
    return new (_LinterAdapter().LinterAdapter)(linter, busySpy);
  }

  beforeEach(() => {
    textEventSubject = new _RxMin.Subject();
    textEventSpy = jest.spyOn(require("../../../../nuclide-commons-atom/text-event"), 'observeTextEditorEvents').mockReturnValue(textEventSubject.asObservable());
    const fakeBuffer = {
      onDidDestroy(callback) {
        bufferDestroyCallback = callback;
        return new (_UniversalDisposable().default)();
      },

      isDestroyed: () => false
    };
    fakeEditor = {
      getPath() {
        return 'foo';
      },

      getGrammar() {
        return {
          scopeName: grammar
        };
      },

      getBuffer() {
        return fakeBuffer;
      }

    };
    linterReturn = Promise.resolve([]);
    fakeLinter = {
      name: 'fakeLinter',
      grammarScopes: [grammar],
      scope: 'file',
      lintsOnChange: true,
      lint: () => linterReturn
    };
    jest.spyOn(fakeLinter, 'lint');
    busyDisposeSpy = jest.fn();
    busySpy = jest.fn().mockReturnValue({
      dispose: busyDisposeSpy
    });
    linterAdapter = newLinterAdapter(fakeLinter);
  });
  afterEach(() => {
    bufferDestroyCallback = null;
  });
  it('should dispatch the linter on an event', async () => {
    textEventSubject.next(fakeEditor);
    expect(fakeLinter.lint).toHaveBeenCalled();
    expect(busySpy).toHaveBeenCalledWith('fakeLinter: running on "foo"'); // `lint` is a promise, so the busy signal should stay active.

    expect(busyDisposeSpy).not.toHaveBeenCalled();
    await (0, _waits_for().default)(() => busyDisposeSpy.mock.calls.length > 0, 'busy signal to be disposed');
  });
  it("should subscribe to 'all' when * is in grammarScopes", () => {
    newLinterAdapter({
      name: 'linter',
      grammarScopes: ['*'],
      scope: 'file',
      lintsOnChange: true,
      lint: () => linterReturn
    });
    expect(textEventSpy).toHaveBeenCalledWith('all', 'changes');
  });
  it('should work when the linter is synchronous', async () => {
    linterReturn = [{
      type: 'Error',
      filePath: 'foo'
    }];
    textEventSubject.next(fakeEditor);
    const message = await linterAdapter.getUpdates().take(1).toPromise();
    expect(message.has('foo')).toBe(true);
    expect(busySpy).toHaveBeenCalledWith('fakeLinter: running on "foo"');
    expect(busyDisposeSpy).toHaveBeenCalled();
  });

  async function shouldNotInvalidate(value) {
    const spy = jest.fn();
    linterAdapter.getInvalidations().subscribe(() => spy());
    const promise = linterAdapter.getUpdates().take(1).toPromise(); // Populate the result.

    linterReturn = [{
      type: 'Error',
      filePath: 'foo'
    }];
    textEventSubject.next(fakeEditor);
    await promise;
    linterReturn = value;
    textEventSubject.next(fakeEditor); // This is tricky - the result resolves on the next tick.

    await new Promise(resolve => process.nextTick(resolve));
    expect(spy).not.toHaveBeenCalled();
  }

  it('should not invalidate previous result when linter resolves to null', async () => {
    await shouldNotInvalidate(Promise.resolve(null));
  });
  it('should not invalidate previous result when linter resolves to undefined', async () => {
    await shouldNotInvalidate(Promise.resolve(undefined));
  });
  it('should not invalidate previous result when linter returns null', async () => {
    await shouldNotInvalidate(null);
  });
  it('should not invalidate previous result when linter returns undefined', async () => {
    await shouldNotInvalidate(undefined);
  });
  it('should not invalidate files included in an update', async () => {
    await shouldNotInvalidate([{
      type: 'Error',
      filePath: 'foo'
    }]);
  });
  it('should not reorder results', async () => {
    let numMessages = 0;
    let lastMessage = null;
    linterAdapter.getUpdates().subscribe(message => {
      numMessages++;
      lastMessage = message;
    }); // Dispatch two linter requests.

    linterReturn = makePromise([{
      type: 'Error',
      filePath: 'bar'
    }], 50);
    textEventSubject.next(fakeEditor);
    linterReturn = makePromise([{
      type: 'Error',
      filePath: 'baz'
    }], 10);
    textEventSubject.next(fakeEditor); // If we call it once with a larger value, the first promise will resolve
    // first, even though the timeout is larger

    await sleep(30);
    await sleep(30);
    await (0, _waits_for().default)(() => {
      return numMessages === 1 && lastMessage != null && lastMessage.has('baz');
    }, 'There should be only the latest message', 100);
  });
  it.skip('invalidates files on close', async () => {
    linterReturn = Promise.resolve([{
      type: 'Error',
      filePath: 'foo'
    }, {
      type: 'Error',
      filePath: 'bar'
    }]);
    textEventSubject.next(fakeEditor);
    await (0, _waits_for().default)(() => bufferDestroyCallback != null); // Wait for the first lint to finish.

    await linterAdapter.getUpdates().take(1).toPromise(); // Start a pending lint.

    linterReturn = makePromise([], 10);
    textEventSubject.next(fakeEditor);
    const promise = linterAdapter.getInvalidations().take(1).toPromise();
    bufferDestroyCallback();
    const invalidation = await promise;
    expect(invalidation).toEqual({
      scope: 'file',
      filePaths: ['foo', 'bar']
    });
  });
});
describe('message transformation functions', () => {
  const fileMessage = {
    type: 'Error',
    text: 'Uh oh',
    filePath: '/fu/bar'
  };
  const fileMessageWithName = {
    type: 'Error',
    text: 'Uh oh',
    filePath: '/fu/bar',
    name: 'Custom Linter Name'
  };
  const projectMessage = {
    type: 'Warning',
    text: 'Oh no!'
  };
  let providerName;
  let currentPath = null;
  beforeEach(() => {
    providerName = 'provider';
    currentPath = 'foo/bar';
  });
  describe('linterMessageToDiagnosticMessage', () => {
    function checkMessage(linterMessage, expected) {
      if (!providerName) {
        throw new Error("Invariant violation: \"providerName\"");
      }

      const actual = (0, _LinterAdapter().linterMessageToDiagnosticMessage)(linterMessage, providerName); // This filters out any undefined values.

      expect(JSON.stringify(actual)).toEqual(JSON.stringify(expected));
    }

    it('should turn a message with a filePath into a file scope diagnostic', () => {
      checkMessage(fileMessage, {
        providerName,
        type: fileMessage.type,
        filePath: fileMessage.filePath,
        text: fileMessage.text
      }); // Invalid types are automatically turned into "Error".

      checkMessage(Object.assign({}, fileMessage, {
        type: 'blah'
      }), {
        providerName,
        type: 'Error',
        filePath: fileMessage.filePath,
        text: fileMessage.text
      }); // Make sure the trace range gets converted.

      checkMessage(Object.assign({}, fileMessage, {
        trace: [{
          type: 'Trace',
          text: 'test',
          filePath: '/fu/bar2',
          range: [[0, 0], [0, 1]]
        }]
      }), {
        providerName,
        type: fileMessage.type,
        filePath: fileMessage.filePath,
        text: fileMessage.text,
        trace: [{
          type: 'Trace',
          text: 'test',
          filePath: '/fu/bar2',
          range: new _atom.Range([0, 0], [0, 1])
        }]
      });
    });
    it('should turn a message without a filePath into a project scope diagnostic', () => {
      checkMessage(projectMessage, {
        providerName,
        type: projectMessage.type,
        filePath: _nuclideUri().default.ensureTrailingSeparator(''),
        text: projectMessage.text
      });
    });
  });
  describe('linterMessageV2ToDiagnosticMessage', () => {
    it('should correctly convert messages', () => {
      const message = {
        location: {
          file: 'file.txt',
          position: [[0, 0], [0, 1]]
        },
        reference: {
          file: 'ref.txt',
          position: [1, 1]
        },
        excerpt: 'Error',
        severity: 'error',
        solutions: [{
          title: 'Solution',
          position: [[0, 0], [0, 1]],
          currentText: '',
          replaceWith: 'a'
        }],
        description: 'Description',
        linterName: 'test2'
      };
      const expected = {
        providerName: 'test2',
        type: 'Error',
        kind: undefined,
        filePath: 'file.txt',
        range: new _atom.Range([0, 0], [0, 1]),
        text: 'Error\nDescription',
        trace: [{
          type: 'Trace',
          text: 'Reference',
          filePath: 'ref.txt',
          range: new _atom.Range([1, 1], [1, 1])
        }],
        fix: {
          title: 'Solution',
          oldRange: new _atom.Range([0, 0], [0, 1]),
          oldText: '',
          newText: 'a'
        },
        actions: []
      };
      expect((0, _LinterAdapter().linterMessageV2ToDiagnosticMessage)(message, 'test')).toEqual(expected);
      expect((0, _LinterAdapter().linterMessageV2ToDiagnosticMessage)(Object.assign({}, message, {
        solutions: [{
          title: 'Test solution',
          position: [[0, 0], [0, 1]],
          // Since we can't match functions :(
          apply: {
            bind: () => 'dummy'
          },
          priority: 2
        }, {
          position: [[0, 0], [0, 1]],
          apply: {
            bind: () => 'dummy'
          },
          priority: 1
        }]
      }), 'test')).toEqual(Object.assign({}, expected, {
        fix: undefined,
        actions: [{
          title: 'Solution 1',
          apply: 'dummy'
        }, {
          title: 'Test solution',
          apply: 'dummy'
        }]
      }));
    });
  });
  describe('linterMessagesToDiagnosticUpdate', () => {
    function runWith(linterMessages) {
      return (0, _LinterAdapter().linterMessagesToDiagnosticUpdate)(currentPath, linterMessages, providerName);
    }

    it('should invalidate diagnostics in the current file', () => {
      const result = runWith([]);
      expect(result.get(currentPath)).toEqual([]);
    });
    it('should use the LinterProvider name when one is not specified in message', () => {
      const result = runWith([fileMessage]);
      const messages = result.get(fileMessage.filePath);

      if (!(messages != null)) {
        throw new Error("Invariant violation: \"messages != null\"");
      }

      const resultMessage = messages[0];
      expect(resultMessage.providerName).toEqual('provider');
    });
    it('should use the provider name specified in message when available', () => {
      const result = runWith([fileMessageWithName]);
      const messages = result.get(fileMessageWithName.filePath);

      if (!(messages != null)) {
        throw new Error("Invariant violation: \"messages != null\"");
      }

      const resultMessage = messages[0];
      expect(resultMessage.providerName).toEqual('Custom Linter Name');
    });
    it('should provide both project messages and file messages', () => {
      const result = runWith([fileMessage, projectMessage]); // The actual message transformations are tested in the tests from
      // linterMessageToDiagnosticMessage -- no need to duplicate them here.

      const messages = result.get(fileMessage.filePath);

      if (!(messages != null)) {
        throw new Error("Invariant violation: \"messages != null\"");
      }

      expect(messages.length).toEqual(1);
      const projectMessages = result.get(_nuclideUri().default.ensureTrailingSeparator(''));

      if (!(projectMessages != null)) {
        throw new Error("Invariant violation: \"projectMessages != null\"");
      }

      expect(projectMessages.length).toEqual(1);
    });
  });
});