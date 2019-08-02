"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("../convert");
const languageclient_1 = require("../languageclient");
const apply_edit_adapter_1 = require("./apply-edit-adapter");
const atom_1 = require("atom");
const Utils = require("../utils");
// Public: Synchronizes the documents between Atom and the language server by notifying
// each end of changes, opening, closing and other events as well as sending and applying
// changes either in whole or in part depending on what the language server supports.
class DocumentSyncAdapter {
    // Public: Create a new {DocumentSyncAdapter} for the given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server to be kept in sync.
    // * `documentSync` The document syncing options.
    // * `editorSelector` A predicate function that takes a {TextEditor} and returns a {boolean}
    //                    indicating whether this adapter should care about the contents of the editor.
    constructor(_connection, _editorSelector, documentSync, _reportBusyWhile) {
        this._connection = _connection;
        this._editorSelector = _editorSelector;
        this._reportBusyWhile = _reportBusyWhile;
        this._disposable = new atom_1.CompositeDisposable();
        this._editors = new WeakMap();
        this._versions = new Map();
        if (typeof documentSync === 'object') {
            this._documentSync = documentSync;
        }
        else {
            this._documentSync = {
                change: documentSync || languageclient_1.TextDocumentSyncKind.Full,
            };
        }
        this._disposable.add(atom.textEditors.observe(this.observeTextEditor.bind(this)));
    }
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix textDocumentSync capability either being Full or
    // Incremental.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return this.canAdaptV2(serverCapabilities) || this.canAdaptV3(serverCapabilities);
    }
    static canAdaptV2(serverCapabilities) {
        return (serverCapabilities.textDocumentSync === languageclient_1.TextDocumentSyncKind.Incremental ||
            serverCapabilities.textDocumentSync === languageclient_1.TextDocumentSyncKind.Full);
    }
    static canAdaptV3(serverCapabilities) {
        const options = serverCapabilities.textDocumentSync;
        return (options !== null &&
            typeof options === 'object' &&
            (options.change === languageclient_1.TextDocumentSyncKind.Incremental || options.change === languageclient_1.TextDocumentSyncKind.Full));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this._disposable.dispose();
    }
    // Examine a {TextEditor} and decide if we wish to observe it. If so ensure that we stop observing it
    // when it is closed or otherwise destroyed.
    //
    // * `editor` A {TextEditor} to consider for observation.
    observeTextEditor(editor) {
        const listener = editor.observeGrammar((_grammar) => this._handleGrammarChange(editor));
        this._disposable.add(editor.onDidDestroy(() => {
            this._disposable.remove(listener);
            listener.dispose();
        }));
        this._disposable.add(listener);
        if (!this._editors.has(editor) && this._editorSelector(editor)) {
            this._handleNewEditor(editor);
        }
    }
    _handleGrammarChange(editor) {
        const sync = this._editors.get(editor);
        if (sync != null && !this._editorSelector(editor)) {
            this._editors.delete(editor);
            this._disposable.remove(sync);
            sync.didClose();
            sync.dispose();
        }
        else if (sync == null && this._editorSelector(editor)) {
            this._handleNewEditor(editor);
        }
    }
    _handleNewEditor(editor) {
        const sync = new TextEditorSyncAdapter(editor, this._connection, this._documentSync, this._versions, this._reportBusyWhile);
        this._editors.set(editor, sync);
        this._disposable.add(sync);
        this._disposable.add(editor.onDidDestroy(() => {
            const destroyedSync = this._editors.get(editor);
            if (destroyedSync) {
                this._editors.delete(editor);
                this._disposable.remove(destroyedSync);
                destroyedSync.dispose();
            }
        }));
    }
    getEditorSyncAdapter(editor) {
        return this._editors.get(editor);
    }
}
exports.default = DocumentSyncAdapter;
// Public: Keep a single {TextEditor} in sync with a given language server.
class TextEditorSyncAdapter {
    // Public: Create a {TextEditorSyncAdapter} in sync with a given language server.
    //
    // * `editor` A {TextEditor} to keep in sync.
    // * `connection` A {LanguageClientConnection} to a language server to keep in sync.
    // * `documentSync` The document syncing options.
    constructor(_editor, _connection, _documentSync, _versions, _reportBusyWhile) {
        this._editor = _editor;
        this._connection = _connection;
        this._documentSync = _documentSync;
        this._versions = _versions;
        this._reportBusyWhile = _reportBusyWhile;
        this._disposable = new atom_1.CompositeDisposable();
        this._fakeDidChangeWatchedFiles = atom.project.onDidChangeFiles == null;
        const changeTracking = this.setupChangeTracking(_documentSync);
        if (changeTracking != null) {
            this._disposable.add(changeTracking);
        }
        // These handlers are attached only if server supports them
        if (_documentSync.willSave) {
            this._disposable.add(_editor.getBuffer().onWillSave(this.willSave.bind(this)));
        }
        if (_documentSync.willSaveWaitUntil) {
            this._disposable.add(_editor.getBuffer().onWillSave(this.willSaveWaitUntil.bind(this)));
        }
        // Send close notifications unless it's explicitly disabled
        if (_documentSync.openClose !== false) {
            this._disposable.add(_editor.onDidDestroy(this.didClose.bind(this)));
        }
        this._disposable.add(_editor.onDidSave(this.didSave.bind(this)), _editor.onDidChangePath(this.didRename.bind(this)));
        this._currentUri = this.getEditorUri();
        if (_documentSync.openClose !== false) {
            this.didOpen();
        }
    }
    // The change tracking disposable listener that will ensure that changes are sent to the
    // language server as appropriate.
    setupChangeTracking(documentSync) {
        switch (documentSync.change) {
            case languageclient_1.TextDocumentSyncKind.Full:
                return this._editor.onDidChange(this.sendFullChanges.bind(this));
            case languageclient_1.TextDocumentSyncKind.Incremental:
                return this._editor.getBuffer().onDidChangeText(this.sendIncrementalChanges.bind(this));
        }
        return null;
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this._disposable.dispose();
    }
    // Get the languageId field that will be sent to the language server by simply
    // using the grammar name.
    getLanguageId() {
        return this._editor.getGrammar().name;
    }
    // Public: Create a {VersionedTextDocumentIdentifier} for the document observed by
    // this adapter including both the Uri and the current Version.
    getVersionedTextDocumentIdentifier() {
        return {
            uri: this.getEditorUri(),
            version: this._getVersion(this._editor.getPath() || ''),
        };
    }
    // Public: Send the entire document to the language server. This is used when
    // operating in Full (1) sync mode.
    sendFullChanges() {
        if (!this._isPrimaryAdapter()) {
            return;
        } // Multiple editors, we are not first
        this._bumpVersion();
        this._connection.didChangeTextDocument({
            textDocument: this.getVersionedTextDocumentIdentifier(),
            contentChanges: [{ text: this._editor.getText() }],
        });
    }
    // Public: Send the incremental text changes to the language server. This is used
    // when operating in Incremental (2) sync mode.
    //
    // * `event` The event fired by Atom to indicate the document has stopped changing
    //           including a list of changes since the last time this event fired for this
    //           text editor.
    // Note: The order of changes in the event is guaranteed top to bottom.  Language server
    // expects this in reverse.
    sendIncrementalChanges(event) {
        if (event.changes.length > 0) {
            if (!this._isPrimaryAdapter()) {
                return;
            } // Multiple editors, we are not first
            this._bumpVersion();
            this._connection.didChangeTextDocument({
                textDocument: this.getVersionedTextDocumentIdentifier(),
                contentChanges: event.changes.map(TextEditorSyncAdapter.textEditToContentChange).reverse(),
            });
        }
    }
    // Public: Convert an Atom {TextEditEvent} to a language server {TextDocumentContentChangeEvent}
    // object.
    //
    // * `change` The Atom {TextEditEvent} to convert.
    //
    // Returns a {TextDocumentContentChangeEvent} that represents the converted {TextEditEvent}.
    static textEditToContentChange(change) {
        return {
            range: convert_1.default.atomRangeToLSRange(change.oldRange),
            rangeLength: change.oldText.length,
            text: change.newText,
        };
    }
    _isPrimaryAdapter() {
        const lowestIdForBuffer = Math.min(...atom.workspace
            .getTextEditors()
            .filter((t) => t.getBuffer() === this._editor.getBuffer())
            .map((t) => t.id));
        return lowestIdForBuffer === this._editor.id;
    }
    _bumpVersion() {
        const filePath = this._editor.getPath();
        if (filePath == null) {
            return;
        }
        this._versions.set(filePath, this._getVersion(filePath) + 1);
    }
    // Ensure when the document is opened we send notification to the language server
    // so it can load it in and keep track of diagnostics etc.
    didOpen() {
        const filePath = this._editor.getPath();
        if (filePath == null) {
            return;
        } // Not yet saved
        if (!this._isPrimaryAdapter()) {
            return;
        } // Multiple editors, we are not first
        this._connection.didOpenTextDocument({
            textDocument: {
                uri: this.getEditorUri(),
                languageId: this.getLanguageId().toLowerCase(),
                version: this._getVersion(filePath),
                text: this._editor.getText(),
            },
        });
    }
    _getVersion(filePath) {
        return this._versions.get(filePath) || 1;
    }
    // Called when the {TextEditor} is closed and sends the 'didCloseTextDocument' notification to
    // the connected language server.
    didClose() {
        if (this._editor.getPath() == null) {
            return;
        } // Not yet saved
        const fileStillOpen = atom.workspace.getTextEditors().find((t) => t.getBuffer() === this._editor.getBuffer());
        if (fileStillOpen) {
            return; // Other windows or editors still have this file open
        }
        this._connection.didCloseTextDocument({ textDocument: { uri: this.getEditorUri() } });
    }
    // Called just before the {TextEditor} saves and sends the 'willSaveTextDocument' notification to
    // the connected language server.
    willSave() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const uri = this.getEditorUri();
        this._connection.willSaveTextDocument({
            textDocument: { uri },
            reason: languageclient_1.TextDocumentSaveReason.Manual,
        });
    }
    // Called just before the {TextEditor} saves, sends the 'willSaveWaitUntilTextDocument' request to
    // the connected language server and waits for the response before saving the buffer.
    willSaveWaitUntil() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._isPrimaryAdapter()) {
                return Promise.resolve();
            }
            const buffer = this._editor.getBuffer();
            const uri = this.getEditorUri();
            const title = this._editor.getLongTitle();
            const applyEditsOrTimeout = Utils.promiseWithTimeout(2500, // 2.5 seconds timeout
            this._connection.willSaveWaitUntilTextDocument({
                textDocument: { uri },
                reason: languageclient_1.TextDocumentSaveReason.Manual,
            })).then((edits) => {
                const cursor = this._editor.getCursorBufferPosition();
                apply_edit_adapter_1.default.applyEdits(buffer, convert_1.default.convertLsTextEdits(edits));
                this._editor.setCursorBufferPosition(cursor);
            }).catch((err) => {
                atom.notifications.addError('On-save action failed', {
                    description: `Failed to apply edits to ${title}`,
                    detail: err.message,
                });
                return;
            });
            const withBusySignal = this._reportBusyWhile(`Applying on-save edits for ${title}`, () => applyEditsOrTimeout);
            return withBusySignal || applyEditsOrTimeout;
        });
    }
    // Called when the {TextEditor} saves and sends the 'didSaveTextDocument' notification to
    // the connected language server.
    // Note: Right now this also sends the `didChangeWatchedFiles` notification as well but that
    // will be sent from elsewhere soon.
    didSave() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const uri = this.getEditorUri();
        const didSaveNotification = {
            textDocument: { uri, version: this._getVersion((uri)) },
        };
        if (this._documentSync.save && this._documentSync.save.includeText) {
            didSaveNotification.text = this._editor.getText();
        }
        this._connection.didSaveTextDocument(didSaveNotification);
        if (this._fakeDidChangeWatchedFiles) {
            this._connection.didChangeWatchedFiles({
                changes: [{ uri, type: languageclient_1.FileChangeType.Changed }],
            });
        }
    }
    didRename() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const oldUri = this._currentUri;
        this._currentUri = this.getEditorUri();
        if (!oldUri) {
            return; // Didn't previously have a name
        }
        if (this._documentSync.openClose !== false) {
            this._connection.didCloseTextDocument({ textDocument: { uri: oldUri } });
        }
        if (this._fakeDidChangeWatchedFiles) {
            this._connection.didChangeWatchedFiles({
                changes: [
                    { uri: oldUri, type: languageclient_1.FileChangeType.Deleted },
                    { uri: this._currentUri, type: languageclient_1.FileChangeType.Created },
                ],
            });
        }
        // Send an equivalent open event for this editor, which will now use the new
        // file path.
        if (this._documentSync.openClose !== false) {
            this.didOpen();
        }
    }
    // Public: Obtain the current {TextEditor} path and convert it to a Uri.
    getEditorUri() {
        return convert_1.default.pathToUri(this._editor.getPath() || '');
    }
}
exports.TextEditorSyncAdapter = TextEditorSyncAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQtc3luYy1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsd0NBQWlDO0FBQ2pDLHNEQVUyQjtBQUMzQiw2REFBb0Q7QUFDcEQsK0JBTWM7QUFDZCxrQ0FBa0M7QUFFbEMsdUZBQXVGO0FBQ3ZGLHlGQUF5RjtBQUN6RixxRkFBcUY7QUFDckYsTUFBcUIsbUJBQW1CO0lBa0N0Qyw0RUFBNEU7SUFDNUUsRUFBRTtJQUNGLHlGQUF5RjtJQUN6RixpREFBaUQ7SUFDakQsNEZBQTRGO0lBQzVGLG1HQUFtRztJQUNuRyxZQUNVLFdBQXFDLEVBQ3JDLGVBQWdELEVBQ3hELFlBQXdFLEVBQ2hFLGdCQUF1QztRQUh2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBMEI7UUFDckMsb0JBQWUsR0FBZixlQUFlLENBQWlDO1FBRWhELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBdUI7UUEzQ3pDLGdCQUFXLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRXhDLGFBQVEsR0FBK0MsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUNyRSxjQUFTLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUM7UUEwQ2pELElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1NBQ25DO2FBQU07WUFDTCxJQUFJLENBQUMsYUFBYSxHQUFHO2dCQUNuQixNQUFNLEVBQUUsWUFBWSxJQUFJLHFDQUFvQixDQUFDLElBQUk7YUFDbEQsQ0FBQztTQUNIO1FBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQWhERCxnRkFBZ0Y7SUFDaEYsMEZBQTBGO0lBQzFGLGVBQWU7SUFDZixFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxrQkFBc0M7UUFDOUQsT0FBTyxDQUNMLGtCQUFrQixDQUFDLGdCQUFnQixLQUFLLHFDQUFvQixDQUFDLFdBQVc7WUFDeEUsa0JBQWtCLENBQUMsZ0JBQWdCLEtBQUsscUNBQW9CLENBQUMsSUFBSSxDQUNsRSxDQUFDO0lBQ0osQ0FBQztJQUVPLE1BQU0sQ0FBQyxVQUFVLENBQUMsa0JBQXNDO1FBQzlELE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDO1FBQ3BELE9BQU8sQ0FDTCxPQUFPLEtBQUssSUFBSTtZQUNoQixPQUFPLE9BQU8sS0FBSyxRQUFRO1lBQzNCLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxxQ0FBb0IsQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxxQ0FBb0IsQ0FBQyxJQUFJLENBQUMsQ0FDdEcsQ0FBQztJQUNKLENBQUM7SUF3QkQsNkVBQTZFO0lBQ3RFLE9BQU87UUFDWixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRCxxR0FBcUc7SUFDckcsNENBQTRDO0lBQzVDLEVBQUU7SUFDRix5REFBeUQ7SUFDbEQsaUJBQWlCLENBQUMsTUFBa0I7UUFDekMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDeEYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQ2xCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDOUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQUVPLG9CQUFvQixDQUFDLE1BQWtCO1FBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDakQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoQjthQUFNLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3ZELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQjtJQUNILENBQUM7SUFFTyxnQkFBZ0IsQ0FBQyxNQUFrQjtRQUN6QyxNQUFNLElBQUksR0FBRyxJQUFJLHFCQUFxQixDQUNwQyxNQUFNLEVBQ04sSUFBSSxDQUFDLFdBQVcsRUFDaEIsSUFBSSxDQUFDLGFBQWEsRUFDbEIsSUFBSSxDQUFDLFNBQVMsRUFDZCxJQUFJLENBQUMsZ0JBQWdCLENBQ3RCLENBQUM7UUFDRixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQ2xCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFO1lBQ3ZCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELElBQUksYUFBYSxFQUFFO2dCQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3ZDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUN6QjtRQUNILENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBRU0sb0JBQW9CLENBQUMsTUFBa0I7UUFDNUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUFwSEQsc0NBb0hDO0FBRUQsMkVBQTJFO0FBQzNFLE1BQWEscUJBQXFCO0lBS2hDLGlGQUFpRjtJQUNqRixFQUFFO0lBQ0YsNkNBQTZDO0lBQzdDLG9GQUFvRjtJQUNwRixpREFBaUQ7SUFDakQsWUFDVSxPQUFtQixFQUNuQixXQUFxQyxFQUNyQyxhQUFzQyxFQUN0QyxTQUE4QixFQUM5QixnQkFBdUM7UUFKdkMsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUNuQixnQkFBVyxHQUFYLFdBQVcsQ0FBMEI7UUFDckMsa0JBQWEsR0FBYixhQUFhLENBQXlCO1FBQ3RDLGNBQVMsR0FBVCxTQUFTLENBQXFCO1FBQzlCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBdUI7UUFkekMsZ0JBQVcsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFnQjlDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQztRQUV4RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDL0QsSUFBSSxjQUFjLElBQUksSUFBSSxFQUFFO1lBQzFCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsMkRBQTJEO1FBQzNELElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRTtZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNoRjtRQUNELElBQUksYUFBYSxDQUFDLGlCQUFpQixFQUFFO1lBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDekY7UUFDRCwyREFBMkQ7UUFDM0QsSUFBSSxhQUFhLENBQUMsU0FBUyxLQUFLLEtBQUssRUFBRTtZQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0RTtRQUNELElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUNsQixPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQzFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDbkQsQ0FBQztRQUVGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRXZDLElBQUksYUFBYSxDQUFDLFNBQVMsS0FBSyxLQUFLLEVBQUU7WUFDckMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQztJQUVELHdGQUF3RjtJQUN4RixrQ0FBa0M7SUFDM0IsbUJBQW1CLENBQUMsWUFBcUM7UUFDOUQsUUFBUSxZQUFZLENBQUMsTUFBTSxFQUFFO1lBQzNCLEtBQUsscUNBQW9CLENBQUMsSUFBSTtnQkFDNUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25FLEtBQUsscUNBQW9CLENBQUMsV0FBVztnQkFDbkMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDM0Y7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCw2RUFBNkU7SUFDdEUsT0FBTztRQUNaLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVELDhFQUE4RTtJQUM5RSwwQkFBMEI7SUFDbkIsYUFBYTtRQUNsQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3hDLENBQUM7SUFFRCxrRkFBa0Y7SUFDbEYsK0RBQStEO0lBQ3hELGtDQUFrQztRQUN2QyxPQUFPO1lBQ0wsR0FBRyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDeEIsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7U0FDeEQsQ0FBQztJQUNKLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsbUNBQW1DO0lBQzVCLGVBQWU7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO1lBQUUsT0FBTztTQUFFLENBQUMscUNBQXFDO1FBRWhGLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDO1lBQ3JDLFlBQVksRUFBRSxJQUFJLENBQUMsa0NBQWtDLEVBQUU7WUFDdkQsY0FBYyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1NBQ25ELENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxpRkFBaUY7SUFDakYsK0NBQStDO0lBQy9DLEVBQUU7SUFDRixrRkFBa0Y7SUFDbEYsc0ZBQXNGO0lBQ3RGLHlCQUF5QjtJQUN6Qix3RkFBd0Y7SUFDeEYsMkJBQTJCO0lBQ3BCLHNCQUFzQixDQUFDLEtBQWlDO1FBQzdELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtnQkFBRSxPQUFPO2FBQUUsQ0FBQyxxQ0FBcUM7WUFFaEYsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMscUJBQXFCLENBQUM7Z0JBQ3JDLFlBQVksRUFBRSxJQUFJLENBQUMsa0NBQWtDLEVBQUU7Z0JBQ3ZELGNBQWMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLE9BQU8sRUFBRTthQUMzRixDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFFRCxnR0FBZ0c7SUFDaEcsVUFBVTtJQUNWLEVBQUU7SUFDRixrREFBa0Q7SUFDbEQsRUFBRTtJQUNGLDRGQUE0RjtJQUNyRixNQUFNLENBQUMsdUJBQXVCLENBQUMsTUFBa0I7UUFDdEQsT0FBTztZQUNMLEtBQUssRUFBRSxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDbEQsV0FBVyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNsQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU87U0FDckIsQ0FBQztJQUNKLENBQUM7SUFFTyxpQkFBaUI7UUFDdkIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUNoQyxHQUFHLElBQUksQ0FBQyxTQUFTO2FBQ2QsY0FBYyxFQUFFO2FBQ2hCLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7YUFDekQsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ3BCLENBQUM7UUFDRixPQUFPLGlCQUFpQixLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0lBQy9DLENBQUM7SUFFTyxZQUFZO1FBQ2xCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDeEMsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO1lBQUUsT0FBTztTQUFFO1FBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxpRkFBaUY7SUFDakYsMERBQTBEO0lBQ2xELE9BQU87UUFDYixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hDLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUFFLE9BQU87U0FBRSxDQUFDLGdCQUFnQjtRQUVsRCxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7WUFBRSxPQUFPO1NBQUUsQ0FBQyxxQ0FBcUM7UUFFaEYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQztZQUNuQyxZQUFZLEVBQUU7Z0JBQ1osR0FBRyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ3hCLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUM5QyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUM3QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxXQUFXLENBQUMsUUFBZ0I7UUFDbEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELDhGQUE4RjtJQUM5RixpQ0FBaUM7SUFDMUIsUUFBUTtRQUNiLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFBRSxPQUFPO1NBQUUsQ0FBQyxnQkFBZ0I7UUFFaEUsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDOUcsSUFBSSxhQUFhLEVBQUU7WUFDakIsT0FBTyxDQUFDLHFEQUFxRDtTQUM5RDtRQUVELElBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFFRCxpR0FBaUc7SUFDakcsaUNBQWlDO0lBQzFCLFFBQVE7UUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFFMUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUM7WUFDcEMsWUFBWSxFQUFFLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLE1BQU0sRUFBRSx1Q0FBc0IsQ0FBQyxNQUFNO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxrR0FBa0c7SUFDbEcscUZBQXFGO0lBQ3hFLGlCQUFpQjs7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO2dCQUFFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQUU7WUFFNUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUUxQyxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FDbEQsSUFBSSxFQUFFLHNCQUFzQjtZQUM1QixJQUFJLENBQUMsV0FBVyxDQUFDLDZCQUE2QixDQUFDO2dCQUM3QyxZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3JCLE1BQU0sRUFBRSx1Q0FBc0IsQ0FBQyxNQUFNO2FBQ3RDLENBQUMsQ0FDSCxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNmLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDdEQsNEJBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUU7b0JBQ25ELFdBQVcsRUFBRSw0QkFBNEIsS0FBSyxFQUFFO29CQUNoRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE9BQU87aUJBQ3BCLENBQUMsQ0FBQztnQkFDSCxPQUFPO1lBQ1QsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLGNBQWMsR0FDbEIsSUFBSSxDQUFDLGdCQUFnQixDQUNuQiw4QkFBOEIsS0FBSyxFQUFFLEVBQ3JDLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUMxQixDQUFDO1lBQ0osT0FBTyxjQUFjLElBQUksbUJBQW1CLENBQUM7UUFDL0MsQ0FBQztLQUFBO0lBRUQseUZBQXlGO0lBQ3pGLGlDQUFpQztJQUNqQyw0RkFBNEY7SUFDNUYsb0NBQW9DO0lBQzdCLE9BQU87UUFDWixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFFMUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2hDLE1BQU0sbUJBQW1CLEdBQUc7WUFDMUIsWUFBWSxFQUFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtTQUMzQixDQUFDO1FBQy9CLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2xFLG1CQUFtQixDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzFELElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFO1lBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMscUJBQXFCLENBQUM7Z0JBQ3JDLE9BQU8sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSwrQkFBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVNLFNBQVM7UUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFFMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN2QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTyxDQUFDLGdDQUFnQztTQUN6QztRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEtBQUssS0FBSyxFQUFFO1lBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzFFO1FBRUQsSUFBSSxJQUFJLENBQUMsMEJBQTBCLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQztnQkFDckMsT0FBTyxFQUFFO29CQUNQLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsK0JBQWMsQ0FBQyxPQUFPLEVBQUU7b0JBQzdDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLCtCQUFjLENBQUMsT0FBTyxFQUFFO2lCQUN4RDthQUNGLENBQUMsQ0FBQztTQUNKO1FBRUQsNEVBQTRFO1FBQzVFLGFBQWE7UUFDYixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxLQUFLLEtBQUssRUFBRTtZQUMxQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEI7SUFDSCxDQUFDO0lBRUQsd0VBQXdFO0lBQ2pFLFlBQVk7UUFDakIsT0FBTyxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDRjtBQXRSRCxzREFzUkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgRmlsZUNoYW5nZVR5cGUsXG4gIFRleHREb2N1bWVudFNhdmVSZWFzb24sXG4gIFRleHREb2N1bWVudFN5bmNLaW5kLFxuICBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyxcbiAgVGV4dERvY3VtZW50Q29udGVudENoYW5nZUV2ZW50LFxuICBWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG4gIERpZFNhdmVUZXh0RG9jdW1lbnRQYXJhbXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCBBcHBseUVkaXRBZGFwdGVyIGZyb20gJy4vYXBwbHktZWRpdC1hZGFwdGVyJztcbmltcG9ydCB7XG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIERpc3Bvc2FibGUsXG4gIFRleHRFZGl0b3IsXG4gIEJ1ZmZlclN0b3BwZWRDaGFuZ2luZ0V2ZW50LFxuICBUZXh0Q2hhbmdlLFxufSBmcm9tICdhdG9tJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL3V0aWxzJztcblxuLy8gUHVibGljOiBTeW5jaHJvbml6ZXMgdGhlIGRvY3VtZW50cyBiZXR3ZWVuIEF0b20gYW5kIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgYnkgbm90aWZ5aW5nXG4vLyBlYWNoIGVuZCBvZiBjaGFuZ2VzLCBvcGVuaW5nLCBjbG9zaW5nIGFuZCBvdGhlciBldmVudHMgYXMgd2VsbCBhcyBzZW5kaW5nIGFuZCBhcHBseWluZ1xuLy8gY2hhbmdlcyBlaXRoZXIgaW4gd2hvbGUgb3IgaW4gcGFydCBkZXBlbmRpbmcgb24gd2hhdCB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHN1cHBvcnRzLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRG9jdW1lbnRTeW5jQWRhcHRlciB7XG4gIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICBwdWJsaWMgX2RvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY09wdGlvbnM7XG4gIHByaXZhdGUgX2VkaXRvcnM6IFdlYWtNYXA8VGV4dEVkaXRvciwgVGV4dEVkaXRvclN5bmNBZGFwdGVyPiA9IG5ldyBXZWFrTWFwKCk7XG4gIHByaXZhdGUgX3ZlcnNpb25zOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXG4gIC8vIFB1YmxpYzogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBhZGFwdGVyIGNhbiBiZSB1c2VkIHRvIGFkYXB0IGEgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGJhc2VkIG9uIHRoZSBzZXJ2ZXJDYXBhYmlsaXRpZXMgbWF0cml4IHRleHREb2N1bWVudFN5bmMgY2FwYWJpbGl0eSBlaXRoZXIgYmVpbmcgRnVsbCBvclxuICAvLyBJbmNyZW1lbnRhbC5cbiAgLy9cbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byBjb25zaWRlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNhbkFkYXB0VjIoc2VydmVyQ2FwYWJpbGl0aWVzKSB8fCB0aGlzLmNhbkFkYXB0VjMoc2VydmVyQ2FwYWJpbGl0aWVzKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGNhbkFkYXB0VjIoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLnRleHREb2N1bWVudFN5bmMgPT09IFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsIHx8XG4gICAgICBzZXJ2ZXJDYXBhYmlsaXRpZXMudGV4dERvY3VtZW50U3luYyA9PT0gVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBjYW5BZGFwdFYzKHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHNlcnZlckNhcGFiaWxpdGllcy50ZXh0RG9jdW1lbnRTeW5jO1xuICAgIHJldHVybiAoXG4gICAgICBvcHRpb25zICE9PSBudWxsICYmXG4gICAgICB0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcgJiZcbiAgICAgIChvcHRpb25zLmNoYW5nZSA9PT0gVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWwgfHwgb3B0aW9ucy5jaGFuZ2UgPT09IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwpXG4gICAgKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEgbmV3IHtEb2N1bWVudFN5bmNBZGFwdGVyfSBmb3IgdGhlIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIGJlIGtlcHQgaW4gc3luYy5cbiAgLy8gKiBgZG9jdW1lbnRTeW5jYCBUaGUgZG9jdW1lbnQgc3luY2luZyBvcHRpb25zLlxuICAvLyAqIGBlZGl0b3JTZWxlY3RvcmAgQSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHtUZXh0RWRpdG9yfSBhbmQgcmV0dXJucyBhIHtib29sZWFufVxuICAvLyAgICAgICAgICAgICAgICAgICAgaW5kaWNhdGluZyB3aGV0aGVyIHRoaXMgYWRhcHRlciBzaG91bGQgY2FyZSBhYm91dCB0aGUgY29udGVudHMgb2YgdGhlIGVkaXRvci5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIHByaXZhdGUgX2VkaXRvclNlbGVjdG9yOiAoZWRpdG9yOiBUZXh0RWRpdG9yKSA9PiBib29sZWFuLFxuICAgIGRvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY09wdGlvbnMgfCBUZXh0RG9jdW1lbnRTeW5jS2luZCB8IHVuZGVmaW5lZCxcbiAgICBwcml2YXRlIF9yZXBvcnRCdXN5V2hpbGU6IFV0aWxzLlJlcG9ydEJ1c3lXaGlsZSxcbiAgKSB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudFN5bmMgPT09ICdvYmplY3QnKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudFN5bmMgPSBkb2N1bWVudFN5bmM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2RvY3VtZW50U3luYyA9IHtcbiAgICAgICAgY2hhbmdlOiBkb2N1bWVudFN5bmMgfHwgVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbCxcbiAgICAgIH07XG4gICAgfVxuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20udGV4dEVkaXRvcnMub2JzZXJ2ZSh0aGlzLm9ic2VydmVUZXh0RWRpdG9yLmJpbmQodGhpcykpKTtcbiAgfVxuXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICB9XG5cbiAgLy8gRXhhbWluZSBhIHtUZXh0RWRpdG9yfSBhbmQgZGVjaWRlIGlmIHdlIHdpc2ggdG8gb2JzZXJ2ZSBpdC4gSWYgc28gZW5zdXJlIHRoYXQgd2Ugc3RvcCBvYnNlcnZpbmcgaXRcbiAgLy8gd2hlbiBpdCBpcyBjbG9zZWQgb3Igb3RoZXJ3aXNlIGRlc3Ryb3llZC5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBBIHtUZXh0RWRpdG9yfSB0byBjb25zaWRlciBmb3Igb2JzZXJ2YXRpb24uXG4gIHB1YmxpYyBvYnNlcnZlVGV4dEVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBsaXN0ZW5lciA9IGVkaXRvci5vYnNlcnZlR3JhbW1hcigoX2dyYW1tYXIpID0+IHRoaXMuX2hhbmRsZUdyYW1tYXJDaGFuZ2UoZWRpdG9yKSk7XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXG4gICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUobGlzdGVuZXIpO1xuICAgICAgICBsaXN0ZW5lci5kaXNwb3NlKCk7XG4gICAgICB9KSxcbiAgICApO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGxpc3RlbmVyKTtcbiAgICBpZiAoIXRoaXMuX2VkaXRvcnMuaGFzKGVkaXRvcikgJiYgdGhpcy5fZWRpdG9yU2VsZWN0b3IoZWRpdG9yKSkge1xuICAgICAgdGhpcy5faGFuZGxlTmV3RWRpdG9yKGVkaXRvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaGFuZGxlR3JhbW1hckNoYW5nZShlZGl0b3I6IFRleHRFZGl0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBzeW5jID0gdGhpcy5fZWRpdG9ycy5nZXQoZWRpdG9yKTtcbiAgICBpZiAoc3luYyAhPSBudWxsICYmICF0aGlzLl9lZGl0b3JTZWxlY3RvcihlZGl0b3IpKSB7XG4gICAgICB0aGlzLl9lZGl0b3JzLmRlbGV0ZShlZGl0b3IpO1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc3luYyk7XG4gICAgICBzeW5jLmRpZENsb3NlKCk7XG4gICAgICBzeW5jLmRpc3Bvc2UoKTtcbiAgICB9IGVsc2UgaWYgKHN5bmMgPT0gbnVsbCAmJiB0aGlzLl9lZGl0b3JTZWxlY3RvcihlZGl0b3IpKSB7XG4gICAgICB0aGlzLl9oYW5kbGVOZXdFZGl0b3IoZWRpdG9yKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oYW5kbGVOZXdFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yKTogdm9pZCB7XG4gICAgY29uc3Qgc3luYyA9IG5ldyBUZXh0RWRpdG9yU3luY0FkYXB0ZXIoXG4gICAgICBlZGl0b3IsXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLFxuICAgICAgdGhpcy5fZG9jdW1lbnRTeW5jLFxuICAgICAgdGhpcy5fdmVyc2lvbnMsXG4gICAgICB0aGlzLl9yZXBvcnRCdXN5V2hpbGUsXG4gICAgKTtcbiAgICB0aGlzLl9lZGl0b3JzLnNldChlZGl0b3IsIHN5bmMpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHN5bmMpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxuICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlc3Ryb3llZFN5bmMgPSB0aGlzLl9lZGl0b3JzLmdldChlZGl0b3IpO1xuICAgICAgICBpZiAoZGVzdHJveWVkU3luYykge1xuICAgICAgICAgIHRoaXMuX2VkaXRvcnMuZGVsZXRlKGVkaXRvcik7XG4gICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoZGVzdHJveWVkU3luYyk7XG4gICAgICAgICAgZGVzdHJveWVkU3luYy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0RWRpdG9yU3luY0FkYXB0ZXIoZWRpdG9yOiBUZXh0RWRpdG9yKTogVGV4dEVkaXRvclN5bmNBZGFwdGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fZWRpdG9ycy5nZXQoZWRpdG9yKTtcbiAgfVxufVxuXG4vLyBQdWJsaWM6IEtlZXAgYSBzaW5nbGUge1RleHRFZGl0b3J9IGluIHN5bmMgd2l0aCBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbmV4cG9ydCBjbGFzcyBUZXh0RWRpdG9yU3luY0FkYXB0ZXIge1xuICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgcHJpdmF0ZSBfY3VycmVudFVyaTogc3RyaW5nO1xuICBwcml2YXRlIF9mYWtlRGlkQ2hhbmdlV2F0Y2hlZEZpbGVzOiBib29sZWFuO1xuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1RleHRFZGl0b3JTeW5jQWRhcHRlcn0gaW4gc3luYyB3aXRoIGEgZ2l2ZW4gbGFuZ3VhZ2Ugc2VydmVyLlxuICAvL1xuICAvLyAqIGBlZGl0b3JgIEEge1RleHRFZGl0b3J9IHRvIGtlZXAgaW4gc3luYy5cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byBhIGxhbmd1YWdlIHNlcnZlciB0byBrZWVwIGluIHN5bmMuXG4gIC8vICogYGRvY3VtZW50U3luY2AgVGhlIGRvY3VtZW50IHN5bmNpbmcgb3B0aW9ucy5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHByaXZhdGUgX2Nvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBwcml2YXRlIF9kb2N1bWVudFN5bmM6IFRleHREb2N1bWVudFN5bmNPcHRpb25zLFxuICAgIHByaXZhdGUgX3ZlcnNpb25zOiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICAgIHByaXZhdGUgX3JlcG9ydEJ1c3lXaGlsZTogVXRpbHMuUmVwb3J0QnVzeVdoaWxlLFxuICApIHtcbiAgICB0aGlzLl9mYWtlRGlkQ2hhbmdlV2F0Y2hlZEZpbGVzID0gYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlRmlsZXMgPT0gbnVsbDtcblxuICAgIGNvbnN0IGNoYW5nZVRyYWNraW5nID0gdGhpcy5zZXR1cENoYW5nZVRyYWNraW5nKF9kb2N1bWVudFN5bmMpO1xuICAgIGlmIChjaGFuZ2VUcmFja2luZyAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChjaGFuZ2VUcmFja2luZyk7XG4gICAgfVxuXG4gICAgLy8gVGhlc2UgaGFuZGxlcnMgYXJlIGF0dGFjaGVkIG9ubHkgaWYgc2VydmVyIHN1cHBvcnRzIHRoZW1cbiAgICBpZiAoX2RvY3VtZW50U3luYy53aWxsU2F2ZSkge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX2VkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxTYXZlKHRoaXMud2lsbFNhdmUuYmluZCh0aGlzKSkpO1xuICAgIH1cbiAgICBpZiAoX2RvY3VtZW50U3luYy53aWxsU2F2ZVdhaXRVbnRpbCkge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX2VkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxTYXZlKHRoaXMud2lsbFNhdmVXYWl0VW50aWwuYmluZCh0aGlzKSkpO1xuICAgIH1cbiAgICAvLyBTZW5kIGNsb3NlIG5vdGlmaWNhdGlvbnMgdW5sZXNzIGl0J3MgZXhwbGljaXRseSBkaXNhYmxlZFxuICAgIGlmIChfZG9jdW1lbnRTeW5jLm9wZW5DbG9zZSAhPT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKF9lZGl0b3Iub25EaWREZXN0cm95KHRoaXMuZGlkQ2xvc2UuYmluZCh0aGlzKSkpO1xuICAgIH1cbiAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcbiAgICAgIF9lZGl0b3Iub25EaWRTYXZlKHRoaXMuZGlkU2F2ZS5iaW5kKHRoaXMpKSxcbiAgICAgIF9lZGl0b3Iub25EaWRDaGFuZ2VQYXRoKHRoaXMuZGlkUmVuYW1lLmJpbmQodGhpcykpLFxuICAgICk7XG5cbiAgICB0aGlzLl9jdXJyZW50VXJpID0gdGhpcy5nZXRFZGl0b3JVcmkoKTtcblxuICAgIGlmIChfZG9jdW1lbnRTeW5jLm9wZW5DbG9zZSAhPT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuZGlkT3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBjaGFuZ2UgdHJhY2tpbmcgZGlzcG9zYWJsZSBsaXN0ZW5lciB0aGF0IHdpbGwgZW5zdXJlIHRoYXQgY2hhbmdlcyBhcmUgc2VudCB0byB0aGVcbiAgLy8gbGFuZ3VhZ2Ugc2VydmVyIGFzIGFwcHJvcHJpYXRlLlxuICBwdWJsaWMgc2V0dXBDaGFuZ2VUcmFja2luZyhkb2N1bWVudFN5bmM6IFRleHREb2N1bWVudFN5bmNPcHRpb25zKTogRGlzcG9zYWJsZSB8IG51bGwge1xuICAgIHN3aXRjaCAoZG9jdW1lbnRTeW5jLmNoYW5nZSkge1xuICAgICAgY2FzZSBUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsOlxuICAgICAgICByZXR1cm4gdGhpcy5fZWRpdG9yLm9uRGlkQ2hhbmdlKHRoaXMuc2VuZEZ1bGxDaGFuZ2VzLmJpbmQodGhpcykpO1xuICAgICAgY2FzZSBUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZVRleHQodGhpcy5zZW5kSW5jcmVtZW50YWxDaGFuZ2VzLmJpbmQodGhpcykpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBsYW5ndWFnZUlkIGZpZWxkIHRoYXQgd2lsbCBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgYnkgc2ltcGx5XG4gIC8vIHVzaW5nIHRoZSBncmFtbWFyIG5hbWUuXG4gIHB1YmxpYyBnZXRMYW5ndWFnZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2VkaXRvci5nZXRHcmFtbWFyKCkubmFtZTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1ZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXJ9IGZvciB0aGUgZG9jdW1lbnQgb2JzZXJ2ZWQgYnlcbiAgLy8gdGhpcyBhZGFwdGVyIGluY2x1ZGluZyBib3RoIHRoZSBVcmkgYW5kIHRoZSBjdXJyZW50IFZlcnNpb24uXG4gIHB1YmxpYyBnZXRWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyKCk6IFZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXIge1xuICAgIHJldHVybiB7XG4gICAgICB1cmk6IHRoaXMuZ2V0RWRpdG9yVXJpKCksXG4gICAgICB2ZXJzaW9uOiB0aGlzLl9nZXRWZXJzaW9uKHRoaXMuX2VkaXRvci5nZXRQYXRoKCkgfHwgJycpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgdGhlIGVudGlyZSBkb2N1bWVudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyLiBUaGlzIGlzIHVzZWQgd2hlblxuICAvLyBvcGVyYXRpbmcgaW4gRnVsbCAoMSkgc3luYyBtb2RlLlxuICBwdWJsaWMgc2VuZEZ1bGxDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfSAvLyBNdWx0aXBsZSBlZGl0b3JzLCB3ZSBhcmUgbm90IGZpcnN0XG5cbiAgICB0aGlzLl9idW1wVmVyc2lvbigpO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24uZGlkQ2hhbmdlVGV4dERvY3VtZW50KHtcbiAgICAgIHRleHREb2N1bWVudDogdGhpcy5nZXRWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyKCksXG4gICAgICBjb250ZW50Q2hhbmdlczogW3sgdGV4dDogdGhpcy5fZWRpdG9yLmdldFRleHQoKSB9XSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCB0aGUgaW5jcmVtZW50YWwgdGV4dCBjaGFuZ2VzIHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuIFRoaXMgaXMgdXNlZFxuICAvLyB3aGVuIG9wZXJhdGluZyBpbiBJbmNyZW1lbnRhbCAoMikgc3luYyBtb2RlLlxuICAvL1xuICAvLyAqIGBldmVudGAgVGhlIGV2ZW50IGZpcmVkIGJ5IEF0b20gdG8gaW5kaWNhdGUgdGhlIGRvY3VtZW50IGhhcyBzdG9wcGVkIGNoYW5naW5nXG4gIC8vICAgICAgICAgICBpbmNsdWRpbmcgYSBsaXN0IG9mIGNoYW5nZXMgc2luY2UgdGhlIGxhc3QgdGltZSB0aGlzIGV2ZW50IGZpcmVkIGZvciB0aGlzXG4gIC8vICAgICAgICAgICB0ZXh0IGVkaXRvci5cbiAgLy8gTm90ZTogVGhlIG9yZGVyIG9mIGNoYW5nZXMgaW4gdGhlIGV2ZW50IGlzIGd1YXJhbnRlZWQgdG9wIHRvIGJvdHRvbS4gIExhbmd1YWdlIHNlcnZlclxuICAvLyBleHBlY3RzIHRoaXMgaW4gcmV2ZXJzZS5cbiAgcHVibGljIHNlbmRJbmNyZW1lbnRhbENoYW5nZXMoZXZlbnQ6IEJ1ZmZlclN0b3BwZWRDaGFuZ2luZ0V2ZW50KTogdm9pZCB7XG4gICAgaWYgKGV2ZW50LmNoYW5nZXMubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCF0aGlzLl9pc1ByaW1hcnlBZGFwdGVyKCkpIHsgcmV0dXJuOyB9IC8vIE11bHRpcGxlIGVkaXRvcnMsIHdlIGFyZSBub3QgZmlyc3RcblxuICAgICAgdGhpcy5fYnVtcFZlcnNpb24oKTtcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uZGlkQ2hhbmdlVGV4dERvY3VtZW50KHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB0aGlzLmdldFZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXIoKSxcbiAgICAgICAgY29udGVudENoYW5nZXM6IGV2ZW50LmNoYW5nZXMubWFwKFRleHRFZGl0b3JTeW5jQWRhcHRlci50ZXh0RWRpdFRvQ29udGVudENoYW5nZSkucmV2ZXJzZSgpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIEF0b20ge1RleHRFZGl0RXZlbnR9IHRvIGEgbGFuZ3VhZ2Ugc2VydmVyIHtUZXh0RG9jdW1lbnRDb250ZW50Q2hhbmdlRXZlbnR9XG4gIC8vIG9iamVjdC5cbiAgLy9cbiAgLy8gKiBgY2hhbmdlYCBUaGUgQXRvbSB7VGV4dEVkaXRFdmVudH0gdG8gY29udmVydC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtUZXh0RG9jdW1lbnRDb250ZW50Q2hhbmdlRXZlbnR9IHRoYXQgcmVwcmVzZW50cyB0aGUgY29udmVydGVkIHtUZXh0RWRpdEV2ZW50fS5cbiAgcHVibGljIHN0YXRpYyB0ZXh0RWRpdFRvQ29udGVudENoYW5nZShjaGFuZ2U6IFRleHRDaGFuZ2UpOiBUZXh0RG9jdW1lbnRDb250ZW50Q2hhbmdlRXZlbnQge1xuICAgIHJldHVybiB7XG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UoY2hhbmdlLm9sZFJhbmdlKSxcbiAgICAgIHJhbmdlTGVuZ3RoOiBjaGFuZ2Uub2xkVGV4dC5sZW5ndGgsXG4gICAgICB0ZXh0OiBjaGFuZ2UubmV3VGV4dCxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfaXNQcmltYXJ5QWRhcHRlcigpOiBib29sZWFuIHtcbiAgICBjb25zdCBsb3dlc3RJZEZvckJ1ZmZlciA9IE1hdGgubWluKFxuICAgICAgLi4uYXRvbS53b3Jrc3BhY2VcbiAgICAgICAgLmdldFRleHRFZGl0b3JzKClcbiAgICAgICAgLmZpbHRlcigodCkgPT4gdC5nZXRCdWZmZXIoKSA9PT0gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpKVxuICAgICAgICAubWFwKCh0KSA9PiB0LmlkKSxcbiAgICApO1xuICAgIHJldHVybiBsb3dlc3RJZEZvckJ1ZmZlciA9PT0gdGhpcy5fZWRpdG9yLmlkO1xuICB9XG5cbiAgcHJpdmF0ZSBfYnVtcFZlcnNpb24oKTogdm9pZCB7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0aGlzLl9lZGl0b3IuZ2V0UGF0aCgpO1xuICAgIGlmIChmaWxlUGF0aCA9PSBudWxsKSB7IHJldHVybjsgfVxuICAgIHRoaXMuX3ZlcnNpb25zLnNldChmaWxlUGF0aCwgdGhpcy5fZ2V0VmVyc2lvbihmaWxlUGF0aCkgKyAxKTtcbiAgfVxuXG4gIC8vIEVuc3VyZSB3aGVuIHRoZSBkb2N1bWVudCBpcyBvcGVuZWQgd2Ugc2VuZCBub3RpZmljYXRpb24gdG8gdGhlIGxhbmd1YWdlIHNlcnZlclxuICAvLyBzbyBpdCBjYW4gbG9hZCBpdCBpbiBhbmQga2VlcCB0cmFjayBvZiBkaWFnbm9zdGljcyBldGMuXG4gIHByaXZhdGUgZGlkT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuX2VkaXRvci5nZXRQYXRoKCk7XG4gICAgaWYgKGZpbGVQYXRoID09IG51bGwpIHsgcmV0dXJuOyB9IC8vIE5vdCB5ZXQgc2F2ZWRcblxuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfSAvLyBNdWx0aXBsZSBlZGl0b3JzLCB3ZSBhcmUgbm90IGZpcnN0XG5cbiAgICB0aGlzLl9jb25uZWN0aW9uLmRpZE9wZW5UZXh0RG9jdW1lbnQoe1xuICAgICAgdGV4dERvY3VtZW50OiB7XG4gICAgICAgIHVyaTogdGhpcy5nZXRFZGl0b3JVcmkoKSxcbiAgICAgICAgbGFuZ3VhZ2VJZDogdGhpcy5nZXRMYW5ndWFnZUlkKCkudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgdmVyc2lvbjogdGhpcy5fZ2V0VmVyc2lvbihmaWxlUGF0aCksXG4gICAgICAgIHRleHQ6IHRoaXMuX2VkaXRvci5nZXRUZXh0KCksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0VmVyc2lvbihmaWxlUGF0aDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdmVyc2lvbnMuZ2V0KGZpbGVQYXRoKSB8fCAxO1xuICB9XG5cbiAgLy8gQ2FsbGVkIHdoZW4gdGhlIHtUZXh0RWRpdG9yfSBpcyBjbG9zZWQgYW5kIHNlbmRzIHRoZSAnZGlkQ2xvc2VUZXh0RG9jdW1lbnQnIG5vdGlmaWNhdGlvbiB0b1xuICAvLyB0aGUgY29ubmVjdGVkIGxhbmd1YWdlIHNlcnZlci5cbiAgcHVibGljIGRpZENsb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9lZGl0b3IuZ2V0UGF0aCgpID09IG51bGwpIHsgcmV0dXJuOyB9IC8vIE5vdCB5ZXQgc2F2ZWRcblxuICAgIGNvbnN0IGZpbGVTdGlsbE9wZW4gPSBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpLmZpbmQoKHQpID0+IHQuZ2V0QnVmZmVyKCkgPT09IHRoaXMuX2VkaXRvci5nZXRCdWZmZXIoKSk7XG4gICAgaWYgKGZpbGVTdGlsbE9wZW4pIHtcbiAgICAgIHJldHVybjsgLy8gT3RoZXIgd2luZG93cyBvciBlZGl0b3JzIHN0aWxsIGhhdmUgdGhpcyBmaWxlIG9wZW5cbiAgICB9XG5cbiAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENsb3NlVGV4dERvY3VtZW50KHsgdGV4dERvY3VtZW50OiB7IHVyaTogdGhpcy5nZXRFZGl0b3JVcmkoKSB9IH0pO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGp1c3QgYmVmb3JlIHRoZSB7VGV4dEVkaXRvcn0gc2F2ZXMgYW5kIHNlbmRzIHRoZSAnd2lsbFNhdmVUZXh0RG9jdW1lbnQnIG5vdGlmaWNhdGlvbiB0b1xuICAvLyB0aGUgY29ubmVjdGVkIGxhbmd1YWdlIHNlcnZlci5cbiAgcHVibGljIHdpbGxTYXZlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfVxuXG4gICAgY29uc3QgdXJpID0gdGhpcy5nZXRFZGl0b3JVcmkoKTtcbiAgICB0aGlzLl9jb25uZWN0aW9uLndpbGxTYXZlVGV4dERvY3VtZW50KHtcbiAgICAgIHRleHREb2N1bWVudDogeyB1cmkgfSxcbiAgICAgIHJlYXNvbjogVGV4dERvY3VtZW50U2F2ZVJlYXNvbi5NYW51YWwsXG4gICAgfSk7XG4gIH1cblxuICAvLyBDYWxsZWQganVzdCBiZWZvcmUgdGhlIHtUZXh0RWRpdG9yfSBzYXZlcywgc2VuZHMgdGhlICd3aWxsU2F2ZVdhaXRVbnRpbFRleHREb2N1bWVudCcgcmVxdWVzdCB0b1xuICAvLyB0aGUgY29ubmVjdGVkIGxhbmd1YWdlIHNlcnZlciBhbmQgd2FpdHMgZm9yIHRoZSByZXNwb25zZSBiZWZvcmUgc2F2aW5nIHRoZSBidWZmZXIuXG4gIHB1YmxpYyBhc3luYyB3aWxsU2F2ZVdhaXRVbnRpbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX2lzUHJpbWFyeUFkYXB0ZXIoKSkgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7IH1cblxuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuX2VkaXRvci5nZXRCdWZmZXIoKTtcbiAgICBjb25zdCB1cmkgPSB0aGlzLmdldEVkaXRvclVyaSgpO1xuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5fZWRpdG9yLmdldExvbmdUaXRsZSgpO1xuXG4gICAgY29uc3QgYXBwbHlFZGl0c09yVGltZW91dCA9IFV0aWxzLnByb21pc2VXaXRoVGltZW91dChcbiAgICAgIDI1MDAsIC8vIDIuNSBzZWNvbmRzIHRpbWVvdXRcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24ud2lsbFNhdmVXYWl0VW50aWxUZXh0RG9jdW1lbnQoe1xuICAgICAgICB0ZXh0RG9jdW1lbnQ6IHsgdXJpIH0sXG4gICAgICAgIHJlYXNvbjogVGV4dERvY3VtZW50U2F2ZVJlYXNvbi5NYW51YWwsXG4gICAgICB9KSxcbiAgICApLnRoZW4oKGVkaXRzKSA9PiB7XG4gICAgICBjb25zdCBjdXJzb3IgPSB0aGlzLl9lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgIEFwcGx5RWRpdEFkYXB0ZXIuYXBwbHlFZGl0cyhidWZmZXIsIENvbnZlcnQuY29udmVydExzVGV4dEVkaXRzKGVkaXRzKSk7XG4gICAgICB0aGlzLl9lZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oY3Vyc29yKTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ09uLXNhdmUgYWN0aW9uIGZhaWxlZCcsIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBGYWlsZWQgdG8gYXBwbHkgZWRpdHMgdG8gJHt0aXRsZX1gLFxuICAgICAgICBkZXRhaWw6IGVyci5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfSk7XG5cbiAgICBjb25zdCB3aXRoQnVzeVNpZ25hbCA9XG4gICAgICB0aGlzLl9yZXBvcnRCdXN5V2hpbGUoXG4gICAgICAgIGBBcHBseWluZyBvbi1zYXZlIGVkaXRzIGZvciAke3RpdGxlfWAsXG4gICAgICAgICgpID0+IGFwcGx5RWRpdHNPclRpbWVvdXQsXG4gICAgICApO1xuICAgIHJldHVybiB3aXRoQnVzeVNpZ25hbCB8fCBhcHBseUVkaXRzT3JUaW1lb3V0O1xuICB9XG5cbiAgLy8gQ2FsbGVkIHdoZW4gdGhlIHtUZXh0RWRpdG9yfSBzYXZlcyBhbmQgc2VuZHMgdGhlICdkaWRTYXZlVGV4dERvY3VtZW50JyBub3RpZmljYXRpb24gdG9cbiAgLy8gdGhlIGNvbm5lY3RlZCBsYW5ndWFnZSBzZXJ2ZXIuXG4gIC8vIE5vdGU6IFJpZ2h0IG5vdyB0aGlzIGFsc28gc2VuZHMgdGhlIGBkaWRDaGFuZ2VXYXRjaGVkRmlsZXNgIG5vdGlmaWNhdGlvbiBhcyB3ZWxsIGJ1dCB0aGF0XG4gIC8vIHdpbGwgYmUgc2VudCBmcm9tIGVsc2V3aGVyZSBzb29uLlxuICBwdWJsaWMgZGlkU2F2ZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzUHJpbWFyeUFkYXB0ZXIoKSkgeyByZXR1cm47IH1cblxuICAgIGNvbnN0IHVyaSA9IHRoaXMuZ2V0RWRpdG9yVXJpKCk7XG4gICAgY29uc3QgZGlkU2F2ZU5vdGlmaWNhdGlvbiA9IHtcbiAgICAgIHRleHREb2N1bWVudDogeyB1cmksIHZlcnNpb246IHRoaXMuX2dldFZlcnNpb24oKHVyaSkpIH0sXG4gICAgfSBhcyBEaWRTYXZlVGV4dERvY3VtZW50UGFyYW1zO1xuICAgIGlmICh0aGlzLl9kb2N1bWVudFN5bmMuc2F2ZSAmJiB0aGlzLl9kb2N1bWVudFN5bmMuc2F2ZS5pbmNsdWRlVGV4dCkge1xuICAgICAgZGlkU2F2ZU5vdGlmaWNhdGlvbi50ZXh0ID0gdGhpcy5fZWRpdG9yLmdldFRleHQoKTtcbiAgICB9XG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaWRTYXZlVGV4dERvY3VtZW50KGRpZFNhdmVOb3RpZmljYXRpb24pO1xuICAgIGlmICh0aGlzLl9mYWtlRGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKSB7XG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVdhdGNoZWRGaWxlcyh7XG4gICAgICAgIGNoYW5nZXM6IFt7IHVyaSwgdHlwZTogRmlsZUNoYW5nZVR5cGUuQ2hhbmdlZCB9XSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkaWRSZW5hbWUoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc1ByaW1hcnlBZGFwdGVyKCkpIHsgcmV0dXJuOyB9XG5cbiAgICBjb25zdCBvbGRVcmkgPSB0aGlzLl9jdXJyZW50VXJpO1xuICAgIHRoaXMuX2N1cnJlbnRVcmkgPSB0aGlzLmdldEVkaXRvclVyaSgpO1xuICAgIGlmICghb2xkVXJpKSB7XG4gICAgICByZXR1cm47IC8vIERpZG4ndCBwcmV2aW91c2x5IGhhdmUgYSBuYW1lXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RvY3VtZW50U3luYy5vcGVuQ2xvc2UgIT09IGZhbHNlKSB7XG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENsb3NlVGV4dERvY3VtZW50KHsgdGV4dERvY3VtZW50OiB7IHVyaTogb2xkVXJpIH0gfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2Zha2VEaWRDaGFuZ2VXYXRjaGVkRmlsZXMpIHtcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKHtcbiAgICAgICAgY2hhbmdlczogW1xuICAgICAgICAgIHsgdXJpOiBvbGRVcmksIHR5cGU6IEZpbGVDaGFuZ2VUeXBlLkRlbGV0ZWQgfSxcbiAgICAgICAgICB7IHVyaTogdGhpcy5fY3VycmVudFVyaSwgdHlwZTogRmlsZUNoYW5nZVR5cGUuQ3JlYXRlZCB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU2VuZCBhbiBlcXVpdmFsZW50IG9wZW4gZXZlbnQgZm9yIHRoaXMgZWRpdG9yLCB3aGljaCB3aWxsIG5vdyB1c2UgdGhlIG5ld1xuICAgIC8vIGZpbGUgcGF0aC5cbiAgICBpZiAodGhpcy5fZG9jdW1lbnRTeW5jLm9wZW5DbG9zZSAhPT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuZGlkT3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIHRoZSBjdXJyZW50IHtUZXh0RWRpdG9yfSBwYXRoIGFuZCBjb252ZXJ0IGl0IHRvIGEgVXJpLlxuICBwdWJsaWMgZ2V0RWRpdG9yVXJpKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIENvbnZlcnQucGF0aFRvVXJpKHRoaXMuX2VkaXRvci5nZXRQYXRoKCkgfHwgJycpO1xuICB9XG59XG4iXX0=