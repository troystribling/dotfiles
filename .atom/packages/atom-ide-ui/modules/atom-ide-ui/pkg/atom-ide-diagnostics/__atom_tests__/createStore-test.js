"use strict";

var _atom = require("atom");

function _createStore() {
  const data = _interopRequireDefault(require("../lib/redux/createStore"));

  _createStore = function () {
    return data;
  };

  return data;
}

function Actions() {
  const data = _interopRequireWildcard(require("../lib/redux/Actions"));

  Actions = function () {
    return data;
  };

  return data;
}

function Selectors() {
  const data = _interopRequireWildcard(require("../lib/redux/Selectors"));

  Selectors = function () {
    return data;
  };

  return data;
}

function _DiagnosticUpdater() {
  const data = _interopRequireDefault(require("../lib/services/DiagnosticUpdater"));

  _DiagnosticUpdater = function () {
    return data;
  };

  return data;
}

function _MessageRangeTracker() {
  const data = _interopRequireDefault(require("../lib/MessageRangeTracker"));

  _MessageRangeTracker = function () {
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
// Test Constants
const dummyProviderA = {};
const dummyProviderB = {};
const fileMessageA = {
  providerName: 'dummyProviderA',
  type: 'Error',
  filePath: 'fileA'
};
const fileMessageA2 = {
  // Warning instead of Error
  providerName: 'dummyProviderA',
  type: 'Warning',
  filePath: 'fileA'
};
const fileMessageB = {
  providerName: 'dummyProviderB',
  type: 'Error',
  filePath: 'fileB'
};
describe('createStore', () => {
  let store = null;
  let updater = null;
  let spy_fileA;
  let spy_fileA_subscription;
  let spy_fileB;
  let spy_fileB_subscription;
  let spy_allMessages;
  let spy_allMessages_subscription;

  const disposeSpies = () => {
    if (spy_fileA_subscription) {
      spy_fileA_subscription.dispose();
    }

    if (spy_fileB_subscription) {
      spy_fileB_subscription.dispose();
    }

    if (spy_allMessages_subscription) {
      spy_allMessages_subscription.dispose();
    }
  };

  const setSpies = () => {
    spy_fileA = jest.fn();
    spy_fileB = jest.fn();
    spy_allMessages = jest.fn();
    spy_fileA_subscription = updater.observeFileMessages('fileA', spy_fileA);
    spy_fileB_subscription = updater.observeFileMessages('fileB', spy_fileB);
    spy_allMessages_subscription = updater.observeMessages(spy_allMessages);
  };

  const addUpdateA = () => {
    const updateA = new Map([['fileA', [fileMessageA]]]);
    store.dispatch(Actions().updateMessages(dummyProviderA, updateA));
  };

  const addUpdateB = () => {
    const updateB = new Map([['fileB', [fileMessageB]]]);
    store.dispatch(Actions().updateMessages(dummyProviderB, updateB));
  };

  const addUpdateA2 = () => {
    const updateA2 = new Map([['fileA', [fileMessageA2]]]);
    store.dispatch(Actions().updateMessages(dummyProviderA, updateA2));
  };

  beforeEach(() => {
    store = (0, _createStore().default)(new (_MessageRangeTracker().default)());
    updater = new (_DiagnosticUpdater().default)(store);
  });
  afterEach(() => {
    disposeSpies();
  });
  it("removes the provider when it's unregistered", () => {
    addUpdateA();
    addUpdateB();
    let state = store.getState();
    expect(state.messages.size).toBe(2);
    store.dispatch(Actions().removeProvider(dummyProviderA));
    state = store.getState();
    expect(state.messages.size).toBe(1);
  });
  it('An updates only notifies listeners for the scope(s) of the update.', () => {
    // Register spies. Spies should be called with the initial data.
    setSpies();
    expect(spy_fileA.mock.calls.length).toBe(1);
    expect(spy_fileB.mock.calls.length).toBe(1);
    expect(spy_allMessages.mock.calls.length).toBe(1); // Test 1. Add file messages from one provider.

    addUpdateA(); // Expect all spies except spy_fileB to have been called.

    expect(spy_fileB.mock.calls.length).toBe(1);
    expect(spy_fileA.mock.calls.length).toBe(2);
    expect(spy_fileA.mock.calls[spy_fileA.mock.calls.length - 1]).toEqual([{
      filePath: 'fileA',
      messages: [fileMessageA]
    }]);
    expect(spy_allMessages.mock.calls.length).toBe(2);
    expect(spy_allMessages.mock.calls[spy_allMessages.mock.calls.length - 1][0]).toEqual([fileMessageA]); // Expect the getter methods on DiagnosticStore to return correct info.

    expect(Selectors().getFileMessages(store.getState(), 'fileA')).toEqual([fileMessageA]);
    const allMessages = Selectors().getMessages(store.getState());
    expect(allMessages).toEqual([fileMessageA]);
  });
  it('An update should notify listeners for the scope(s) of the update, and not affect other' + ' listeners.', () => {
    // Set the initial state of the store.
    addUpdateA(); // Register spies. Some spies should be called immediately because there is
    // data in the store.

    setSpies();
    expect(spy_fileA.mock.calls.length).toBe(1);
    expect(spy_fileA).toHaveBeenCalledWith({
      filePath: 'fileA',
      messages: [fileMessageA]
    });
    expect(spy_fileB.mock.calls.length).toBe(1);
    expect(spy_fileB).toHaveBeenCalledWith({
      filePath: 'fileB',
      messages: []
    });
    expect(spy_allMessages.mock.calls.length).toBe(1);
    expect(spy_allMessages.mock.calls[spy_allMessages.mock.calls.length - 1][0]).toEqual([fileMessageA]); // Test 2. Add file messages from a second provider.
    // They should not interfere with messages from the first provider.

    addUpdateB(); // spy_fileA experiences no change.

    expect(spy_fileA.mock.calls.length).toBe(1); // spy_fileB is called from updateB.

    expect(spy_fileB.mock.calls.length).toBe(2);
    expect(spy_fileB.mock.calls[spy_fileB.mock.calls.length - 1]).toEqual([{
      filePath: 'fileB',
      messages: [fileMessageB]
    }]); // spy_allMessages is called from data from the initial state and from updateB.

    expect(spy_allMessages.mock.calls.length).toBe(2);
    expect(spy_allMessages.mock.calls[spy_allMessages.mock.calls.length - 1][0]).toEqual([fileMessageA, fileMessageB]); // Expect the getter methods on DiagnosticStore to return correct data.

    expect(Selectors().getFileMessages(store.getState(), 'fileA')).toEqual([fileMessageA]);
    expect(Selectors().getFileMessages(store.getState(), 'fileB')).toEqual([fileMessageB]);
    const allMessages = Selectors().getMessages(store.getState());
    expect(allMessages).toEqual([fileMessageA, fileMessageB]);
  });
  it('An update from the same provider should overwrite previous messages from that' + ' provider.', () => {
    // Set the initial state of the store.
    addUpdateA();
    addUpdateB(); // Register spies. All spies should be called immediately because there is
    // relevant data in the store.

    setSpies(); // 3. Add new messages from ProviderA. They should overwrite existing
    // messages from ProviderA at the same scope.
    // ProviderB messages should remain the same.

    addUpdateA2(); // spy_fileB is called with data from the initial state.

    expect(spy_fileB.mock.calls.length).toBe(1); // spy_fileA and spy_allMessages are called with data from the
    // initial state and updateA2.

    expect(spy_fileA.mock.calls.length).toBe(2);
    expect(spy_fileA.mock.calls[spy_fileA.mock.calls.length - 1]).toEqual([{
      filePath: 'fileA',
      messages: [fileMessageA2]
    }]);
    expect(spy_allMessages.mock.calls.length).toBe(2);
    expect(spy_allMessages.mock.calls[spy_allMessages.mock.calls.length - 1][0]).toEqual([fileMessageA2, fileMessageB]); // Expect the getter methods on DiagnosticStore to return the correct info.

    expect(Selectors().getFileMessages(store.getState(), 'fileA')).toEqual([fileMessageA2]);
    expect(Selectors().getFileMessages(store.getState(), 'fileB')).toEqual([fileMessageB]);
    const allMessages = Selectors().getMessages(store.getState());
    expect(allMessages).toEqual([fileMessageA2, fileMessageB]);
  });
  describe('When an invalidation message is sent from one provider, ', () => {
    it('if specifying file scope, it should only invalidate messages from that provider for that' + ' file.', () => {
      // Set up the state of the store.
      addUpdateB();
      addUpdateA2(); // Register spies. All spies should be called immediately because there is
      // relevant data in the store.

      setSpies(); // Test 4A. Invalidate file messages from ProviderA.

      const fileInvalidationMessage = {
        scope: 'file',
        filePaths: ['fileA']
      };
      store.dispatch(Actions().invalidateMessages(dummyProviderA, fileInvalidationMessage)); // Expect spy_fileA and spy_allMessages to have been called from the
      // invalidation message.
      // File messages from ProviderA should be gone, but no other changes.
      // At this point, there should only be ProviderB file messages.

      expect(spy_fileB.mock.calls.length).toBe(1);
      expect(spy_fileA.mock.calls.length).toBe(2);
      expect(spy_fileA.mock.calls[spy_fileA.mock.calls.length - 1]).toEqual([{
        filePath: 'fileA',
        messages: []
      }]);
      expect(spy_allMessages.mock.calls.length).toBe(2);
      expect(spy_allMessages.mock.calls[spy_allMessages.mock.calls.length - 1][0]).toEqual([fileMessageB]); // Expect the getter methods on DiagnosticStore to return the correct info.

      expect(Selectors().getFileMessages(store.getState(), 'fileA')).toEqual([]);
      expect(Selectors().getFileMessages(store.getState(), 'fileB')).toEqual([fileMessageB]);
      const allMessages = Selectors().getMessages(store.getState());
      expect(allMessages).toEqual([fileMessageB]);
    });
  });
  it('When callbacks are unregistered, they are not messaged with updates.', () => {
    // Set up the state of the store.
    addUpdateB(); // Register spies. Spies should be called immediately because there is relevant data in the
    // store.

    setSpies();
    expect(spy_fileA.mock.calls.length).toBe(1);
    expect(spy_fileB.mock.calls.length).toBe(1);
    expect(spy_allMessages.mock.calls.length).toBe(1); // Test 5. Remove listeners, then invalidate all messages from ProviderB.
    // We don't need to remove spy_fileA_subscription -- it shouldn't be called anyway.

    if (!spy_fileB_subscription) {
      throw new Error("Invariant violation: \"spy_fileB_subscription\"");
    }

    spy_fileB_subscription.dispose();

    if (!spy_allMessages_subscription) {
      throw new Error("Invariant violation: \"spy_allMessages_subscription\"");
    }

    spy_allMessages_subscription.dispose(); // All messages from ProviderB should be removed.

    const providerInvalidationMessage = {
      scope: 'all'
    };
    store.dispatch(Actions().invalidateMessages(dummyProviderB, providerInvalidationMessage)); // There should have been no additional calls on the spies.

    expect(spy_fileA.mock.calls.length).toBe(1);
    expect(spy_fileB.mock.calls.length).toBe(1);
    expect(spy_allMessages.mock.calls.length).toBe(1); // Expect the getter methods on DiagnosticStore to return the correct info.

    expect(Selectors().getFileMessages(store.getState(), 'fileA')).toEqual([]);
    expect(Selectors().getFileMessages(store.getState(), 'fileB')).toEqual([]);
    expect(Selectors().getMessages(store.getState()).length).toBe(0);
  });
  describe('autofix', () => {
    const messageWithAutofix = {
      providerName: 'dummyProviderA',
      type: 'Error',
      filePath: '/tmp/fileA',
      fix: {
        oldRange: new _atom.Range([0, 0], [0, 1]),
        newText: 'FOO'
      }
    };
    let editor = null;
    beforeEach(async () => {
      editor = await atom.workspace.open('/tmp/fileA');
      editor.setText('foobar\n');
      store.dispatch(Actions().updateMessages(dummyProviderA, new Map([['/tmp/fileA', [messageWithAutofix]]])));
    });
    describe('applyFix', () => {
      it('should apply the fix to the editor', () => {
        store.dispatch(Actions().applyFix(messageWithAutofix));
        expect(editor.getText()).toEqual('FOOoobar\n');
      });
      it('should invalidate the message', () => {
        expect(Selectors().getFileMessages(store.getState(), '/tmp/fileA')).toEqual([messageWithAutofix]);
        store.dispatch(Actions().applyFix(messageWithAutofix));
        expect(Selectors().getFileMessages(store.getState(), '/tmp/fileA')).toEqual([]);
      });
    });
    describe('applyFixesForFile', () => {
      it('should apply the fixes for the given file', () => {
        store.dispatch(Actions().applyFixesForFile('/tmp/fileA'));
        expect(editor.getText()).toEqual('FOOoobar\n');
      });
    });
  });
});