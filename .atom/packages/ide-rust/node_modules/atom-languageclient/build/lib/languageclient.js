"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrpc = require("vscode-jsonrpc");
const events_1 = require("events");
const logger_1 = require("./logger");
__export(require("vscode-languageserver-protocol"));
// TypeScript wrapper around JSONRPC to implement Microsoft Language Server Protocol v3
// https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md
class LanguageClientConnection extends events_1.EventEmitter {
    constructor(rpc, logger) {
        super();
        this._rpc = rpc;
        this._log = logger || new logger_1.NullLogger();
        this.setupLogging();
        rpc.listen();
        this.isConnected = true;
        this._rpc.onClose(() => {
            this.isConnected = false;
            this._log.warn('rpc.onClose', 'The RPC connection closed unexpectedly');
            this.emit('close');
        });
    }
    setupLogging() {
        this._rpc.onError((error) => this._log.error(['rpc.onError', error]));
        this._rpc.onUnhandledNotification((notification) => {
            if (notification.method != null && notification.params != null) {
                this._log.warn(`rpc.onUnhandledNotification ${notification.method}`, notification.params);
            }
            else {
                this._log.warn('rpc.onUnhandledNotification', notification);
            }
        });
        this._rpc.onNotification((...args) => this._log.debug('rpc.onNotification', args));
    }
    dispose() {
        this._rpc.dispose();
    }
    // Public: Initialize the language server with necessary {InitializeParams}.
    //
    // * `params` The {InitializeParams} containing processId, rootPath, options and
    //            server capabilities.
    //
    // Returns a {Promise} containing the {InitializeResult} with details of the server's
    // capabilities.
    initialize(params) {
        return this._sendRequest('initialize', params);
    }
    // Public: Send an `initialized` notification to the language server.
    initialized() {
        this._sendNotification('initialized', {});
    }
    // Public: Send a `shutdown` request to the language server.
    shutdown() {
        return this._sendRequest('shutdown');
    }
    // Public: Send an `exit` notification to the language server.
    exit() {
        this._sendNotification('exit');
    }
    // Public: Register a callback for a custom message.
    //
    // * `method`   A string containing the name of the message to listen for.
    // * `callback` The function to be called when the message is received.
    //              The payload from the message is passed to the function.
    onCustom(method, callback) {
        this._onNotification({ method }, callback);
    }
    // Public: Send a custom request
    //
    // * `method`   A string containing the name of the request message.
    // * `params`   The method's parameters
    sendCustomRequest(method, params) {
        return this._sendRequest(method, params);
    }
    // Public: Send a custom notification
    //
    // * `method`   A string containing the name of the notification message.
    // * `params`  The method's parameters
    sendCustomNotification(method, params) {
        this._sendNotification(method, params);
    }
    // Public: Register a callback for the `window/showMessage` message.
    //
    // * `callback` The function to be called when the `window/showMessage` message is
    //              received with {ShowMessageParams} being passed.
    onShowMessage(callback) {
        this._onNotification({ method: 'window/showMessage' }, callback);
    }
    // Public: Register a callback for the `window/showMessageRequest` message.
    //
    // * `callback` The function to be called when the `window/showMessageRequest` message is
    //              received with {ShowMessageRequestParam}' being passed.
    // Returns a {Promise} containing the {MessageActionItem}.
    onShowMessageRequest(callback) {
        this._onRequest({ method: 'window/showMessageRequest' }, callback);
    }
    // Public: Register a callback for the `window/logMessage` message.
    //
    // * `callback` The function to be called when the `window/logMessage` message is
    //              received with {LogMessageParams} being passed.
    onLogMessage(callback) {
        this._onNotification({ method: 'window/logMessage' }, callback);
    }
    // Public: Register a callback for the `telemetry/event` message.
    //
    // * `callback` The function to be called when the `telemetry/event` message is
    //              received with any parameters received being passed on.
    onTelemetryEvent(callback) {
        this._onNotification({ method: 'telemetry/event' }, callback);
    }
    // Public: Register a callback for the `workspace/applyEdit` message.
    //
    // * `callback` The function to be called when the `workspace/applyEdit` message is
    //              received with {ApplyWorkspaceEditParams} being passed.
    // Returns a {Promise} containing the {ApplyWorkspaceEditResponse}.
    onApplyEdit(callback) {
        this._onRequest({ method: 'workspace/applyEdit' }, callback);
    }
    // Public: Send a `workspace/didChangeConfiguration` notification.
    //
    // * `params` The {DidChangeConfigurationParams} containing the new configuration.
    didChangeConfiguration(params) {
        this._sendNotification('workspace/didChangeConfiguration', params);
    }
    // Public: Send a `textDocument/didOpen` notification.
    //
    // * `params` The {DidOpenTextDocumentParams} containing the opened text document details.
    didOpenTextDocument(params) {
        this._sendNotification('textDocument/didOpen', params);
    }
    // Public: Send a `textDocument/didChange` notification.
    //
    // * `params` The {DidChangeTextDocumentParams} containing the changed text document
    // details including the version number and actual text changes.
    didChangeTextDocument(params) {
        this._sendNotification('textDocument/didChange', params);
    }
    // Public: Send a `textDocument/didClose` notification.
    //
    // * `params` The {DidCloseTextDocumentParams} containing the opened text document details.
    didCloseTextDocument(params) {
        this._sendNotification('textDocument/didClose', params);
    }
    // Public: Send a `textDocument/willSave` notification.
    //
    // * `params` The {WillSaveTextDocumentParams} containing the to-be-saved text document
    // details and the reason for the save.
    willSaveTextDocument(params) {
        this._sendNotification('textDocument/willSave', params);
    }
    // Public: Send a `textDocument/willSaveWaitUntil` notification.
    //
    // * `params` The {WillSaveTextDocumentParams} containing the to-be-saved text document
    // details and the reason for the save.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the text
    // document before it is saved.
    willSaveWaitUntilTextDocument(params) {
        return this._sendRequest('textDocument/willSaveWaitUntil', params);
    }
    // Public: Send a `textDocument/didSave` notification.
    //
    // * `params` The {DidSaveTextDocumentParams} containing the saved text document details.
    didSaveTextDocument(params) {
        this._sendNotification('textDocument/didSave', params);
    }
    // Public: Send a `workspace/didChangeWatchedFiles` notification.
    //
    // * `params` The {DidChangeWatchedFilesParams} containing the array of {FileEvent}s that
    // have been observed upon the watched files.
    didChangeWatchedFiles(params) {
        this._sendNotification('workspace/didChangeWatchedFiles', params);
    }
    // Public: Register a callback for the `textDocument/publishDiagnostics` message.
    //
    // * `callback` The function to be called when the `textDocument/publishDiagnostics` message is
    //              received a {PublishDiagnosticsParams} containing new {Diagnostic} messages for a given uri.
    onPublishDiagnostics(callback) {
        this._onNotification({ method: 'textDocument/publishDiagnostics' }, callback);
    }
    // Public: Send a `textDocument/completion` request.
    //
    // * `params`            The {TextDocumentPositionParams} or {CompletionParams} for which
    //                       {CompletionItem}s are desired.
    // * `cancellationToken` The {CancellationToken} that is used to cancel this request if
    //                       necessary.
    // Returns a {Promise} containing either a {CompletionList} or an {Array} of {CompletionItem}s.
    completion(params, cancellationToken) {
        // Cancel prior request if necessary
        return this._sendRequest('textDocument/completion', params, cancellationToken);
    }
    // Public: Send a `completionItem/resolve` request.
    //
    // * `params` The {CompletionItem} for which a fully resolved {CompletionItem} is desired.
    // Returns a {Promise} containing a fully resolved {CompletionItem}.
    completionItemResolve(params) {
        return this._sendRequest('completionItem/resolve', params);
    }
    // Public: Send a `textDocument/hover` request.
    //
    // * `params` The {TextDocumentPositionParams} for which a {Hover} is desired.
    // Returns a {Promise} containing a {Hover}.
    hover(params) {
        return this._sendRequest('textDocument/hover', params);
    }
    // Public: Send a `textDocument/signatureHelp` request.
    //
    // * `params` The {TextDocumentPositionParams} for which a {SignatureHelp} is desired.
    // Returns a {Promise} containing a {SignatureHelp}.
    signatureHelp(params) {
        return this._sendRequest('textDocument/signatureHelp', params);
    }
    // Public: Send a `textDocument/definition` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which one or more {Location}s
    // that define that symbol are required.
    // Returns a {Promise} containing either a single {Location} or an {Array} of many {Location}s.
    gotoDefinition(params) {
        return this._sendRequest('textDocument/definition', params);
    }
    // Public: Send a `textDocument/references` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which all referring {Location}s
    // are desired.
    // Returns a {Promise} containing an {Array} of {Location}s that reference this symbol.
    findReferences(params) {
        return this._sendRequest('textDocument/references', params);
    }
    // Public: Send a `textDocument/documentHighlight` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which all highlights are desired.
    // Returns a {Promise} containing an {Array} of {DocumentHighlight}s that can be used to
    // highlight this symbol.
    documentHighlight(params) {
        return this._sendRequest('textDocument/documentHighlight', params);
    }
    // Public: Send a `textDocument/documentSymbol` request.
    //
    // * `params`            The {DocumentSymbolParams} that identifies the document for which
    //                       symbols are desired.
    // * `cancellationToken` The {CancellationToken} that is used to cancel this request if
    //                       necessary.
    // Returns a {Promise} containing an {Array} of {SymbolInformation}s that can be used to
    // navigate this document.
    documentSymbol(params, _cancellationToken) {
        return this._sendRequest('textDocument/documentSymbol', params);
    }
    // Public: Send a `workspace/symbol` request.
    //
    // * `params` The {WorkspaceSymbolParams} containing the query string to search the workspace for.
    // Returns a {Promise} containing an {Array} of {SymbolInformation}s that identify where the query
    // string occurs within the workspace.
    workspaceSymbol(params) {
        return this._sendRequest('workspace/symbol', params);
    }
    // Public: Send a `textDocument/codeAction` request.
    //
    // * `params` The {CodeActionParams} identifying the document, range and context for the code action.
    // Returns a {Promise} containing an {Array} of {Commands}s that can be performed against the given
    // documents range.
    codeAction(params) {
        return this._sendRequest('textDocument/codeAction', params);
    }
    // Public: Send a `textDocument/codeLens` request.
    //
    // * `params` The {CodeLensParams} identifying the document for which code lens commands are desired.
    // Returns a {Promise} containing an {Array} of {CodeLens}s that associate commands and data with
    // specified ranges within the document.
    codeLens(params) {
        return this._sendRequest('textDocument/codeLens', params);
    }
    // Public: Send a `codeLens/resolve` request.
    //
    // * `params` The {CodeLens} identifying the code lens to be resolved with full detail.
    // Returns a {Promise} containing the {CodeLens} fully resolved.
    codeLensResolve(params) {
        return this._sendRequest('codeLens/resolve', params);
    }
    // Public: Send a `textDocument/documentLink` request.
    //
    // * `params` The {DocumentLinkParams} identifying the document for which links should be identified.
    // Returns a {Promise} containing an {Array} of {DocumentLink}s relating uri's to specific ranges
    // within the document.
    documentLink(params) {
        return this._sendRequest('textDocument/documentLink', params);
    }
    // Public: Send a `documentLink/resolve` request.
    //
    // * `params` The {DocumentLink} identifying the document link to be resolved with full detail.
    // Returns a {Promise} containing the {DocumentLink} fully resolved.
    documentLinkResolve(params) {
        return this._sendRequest('documentLink/resolve', params);
    }
    // Public: Send a `textDocument/formatting` request.
    //
    // * `params` The {DocumentFormattingParams} identifying the document to be formatted as well as
    // additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentFormatting(params) {
        return this._sendRequest('textDocument/formatting', params);
    }
    // Public: Send a `textDocument/rangeFormatting` request.
    //
    // * `params` The {DocumentRangeFormattingParams} identifying the document and range to be formatted
    // as well as additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentRangeFormatting(params) {
        return this._sendRequest('textDocument/rangeFormatting', params);
    }
    // Public: Send a `textDocument/onTypeFormatting` request.
    //
    // * `params` The {DocumentOnTypeFormattingParams} identifying the document to be formatted,
    // the character that was typed and at what position as well as additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentOnTypeFormatting(params) {
        return this._sendRequest('textDocument/onTypeFormatting', params);
    }
    // Public: Send a `textDocument/rename` request.
    //
    // * `params` The {RenameParams} identifying the document containing the symbol to be renamed,
    // as well as the position and new name.
    // Returns a {Promise} containing an {WorkspaceEdit} that contains a list of {TextEdit}s either
    // on the changes property (keyed by uri) or the documentChanges property containing
    // an {Array} of {TextDocumentEdit}s (preferred).
    rename(params) {
        return this._sendRequest('textDocument/rename', params);
    }
    // Public: Send a `workspace/executeCommand` request.
    //
    // * `params` The {ExecuteCommandParams} specifying the command and arguments
    // the language server should execute (these commands are usually from {CodeLens} or {CodeAction}
    // responses).
    // Returns a {Promise} containing anything.
    executeCommand(params) {
        return this._sendRequest('workspace/executeCommand', params);
    }
    _onRequest(type, callback) {
        this._rpc.onRequest(type.method, (value) => {
            this._log.debug(`rpc.onRequest ${type.method}`, value);
            return callback(value);
        });
    }
    _onNotification(type, callback) {
        this._rpc.onNotification(type.method, (value) => {
            this._log.debug(`rpc.onNotification ${type.method}`, value);
            callback(value);
        });
    }
    _sendNotification(method, args) {
        this._log.debug(`rpc.sendNotification ${method}`, args);
        this._rpc.sendNotification(method, args);
    }
    _sendRequest(method, args, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log.debug(`rpc.sendRequest ${method} sending`, args);
            try {
                const start = performance.now();
                let result;
                if (cancellationToken) {
                    result = yield this._rpc.sendRequest(method, args, cancellationToken);
                }
                else {
                    // If cancellationToken is null or undefined, don't add the third
                    // argument otherwise vscode-jsonrpc will send an additional, null
                    // message parameter to the request
                    result = yield this._rpc.sendRequest(method, args);
                }
                const took = performance.now() - start;
                this._log.debug(`rpc.sendRequest ${method} received (${Math.floor(took)}ms)`, result);
                return result;
            }
            catch (e) {
                const responseError = e;
                if (cancellationToken && responseError.code === jsonrpc.ErrorCodes.RequestCancelled) {
                    this._log.debug(`rpc.sendRequest ${method} was cancelled`);
                }
                else {
                    this._log.error(`rpc.sendRequest ${method} threw`, e);
                }
                throw e;
            }
        });
    }
}
exports.LanguageClientConnection = LanguageClientConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VjbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUEwQztBQUUxQyxtQ0FBc0M7QUFDdEMscUNBR2tCO0FBRWxCLG9EQUErQztBQXVCL0MsdUZBQXVGO0FBQ3ZGLGdGQUFnRjtBQUNoRixNQUFhLHdCQUF5QixTQUFRLHFCQUFZO0lBS3hELFlBQVksR0FBOEIsRUFBRSxNQUFlO1FBQ3pELEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksSUFBSSxtQkFBVSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUViLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLFlBQVk7UUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7WUFDakQs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anNvbnJwYyBmcm9tICd2c2NvZGUtanNvbnJwYyc7XG5pbXBvcnQgKiBhcyBsc3AgZnJvbSAndnNjb2RlLWxhbmd1YWdlc2VydmVyLXByb3RvY29sJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge1xuICBOdWxsTG9nZ2VyLFxuICBMb2dnZXIsXG59IGZyb20gJy4vbG9nZ2VyJztcblxuZXhwb3J0ICogZnJvbSAndnNjb2RlLWxhbmd1YWdlc2VydmVyLXByb3RvY29sJztcblxuZXhwb3J0IGludGVyZmFjZSBLbm93bk5vdGlmaWNhdGlvbnMge1xuICAndGV4dERvY3VtZW50L3B1Ymxpc2hEaWFnbm9zdGljcyc6IGxzcC5QdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXM7XG4gICd0ZWxlbWV0cnkvZXZlbnQnOiBhbnk7XG4gICd3aW5kb3cvbG9nTWVzc2FnZSc6IGxzcC5Mb2dNZXNzYWdlUGFyYW1zO1xuICAnd2luZG93L3Nob3dNZXNzYWdlUmVxdWVzdCc6IGxzcC5TaG93TWVzc2FnZVJlcXVlc3RQYXJhbXM7XG4gICd3aW5kb3cvc2hvd01lc3NhZ2UnOiBsc3AuU2hvd01lc3NhZ2VQYXJhbXM7XG4gIFtjdXN0b206IHN0cmluZ106IG9iamVjdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLbm93blJlcXVlc3RzIHtcbiAgJ3dpbmRvdy9zaG93TWVzc2FnZVJlcXVlc3QnOlxuICBbbHNwLlNob3dNZXNzYWdlUmVxdWVzdFBhcmFtcywgbHNwLk1lc3NhZ2VBY3Rpb25JdGVtIHwgbnVsbF07XG4gICd3b3Jrc3BhY2UvYXBwbHlFZGl0JzpcbiAgW2xzcC5BcHBseVdvcmtzcGFjZUVkaXRQYXJhbXMsIGxzcC5BcHBseVdvcmtzcGFjZUVkaXRSZXNwb25zZV07XG59XG5cbmV4cG9ydCB0eXBlIFJlcXVlc3RDYWxsYmFjazxUIGV4dGVuZHMga2V5b2YgS25vd25SZXF1ZXN0cz4gPVxuICBLbm93blJlcXVlc3RzW1RdIGV4dGVuZHMgW2luZmVyIFUsIGluZmVyIFZdID9cbiAgKHBhcmFtOiBVKSA9PiBQcm9taXNlPFY+IDpcbiAgbmV2ZXI7XG5cbi8vIFR5cGVTY3JpcHQgd3JhcHBlciBhcm91bmQgSlNPTlJQQyB0byBpbXBsZW1lbnQgTWljcm9zb2Z0IExhbmd1YWdlIFNlcnZlciBQcm90b2NvbCB2M1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9sYW5ndWFnZS1zZXJ2ZXItcHJvdG9jb2wvYmxvYi9tYXN0ZXIvcHJvdG9jb2wubWRcbmV4cG9ydCBjbGFzcyBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBwcml2YXRlIF9ycGM6IGpzb25ycGMuTWVzc2FnZUNvbm5lY3Rpb247XG4gIHByaXZhdGUgX2xvZzogTG9nZ2VyO1xuICBwdWJsaWMgaXNDb25uZWN0ZWQ6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocnBjOiBqc29ucnBjLk1lc3NhZ2VDb25uZWN0aW9uLCBsb2dnZXI/OiBMb2dnZXIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3JwYyA9IHJwYztcbiAgICB0aGlzLl9sb2cgPSBsb2dnZXIgfHwgbmV3IE51bGxMb2dnZXIoKTtcbiAgICB0aGlzLnNldHVwTG9nZ2luZygpO1xuICAgIHJwYy5saXN0ZW4oKTtcblxuICAgIHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlO1xuICAgIHRoaXMuX3JwYy5vbkNsb3NlKCgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2xvZy53YXJuKCdycGMub25DbG9zZScsICdUaGUgUlBDIGNvbm5lY3Rpb24gY2xvc2VkIHVuZXhwZWN0ZWRseScpO1xuICAgICAgdGhpcy5lbWl0KCdjbG9zZScpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cExvZ2dpbmcoKTogdm9pZCB7XG4gICAgdGhpcy5fcnBjLm9uRXJyb3IoKGVycm9yKSA9PiB0aGlzLl9sb2cuZXJyb3IoWydycGMub25FcnJvcicsIGVycm9yXSkpO1xuICAgIHRoaXMuX3JwYy5vblVuaGFuZGxlZE5vdGlmaWNhdGlvbigobm90aWZpY2F0aW9uKSA9PiB7XG4gICAgICBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCAhPSBudWxsICYmIG5vdGlmaWNhdGlvbi5wYXJhbXMgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9sb2cud2FybihgcnBjLm9uVW5oYW5kbGVkTm90aWZpY2F0aW9uICR7bm90aWZpY2F0aW9uLm1ldGhvZH1gLCBub3RpZmljYXRpb24ucGFyYW1zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2xvZy53YXJuKCdycGMub25VbmhhbmRsZWROb3RpZmljYXRpb24nLCBub3RpZmljYXRpb24pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX3JwYy5vbk5vdGlmaWNhdGlvbigoLi4uYXJnczogYW55W10pID0+IHRoaXMuX2xvZy5kZWJ1ZygncnBjLm9uTm90aWZpY2F0aW9uJywgYXJncykpO1xuICB9XG5cbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5fcnBjLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogSW5pdGlhbGl6ZSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHdpdGggbmVjZXNzYXJ5IHtJbml0aWFsaXplUGFyYW1zfS5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0luaXRpYWxpemVQYXJhbXN9IGNvbnRhaW5pbmcgcHJvY2Vzc0lkLCByb290UGF0aCwgb3B0aW9ucyBhbmRcbiAgLy8gICAgICAgICAgICBzZXJ2ZXIgY2FwYWJpbGl0aWVzLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtJbml0aWFsaXplUmVzdWx0fSB3aXRoIGRldGFpbHMgb2YgdGhlIHNlcnZlcidzXG4gIC8vIGNhcGFiaWxpdGllcy5cbiAgcHVibGljIGluaXRpYWxpemUocGFyYW1zOiBsc3AuSW5pdGlhbGl6ZVBhcmFtcyk6IFByb21pc2U8bHNwLkluaXRpYWxpemVSZXN1bHQ+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ2luaXRpYWxpemUnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGFuIGBpbml0aWFsaXplZGAgbm90aWZpY2F0aW9uIHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXG4gIHB1YmxpYyBpbml0aWFsaXplZCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCdpbml0aWFsaXplZCcsIHt9KTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGBzaHV0ZG93bmAgcmVxdWVzdCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICBwdWJsaWMgc2h1dGRvd24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCdzaHV0ZG93bicpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGFuIGBleGl0YCBub3RpZmljYXRpb24gdG8gdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgcHVibGljIGV4aXQoKTogdm9pZCB7XG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbignZXhpdCcpO1xuICB9XG5cbiAgLy8gUHVibGljOiBSZWdpc3RlciBhIGNhbGxiYWNrIGZvciBhIGN1c3RvbSBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBtZXRob2RgICAgQSBzdHJpbmcgY29udGFpbmluZyB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSB0byBsaXN0ZW4gZm9yLlxuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIHJlY2VpdmVkLlxuICAvLyAgICAgICAgICAgICAgVGhlIHBheWxvYWQgZnJvbSB0aGUgbWVzc2FnZSBpcyBwYXNzZWQgdG8gdGhlIGZ1bmN0aW9uLlxuICBwdWJsaWMgb25DdXN0b20obWV0aG9kOiBzdHJpbmcsIGNhbGxiYWNrOiAob2JqOiBvYmplY3QpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9vbk5vdGlmaWNhdGlvbih7IG1ldGhvZCB9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBjdXN0b20gcmVxdWVzdFxuICAvL1xuICAvLyAqIGBtZXRob2RgICAgQSBzdHJpbmcgY29udGFpbmluZyB0aGUgbmFtZSBvZiB0aGUgcmVxdWVzdCBtZXNzYWdlLlxuICAvLyAqIGBwYXJhbXNgICAgVGhlIG1ldGhvZCdzIHBhcmFtZXRlcnNcbiAgcHVibGljIHNlbmRDdXN0b21SZXF1ZXN0KG1ldGhvZDogc3RyaW5nLCBwYXJhbXM/OiBhbnlbXSB8IG9iamVjdCk6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdChtZXRob2QsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBjdXN0b20gbm90aWZpY2F0aW9uXG4gIC8vXG4gIC8vICogYG1ldGhvZGAgICBBIHN0cmluZyBjb250YWluaW5nIHRoZSBuYW1lIG9mIHRoZSBub3RpZmljYXRpb24gbWVzc2FnZS5cbiAgLy8gKiBgcGFyYW1zYCAgVGhlIG1ldGhvZCdzIHBhcmFtZXRlcnNcbiAgcHVibGljIHNlbmRDdXN0b21Ob3RpZmljYXRpb24obWV0aG9kOiBzdHJpbmcsIHBhcmFtcz86IGFueVtdIHwgb2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbihtZXRob2QsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlYCBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlYCBtZXNzYWdlIGlzXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCB3aXRoIHtTaG93TWVzc2FnZVBhcmFtc30gYmVpbmcgcGFzc2VkLlxuICBwdWJsaWMgb25TaG93TWVzc2FnZShjYWxsYmFjazogKHBhcmFtczogbHNwLlNob3dNZXNzYWdlUGFyYW1zKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fb25Ob3RpZmljYXRpb24oeyBtZXRob2Q6ICd3aW5kb3cvc2hvd01lc3NhZ2UnIH0sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB3aW5kb3cvc2hvd01lc3NhZ2VSZXF1ZXN0YCBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlUmVxdWVzdGAgbWVzc2FnZSBpc1xuICAvLyAgICAgICAgICAgICAgcmVjZWl2ZWQgd2l0aCB7U2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW19JyBiZWluZyBwYXNzZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge01lc3NhZ2VBY3Rpb25JdGVtfS5cbiAgcHVibGljIG9uU2hvd01lc3NhZ2VSZXF1ZXN0KGNhbGxiYWNrOiAocGFyYW1zOiBsc3AuU2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zKVxuICAgID0+IFByb21pc2U8bHNwLk1lc3NhZ2VBY3Rpb25JdGVtIHwgbnVsbD4pOiB2b2lkIHtcbiAgICB0aGlzLl9vblJlcXVlc3QoeyBtZXRob2Q6ICd3aW5kb3cvc2hvd01lc3NhZ2VSZXF1ZXN0JyB9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgd2luZG93L2xvZ01lc3NhZ2VgIG1lc3NhZ2UuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB3aW5kb3cvbG9nTWVzc2FnZWAgbWVzc2FnZSBpc1xuICAvLyAgICAgICAgICAgICAgcmVjZWl2ZWQgd2l0aCB7TG9nTWVzc2FnZVBhcmFtc30gYmVpbmcgcGFzc2VkLlxuICBwdWJsaWMgb25Mb2dNZXNzYWdlKGNhbGxiYWNrOiAocGFyYW1zOiBsc3AuTG9nTWVzc2FnZVBhcmFtcykgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHsgbWV0aG9kOiAnd2luZG93L2xvZ01lc3NhZ2UnIH0sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB0ZWxlbWV0cnkvZXZlbnRgIG1lc3NhZ2UuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB0ZWxlbWV0cnkvZXZlbnRgIG1lc3NhZ2UgaXNcbiAgLy8gICAgICAgICAgICAgIHJlY2VpdmVkIHdpdGggYW55IHBhcmFtZXRlcnMgcmVjZWl2ZWQgYmVpbmcgcGFzc2VkIG9uLlxuICBwdWJsaWMgb25UZWxlbWV0cnlFdmVudChjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fb25Ob3RpZmljYXRpb24oeyBtZXRob2Q6ICd0ZWxlbWV0cnkvZXZlbnQnIH0sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB3b3Jrc3BhY2UvYXBwbHlFZGl0YCBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgd29ya3NwYWNlL2FwcGx5RWRpdGAgbWVzc2FnZSBpc1xuICAvLyAgICAgICAgICAgICAgcmVjZWl2ZWQgd2l0aCB7QXBwbHlXb3Jrc3BhY2VFZGl0UGFyYW1zfSBiZWluZyBwYXNzZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0FwcGx5V29ya3NwYWNlRWRpdFJlc3BvbnNlfS5cbiAgcHVibGljIG9uQXBwbHlFZGl0KGNhbGxiYWNrOiAocGFyYW1zOiBsc3AuQXBwbHlXb3Jrc3BhY2VFZGl0UGFyYW1zKSA9PlxuICAgIFByb21pc2U8bHNwLkFwcGx5V29ya3NwYWNlRWRpdFJlc3BvbnNlPik6IHZvaWQge1xuICAgIHRoaXMuX29uUmVxdWVzdCh7IG1ldGhvZDogJ3dvcmtzcGFjZS9hcHBseUVkaXQnIH0sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB3b3Jrc3BhY2UvZGlkQ2hhbmdlQ29uZmlndXJhdGlvbmAgbm90aWZpY2F0aW9uLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RGlkQ2hhbmdlQ29uZmlndXJhdGlvblBhcmFtc30gY29udGFpbmluZyB0aGUgbmV3IGNvbmZpZ3VyYXRpb24uXG4gIHB1YmxpYyBkaWRDaGFuZ2VDb25maWd1cmF0aW9uKHBhcmFtczogbHNwLkRpZENoYW5nZUNvbmZpZ3VyYXRpb25QYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd3b3Jrc3BhY2UvZGlkQ2hhbmdlQ29uZmlndXJhdGlvbicsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RpZE9wZW5gIG5vdGlmaWNhdGlvbi5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZE9wZW5UZXh0RG9jdW1lbnRQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIG9wZW5lZCB0ZXh0IGRvY3VtZW50IGRldGFpbHMuXG4gIHB1YmxpYyBkaWRPcGVuVGV4dERvY3VtZW50KHBhcmFtczogbHNwLkRpZE9wZW5UZXh0RG9jdW1lbnRQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd0ZXh0RG9jdW1lbnQvZGlkT3BlbicsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RpZENoYW5nZWAgbm90aWZpY2F0aW9uLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RGlkQ2hhbmdlVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBjaGFuZ2VkIHRleHQgZG9jdW1lbnRcbiAgLy8gZGV0YWlscyBpbmNsdWRpbmcgdGhlIHZlcnNpb24gbnVtYmVyIGFuZCBhY3R1YWwgdGV4dCBjaGFuZ2VzLlxuICBwdWJsaWMgZGlkQ2hhbmdlVGV4dERvY3VtZW50KHBhcmFtczogbHNwLkRpZENoYW5nZVRleHREb2N1bWVudFBhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3RleHREb2N1bWVudC9kaWRDaGFuZ2UnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kaWRDbG9zZWAgbm90aWZpY2F0aW9uLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RGlkQ2xvc2VUZXh0RG9jdW1lbnRQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIG9wZW5lZCB0ZXh0IGRvY3VtZW50IGRldGFpbHMuXG4gIHB1YmxpYyBkaWRDbG9zZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5EaWRDbG9zZVRleHREb2N1bWVudFBhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3RleHREb2N1bWVudC9kaWRDbG9zZScsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L3dpbGxTYXZlYCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtXaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtc30gY29udGFpbmluZyB0aGUgdG8tYmUtc2F2ZWQgdGV4dCBkb2N1bWVudFxuICAvLyBkZXRhaWxzIGFuZCB0aGUgcmVhc29uIGZvciB0aGUgc2F2ZS5cbiAgcHVibGljIHdpbGxTYXZlVGV4dERvY3VtZW50KHBhcmFtczogbHNwLldpbGxTYXZlVGV4dERvY3VtZW50UGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbigndGV4dERvY3VtZW50L3dpbGxTYXZlJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvd2lsbFNhdmVXYWl0VW50aWxgIG5vdGlmaWNhdGlvbi5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge1dpbGxTYXZlVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSB0by1iZS1zYXZlZCB0ZXh0IGRvY3VtZW50XG4gIC8vIGRldGFpbHMgYW5kIHRoZSByZWFzb24gZm9yIHRoZSBzYXZlLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9cyB0byBiZSBhcHBsaWVkIHRvIHRoZSB0ZXh0XG4gIC8vIGRvY3VtZW50IGJlZm9yZSBpdCBpcyBzYXZlZC5cbiAgcHVibGljIHdpbGxTYXZlV2FpdFVudGlsVGV4dERvY3VtZW50KHBhcmFtczogbHNwLldpbGxTYXZlVGV4dERvY3VtZW50UGFyYW1zKTogUHJvbWlzZTxsc3AuVGV4dEVkaXRbXSB8IG51bGw+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC93aWxsU2F2ZVdhaXRVbnRpbCcsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RpZFNhdmVgIG5vdGlmaWNhdGlvbi5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZFNhdmVUZXh0RG9jdW1lbnRQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIHNhdmVkIHRleHQgZG9jdW1lbnQgZGV0YWlscy5cbiAgcHVibGljIGRpZFNhdmVUZXh0RG9jdW1lbnQocGFyYW1zOiBsc3AuRGlkU2F2ZVRleHREb2N1bWVudFBhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3RleHREb2N1bWVudC9kaWRTYXZlJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB3b3Jrc3BhY2UvZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzYCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEaWRDaGFuZ2VXYXRjaGVkRmlsZXNQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIGFycmF5IG9mIHtGaWxlRXZlbnR9cyB0aGF0XG4gIC8vIGhhdmUgYmVlbiBvYnNlcnZlZCB1cG9uIHRoZSB3YXRjaGVkIGZpbGVzLlxuICBwdWJsaWMgZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKHBhcmFtczogbHNwLkRpZENoYW5nZVdhdGNoZWRGaWxlc1BhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3dvcmtzcGFjZS9kaWRDaGFuZ2VXYXRjaGVkRmlsZXMnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBSZWdpc3RlciBhIGNhbGxiYWNrIGZvciB0aGUgYHRleHREb2N1bWVudC9wdWJsaXNoRGlhZ25vc3RpY3NgIG1lc3NhZ2UuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB0ZXh0RG9jdW1lbnQvcHVibGlzaERpYWdub3N0aWNzYCBtZXNzYWdlIGlzXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCBhIHtQdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXN9IGNvbnRhaW5pbmcgbmV3IHtEaWFnbm9zdGljfSBtZXNzYWdlcyBmb3IgYSBnaXZlbiB1cmkuXG4gIHB1YmxpYyBvblB1Ymxpc2hEaWFnbm9zdGljcyhjYWxsYmFjazogKHBhcmFtczogbHNwLlB1Ymxpc2hEaWFnbm9zdGljc1BhcmFtcykgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHsgbWV0aG9kOiAndGV4dERvY3VtZW50L3B1Ymxpc2hEaWFnbm9zdGljcycgfSwgY2FsbGJhY2spO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9jb21wbGV0aW9uYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgICAgICAgICAgICAgVGhlIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gb3Ige0NvbXBsZXRpb25QYXJhbXN9IGZvciB3aGljaFxuICAvLyAgICAgICAgICAgICAgICAgICAgICAge0NvbXBsZXRpb25JdGVtfXMgYXJlIGRlc2lyZWQuXG4gIC8vICogYGNhbmNlbGxhdGlvblRva2VuYCBUaGUge0NhbmNlbGxhdGlvblRva2VufSB0aGF0IGlzIHVzZWQgdG8gY2FuY2VsIHRoaXMgcmVxdWVzdCBpZlxuICAvLyAgICAgICAgICAgICAgICAgICAgICAgbmVjZXNzYXJ5LlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgZWl0aGVyIGEge0NvbXBsZXRpb25MaXN0fSBvciBhbiB7QXJyYXl9IG9mIHtDb21wbGV0aW9uSXRlbX1zLlxuICBwdWJsaWMgY29tcGxldGlvbihcbiAgICBwYXJhbXM6IGxzcC5UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyB8IENvbXBsZXRpb25QYXJhbXMsXG4gICAgY2FuY2VsbGF0aW9uVG9rZW4/OiBqc29ucnBjLkNhbmNlbGxhdGlvblRva2VuKTogUHJvbWlzZTxsc3AuQ29tcGxldGlvbkl0ZW1bXSB8IGxzcC5Db21wbGV0aW9uTGlzdD4ge1xuICAgIC8vIENhbmNlbCBwcmlvciByZXF1ZXN0IGlmIG5lY2Vzc2FyeVxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2NvbXBsZXRpb24nLCBwYXJhbXMsIGNhbmNlbGxhdGlvblRva2VuKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGBjb21wbGV0aW9uSXRlbS9yZXNvbHZlYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7Q29tcGxldGlvbkl0ZW19IGZvciB3aGljaCBhIGZ1bGx5IHJlc29sdmVkIHtDb21wbGV0aW9uSXRlbX0gaXMgZGVzaXJlZC5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGEgZnVsbHkgcmVzb2x2ZWQge0NvbXBsZXRpb25JdGVtfS5cbiAgcHVibGljIGNvbXBsZXRpb25JdGVtUmVzb2x2ZShwYXJhbXM6IGxzcC5Db21wbGV0aW9uSXRlbSk6IFByb21pc2U8bHNwLkNvbXBsZXRpb25JdGVtIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnY29tcGxldGlvbkl0ZW0vcmVzb2x2ZScsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2hvdmVyYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IGZvciB3aGljaCBhIHtIb3Zlcn0gaXMgZGVzaXJlZC5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGEge0hvdmVyfS5cbiAgcHVibGljIGhvdmVyKHBhcmFtczogbHNwLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTogUHJvbWlzZTxsc3AuSG92ZXIgfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvaG92ZXInLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9zaWduYXR1cmVIZWxwYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IGZvciB3aGljaCBhIHtTaWduYXR1cmVIZWxwfSBpcyBkZXNpcmVkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYSB7U2lnbmF0dXJlSGVscH0uXG4gIHB1YmxpYyBzaWduYXR1cmVIZWxwKHBhcmFtczogbHNwLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTogUHJvbWlzZTxsc3AuU2lnbmF0dXJlSGVscCB8IG51bGw+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9zaWduYXR1cmVIZWxwJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZGVmaW5pdGlvbmAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvZiBhIHN5bWJvbCBmb3Igd2hpY2ggb25lIG9yIG1vcmUge0xvY2F0aW9ufXNcbiAgLy8gdGhhdCBkZWZpbmUgdGhhdCBzeW1ib2wgYXJlIHJlcXVpcmVkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgZWl0aGVyIGEgc2luZ2xlIHtMb2NhdGlvbn0gb3IgYW4ge0FycmF5fSBvZiBtYW55IHtMb2NhdGlvbn1zLlxuICBwdWJsaWMgZ290b0RlZmluaXRpb24ocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Mb2NhdGlvbiB8IGxzcC5Mb2NhdGlvbltdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvZGVmaW5pdGlvbicsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L3JlZmVyZW5jZXNgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gb2YgYSBzeW1ib2wgZm9yIHdoaWNoIGFsbCByZWZlcnJpbmcge0xvY2F0aW9ufXNcbiAgLy8gYXJlIGRlc2lyZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtMb2NhdGlvbn1zIHRoYXQgcmVmZXJlbmNlIHRoaXMgc3ltYm9sLlxuICBwdWJsaWMgZmluZFJlZmVyZW5jZXMocGFyYW1zOiBsc3AuUmVmZXJlbmNlUGFyYW1zKTogUHJvbWlzZTxsc3AuTG9jYXRpb25bXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L3JlZmVyZW5jZXMnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kb2N1bWVudEhpZ2hsaWdodGAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvZiBhIHN5bWJvbCBmb3Igd2hpY2ggYWxsIGhpZ2hsaWdodHMgYXJlIGRlc2lyZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtEb2N1bWVudEhpZ2hsaWdodH1zIHRoYXQgY2FuIGJlIHVzZWQgdG9cbiAgLy8gaGlnaGxpZ2h0IHRoaXMgc3ltYm9sLlxuICBwdWJsaWMgZG9jdW1lbnRIaWdobGlnaHQocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Eb2N1bWVudEhpZ2hsaWdodFtdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvZG9jdW1lbnRIaWdobGlnaHQnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kb2N1bWVudFN5bWJvbGAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCAgICAgICAgICAgIFRoZSB7RG9jdW1lbnRTeW1ib2xQYXJhbXN9IHRoYXQgaWRlbnRpZmllcyB0aGUgZG9jdW1lbnQgZm9yIHdoaWNoXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICBzeW1ib2xzIGFyZSBkZXNpcmVkLlxuICAvLyAqIGBjYW5jZWxsYXRpb25Ub2tlbmAgVGhlIHtDYW5jZWxsYXRpb25Ub2tlbn0gdGhhdCBpcyB1c2VkIHRvIGNhbmNlbCB0aGlzIHJlcXVlc3QgaWZcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgIG5lY2Vzc2FyeS5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge1N5bWJvbEluZm9ybWF0aW9ufXMgdGhhdCBjYW4gYmUgdXNlZCB0b1xuICAvLyBuYXZpZ2F0ZSB0aGlzIGRvY3VtZW50LlxuICBwdWJsaWMgZG9jdW1lbnRTeW1ib2woXG4gICAgcGFyYW1zOiBsc3AuRG9jdW1lbnRTeW1ib2xQYXJhbXMsXG4gICAgX2NhbmNlbGxhdGlvblRva2VuPzoganNvbnJwYy5DYW5jZWxsYXRpb25Ub2tlbixcbiAgKTogUHJvbWlzZTxsc3AuU3ltYm9sSW5mb3JtYXRpb25bXSB8IGxzcC5Eb2N1bWVudFN5bWJvbFtdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvZG9jdW1lbnRTeW1ib2wnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHdvcmtzcGFjZS9zeW1ib2xgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtXb3Jrc3BhY2VTeW1ib2xQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIHF1ZXJ5IHN0cmluZyB0byBzZWFyY2ggdGhlIHdvcmtzcGFjZSBmb3IuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtTeW1ib2xJbmZvcm1hdGlvbn1zIHRoYXQgaWRlbnRpZnkgd2hlcmUgdGhlIHF1ZXJ5XG4gIC8vIHN0cmluZyBvY2N1cnMgd2l0aGluIHRoZSB3b3Jrc3BhY2UuXG4gIHB1YmxpYyB3b3Jrc3BhY2VTeW1ib2wocGFyYW1zOiBsc3AuV29ya3NwYWNlU3ltYm9sUGFyYW1zKTogUHJvbWlzZTxsc3AuU3ltYm9sSW5mb3JtYXRpb25bXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnd29ya3NwYWNlL3N5bWJvbCcsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2NvZGVBY3Rpb25gIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb2RlQWN0aW9uUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQsIHJhbmdlIGFuZCBjb250ZXh0IGZvciB0aGUgY29kZSBhY3Rpb24uXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtDb21tYW5kc31zIHRoYXQgY2FuIGJlIHBlcmZvcm1lZCBhZ2FpbnN0IHRoZSBnaXZlblxuICAvLyBkb2N1bWVudHMgcmFuZ2UuXG4gIHB1YmxpYyBjb2RlQWN0aW9uKHBhcmFtczogbHNwLkNvZGVBY3Rpb25QYXJhbXMpOiBQcm9taXNlPEFycmF5PGxzcC5Db21tYW5kIHwgbHNwLkNvZGVBY3Rpb24+PiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvY29kZUFjdGlvbicsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2NvZGVMZW5zYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7Q29kZUxlbnNQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCBmb3Igd2hpY2ggY29kZSBsZW5zIGNvbW1hbmRzIGFyZSBkZXNpcmVkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7Q29kZUxlbnN9cyB0aGF0IGFzc29jaWF0ZSBjb21tYW5kcyBhbmQgZGF0YSB3aXRoXG4gIC8vIHNwZWNpZmllZCByYW5nZXMgd2l0aGluIHRoZSBkb2N1bWVudC5cbiAgcHVibGljIGNvZGVMZW5zKHBhcmFtczogbHNwLkNvZGVMZW5zUGFyYW1zKTogUHJvbWlzZTxsc3AuQ29kZUxlbnNbXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2NvZGVMZW5zJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGBjb2RlTGVucy9yZXNvbHZlYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7Q29kZUxlbnN9IGlkZW50aWZ5aW5nIHRoZSBjb2RlIGxlbnMgdG8gYmUgcmVzb2x2ZWQgd2l0aCBmdWxsIGRldGFpbC5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIHRoZSB7Q29kZUxlbnN9IGZ1bGx5IHJlc29sdmVkLlxuICBwdWJsaWMgY29kZUxlbnNSZXNvbHZlKHBhcmFtczogbHNwLkNvZGVMZW5zKTogUHJvbWlzZTxsc3AuQ29kZUxlbnMgfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCdjb2RlTGVucy9yZXNvbHZlJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZG9jdW1lbnRMaW5rYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRMaW5rUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgZm9yIHdoaWNoIGxpbmtzIHNob3VsZCBiZSBpZGVudGlmaWVkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7RG9jdW1lbnRMaW5rfXMgcmVsYXRpbmcgdXJpJ3MgdG8gc3BlY2lmaWMgcmFuZ2VzXG4gIC8vIHdpdGhpbiB0aGUgZG9jdW1lbnQuXG4gIHB1YmxpYyBkb2N1bWVudExpbmsocGFyYW1zOiBsc3AuRG9jdW1lbnRMaW5rUGFyYW1zKTogUHJvbWlzZTxsc3AuRG9jdW1lbnRMaW5rW10+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9kb2N1bWVudExpbmsnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYGRvY3VtZW50TGluay9yZXNvbHZlYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRMaW5rfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgbGluayB0byBiZSByZXNvbHZlZCB3aXRoIGZ1bGwgZGV0YWlsLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtEb2N1bWVudExpbmt9IGZ1bGx5IHJlc29sdmVkLlxuICBwdWJsaWMgZG9jdW1lbnRMaW5rUmVzb2x2ZShwYXJhbXM6IGxzcC5Eb2N1bWVudExpbmspOiBQcm9taXNlPGxzcC5Eb2N1bWVudExpbms+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ2RvY3VtZW50TGluay9yZXNvbHZlJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZm9ybWF0dGluZ2AgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RvY3VtZW50Rm9ybWF0dGluZ1BhcmFtc30gaWRlbnRpZnlpbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZCBhcyB3ZWxsIGFzXG4gIC8vIGFkZGl0aW9uYWwgZm9ybWF0dGluZyBwcmVmZXJlbmNlcy5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge1RleHRFZGl0fXMgdG8gYmUgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgdG9cbiAgLy8gY29ycmVjdGx5IHJlZm9ybWF0IGl0LlxuICBwdWJsaWMgZG9jdW1lbnRGb3JtYXR0aW5nKHBhcmFtczogbHNwLkRvY3VtZW50Rm9ybWF0dGluZ1BhcmFtcyk6IFByb21pc2U8bHNwLlRleHRFZGl0W10+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9mb3JtYXR0aW5nJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvcmFuZ2VGb3JtYXR0aW5nYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCBhbmQgcmFuZ2UgdG8gYmUgZm9ybWF0dGVkXG4gIC8vIGFzIHdlbGwgYXMgYWRkaXRpb25hbCBmb3JtYXR0aW5nIHByZWZlcmVuY2VzLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9cyB0byBiZSBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCB0b1xuICAvLyBjb3JyZWN0bHkgcmVmb3JtYXQgaXQuXG4gIHB1YmxpYyBkb2N1bWVudFJhbmdlRm9ybWF0dGluZyhwYXJhbXM6IGxzcC5Eb2N1bWVudFJhbmdlRm9ybWF0dGluZ1BhcmFtcyk6IFByb21pc2U8bHNwLlRleHRFZGl0W10+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9yYW5nZUZvcm1hdHRpbmcnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9vblR5cGVGb3JtYXR0aW5nYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkLFxuICAvLyB0aGUgY2hhcmFjdGVyIHRoYXQgd2FzIHR5cGVkIGFuZCBhdCB3aGF0IHBvc2l0aW9uIGFzIHdlbGwgYXMgYWRkaXRpb25hbCBmb3JtYXR0aW5nIHByZWZlcmVuY2VzLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9cyB0byBiZSBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCB0b1xuICAvLyBjb3JyZWN0bHkgcmVmb3JtYXQgaXQuXG4gIHB1YmxpYyBkb2N1bWVudE9uVHlwZUZvcm1hdHRpbmcocGFyYW1zOiBsc3AuRG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUGFyYW1zKTogUHJvbWlzZTxsc3AuVGV4dEVkaXRbXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L29uVHlwZUZvcm1hdHRpbmcnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9yZW5hbWVgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtSZW5hbWVQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCBjb250YWluaW5nIHRoZSBzeW1ib2wgdG8gYmUgcmVuYW1lZCxcbiAgLy8gYXMgd2VsbCBhcyB0aGUgcG9zaXRpb24gYW5kIG5ldyBuYW1lLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge1dvcmtzcGFjZUVkaXR9IHRoYXQgY29udGFpbnMgYSBsaXN0IG9mIHtUZXh0RWRpdH1zIGVpdGhlclxuICAvLyBvbiB0aGUgY2hhbmdlcyBwcm9wZXJ0eSAoa2V5ZWQgYnkgdXJpKSBvciB0aGUgZG9jdW1lbnRDaGFuZ2VzIHByb3BlcnR5IGNvbnRhaW5pbmdcbiAgLy8gYW4ge0FycmF5fSBvZiB7VGV4dERvY3VtZW50RWRpdH1zIChwcmVmZXJyZWQpLlxuICBwdWJsaWMgcmVuYW1lKHBhcmFtczogbHNwLlJlbmFtZVBhcmFtcyk6IFByb21pc2U8bHNwLldvcmtzcGFjZUVkaXQ+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9yZW5hbWUnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHdvcmtzcGFjZS9leGVjdXRlQ29tbWFuZGAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0V4ZWN1dGVDb21tYW5kUGFyYW1zfSBzcGVjaWZ5aW5nIHRoZSBjb21tYW5kIGFuZCBhcmd1bWVudHNcbiAgLy8gdGhlIGxhbmd1YWdlIHNlcnZlciBzaG91bGQgZXhlY3V0ZSAodGhlc2UgY29tbWFuZHMgYXJlIHVzdWFsbHkgZnJvbSB7Q29kZUxlbnN9IG9yIHtDb2RlQWN0aW9ufVxuICAvLyByZXNwb25zZXMpLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW55dGhpbmcuXG4gIHB1YmxpYyBleGVjdXRlQ29tbWFuZChwYXJhbXM6IGxzcC5FeGVjdXRlQ29tbWFuZFBhcmFtcyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd3b3Jrc3BhY2UvZXhlY3V0ZUNvbW1hbmQnLCBwYXJhbXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfb25SZXF1ZXN0PFQgZXh0ZW5kcyBFeHRyYWN0PGtleW9mIEtub3duUmVxdWVzdHMsIHN0cmluZz4+KFxuICAgIHR5cGU6IHsgbWV0aG9kOiBUIH0sIGNhbGxiYWNrOiBSZXF1ZXN0Q2FsbGJhY2s8VD4sXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX3JwYy5vblJlcXVlc3QodHlwZS5tZXRob2QsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMub25SZXF1ZXN0ICR7dHlwZS5tZXRob2R9YCwgdmFsdWUpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX29uTm90aWZpY2F0aW9uPFQgZXh0ZW5kcyBFeHRyYWN0PGtleW9mIEtub3duTm90aWZpY2F0aW9ucywgc3RyaW5nPj4oXG4gICAgdHlwZTogeyBtZXRob2Q6IFQgfSwgY2FsbGJhY2s6IChvYmo6IEtub3duTm90aWZpY2F0aW9uc1tUXSkgPT4gdm9pZCxcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5fcnBjLm9uTm90aWZpY2F0aW9uKHR5cGUubWV0aG9kLCAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMub25Ob3RpZmljYXRpb24gJHt0eXBlLm1ldGhvZH1gLCB2YWx1ZSk7XG4gICAgICBjYWxsYmFjayh2YWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9zZW5kTm90aWZpY2F0aW9uKG1ldGhvZDogc3RyaW5nLCBhcmdzPzogb2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5fbG9nLmRlYnVnKGBycGMuc2VuZE5vdGlmaWNhdGlvbiAke21ldGhvZH1gLCBhcmdzKTtcbiAgICB0aGlzLl9ycGMuc2VuZE5vdGlmaWNhdGlvbihtZXRob2QsIGFyZ3MpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfc2VuZFJlcXVlc3QoXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgYXJncz86IG9iamVjdCxcbiAgICBjYW5jZWxsYXRpb25Ub2tlbj86IGpzb25ycGMuQ2FuY2VsbGF0aW9uVG9rZW4sXG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgdGhpcy5fbG9nLmRlYnVnKGBycGMuc2VuZFJlcXVlc3QgJHttZXRob2R9IHNlbmRpbmdgLCBhcmdzKTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIGxldCByZXN1bHQ7XG4gICAgICBpZiAoY2FuY2VsbGF0aW9uVG9rZW4pIHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5fcnBjLnNlbmRSZXF1ZXN0KG1ldGhvZCwgYXJncywgY2FuY2VsbGF0aW9uVG9rZW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgY2FuY2VsbGF0aW9uVG9rZW4gaXMgbnVsbCBvciB1bmRlZmluZWQsIGRvbid0IGFkZCB0aGUgdGhpcmRcbiAgICAgICAgLy8gYXJndW1lbnQgb3RoZXJ3aXNlIHZzY29kZS1qc29ucnBjIHdpbGwgc2VuZCBhbiBhZGRpdGlvbmFsLCBudWxsXG4gICAgICAgIC8vIG1lc3NhZ2UgcGFyYW1ldGVyIHRvIHRoZSByZXF1ZXN0XG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuX3JwYy5zZW5kUmVxdWVzdChtZXRob2QsIGFyZ3MpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0b29rID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydDtcbiAgICAgIHRoaXMuX2xvZy5kZWJ1ZyhgcnBjLnNlbmRSZXF1ZXN0ICR7bWV0aG9kfSByZWNlaXZlZCAoJHtNYXRoLmZsb29yKHRvb2spfW1zKWAsIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlRXJyb3IgPSBlIGFzIGpzb25ycGMuUmVzcG9uc2VFcnJvcjxhbnk+O1xuICAgICAgaWYgKGNhbmNlbGxhdGlvblRva2VuICYmIHJlc3BvbnNlRXJyb3IuY29kZSA9PT0ganNvbnJwYy5FcnJvckNvZGVzLlJlcXVlc3RDYW5jZWxsZWQpIHtcbiAgICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMuc2VuZFJlcXVlc3QgJHttZXRob2R9IHdhcyBjYW5jZWxsZWRgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLl9sb2cuZXJyb3IoYHJwYy5zZW5kUmVxdWVzdCAke21ldGhvZH0gdGhyZXdgLCBlKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRGlhZ25vc3RpY0NvZGUgPSBudW1iZXIgfCBzdHJpbmc7XG5cbi8qKlxuICogQ29udGFpbnMgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY29udGV4dCBpbiB3aGljaCBhIGNvbXBsZXRpb24gcmVxdWVzdCBpcyB0cmlnZ2VyZWQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxldGlvbkNvbnRleHQge1xuICAvKipcbiAgICogSG93IHRoZSBjb21wbGV0aW9uIHdhcyB0cmlnZ2VyZWQuXG4gICAqL1xuICB0cmlnZ2VyS2luZDogbHNwLkNvbXBsZXRpb25UcmlnZ2VyS2luZDtcblxuICAvKipcbiAgICogVGhlIHRyaWdnZXIgY2hhcmFjdGVyIChhIHNpbmdsZSBjaGFyYWN0ZXIpIHRoYXQgaGFzIHRyaWdnZXIgY29kZSBjb21wbGV0ZS5cbiAgICogSXMgdW5kZWZpbmVkIGlmIGB0cmlnZ2VyS2luZCAhPT0gQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJDaGFyYWN0ZXJgXG4gICAqL1xuICB0cmlnZ2VyQ2hhcmFjdGVyPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIENvbXBsZXRpb24gcGFyYW1ldGVyc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBsZXRpb25QYXJhbXMgZXh0ZW5kcyBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMge1xuXG4gIC8qKlxuICAgKiBUaGUgY29tcGxldGlvbiBjb250ZXh0LiBUaGlzIGlzIG9ubHkgYXZhaWxhYmxlIGl0IHRoZSBjbGllbnQgc3BlY2lmaWVzXG4gICAqIHRvIHNlbmQgdGhpcyB1c2luZyBgQ2xpZW50Q2FwYWJpbGl0aWVzLnRleHREb2N1bWVudC5jb21wbGV0aW9uLmNvbnRleHRTdXBwb3J0ID09PSB0cnVlYFxuICAgKi9cbiAgY29udGV4dD86IENvbXBsZXRpb25Db250ZXh0O1xufVxuIl19