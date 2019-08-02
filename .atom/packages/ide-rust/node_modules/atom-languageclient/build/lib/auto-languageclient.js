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
const cp = require("child_process");
const rpc = require("vscode-jsonrpc");
const path = require("path");
const convert_js_1 = require("./convert.js");
const apply_edit_adapter_1 = require("./adapters/apply-edit-adapter");
const autocomplete_adapter_1 = require("./adapters/autocomplete-adapter");
const code_action_adapter_1 = require("./adapters/code-action-adapter");
const code_format_adapter_1 = require("./adapters/code-format-adapter");
const code_highlight_adapter_1 = require("./adapters/code-highlight-adapter");
const datatip_adapter_1 = require("./adapters/datatip-adapter");
const definition_adapter_1 = require("./adapters/definition-adapter");
const document_sync_adapter_1 = require("./adapters/document-sync-adapter");
const find_references_adapter_1 = require("./adapters/find-references-adapter");
const linter_push_v2_adapter_1 = require("./adapters/linter-push-v2-adapter");
const logging_console_adapter_1 = require("./adapters/logging-console-adapter");
const notifications_adapter_1 = require("./adapters/notifications-adapter");
const outline_view_adapter_1 = require("./adapters/outline-view-adapter");
const signature_help_adapter_1 = require("./adapters/signature-help-adapter");
const Utils = require("./utils");
const languageclient_1 = require("./languageclient");
exports.LanguageClientConnection = languageclient_1.LanguageClientConnection;
const logger_1 = require("./logger");
const server_manager_js_1 = require("./server-manager.js");
const atom_1 = require("atom");
// Public: AutoLanguageClient provides a simple way to have all the supported
// Atom-IDE services wired up entirely for you by just subclassing it and
// implementing startServerProcess/getGrammarScopes/getLanguageName and
// getServerName.
class AutoLanguageClient {
    constructor() {
        this._isDeactivating = false;
        this._serverAdapters = new WeakMap();
        this.processStdErr = '';
        this.reportBusyWhile = (title, f) => __awaiter(this, void 0, void 0, function* () {
            if (this.busySignalService) {
                return this.busySignalService.reportBusyWhile(title, f);
            }
            else {
                return this.reportBusyWhileDefault(title, f);
            }
        });
        this.reportBusyWhileDefault = (title, f) => __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`[Started] ${title}`);
            let res;
            try {
                res = yield f();
            }
            finally {
                this.logger.info(`[Finished] ${title}`);
            }
            return res;
        });
    }
    // You must implement these so we know how to deal with your language and server
    // -------------------------------------------------------------------------
    // Return an array of the grammar scopes you handle, e.g. [ 'source.js' ]
    getGrammarScopes() {
        throw Error('Must implement getGrammarScopes when extending AutoLanguageClient');
    }
    // Return the name of the language you support, e.g. 'JavaScript'
    getLanguageName() {
        throw Error('Must implement getLanguageName when extending AutoLanguageClient');
    }
    // Return the name of your server, e.g. 'Eclipse JDT'
    getServerName() {
        throw Error('Must implement getServerName when extending AutoLanguageClient');
    }
    // Start your server process
    startServerProcess(_projectPath) {
        throw Error('Must override startServerProcess to start language server process when extending AutoLanguageClient');
    }
    // You might want to override these for different behavior
    // ---------------------------------------------------------------------------
    // Determine whether we should start a server for a given editor if we don't have one yet
    shouldStartForEditor(editor) {
        return this.getGrammarScopes().includes(editor.getGrammar().scopeName);
    }
    // Return the parameters used to initialize a client - you may want to extend capabilities
    getInitializeParams(projectPath, process) {
        return {
            processId: process.pid,
            rootPath: projectPath,
            rootUri: convert_js_1.default.pathToUri(projectPath),
            workspaceFolders: [],
            capabilities: {
                workspace: {
                    applyEdit: true,
                    configuration: false,
                    workspaceEdit: {
                        documentChanges: true,
                    },
                    workspaceFolders: false,
                    didChangeConfiguration: {
                        dynamicRegistration: false,
                    },
                    didChangeWatchedFiles: {
                        dynamicRegistration: false,
                    },
                    symbol: {
                        dynamicRegistration: false,
                    },
                    executeCommand: {
                        dynamicRegistration: false,
                    },
                },
                textDocument: {
                    synchronization: {
                        dynamicRegistration: false,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true,
                    },
                    completion: {
                        dynamicRegistration: false,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: false,
                        },
                        contextSupport: true,
                    },
                    hover: {
                        dynamicRegistration: false,
                    },
                    signatureHelp: {
                        dynamicRegistration: false,
                    },
                    references: {
                        dynamicRegistration: false,
                    },
                    documentHighlight: {
                        dynamicRegistration: false,
                    },
                    documentSymbol: {
                        dynamicRegistration: false,
                        hierarchicalDocumentSymbolSupport: true,
                    },
                    formatting: {
                        dynamicRegistration: false,
                    },
                    rangeFormatting: {
                        dynamicRegistration: false,
                    },
                    onTypeFormatting: {
                        dynamicRegistration: false,
                    },
                    definition: {
                        dynamicRegistration: false,
                    },
                    codeAction: {
                        dynamicRegistration: false,
                    },
                    codeLens: {
                        dynamicRegistration: false,
                    },
                    documentLink: {
                        dynamicRegistration: false,
                    },
                    rename: {
                        dynamicRegistration: false,
                    },
                    // We do not support these features yet.
                    // Need to set to undefined to appease TypeScript weak type detection.
                    implementation: undefined,
                    typeDefinition: undefined,
                    colorProvider: undefined,
                    foldingRange: undefined,
                },
                experimental: {},
            },
        };
    }
    // Early wire-up of listeners before initialize method is sent
    preInitialization(_connection) { }
    // Late wire-up of listeners after initialize method has been sent
    postInitialization(_server) { }
    // Determine whether to use ipc, stdio or socket to connect to the server
    getConnectionType() {
        return this.socket != null ? 'socket' : 'stdio';
    }
    // Return the name of your root configuration key
    getRootConfigurationKey() {
        return '';
    }
    // Optionally transform the configuration object before it is sent to the server
    mapConfigurationObject(configuration) {
        return configuration;
    }
    // Helper methods that are useful for implementors
    // ---------------------------------------------------------------------------
    // Gets a LanguageClientConnection for a given TextEditor
    getConnectionForEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            return server ? server.connection : null;
        });
    }
    // Restart all active language servers for this language client in the workspace
    restartAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._serverManager.restartAllServers();
        });
    }
    // Default implementation of the rest of the AutoLanguageClient
    // ---------------------------------------------------------------------------
    // Activate does very little for perf reasons - hooks in via ServerManager for later 'activation'
    activate() {
        this._disposable = new atom_1.CompositeDisposable();
        this.name = `${this.getLanguageName()} (${this.getServerName()})`;
        this.logger = this.getLogger();
        this._serverManager = new server_manager_js_1.ServerManager((p) => this.startServer(p), this.logger, (e) => this.shouldStartForEditor(e), (filepath) => this.filterChangeWatchedFiles(filepath), this.reportBusyWhile, this.getServerName(), this.shutdownServersGracefully());
        this._serverManager.startListening();
        process.on('exit', () => this.exitCleanup.bind(this));
    }
    exitCleanup() {
        this._serverManager.terminate();
    }
    // Deactivate disposes the resources we're using
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isDeactivating = true;
            this._disposable.dispose();
            this._serverManager.stopListening();
            yield this._serverManager.stopAllServers();
        });
    }
    spawnChildNode(args, options = {}) {
        this.logger.debug(`starting child Node "${args.join(' ')}"`);
        options.env = options.env || Object.create(process.env);
        if (options.env) {
            options.env.ELECTRON_RUN_AS_NODE = '1';
            options.env.ELECTRON_NO_ATTACH_CONSOLE = '1';
        }
        return cp.spawn(process.execPath, args, options);
    }
    // LSP logging is only set for warnings & errors by default unless you turn on the core.debugLSP setting
    getLogger() {
        const filter = atom.config.get('core.debugLSP')
            ? logger_1.FilteredLogger.DeveloperLevelFilter
            : logger_1.FilteredLogger.UserLevelFilter;
        return new logger_1.FilteredLogger(new logger_1.ConsoleLogger(this.name), filter);
    }
    // Starts the server by starting the process, then initializing the language server and starting adapters
    startServer(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const process = yield this.reportBusyWhile(`Starting ${this.getServerName()} for ${path.basename(projectPath)}`, () => __awaiter(this, void 0, void 0, function* () { return this.startServerProcess(projectPath); }));
            this.captureServerErrors(process, projectPath);
            const connection = new languageclient_1.LanguageClientConnection(this.createRpcConnection(process), this.logger);
            this.preInitialization(connection);
            const initializeParams = this.getInitializeParams(projectPath, process);
            const initialization = connection.initialize(initializeParams);
            this.reportBusyWhile(`${this.getServerName()} initializing for ${path.basename(projectPath)}`, () => initialization);
            const initializeResponse = yield initialization;
            const newServer = {
                projectPath,
                process,
                connection,
                capabilities: initializeResponse.capabilities,
                disposable: new atom_1.CompositeDisposable(),
                additionalPaths: new Set(),
                considerDefinitionPath: (defPath) => {
                    if (!defPath.startsWith(projectPath)) {
                        newServer.additionalPaths.add(path.dirname(defPath));
                    }
                },
            };
            this.postInitialization(newServer);
            connection.initialized();
            connection.on('close', () => {
                if (!this._isDeactivating) {
                    this._serverManager.stopServer(newServer);
                    if (!this._serverManager.hasServerReachedRestartLimit(newServer)) {
                        this.logger.debug(`Restarting language server for project '${newServer.projectPath}'`);
                        this._serverManager.startServer(projectPath);
                    }
                    else {
                        this.logger.warn(`Language server has exceeded auto-restart limit for project '${newServer.projectPath}'`);
                        atom.notifications.addError(
                        // tslint:disable-next-line:max-line-length
                        `The ${this.name} language server has exited and exceeded the restart limit for project '${newServer.projectPath}'`);
                    }
                }
            });
            const configurationKey = this.getRootConfigurationKey();
            if (configurationKey) {
                newServer.disposable.add(atom.config.observe(configurationKey, (config) => {
                    const mappedConfig = this.mapConfigurationObject(config || {});
                    if (mappedConfig) {
                        connection.didChangeConfiguration({
                            settings: mappedConfig,
                        });
                    }
                }));
            }
            this.startExclusiveAdapters(newServer);
            return newServer;
        });
    }
    captureServerErrors(childProcess, projectPath) {
        childProcess.on('error', (err) => this.handleSpawnFailure(err));
        childProcess.on('exit', (code, signal) => this.logger.debug(`exit: code ${code} signal ${signal}`));
        childProcess.stderr.setEncoding('utf8');
        childProcess.stderr.on('data', (chunk) => {
            const errorString = chunk.toString();
            this.handleServerStderr(errorString, projectPath);
            // Keep the last 5 lines for packages to use in messages
            this.processStdErr = (this.processStdErr + errorString)
                .split('\n')
                .slice(-5)
                .join('\n');
        });
    }
    handleSpawnFailure(err) {
        atom.notifications.addError(`${this.getServerName()} language server for ${this.getLanguageName()} unable to start`, {
            dismissable: true,
            description: err.toString(),
        });
    }
    // Creates the RPC connection which can be ipc, socket or stdio
    createRpcConnection(process) {
        let reader;
        let writer;
        const connectionType = this.getConnectionType();
        switch (connectionType) {
            case 'ipc':
                reader = new rpc.IPCMessageReader(process);
                writer = new rpc.IPCMessageWriter(process);
                break;
            case 'socket':
                reader = new rpc.SocketMessageReader(this.socket);
                writer = new rpc.SocketMessageWriter(this.socket);
                break;
            case 'stdio':
                reader = new rpc.StreamMessageReader(process.stdout);
                writer = new rpc.StreamMessageWriter(process.stdin);
                break;
            default:
                return Utils.assertUnreachable(connectionType);
        }
        return rpc.createMessageConnection(reader, writer, {
            log: (..._args) => { },
            warn: (..._args) => { },
            info: (..._args) => { },
            error: (...args) => {
                this.logger.error(args);
            },
        });
    }
    // Start adapters that are not shared between servers
    startExclusiveAdapters(server) {
        apply_edit_adapter_1.default.attach(server.connection);
        notifications_adapter_1.default.attach(server.connection, this.name, server.projectPath);
        if (document_sync_adapter_1.default.canAdapt(server.capabilities)) {
            const docSyncAdapter = new document_sync_adapter_1.default(server.connection, (editor) => this.shouldSyncForEditor(editor, server.projectPath), server.capabilities.textDocumentSync, this.reportBusyWhile);
            server.disposable.add(docSyncAdapter);
        }
        const linterPushV2 = new linter_push_v2_adapter_1.default(server.connection);
        if (this._linterDelegate != null) {
            linterPushV2.attach(this._linterDelegate);
        }
        server.disposable.add(linterPushV2);
        const loggingConsole = new logging_console_adapter_1.default(server.connection);
        if (this._consoleDelegate != null) {
            loggingConsole.attach(this._consoleDelegate({ id: this.name, name: this.getLanguageName() }));
        }
        server.disposable.add(loggingConsole);
        let signatureHelpAdapter;
        if (signature_help_adapter_1.default.canAdapt(server.capabilities)) {
            signatureHelpAdapter = new signature_help_adapter_1.default(server, this.getGrammarScopes());
            if (this._signatureHelpRegistry != null) {
                signatureHelpAdapter.attach(this._signatureHelpRegistry);
            }
            server.disposable.add(signatureHelpAdapter);
        }
        this._serverAdapters.set(server, {
            linterPushV2, loggingConsole, signatureHelpAdapter,
        });
    }
    shouldSyncForEditor(editor, projectPath) {
        return this.isFileInProject(editor, projectPath) && this.shouldStartForEditor(editor);
    }
    isFileInProject(editor, projectPath) {
        return (editor.getPath() || '').startsWith(projectPath);
    }
    // Autocomplete+ via LS completion---------------------------------------
    provideAutocomplete() {
        return {
            selector: this.getGrammarScopes()
                .map((g) => g.includes('.') ? '.' + g : g)
                .join(', '),
            inclusionPriority: 1,
            suggestionPriority: 2,
            excludeLowerPriority: false,
            getSuggestions: this.getSuggestions.bind(this),
            onDidInsertSuggestion: this.onDidInsertSuggestion.bind(this),
            getSuggestionDetailsOnSelect: this.getSuggestionDetailsOnSelect.bind(this),
        };
    }
    getSuggestions(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(request.editor);
            if (server == null || !autocomplete_adapter_1.default.canAdapt(server.capabilities)) {
                return [];
            }
            this.autoComplete = this.autoComplete || new autocomplete_adapter_1.default();
            this._lastAutocompleteRequest = request;
            return this.autoComplete.getSuggestions(server, request, this.onDidConvertAutocomplete, atom.config.get('autocomplete-plus.minimumWordLength'));
        });
    }
    getSuggestionDetailsOnSelect(suggestion) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = this._lastAutocompleteRequest;
            if (request == null) {
                return null;
            }
            const server = yield this._serverManager.getServer(request.editor);
            if (server == null || !autocomplete_adapter_1.default.canResolve(server.capabilities) || this.autoComplete == null) {
                return null;
            }
            return this.autoComplete.completeSuggestion(server, suggestion, request, this.onDidConvertAutocomplete);
        });
    }
    onDidConvertAutocomplete(_completionItem, _suggestion, _request) {
    }
    onDidInsertSuggestion(_arg) { }
    // Definitions via LS documentHighlight and gotoDefinition------------
    provideDefinitions() {
        return {
            name: this.name,
            priority: 20,
            grammarScopes: this.getGrammarScopes(),
            getDefinition: this.getDefinition.bind(this),
        };
    }
    getDefinition(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !definition_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.definitions = this.definitions || new definition_adapter_1.default();
            const queryPromise = this.definitions.getDefinition(server.connection, server.capabilities, this.getLanguageName(), editor, point);
            if (this.serversSupportDefinitionDestinations()) {
                queryPromise.then((query) => {
                    if (query) {
                        for (const def of query.definitions) {
                            server.considerDefinitionPath(def.path);
                        }
                    }
                });
            }
            return queryPromise;
        });
    }
    // Outline View via LS documentSymbol---------------------------------
    provideOutlines() {
        return {
            name: this.name,
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            getOutline: this.getOutline.bind(this),
        };
    }
    getOutline(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !outline_view_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.outlineView = this.outlineView || new outline_view_adapter_1.default();
            return this.outlineView.getOutline(server.connection, editor);
        });
    }
    // Linter push v2 API via LS publishDiagnostics
    consumeLinterV2(registerIndie) {
        this._linterDelegate = registerIndie({ name: this.name });
        if (this._linterDelegate == null) {
            return;
        }
        for (const server of this._serverManager.getActiveServers()) {
            const linterPushV2 = this.getServerAdapter(server, 'linterPushV2');
            if (linterPushV2 != null) {
                linterPushV2.attach(this._linterDelegate);
            }
        }
    }
    // Find References via LS findReferences------------------------------
    provideFindReferences() {
        return {
            isEditorSupported: (editor) => this.getGrammarScopes().includes(editor.getGrammar().scopeName),
            findReferences: this.getReferences.bind(this),
        };
    }
    getReferences(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !find_references_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.findReferences = this.findReferences || new find_references_adapter_1.default();
            return this.findReferences.getReferences(server.connection, editor, point, server.projectPath);
        });
    }
    // Datatip via LS textDocument/hover----------------------------------
    consumeDatatip(service) {
        this._disposable.add(service.addProvider({
            providerName: this.name,
            priority: 1,
            grammarScopes: this.getGrammarScopes(),
            validForScope: (scopeName) => {
                return this.getGrammarScopes().includes(scopeName);
            },
            datatip: this.getDatatip.bind(this),
        }));
    }
    getDatatip(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !datatip_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.datatip = this.datatip || new datatip_adapter_1.default();
            return this.datatip.getDatatip(server.connection, editor, point);
        });
    }
    // Console via LS logging---------------------------------------------
    consumeConsole(createConsole) {
        this._consoleDelegate = createConsole;
        for (const server of this._serverManager.getActiveServers()) {
            const loggingConsole = this.getServerAdapter(server, 'loggingConsole');
            if (loggingConsole) {
                loggingConsole.attach(this._consoleDelegate({ id: this.name, name: this.getLanguageName() }));
            }
        }
        // No way of detaching from client connections today
        return new atom_1.Disposable(() => { });
    }
    // Code Format via LS formatDocument & formatDocumentRange------------
    provideCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatCode: this.getCodeFormat.bind(this),
        };
    }
    getCodeFormat(editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_format_adapter_1.default.canAdapt(server.capabilities)) {
                return [];
            }
            return code_format_adapter_1.default.format(server.connection, server.capabilities, editor, range);
        });
    }
    provideRangeCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatCode: this.getRangeCodeFormat.bind(this),
        };
    }
    getRangeCodeFormat(editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !server.capabilities.documentRangeFormattingProvider) {
                return [];
            }
            return code_format_adapter_1.default.formatRange(server.connection, editor, range);
        });
    }
    provideFileCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatEntireFile: this.getFileCodeFormat.bind(this),
        };
    }
    provideOnSaveCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatOnSave: this.getFileCodeFormat.bind(this),
        };
    }
    getFileCodeFormat(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !server.capabilities.documentFormattingProvider) {
                return [];
            }
            return code_format_adapter_1.default.formatDocument(server.connection, editor);
        });
    }
    provideOnTypeCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatAtPosition: this.getOnTypeCodeFormat.bind(this),
        };
    }
    getOnTypeCodeFormat(editor, point, character) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !server.capabilities.documentOnTypeFormattingProvider) {
                return [];
            }
            return code_format_adapter_1.default.formatOnType(server.connection, editor, point, character);
        });
    }
    provideCodeHighlight() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            highlight: (editor, position) => {
                return this.getCodeHighlight(editor, position);
            },
        };
    }
    getCodeHighlight(editor, position) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_highlight_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            return code_highlight_adapter_1.default.highlight(server.connection, server.capabilities, editor, position);
        });
    }
    provideCodeActions() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            getCodeActions: (editor, range, diagnostics) => {
                return this.getCodeActions(editor, range, diagnostics);
            },
        };
    }
    getCodeActions(editor, range, diagnostics) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_action_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            return code_action_adapter_1.default.getCodeActions(server.connection, server.capabilities, this.getServerAdapter(server, 'linterPushV2'), editor, range, diagnostics);
        });
    }
    consumeSignatureHelp(registry) {
        this._signatureHelpRegistry = registry;
        for (const server of this._serverManager.getActiveServers()) {
            const signatureHelpAdapter = this.getServerAdapter(server, 'signatureHelpAdapter');
            if (signatureHelpAdapter != null) {
                signatureHelpAdapter.attach(registry);
            }
        }
        return new atom_1.Disposable(() => {
            this._signatureHelpRegistry = undefined;
        });
    }
    consumeBusySignal(service) {
        this.busySignalService = service;
        return new atom_1.Disposable(() => delete this.busySignalService);
    }
    /**
     * `didChangeWatchedFiles` message filtering, override for custom logic.
     * @param filePath path of a file that has changed in the project path
     * @return false => message will not be sent to the language server
     */
    filterChangeWatchedFiles(_filePath) {
        return true;
    }
    /** @return false => servers will be killed without awaiting shutdown response. */
    shutdownServersGracefully() {
        return true;
    }
    /**
     * Called on language server stderr output.
     * @param stderr a chunk of stderr from a language server instance
     */
    handleServerStderr(stderr, _projectPath) {
        stderr.split('\n').filter((l) => l).forEach((line) => this.logger.warn(`stderr ${line}`));
    }
    /**
     * Indicates that the language server can support LSP functionality for
     * out of project files indicated by `textDocument/definition` responses.
     *
     * Default: false
     */
    serversSupportDefinitionDestinations() {
        return false;
    }
    getServerAdapter(server, adapter) {
        const adapters = this._serverAdapters.get(server);
        return adapters && adapters[adapter];
    }
}
exports.default = AutoLanguageClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1sYW5ndWFnZWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hdXRvLWxhbmd1YWdlY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxvQ0FBb0M7QUFFcEMsc0NBQXNDO0FBQ3RDLDZCQUE2QjtBQUc3Qiw2Q0FBbUM7QUFDbkMsc0VBQTZEO0FBQzdELDBFQUFrRTtBQUNsRSx3RUFBK0Q7QUFDL0Qsd0VBQStEO0FBQy9ELDhFQUFxRTtBQUNyRSxnRUFBd0Q7QUFDeEQsc0VBQThEO0FBQzlELDRFQUFtRTtBQUNuRSxnRkFBdUU7QUFDdkUsOEVBQW9FO0FBQ3BFLGdGQUF1RTtBQUN2RSw0RUFBb0U7QUFDcEUsMEVBQWlFO0FBQ2pFLDhFQUFxRTtBQUNyRSxpQ0FBaUM7QUFFakMscURBQTREO0FBb0JyQyxtQ0FwQmQseUNBQXdCLENBb0JjO0FBbkIvQyxxQ0FJa0I7QUFDbEIsMkRBSTZCO0FBQzdCLCtCQU1jO0FBWWQsNkVBQTZFO0FBQzdFLHlFQUF5RTtBQUN6RSx1RUFBdUU7QUFDdkUsaUJBQWlCO0FBQ2pCLE1BQXFCLGtCQUFrQjtJQUF2QztRQU9VLG9CQUFlLEdBQVksS0FBSyxDQUFDO1FBQ2pDLG9CQUFlLEdBQUcsSUFBSSxPQUFPLEVBQWdDLENBQUM7UUFLNUQsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUF3dkIzQixvQkFBZSxHQUEwQixDQUFPLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwRSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDMUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN6RDtpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDOUM7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVTLDJCQUFzQixHQUEwQixD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Q0FDdEIsTUFBb0IsRUFBRSxPQUFVO1FBRWhDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBb0JGO0FBdnhCRCxxQ0F1eEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY3AgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCAqIGFzIHJwYyBmcm9tICd2c2NvZGUtanNvbnJwYyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQgKiBhcyBsaW50ZXIgZnJvbSAnYXRvbS9saW50ZXInO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi9jb252ZXJ0LmpzJztcbmltcG9ydCBBcHBseUVkaXRBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvYXBwbHktZWRpdC1hZGFwdGVyJztcbmltcG9ydCBBdXRvY29tcGxldGVBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXInO1xuaW1wb3J0IENvZGVBY3Rpb25BZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvY29kZS1hY3Rpb24tYWRhcHRlcic7XG5pbXBvcnQgQ29kZUZvcm1hdEFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9jb2RlLWZvcm1hdC1hZGFwdGVyJztcbmltcG9ydCBDb2RlSGlnaGxpZ2h0QWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2NvZGUtaGlnaGxpZ2h0LWFkYXB0ZXInO1xuaW1wb3J0IERhdGF0aXBBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvZGF0YXRpcC1hZGFwdGVyJztcbmltcG9ydCBEZWZpbml0aW9uQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2RlZmluaXRpb24tYWRhcHRlcic7XG5pbXBvcnQgRG9jdW1lbnRTeW5jQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlcic7XG5pbXBvcnQgRmluZFJlZmVyZW5jZXNBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXInO1xuaW1wb3J0IExpbnRlclB1c2hWMkFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyJztcbmltcG9ydCBMb2dnaW5nQ29uc29sZUFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9sb2dnaW5nLWNvbnNvbGUtYWRhcHRlcic7XG5pbXBvcnQgTm90aWZpY2F0aW9uc0FkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9ub3RpZmljYXRpb25zLWFkYXB0ZXInO1xuaW1wb3J0IE91dGxpbmVWaWV3QWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL291dGxpbmUtdmlldy1hZGFwdGVyJztcbmltcG9ydCBTaWduYXR1cmVIZWxwQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL3NpZ25hdHVyZS1oZWxwLWFkYXB0ZXInO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tICduZXQnO1xuaW1wb3J0IHsgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIH0gZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQge1xuICBDb25zb2xlTG9nZ2VyLFxuICBGaWx0ZXJlZExvZ2dlcixcbiAgTG9nZ2VyLFxufSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQge1xuICBMYW5ndWFnZVNlcnZlclByb2Nlc3MsXG4gIFNlcnZlck1hbmFnZXIsXG4gIEFjdGl2ZVNlcnZlcixcbn0gZnJvbSAnLi9zZXJ2ZXItbWFuYWdlci5qcyc7XG5pbXBvcnQge1xuICBEaXNwb3NhYmxlLFxuICBDb21wb3NpdGVEaXNwb3NhYmxlLFxuICBQb2ludCxcbiAgUmFuZ2UsXG4gIFRleHRFZGl0b3IsXG59IGZyb20gJ2F0b20nO1xuaW1wb3J0ICogYXMgYWMgZnJvbSAnYXRvbS9hdXRvY29tcGxldGUtcGx1cyc7XG5cbmV4cG9ydCB7IEFjdGl2ZVNlcnZlciwgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLCBMYW5ndWFnZVNlcnZlclByb2Nlc3MgfTtcbmV4cG9ydCB0eXBlIENvbm5lY3Rpb25UeXBlID0gJ3N0ZGlvJyB8ICdzb2NrZXQnIHwgJ2lwYyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVyQWRhcHRlcnMge1xuICBsaW50ZXJQdXNoVjI6IExpbnRlclB1c2hWMkFkYXB0ZXI7XG4gIGxvZ2dpbmdDb25zb2xlOiBMb2dnaW5nQ29uc29sZUFkYXB0ZXI7XG4gIHNpZ25hdHVyZUhlbHBBZGFwdGVyPzogU2lnbmF0dXJlSGVscEFkYXB0ZXI7XG59XG5cbi8vIFB1YmxpYzogQXV0b0xhbmd1YWdlQ2xpZW50IHByb3ZpZGVzIGEgc2ltcGxlIHdheSB0byBoYXZlIGFsbCB0aGUgc3VwcG9ydGVkXG4vLyBBdG9tLUlERSBzZXJ2aWNlcyB3aXJlZCB1cCBlbnRpcmVseSBmb3IgeW91IGJ5IGp1c3Qgc3ViY2xhc3NpbmcgaXQgYW5kXG4vLyBpbXBsZW1lbnRpbmcgc3RhcnRTZXJ2ZXJQcm9jZXNzL2dldEdyYW1tYXJTY29wZXMvZ2V0TGFuZ3VhZ2VOYW1lIGFuZFxuLy8gZ2V0U2VydmVyTmFtZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9MYW5ndWFnZUNsaWVudCB7XG4gIHByaXZhdGUgX2Rpc3Bvc2FibGUhOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBwcml2YXRlIF9zZXJ2ZXJNYW5hZ2VyITogU2VydmVyTWFuYWdlcjtcbiAgcHJpdmF0ZSBfY29uc29sZURlbGVnYXRlPzogYXRvbUlkZS5Db25zb2xlU2VydmljZTtcbiAgcHJpdmF0ZSBfbGludGVyRGVsZWdhdGU/OiBsaW50ZXIuSW5kaWVEZWxlZ2F0ZTtcbiAgcHJpdmF0ZSBfc2lnbmF0dXJlSGVscFJlZ2lzdHJ5PzogYXRvbUlkZS5TaWduYXR1cmVIZWxwUmVnaXN0cnk7XG4gIHByaXZhdGUgX2xhc3RBdXRvY29tcGxldGVSZXF1ZXN0PzogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudDtcbiAgcHJpdmF0ZSBfaXNEZWFjdGl2YXRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc2VydmVyQWRhcHRlcnMgPSBuZXcgV2Vha01hcDxBY3RpdmVTZXJ2ZXIsIFNlcnZlckFkYXB0ZXJzPigpO1xuXG4gIC8vIEF2YWlsYWJsZSBpZiBjb25zdW1lQnVzeVNpZ25hbCBpcyBzZXR1cFxuICBwcm90ZWN0ZWQgYnVzeVNpZ25hbFNlcnZpY2U/OiBhdG9tSWRlLkJ1c3lTaWduYWxTZXJ2aWNlO1xuXG4gIHByb3RlY3RlZCBwcm9jZXNzU3RkRXJyOiBzdHJpbmcgPSAnJztcbiAgcHJvdGVjdGVkIGxvZ2dlciE6IExvZ2dlcjtcbiAgcHJvdGVjdGVkIG5hbWUhOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBzb2NrZXQhOiBTb2NrZXQ7XG5cbiAgLy8gU2hhcmVkIGFkYXB0ZXJzIHRoYXQgY2FuIHRha2UgdGhlIFJQQyBjb25uZWN0aW9uIGFzIHJlcXVpcmVkXG4gIHByb3RlY3RlZCBhdXRvQ29tcGxldGU/OiBBdXRvY29tcGxldGVBZGFwdGVyO1xuICBwcm90ZWN0ZWQgZGF0YXRpcD86IERhdGF0aXBBZGFwdGVyO1xuICBwcm90ZWN0ZWQgZGVmaW5pdGlvbnM/OiBEZWZpbml0aW9uQWRhcHRlcjtcbiAgcHJvdGVjdGVkIGZpbmRSZWZlcmVuY2VzPzogRmluZFJlZmVyZW5jZXNBZGFwdGVyO1xuICBwcm90ZWN0ZWQgb3V0bGluZVZpZXc/OiBPdXRsaW5lVmlld0FkYXB0ZXI7XG5cbiAgLy8gWW91IG11c3QgaW1wbGVtZW50IHRoZXNlIHNvIHdlIGtub3cgaG93IHRvIGRlYWwgd2l0aCB5b3VyIGxhbmd1YWdlIGFuZCBzZXJ2ZXJcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHVybiBhbiBhcnJheSBvZiB0aGUgZ3JhbW1hciBzY29wZXMgeW91IGhhbmRsZSwgZS5nLiBbICdzb3VyY2UuanMnIF1cbiAgcHJvdGVjdGVkIGdldEdyYW1tYXJTY29wZXMoKTogc3RyaW5nW10ge1xuICAgIHRocm93IEVycm9yKCdNdXN0IGltcGxlbWVudCBnZXRHcmFtbWFyU2NvcGVzIHdoZW4gZXh0ZW5kaW5nIEF1dG9MYW5ndWFnZUNsaWVudCcpO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBsYW5ndWFnZSB5b3Ugc3VwcG9ydCwgZS5nLiAnSmF2YVNjcmlwdCdcbiAgcHJvdGVjdGVkIGdldExhbmd1YWdlTmFtZSgpOiBzdHJpbmcge1xuICAgIHRocm93IEVycm9yKCdNdXN0IGltcGxlbWVudCBnZXRMYW5ndWFnZU5hbWUgd2hlbiBleHRlbmRpbmcgQXV0b0xhbmd1YWdlQ2xpZW50Jyk7XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIG5hbWUgb2YgeW91ciBzZXJ2ZXIsIGUuZy4gJ0VjbGlwc2UgSkRUJ1xuICBwcm90ZWN0ZWQgZ2V0U2VydmVyTmFtZSgpOiBzdHJpbmcge1xuICAgIHRocm93IEVycm9yKCdNdXN0IGltcGxlbWVudCBnZXRTZXJ2ZXJOYW1lIHdoZW4gZXh0ZW5kaW5nIEF1dG9MYW5ndWFnZUNsaWVudCcpO1xuICB9XG5cbiAgLy8gU3RhcnQgeW91ciBzZXJ2ZXIgcHJvY2Vzc1xuICBwcm90ZWN0ZWQgc3RhcnRTZXJ2ZXJQcm9jZXNzKF9wcm9qZWN0UGF0aDogc3RyaW5nKTogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzIHwgUHJvbWlzZTxMYW5ndWFnZVNlcnZlclByb2Nlc3M+IHtcbiAgICB0aHJvdyBFcnJvcignTXVzdCBvdmVycmlkZSBzdGFydFNlcnZlclByb2Nlc3MgdG8gc3RhcnQgbGFuZ3VhZ2Ugc2VydmVyIHByb2Nlc3Mgd2hlbiBleHRlbmRpbmcgQXV0b0xhbmd1YWdlQ2xpZW50Jyk7XG4gIH1cblxuICAvLyBZb3UgbWlnaHQgd2FudCB0byBvdmVycmlkZSB0aGVzZSBmb3IgZGlmZmVyZW50IGJlaGF2aW9yXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIHdlIHNob3VsZCBzdGFydCBhIHNlcnZlciBmb3IgYSBnaXZlbiBlZGl0b3IgaWYgd2UgZG9uJ3QgaGF2ZSBvbmUgeWV0XG4gIHByb3RlY3RlZCBzaG91bGRTdGFydEZvckVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCkuaW5jbHVkZXMoZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBwYXJhbWV0ZXJzIHVzZWQgdG8gaW5pdGlhbGl6ZSBhIGNsaWVudCAtIHlvdSBtYXkgd2FudCB0byBleHRlbmQgY2FwYWJpbGl0aWVzXG4gIHByb3RlY3RlZCBnZXRJbml0aWFsaXplUGFyYW1zKHByb2plY3RQYXRoOiBzdHJpbmcsIHByb2Nlc3M6IExhbmd1YWdlU2VydmVyUHJvY2Vzcyk6IGxzLkluaXRpYWxpemVQYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9jZXNzSWQ6IHByb2Nlc3MucGlkLFxuICAgICAgcm9vdFBhdGg6IHByb2plY3RQYXRoLFxuICAgICAgcm9vdFVyaTogQ29udmVydC5wYXRoVG9VcmkocHJvamVjdFBhdGgpLFxuICAgICAgd29ya3NwYWNlRm9sZGVyczogW10sXG4gICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgd29ya3NwYWNlOiB7XG4gICAgICAgICAgYXBwbHlFZGl0OiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYXRpb246IGZhbHNlLFxuICAgICAgICAgIHdvcmtzcGFjZUVkaXQ6IHtcbiAgICAgICAgICAgIGRvY3VtZW50Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHdvcmtzcGFjZUZvbGRlcnM6IGZhbHNlLFxuICAgICAgICAgIGRpZENoYW5nZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN5bWJvbDoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBleGVjdXRlQ29tbWFuZDoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGV4dERvY3VtZW50OiB7XG4gICAgICAgICAgc3luY2hyb25pemF0aW9uOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIHdpbGxTYXZlOiB0cnVlLFxuICAgICAgICAgICAgd2lsbFNhdmVXYWl0VW50aWw6IHRydWUsXG4gICAgICAgICAgICBkaWRTYXZlOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29tcGxldGlvbjoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgICBjb21wbGV0aW9uSXRlbToge1xuICAgICAgICAgICAgICBzbmlwcGV0U3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgICAgICAgY29tbWl0Q2hhcmFjdGVyc1N1cHBvcnQ6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRleHRTdXBwb3J0OiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaG92ZXI6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2lnbmF0dXJlSGVscDoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvY3VtZW50SGlnaGxpZ2h0OiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvY3VtZW50U3ltYm9sOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIGhpZXJhcmNoaWNhbERvY3VtZW50U3ltYm9sU3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZvcm1hdHRpbmc6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmFuZ2VGb3JtYXR0aW5nOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uVHlwZUZvcm1hdHRpbmc6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZGVmaW5pdGlvbjoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb2RlQWN0aW9uOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvZGVMZW5zOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvY3VtZW50TGluazoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZW5hbWU6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICAvLyBXZSBkbyBub3Qgc3VwcG9ydCB0aGVzZSBmZWF0dXJlcyB5ZXQuXG4gICAgICAgICAgLy8gTmVlZCB0byBzZXQgdG8gdW5kZWZpbmVkIHRvIGFwcGVhc2UgVHlwZVNjcmlwdCB3ZWFrIHR5cGUgZGV0ZWN0aW9uLlxuICAgICAgICAgIGltcGxlbWVudGF0aW9uOiB1bmRlZmluZWQsXG4gICAgICAgICAgdHlwZURlZmluaXRpb246IHVuZGVmaW5lZCxcbiAgICAgICAgICBjb2xvclByb3ZpZGVyOiB1bmRlZmluZWQsXG4gICAgICAgICAgZm9sZGluZ1JhbmdlOiB1bmRlZmluZWQsXG4gICAgICAgIH0sXG4gICAgICAgIGV4cGVyaW1lbnRhbDoge30sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvLyBFYXJseSB3aXJlLXVwIG9mIGxpc3RlbmVycyBiZWZvcmUgaW5pdGlhbGl6ZSBtZXRob2QgaXMgc2VudFxuICBwcm90ZWN0ZWQgcHJlSW5pdGlhbGl6YXRpb24oX2Nvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbik6IHZvaWQgeyB9XG5cbiAgLy8gTGF0ZSB3aXJlLXVwIG9mIGxpc3RlbmVycyBhZnRlciBpbml0aWFsaXplIG1ldGhvZCBoYXMgYmVlbiBzZW50XG4gIHByb3RlY3RlZCBwb3N0SW5pdGlhbGl6YXRpb24oX3NlcnZlcjogQWN0aXZlU2VydmVyKTogdm9pZCB7IH1cblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciB0byB1c2UgaXBjLCBzdGRpbyBvciBzb2NrZXQgdG8gY29ubmVjdCB0byB0aGUgc2VydmVyXG4gIHByb3RlY3RlZCBnZXRDb25uZWN0aW9uVHlwZSgpOiBDb25uZWN0aW9uVHlwZSB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0ICE9IG51bGwgPyAnc29ja2V0JyA6ICdzdGRpbyc7XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIG5hbWUgb2YgeW91ciByb290IGNvbmZpZ3VyYXRpb24ga2V5XG4gIHByb3RlY3RlZCBnZXRSb290Q29uZmlndXJhdGlvbktleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIC8vIE9wdGlvbmFsbHkgdHJhbnNmb3JtIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdCBiZWZvcmUgaXQgaXMgc2VudCB0byB0aGUgc2VydmVyXG4gIHByb3RlY3RlZCBtYXBDb25maWd1cmF0aW9uT2JqZWN0KGNvbmZpZ3VyYXRpb246IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIGNvbmZpZ3VyYXRpb247XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kcyB0aGF0IGFyZSB1c2VmdWwgZm9yIGltcGxlbWVudG9yc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXRzIGEgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIGZvciBhIGdpdmVuIFRleHRFZGl0b3JcbiAgcHJvdGVjdGVkIGFzeW5jIGdldENvbm5lY3Rpb25Gb3JFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yKTogUHJvbWlzZTxMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24gfCBudWxsPiB7XG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcbiAgICByZXR1cm4gc2VydmVyID8gc2VydmVyLmNvbm5lY3Rpb24gOiBudWxsO1xuICB9XG5cbiAgLy8gUmVzdGFydCBhbGwgYWN0aXZlIGxhbmd1YWdlIHNlcnZlcnMgZm9yIHRoaXMgbGFuZ3VhZ2UgY2xpZW50IGluIHRoZSB3b3Jrc3BhY2VcbiAgcHJvdGVjdGVkIGFzeW5jIHJlc3RhcnRBbGxTZXJ2ZXJzKCkge1xuICAgIGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIucmVzdGFydEFsbFNlcnZlcnMoKTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIHJlc3Qgb2YgdGhlIEF1dG9MYW5ndWFnZUNsaWVudFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBY3RpdmF0ZSBkb2VzIHZlcnkgbGl0dGxlIGZvciBwZXJmIHJlYXNvbnMgLSBob29rcyBpbiB2aWEgU2VydmVyTWFuYWdlciBmb3IgbGF0ZXIgJ2FjdGl2YXRpb24nXG4gIHB1YmxpYyBhY3RpdmF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLm5hbWUgPSBgJHt0aGlzLmdldExhbmd1YWdlTmFtZSgpfSAoJHt0aGlzLmdldFNlcnZlck5hbWUoKX0pYDtcbiAgICB0aGlzLmxvZ2dlciA9IHRoaXMuZ2V0TG9nZ2VyKCk7XG4gICAgdGhpcy5fc2VydmVyTWFuYWdlciA9IG5ldyBTZXJ2ZXJNYW5hZ2VyKFxuICAgICAgKHApID0+IHRoaXMuc3RhcnRTZXJ2ZXIocCksXG4gICAgICB0aGlzLmxvZ2dlcixcbiAgICAgIChlKSA9PiB0aGlzLnNob3VsZFN0YXJ0Rm9yRWRpdG9yKGUpLFxuICAgICAgKGZpbGVwYXRoKSA9PiB0aGlzLmZpbHRlckNoYW5nZVdhdGNoZWRGaWxlcyhmaWxlcGF0aCksXG4gICAgICB0aGlzLnJlcG9ydEJ1c3lXaGlsZSxcbiAgICAgIHRoaXMuZ2V0U2VydmVyTmFtZSgpLFxuICAgICAgdGhpcy5zaHV0ZG93blNlcnZlcnNHcmFjZWZ1bGx5KCksXG4gICAgKTtcbiAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnN0YXJ0TGlzdGVuaW5nKCk7XG4gICAgcHJvY2Vzcy5vbignZXhpdCcsICgpID0+IHRoaXMuZXhpdENsZWFudXAuYmluZCh0aGlzKSk7XG4gIH1cblxuICBwcml2YXRlIGV4aXRDbGVhbnVwKCk6IHZvaWQge1xuICAgIHRoaXMuX3NlcnZlck1hbmFnZXIudGVybWluYXRlKCk7XG4gIH1cblxuICAvLyBEZWFjdGl2YXRlIGRpc3Bvc2VzIHRoZSByZXNvdXJjZXMgd2UncmUgdXNpbmdcbiAgcHVibGljIGFzeW5jIGRlYWN0aXZhdGUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0aGlzLl9pc0RlYWN0aXZhdGluZyA9IHRydWU7XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgdGhpcy5fc2VydmVyTWFuYWdlci5zdG9wTGlzdGVuaW5nKCk7XG4gICAgYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5zdG9wQWxsU2VydmVycygpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNwYXduQ2hpbGROb2RlKGFyZ3M6IHN0cmluZ1tdLCBvcHRpb25zOiBjcC5TcGF3bk9wdGlvbnMgPSB7fSk6IGNwLkNoaWxkUHJvY2VzcyB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYHN0YXJ0aW5nIGNoaWxkIE5vZGUgXCIke2FyZ3Muam9pbignICcpfVwiYCk7XG4gICAgb3B0aW9ucy5lbnYgPSBvcHRpb25zLmVudiB8fCBPYmplY3QuY3JlYXRlKHByb2Nlc3MuZW52KTtcbiAgICBpZiAob3B0aW9ucy5lbnYpIHtcbiAgICAgIG9wdGlvbnMuZW52LkVMRUNUUk9OX1JVTl9BU19OT0RFID0gJzEnO1xuICAgICAgb3B0aW9ucy5lbnYuRUxFQ1RST05fTk9fQVRUQUNIX0NPTlNPTEUgPSAnMSc7XG4gICAgfVxuICAgIHJldHVybiBjcC5zcGF3bihwcm9jZXNzLmV4ZWNQYXRoLCBhcmdzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vIExTUCBsb2dnaW5nIGlzIG9ubHkgc2V0IGZvciB3YXJuaW5ncyAmIGVycm9ycyBieSBkZWZhdWx0IHVubGVzcyB5b3UgdHVybiBvbiB0aGUgY29yZS5kZWJ1Z0xTUCBzZXR0aW5nXG4gIHByb3RlY3RlZCBnZXRMb2dnZXIoKTogTG9nZ2VyIHtcbiAgICBjb25zdCBmaWx0ZXIgPSBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUuZGVidWdMU1AnKVxuICAgICAgPyBGaWx0ZXJlZExvZ2dlci5EZXZlbG9wZXJMZXZlbEZpbHRlclxuICAgICAgOiBGaWx0ZXJlZExvZ2dlci5Vc2VyTGV2ZWxGaWx0ZXI7XG4gICAgcmV0dXJuIG5ldyBGaWx0ZXJlZExvZ2dlcihuZXcgQ29uc29sZUxvZ2dlcih0aGlzLm5hbWUpLCBmaWx0ZXIpO1xuICB9XG5cbiAgLy8gU3RhcnRzIHRoZSBzZXJ2ZXIgYnkgc3RhcnRpbmcgdGhlIHByb2Nlc3MsIHRoZW4gaW5pdGlhbGl6aW5nIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgYW5kIHN0YXJ0aW5nIGFkYXB0ZXJzXG4gIHByaXZhdGUgYXN5bmMgc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8QWN0aXZlU2VydmVyPiB7XG4gICAgY29uc3QgcHJvY2VzcyA9IGF3YWl0IHRoaXMucmVwb3J0QnVzeVdoaWxlKFxuICAgICAgYFN0YXJ0aW5nICR7dGhpcy5nZXRTZXJ2ZXJOYW1lKCl9IGZvciAke3BhdGguYmFzZW5hbWUocHJvamVjdFBhdGgpfWAsXG4gICAgICBhc3luYyAoKSA9PiB0aGlzLnN0YXJ0U2VydmVyUHJvY2Vzcyhwcm9qZWN0UGF0aCksXG4gICAgKTtcbiAgICB0aGlzLmNhcHR1cmVTZXJ2ZXJFcnJvcnMocHJvY2VzcywgcHJvamVjdFBhdGgpO1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKHRoaXMuY3JlYXRlUnBjQ29ubmVjdGlvbihwcm9jZXNzKSwgdGhpcy5sb2dnZXIpO1xuICAgIHRoaXMucHJlSW5pdGlhbGl6YXRpb24oY29ubmVjdGlvbik7XG4gICAgY29uc3QgaW5pdGlhbGl6ZVBhcmFtcyA9IHRoaXMuZ2V0SW5pdGlhbGl6ZVBhcmFtcyhwcm9qZWN0UGF0aCwgcHJvY2Vzcyk7XG4gICAgY29uc3QgaW5pdGlhbGl6YXRpb24gPSBjb25uZWN0aW9uLmluaXRpYWxpemUoaW5pdGlhbGl6ZVBhcmFtcyk7XG4gICAgdGhpcy5yZXBvcnRCdXN5V2hpbGUoXG4gICAgICBgJHt0aGlzLmdldFNlcnZlck5hbWUoKX0gaW5pdGlhbGl6aW5nIGZvciAke3BhdGguYmFzZW5hbWUocHJvamVjdFBhdGgpfWAsXG4gICAgICAoKSA9PiBpbml0aWFsaXphdGlvbixcbiAgICApO1xuICAgIGNvbnN0IGluaXRpYWxpemVSZXNwb25zZSA9IGF3YWl0IGluaXRpYWxpemF0aW9uO1xuICAgIGNvbnN0IG5ld1NlcnZlciA9IHtcbiAgICAgIHByb2plY3RQYXRoLFxuICAgICAgcHJvY2VzcyxcbiAgICAgIGNvbm5lY3Rpb24sXG4gICAgICBjYXBhYmlsaXRpZXM6IGluaXRpYWxpemVSZXNwb25zZS5jYXBhYmlsaXRpZXMsXG4gICAgICBkaXNwb3NhYmxlOiBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpLFxuICAgICAgYWRkaXRpb25hbFBhdGhzOiBuZXcgU2V0KCksXG4gICAgICBjb25zaWRlckRlZmluaXRpb25QYXRoOiAoZGVmUGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICghZGVmUGF0aC5zdGFydHNXaXRoKHByb2plY3RQYXRoKSkge1xuICAgICAgICAgIG5ld1NlcnZlci5hZGRpdGlvbmFsUGF0aHMuYWRkKHBhdGguZGlybmFtZShkZWZQYXRoKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgICB0aGlzLnBvc3RJbml0aWFsaXphdGlvbihuZXdTZXJ2ZXIpO1xuICAgIGNvbm5lY3Rpb24uaW5pdGlhbGl6ZWQoKTtcbiAgICBjb25uZWN0aW9uLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5faXNEZWFjdGl2YXRpbmcpIHtcbiAgICAgICAgdGhpcy5fc2VydmVyTWFuYWdlci5zdG9wU2VydmVyKG5ld1NlcnZlcik7XG4gICAgICAgIGlmICghdGhpcy5fc2VydmVyTWFuYWdlci5oYXNTZXJ2ZXJSZWFjaGVkUmVzdGFydExpbWl0KG5ld1NlcnZlcikpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgUmVzdGFydGluZyBsYW5ndWFnZSBzZXJ2ZXIgZm9yIHByb2plY3QgJyR7bmV3U2VydmVyLnByb2plY3RQYXRofSdgKTtcbiAgICAgICAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnN0YXJ0U2VydmVyKHByb2plY3RQYXRoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBMYW5ndWFnZSBzZXJ2ZXIgaGFzIGV4Y2VlZGVkIGF1dG8tcmVzdGFydCBsaW1pdCBmb3IgcHJvamVjdCAnJHtuZXdTZXJ2ZXIucHJvamVjdFBhdGh9J2ApO1xuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTptYXgtbGluZS1sZW5ndGhcbiAgICAgICAgICAgIGBUaGUgJHt0aGlzLm5hbWV9IGxhbmd1YWdlIHNlcnZlciBoYXMgZXhpdGVkIGFuZCBleGNlZWRlZCB0aGUgcmVzdGFydCBsaW1pdCBmb3IgcHJvamVjdCAnJHtuZXdTZXJ2ZXIucHJvamVjdFBhdGh9J2ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb25maWd1cmF0aW9uS2V5ID0gdGhpcy5nZXRSb290Q29uZmlndXJhdGlvbktleSgpO1xuICAgIGlmIChjb25maWd1cmF0aW9uS2V5KSB7XG4gICAgICBuZXdTZXJ2ZXIuZGlzcG9zYWJsZS5hZGQoXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlndXJhdGlvbktleSwgKGNvbmZpZykgPT4ge1xuICAgICAgICAgIGNvbnN0IG1hcHBlZENvbmZpZyA9IHRoaXMubWFwQ29uZmlndXJhdGlvbk9iamVjdChjb25maWcgfHwge30pO1xuICAgICAgICAgIGlmIChtYXBwZWRDb25maWcpIHtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uZGlkQ2hhbmdlQ29uZmlndXJhdGlvbih7XG4gICAgICAgICAgICAgIHNldHRpbmdzOiBtYXBwZWRDb25maWcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXJ0RXhjbHVzaXZlQWRhcHRlcnMobmV3U2VydmVyKTtcbiAgICByZXR1cm4gbmV3U2VydmVyO1xuICB9XG5cbiAgcHJpdmF0ZSBjYXB0dXJlU2VydmVyRXJyb3JzKGNoaWxkUHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzLCBwcm9qZWN0UGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgY2hpbGRQcm9jZXNzLm9uKCdlcnJvcicsIChlcnIpID0+IHRoaXMuaGFuZGxlU3Bhd25GYWlsdXJlKGVycikpO1xuICAgIGNoaWxkUHJvY2Vzcy5vbignZXhpdCcsIChjb2RlLCBzaWduYWwpID0+IHRoaXMubG9nZ2VyLmRlYnVnKGBleGl0OiBjb2RlICR7Y29kZX0gc2lnbmFsICR7c2lnbmFsfWApKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIChjaHVuazogQnVmZmVyKSA9PiB7XG4gICAgICBjb25zdCBlcnJvclN0cmluZyA9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICB0aGlzLmhhbmRsZVNlcnZlclN0ZGVycihlcnJvclN0cmluZywgcHJvamVjdFBhdGgpO1xuICAgICAgLy8gS2VlcCB0aGUgbGFzdCA1IGxpbmVzIGZvciBwYWNrYWdlcyB0byB1c2UgaW4gbWVzc2FnZXNcbiAgICAgIHRoaXMucHJvY2Vzc1N0ZEVyciA9ICh0aGlzLnByb2Nlc3NTdGRFcnIgKyBlcnJvclN0cmluZylcbiAgICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgICAuc2xpY2UoLTUpXG4gICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlU3Bhd25GYWlsdXJlKGVycjogYW55KTogdm9pZCB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgYCR7dGhpcy5nZXRTZXJ2ZXJOYW1lKCl9IGxhbmd1YWdlIHNlcnZlciBmb3IgJHt0aGlzLmdldExhbmd1YWdlTmFtZSgpfSB1bmFibGUgdG8gc3RhcnRgLFxuICAgICAge1xuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246IGVyci50b1N0cmluZygpLFxuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgLy8gQ3JlYXRlcyB0aGUgUlBDIGNvbm5lY3Rpb24gd2hpY2ggY2FuIGJlIGlwYywgc29ja2V0IG9yIHN0ZGlvXG4gIHByaXZhdGUgY3JlYXRlUnBjQ29ubmVjdGlvbihwcm9jZXNzOiBMYW5ndWFnZVNlcnZlclByb2Nlc3MpOiBycGMuTWVzc2FnZUNvbm5lY3Rpb24ge1xuICAgIGxldCByZWFkZXI6IHJwYy5NZXNzYWdlUmVhZGVyO1xuICAgIGxldCB3cml0ZXI6IHJwYy5NZXNzYWdlV3JpdGVyO1xuICAgIGNvbnN0IGNvbm5lY3Rpb25UeXBlID0gdGhpcy5nZXRDb25uZWN0aW9uVHlwZSgpO1xuICAgIHN3aXRjaCAoY29ubmVjdGlvblR5cGUpIHtcbiAgICAgIGNhc2UgJ2lwYyc6XG4gICAgICAgIHJlYWRlciA9IG5ldyBycGMuSVBDTWVzc2FnZVJlYWRlcihwcm9jZXNzIGFzIGNwLkNoaWxkUHJvY2Vzcyk7XG4gICAgICAgIHdyaXRlciA9IG5ldyBycGMuSVBDTWVzc2FnZVdyaXRlcihwcm9jZXNzIGFzIGNwLkNoaWxkUHJvY2Vzcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc29ja2V0JzpcbiAgICAgICAgcmVhZGVyID0gbmV3IHJwYy5Tb2NrZXRNZXNzYWdlUmVhZGVyKHRoaXMuc29ja2V0KTtcbiAgICAgICAgd3JpdGVyID0gbmV3IHJwYy5Tb2NrZXRNZXNzYWdlV3JpdGVyKHRoaXMuc29ja2V0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzdGRpbyc6XG4gICAgICAgIHJlYWRlciA9IG5ldyBycGMuU3RyZWFtTWVzc2FnZVJlYWRlcihwcm9jZXNzLnN0ZG91dCk7XG4gICAgICAgIHdyaXRlciA9IG5ldyBycGMuU3RyZWFtTWVzc2FnZVdyaXRlcihwcm9jZXNzLnN0ZGluKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gVXRpbHMuYXNzZXJ0VW5yZWFjaGFibGUoY29ubmVjdGlvblR5cGUpO1xuICAgIH1cblxuICAgIHJldHVybiBycGMuY3JlYXRlTWVzc2FnZUNvbm5lY3Rpb24ocmVhZGVyLCB3cml0ZXIsIHtcbiAgICAgIGxvZzogKC4uLl9hcmdzOiBhbnlbXSkgPT4geyB9LFxuICAgICAgd2FybjogKC4uLl9hcmdzOiBhbnlbXSkgPT4geyB9LFxuICAgICAgaW5mbzogKC4uLl9hcmdzOiBhbnlbXSkgPT4geyB9LFxuICAgICAgZXJyb3I6ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihhcmdzKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyBTdGFydCBhZGFwdGVycyB0aGF0IGFyZSBub3Qgc2hhcmVkIGJldHdlZW4gc2VydmVyc1xuICBwcml2YXRlIHN0YXJ0RXhjbHVzaXZlQWRhcHRlcnMoc2VydmVyOiBBY3RpdmVTZXJ2ZXIpOiB2b2lkIHtcbiAgICBBcHBseUVkaXRBZGFwdGVyLmF0dGFjaChzZXJ2ZXIuY29ubmVjdGlvbik7XG4gICAgTm90aWZpY2F0aW9uc0FkYXB0ZXIuYXR0YWNoKHNlcnZlci5jb25uZWN0aW9uLCB0aGlzLm5hbWUsIHNlcnZlci5wcm9qZWN0UGF0aCk7XG5cbiAgICBpZiAoRG9jdW1lbnRTeW5jQWRhcHRlci5jYW5BZGFwdChzZXJ2ZXIuY2FwYWJpbGl0aWVzKSkge1xuICAgICAgY29uc3QgZG9jU3luY0FkYXB0ZXIgPVxuICAgICAgICBuZXcgRG9jdW1lbnRTeW5jQWRhcHRlcihcbiAgICAgICAgICBzZXJ2ZXIuY29ubmVjdGlvbixcbiAgICAgICAgICAoZWRpdG9yKSA9PiB0aGlzLnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCBzZXJ2ZXIucHJvamVjdFBhdGgpLFxuICAgICAgICAgIHNlcnZlci5jYXBhYmlsaXRpZXMudGV4dERvY3VtZW50U3luYyxcbiAgICAgICAgICB0aGlzLnJlcG9ydEJ1c3lXaGlsZSxcbiAgICAgICAgKTtcbiAgICAgIHNlcnZlci5kaXNwb3NhYmxlLmFkZChkb2NTeW5jQWRhcHRlcik7XG4gICAgfVxuXG4gICAgY29uc3QgbGludGVyUHVzaFYyID0gbmV3IExpbnRlclB1c2hWMkFkYXB0ZXIoc2VydmVyLmNvbm5lY3Rpb24pO1xuICAgIGlmICh0aGlzLl9saW50ZXJEZWxlZ2F0ZSAhPSBudWxsKSB7XG4gICAgICBsaW50ZXJQdXNoVjIuYXR0YWNoKHRoaXMuX2xpbnRlckRlbGVnYXRlKTtcbiAgICB9XG4gICAgc2VydmVyLmRpc3Bvc2FibGUuYWRkKGxpbnRlclB1c2hWMik7XG5cbiAgICBjb25zdCBsb2dnaW5nQ29uc29sZSA9IG5ldyBMb2dnaW5nQ29uc29sZUFkYXB0ZXIoc2VydmVyLmNvbm5lY3Rpb24pO1xuICAgIGlmICh0aGlzLl9jb25zb2xlRGVsZWdhdGUgIT0gbnVsbCkge1xuICAgICAgbG9nZ2luZ0NvbnNvbGUuYXR0YWNoKHRoaXMuX2NvbnNvbGVEZWxlZ2F0ZSh7IGlkOiB0aGlzLm5hbWUsIG5hbWU6IHRoaXMuZ2V0TGFuZ3VhZ2VOYW1lKCkgfSkpO1xuICAgIH1cbiAgICBzZXJ2ZXIuZGlzcG9zYWJsZS5hZGQobG9nZ2luZ0NvbnNvbGUpO1xuXG4gICAgbGV0IHNpZ25hdHVyZUhlbHBBZGFwdGVyOiBTaWduYXR1cmVIZWxwQWRhcHRlciB8IHVuZGVmaW5lZDtcbiAgICBpZiAoU2lnbmF0dXJlSGVscEFkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHNpZ25hdHVyZUhlbHBBZGFwdGVyID0gbmV3IFNpZ25hdHVyZUhlbHBBZGFwdGVyKHNlcnZlciwgdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCkpO1xuICAgICAgaWYgKHRoaXMuX3NpZ25hdHVyZUhlbHBSZWdpc3RyeSAhPSBudWxsKSB7XG4gICAgICAgIHNpZ25hdHVyZUhlbHBBZGFwdGVyLmF0dGFjaCh0aGlzLl9zaWduYXR1cmVIZWxwUmVnaXN0cnkpO1xuICAgICAgfVxuICAgICAgc2VydmVyLmRpc3Bvc2FibGUuYWRkKHNpZ25hdHVyZUhlbHBBZGFwdGVyKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXJ2ZXJBZGFwdGVycy5zZXQoc2VydmVyLCB7XG4gICAgICBsaW50ZXJQdXNoVjIsIGxvZ2dpbmdDb25zb2xlLCBzaWduYXR1cmVIZWxwQWRhcHRlcixcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRTeW5jRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvciwgcHJvamVjdFBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzRmlsZUluUHJvamVjdChlZGl0b3IsIHByb2plY3RQYXRoKSAmJiB0aGlzLnNob3VsZFN0YXJ0Rm9yRWRpdG9yKGVkaXRvcik7XG4gIH1cblxuICBwcm90ZWN0ZWQgaXNGaWxlSW5Qcm9qZWN0KGVkaXRvcjogVGV4dEVkaXRvciwgcHJvamVjdFBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoZWRpdG9yLmdldFBhdGgoKSB8fCAnJykuc3RhcnRzV2l0aChwcm9qZWN0UGF0aCk7XG4gIH1cblxuICAvLyBBdXRvY29tcGxldGUrIHZpYSBMUyBjb21wbGV0aW9uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHB1YmxpYyBwcm92aWRlQXV0b2NvbXBsZXRlKCk6IGFjLkF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0b3I6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpXG4gICAgICAgIC5tYXAoKGcpID0+IGcuaW5jbHVkZXMoJy4nKSA/ICcuJyArIGcgOiBnKVxuICAgICAgICAuam9pbignLCAnKSxcbiAgICAgIGluY2x1c2lvblByaW9yaXR5OiAxLFxuICAgICAgc3VnZ2VzdGlvblByaW9yaXR5OiAyLFxuICAgICAgZXhjbHVkZUxvd2VyUHJpb3JpdHk6IGZhbHNlLFxuICAgICAgZ2V0U3VnZ2VzdGlvbnM6IHRoaXMuZ2V0U3VnZ2VzdGlvbnMuYmluZCh0aGlzKSxcbiAgICAgIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbjogdGhpcy5vbkRpZEluc2VydFN1Z2dlc3Rpb24uYmluZCh0aGlzKSxcbiAgICAgIGdldFN1Z2dlc3Rpb25EZXRhaWxzT25TZWxlY3Q6IHRoaXMuZ2V0U3VnZ2VzdGlvbkRldGFpbHNPblNlbGVjdC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMoXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcbiAgKTogUHJvbWlzZTxhYy5BbnlTdWdnZXN0aW9uW10+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihyZXF1ZXN0LmVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFBdXRvY29tcGxldGVBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdGhpcy5hdXRvQ29tcGxldGUgPSB0aGlzLmF1dG9Db21wbGV0ZSB8fCBuZXcgQXV0b2NvbXBsZXRlQWRhcHRlcigpO1xuICAgIHRoaXMuX2xhc3RBdXRvY29tcGxldGVSZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gdGhpcy5hdXRvQ29tcGxldGUuZ2V0U3VnZ2VzdGlvbnMoc2VydmVyLCByZXF1ZXN0LCB0aGlzLm9uRGlkQ29udmVydEF1dG9jb21wbGV0ZSxcbiAgICAgIGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMubWluaW11bVdvcmRMZW5ndGgnKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3VnZ2VzdGlvbkRldGFpbHNPblNlbGVjdChcbiAgICBzdWdnZXN0aW9uOiBhYy5BbnlTdWdnZXN0aW9uLFxuICApOiBQcm9taXNlPGFjLkFueVN1Z2dlc3Rpb24gfCBudWxsPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuX2xhc3RBdXRvY29tcGxldGVSZXF1ZXN0O1xuICAgIGlmIChyZXF1ZXN0ID09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihyZXF1ZXN0LmVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFBdXRvY29tcGxldGVBZGFwdGVyLmNhblJlc29sdmUoc2VydmVyLmNhcGFiaWxpdGllcykgfHwgdGhpcy5hdXRvQ29tcGxldGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYXV0b0NvbXBsZXRlLmNvbXBsZXRlU3VnZ2VzdGlvbihzZXJ2ZXIsIHN1Z2dlc3Rpb24sIHJlcXVlc3QsIHRoaXMub25EaWRDb252ZXJ0QXV0b2NvbXBsZXRlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBvbkRpZENvbnZlcnRBdXRvY29tcGxldGUoXG4gICAgX2NvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSxcbiAgICBfc3VnZ2VzdGlvbjogYWMuQW55U3VnZ2VzdGlvbixcbiAgICBfcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcbiAgKTogdm9pZCB7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25EaWRJbnNlcnRTdWdnZXN0aW9uKF9hcmc6IGFjLlN1Z2dlc3Rpb25JbnNlcnRlZEV2ZW50KTogdm9pZCB7IH1cblxuICAvLyBEZWZpbml0aW9ucyB2aWEgTFMgZG9jdW1lbnRIaWdobGlnaHQgYW5kIGdvdG9EZWZpbml0aW9uLS0tLS0tLS0tLS0tXG4gIHB1YmxpYyBwcm92aWRlRGVmaW5pdGlvbnMoKTogYXRvbUlkZS5EZWZpbml0aW9uUHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICBwcmlvcml0eTogMjAsXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcbiAgICAgIGdldERlZmluaXRpb246IHRoaXMuZ2V0RGVmaW5pdGlvbi5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0RGVmaW5pdGlvbihlZGl0b3I6IFRleHRFZGl0b3IsIHBvaW50OiBQb2ludCk6IFByb21pc2U8YXRvbUlkZS5EZWZpbml0aW9uUXVlcnlSZXN1bHQgfCBudWxsPiB7XG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIURlZmluaXRpb25BZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLmRlZmluaXRpb25zID0gdGhpcy5kZWZpbml0aW9ucyB8fCBuZXcgRGVmaW5pdGlvbkFkYXB0ZXIoKTtcbiAgICBjb25zdCBxdWVyeVByb21pc2UgPSB0aGlzLmRlZmluaXRpb25zLmdldERlZmluaXRpb24oXG4gICAgICBzZXJ2ZXIuY29ubmVjdGlvbixcbiAgICAgIHNlcnZlci5jYXBhYmlsaXRpZXMsXG4gICAgICB0aGlzLmdldExhbmd1YWdlTmFtZSgpLFxuICAgICAgZWRpdG9yLFxuICAgICAgcG9pbnQsXG4gICAgKTtcblxuICAgIGlmICh0aGlzLnNlcnZlcnNTdXBwb3J0RGVmaW5pdGlvbkRlc3RpbmF0aW9ucygpKSB7XG4gICAgICBxdWVyeVByb21pc2UudGhlbigocXVlcnkpID0+IHtcbiAgICAgICAgaWYgKHF1ZXJ5KSB7XG4gICAgICAgICAgZm9yIChjb25zdCBkZWYgb2YgcXVlcnkuZGVmaW5pdGlvbnMpIHtcbiAgICAgICAgICAgIHNlcnZlci5jb25zaWRlckRlZmluaXRpb25QYXRoKGRlZi5wYXRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBxdWVyeVByb21pc2U7XG4gIH1cblxuICAvLyBPdXRsaW5lIFZpZXcgdmlhIExTIGRvY3VtZW50U3ltYm9sLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHB1YmxpYyBwcm92aWRlT3V0bGluZXMoKTogYXRvbUlkZS5PdXRsaW5lUHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZ2V0T3V0bGluZTogdGhpcy5nZXRPdXRsaW5lLmJpbmQodGhpcyksXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRsaW5lKGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8YXRvbUlkZS5PdXRsaW5lIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFPdXRsaW5lVmlld0FkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMub3V0bGluZVZpZXcgPSB0aGlzLm91dGxpbmVWaWV3IHx8IG5ldyBPdXRsaW5lVmlld0FkYXB0ZXIoKTtcbiAgICByZXR1cm4gdGhpcy5vdXRsaW5lVmlldy5nZXRPdXRsaW5lKHNlcnZlci5jb25uZWN0aW9uLCBlZGl0b3IpO1xuICB9XG5cbiAgLy8gTGludGVyIHB1c2ggdjIgQVBJIHZpYSBMUyBwdWJsaXNoRGlhZ25vc3RpY3NcbiAgcHVibGljIGNvbnN1bWVMaW50ZXJWMihyZWdpc3RlckluZGllOiAocGFyYW1zOiB7IG5hbWU6IHN0cmluZyB9KSA9PiBsaW50ZXIuSW5kaWVEZWxlZ2F0ZSk6IHZvaWQge1xuICAgIHRoaXMuX2xpbnRlckRlbGVnYXRlID0gcmVnaXN0ZXJJbmRpZSh7IG5hbWU6IHRoaXMubmFtZSB9KTtcbiAgICBpZiAodGhpcy5fbGludGVyRGVsZWdhdGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2VydmVyIG9mIHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0QWN0aXZlU2VydmVycygpKSB7XG4gICAgICBjb25zdCBsaW50ZXJQdXNoVjIgPSB0aGlzLmdldFNlcnZlckFkYXB0ZXIoc2VydmVyLCAnbGludGVyUHVzaFYyJyk7XG4gICAgICBpZiAobGludGVyUHVzaFYyICE9IG51bGwpIHtcbiAgICAgICAgbGludGVyUHVzaFYyLmF0dGFjaCh0aGlzLl9saW50ZXJEZWxlZ2F0ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRmluZCBSZWZlcmVuY2VzIHZpYSBMUyBmaW5kUmVmZXJlbmNlcy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwdWJsaWMgcHJvdmlkZUZpbmRSZWZlcmVuY2VzKCk6IGF0b21JZGUuRmluZFJlZmVyZW5jZXNQcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzRWRpdG9yU3VwcG9ydGVkOiAoZWRpdG9yOiBUZXh0RWRpdG9yKSA9PiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKS5pbmNsdWRlcyhlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSksXG4gICAgICBmaW5kUmVmZXJlbmNlczogdGhpcy5nZXRSZWZlcmVuY2VzLmJpbmQodGhpcyksXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRSZWZlcmVuY2VzKGVkaXRvcjogVGV4dEVkaXRvciwgcG9pbnQ6IFBvaW50KTogUHJvbWlzZTxhdG9tSWRlLkZpbmRSZWZlcmVuY2VzUmV0dXJuIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFGaW5kUmVmZXJlbmNlc0FkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuZmluZFJlZmVyZW5jZXMgPSB0aGlzLmZpbmRSZWZlcmVuY2VzIHx8IG5ldyBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIoKTtcbiAgICByZXR1cm4gdGhpcy5maW5kUmVmZXJlbmNlcy5nZXRSZWZlcmVuY2VzKHNlcnZlci5jb25uZWN0aW9uLCBlZGl0b3IsIHBvaW50LCBzZXJ2ZXIucHJvamVjdFBhdGgpO1xuICB9XG5cbiAgLy8gRGF0YXRpcCB2aWEgTFMgdGV4dERvY3VtZW50L2hvdmVyLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwdWJsaWMgY29uc3VtZURhdGF0aXAoc2VydmljZTogYXRvbUlkZS5EYXRhdGlwU2VydmljZSk6IHZvaWQge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxuICAgICAgc2VydmljZS5hZGRQcm92aWRlcih7XG4gICAgICAgIHByb3ZpZGVyTmFtZTogdGhpcy5uYW1lLFxuICAgICAgICBwcmlvcml0eTogMSxcbiAgICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXG4gICAgICAgIHZhbGlkRm9yU2NvcGU6IChzY29wZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKS5pbmNsdWRlcyhzY29wZU5hbWUpO1xuICAgICAgICB9LFxuICAgICAgICBkYXRhdGlwOiB0aGlzLmdldERhdGF0aXAuYmluZCh0aGlzKSxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0RGF0YXRpcChlZGl0b3I6IFRleHRFZGl0b3IsIHBvaW50OiBQb2ludCk6IFByb21pc2U8YXRvbUlkZS5EYXRhdGlwIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFEYXRhdGlwQWRhcHRlci5jYW5BZGFwdChzZXJ2ZXIuY2FwYWJpbGl0aWVzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5kYXRhdGlwID0gdGhpcy5kYXRhdGlwIHx8IG5ldyBEYXRhdGlwQWRhcHRlcigpO1xuICAgIHJldHVybiB0aGlzLmRhdGF0aXAuZ2V0RGF0YXRpcChzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yLCBwb2ludCk7XG4gIH1cblxuICAvLyBDb25zb2xlIHZpYSBMUyBsb2dnaW5nLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHB1YmxpYyBjb25zdW1lQ29uc29sZShjcmVhdGVDb25zb2xlOiBhdG9tSWRlLkNvbnNvbGVTZXJ2aWNlKTogRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5fY29uc29sZURlbGVnYXRlID0gY3JlYXRlQ29uc29sZTtcblxuICAgIGZvciAoY29uc3Qgc2VydmVyIG9mIHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0QWN0aXZlU2VydmVycygpKSB7XG4gICAgICBjb25zdCBsb2dnaW5nQ29uc29sZSA9IHRoaXMuZ2V0U2VydmVyQWRhcHRlcihzZXJ2ZXIsICdsb2dnaW5nQ29uc29sZScpO1xuICAgICAgaWYgKGxvZ2dpbmdDb25zb2xlKSB7XG4gICAgICAgIGxvZ2dpbmdDb25zb2xlLmF0dGFjaCh0aGlzLl9jb25zb2xlRGVsZWdhdGUoeyBpZDogdGhpcy5uYW1lLCBuYW1lOiB0aGlzLmdldExhbmd1YWdlTmFtZSgpIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBObyB3YXkgb2YgZGV0YWNoaW5nIGZyb20gY2xpZW50IGNvbm5lY3Rpb25zIHRvZGF5XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHsgfSk7XG4gIH1cblxuICAvLyBDb2RlIEZvcm1hdCB2aWEgTFMgZm9ybWF0RG9jdW1lbnQgJiBmb3JtYXREb2N1bWVudFJhbmdlLS0tLS0tLS0tLS0tXG4gIHB1YmxpYyBwcm92aWRlQ29kZUZvcm1hdCgpOiBhdG9tSWRlLlJhbmdlQ29kZUZvcm1hdFByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdENvZGU6IHRoaXMuZ2V0Q29kZUZvcm1hdC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0Q29kZUZvcm1hdChlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSk6IFByb21pc2U8YXRvbUlkZS5UZXh0RWRpdFtdPiB7XG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIUNvZGVGb3JtYXRBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIENvZGVGb3JtYXRBZGFwdGVyLmZvcm1hdChzZXJ2ZXIuY29ubmVjdGlvbiwgc2VydmVyLmNhcGFiaWxpdGllcywgZWRpdG9yLCByYW5nZSk7XG4gIH1cblxuICBwdWJsaWMgcHJvdmlkZVJhbmdlQ29kZUZvcm1hdCgpOiBhdG9tSWRlLlJhbmdlQ29kZUZvcm1hdFByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdENvZGU6IHRoaXMuZ2V0UmFuZ2VDb2RlRm9ybWF0LmJpbmQodGhpcyksXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRSYW5nZUNvZGVGb3JtYXQoZWRpdG9yOiBUZXh0RWRpdG9yLCByYW5nZTogUmFuZ2UpOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFzZXJ2ZXIuY2FwYWJpbGl0aWVzLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICByZXR1cm4gQ29kZUZvcm1hdEFkYXB0ZXIuZm9ybWF0UmFuZ2Uoc2VydmVyLmNvbm5lY3Rpb24sIGVkaXRvciwgcmFuZ2UpO1xuICB9XG5cbiAgcHVibGljIHByb3ZpZGVGaWxlQ29kZUZvcm1hdCgpOiBhdG9tSWRlLkZpbGVDb2RlRm9ybWF0UHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0RW50aXJlRmlsZTogdGhpcy5nZXRGaWxlQ29kZUZvcm1hdC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgcHJvdmlkZU9uU2F2ZUNvZGVGb3JtYXQoKTogYXRvbUlkZS5PblNhdmVDb2RlRm9ybWF0UHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0T25TYXZlOiB0aGlzLmdldEZpbGVDb2RlRm9ybWF0LmJpbmQodGhpcyksXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRGaWxlQ29kZUZvcm1hdChlZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFzZXJ2ZXIuY2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIENvZGVGb3JtYXRBZGFwdGVyLmZvcm1hdERvY3VtZW50KHNlcnZlci5jb25uZWN0aW9uLCBlZGl0b3IpO1xuICB9XG5cbiAgcHVibGljIHByb3ZpZGVPblR5cGVDb2RlRm9ybWF0KCk6IGF0b21JZGUuT25UeXBlQ29kZUZvcm1hdFByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdEF0UG9zaXRpb246IHRoaXMuZ2V0T25UeXBlQ29kZUZvcm1hdC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T25UeXBlQ29kZUZvcm1hdChcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ6IFBvaW50LFxuICAgIGNoYXJhY3Rlcjogc3RyaW5nLFxuICApOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFzZXJ2ZXIuY2FwYWJpbGl0aWVzLmRvY3VtZW50T25UeXBlRm9ybWF0dGluZ1Byb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIENvZGVGb3JtYXRBZGFwdGVyLmZvcm1hdE9uVHlwZShzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yLCBwb2ludCwgY2hhcmFjdGVyKTtcbiAgfVxuXG4gIHB1YmxpYyBwcm92aWRlQ29kZUhpZ2hsaWdodCgpOiBhdG9tSWRlLkNvZGVIaWdobGlnaHRQcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBoaWdobGlnaHQ6IChlZGl0b3IsIHBvc2l0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvZGVIaWdobGlnaHQoZWRpdG9yLCBwb3NpdGlvbik7XG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0Q29kZUhpZ2hsaWdodChlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFByb21pc2U8UmFuZ2VbXSB8IG51bGw+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhQ29kZUhpZ2hsaWdodEFkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBDb2RlSGlnaGxpZ2h0QWRhcHRlci5oaWdobGlnaHQoc2VydmVyLmNvbm5lY3Rpb24sIHNlcnZlci5jYXBhYmlsaXRpZXMsIGVkaXRvciwgcG9zaXRpb24pO1xuICB9XG5cbiAgcHVibGljIHByb3ZpZGVDb2RlQWN0aW9ucygpOiBhdG9tSWRlLkNvZGVBY3Rpb25Qcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBnZXRDb2RlQWN0aW9uczogKGVkaXRvciwgcmFuZ2UsIGRpYWdub3N0aWNzKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvZGVBY3Rpb25zKGVkaXRvciwgcmFuZ2UsIGRpYWdub3N0aWNzKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRDb2RlQWN0aW9ucyhlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSwgZGlhZ25vc3RpY3M6IGF0b21JZGUuRGlhZ25vc3RpY1tdKSB7XG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIUNvZGVBY3Rpb25BZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gQ29kZUFjdGlvbkFkYXB0ZXIuZ2V0Q29kZUFjdGlvbnMoXG4gICAgICBzZXJ2ZXIuY29ubmVjdGlvbixcbiAgICAgIHNlcnZlci5jYXBhYmlsaXRpZXMsXG4gICAgICB0aGlzLmdldFNlcnZlckFkYXB0ZXIoc2VydmVyLCAnbGludGVyUHVzaFYyJyksXG4gICAgICBlZGl0b3IsXG4gICAgICByYW5nZSxcbiAgICAgIGRpYWdub3N0aWNzLFxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgY29uc3VtZVNpZ25hdHVyZUhlbHAocmVnaXN0cnk6IGF0b21JZGUuU2lnbmF0dXJlSGVscFJlZ2lzdHJ5KTogRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5fc2lnbmF0dXJlSGVscFJlZ2lzdHJ5ID0gcmVnaXN0cnk7XG4gICAgZm9yIChjb25zdCBzZXJ2ZXIgb2YgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRBY3RpdmVTZXJ2ZXJzKCkpIHtcbiAgICAgIGNvbnN0IHNpZ25hdHVyZUhlbHBBZGFwdGVyID0gdGhpcy5nZXRTZXJ2ZXJBZGFwdGVyKHNlcnZlciwgJ3NpZ25hdHVyZUhlbHBBZGFwdGVyJyk7XG4gICAgICBpZiAoc2lnbmF0dXJlSGVscEFkYXB0ZXIgIT0gbnVsbCkge1xuICAgICAgICBzaWduYXR1cmVIZWxwQWRhcHRlci5hdHRhY2gocmVnaXN0cnkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgdGhpcy5fc2lnbmF0dXJlSGVscFJlZ2lzdHJ5ID0gdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbnN1bWVCdXN5U2lnbmFsKHNlcnZpY2U6IGF0b21JZGUuQnVzeVNpZ25hbFNlcnZpY2UpOiBEaXNwb3NhYmxlIHtcbiAgICB0aGlzLmJ1c3lTaWduYWxTZXJ2aWNlID0gc2VydmljZTtcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4gZGVsZXRlIHRoaXMuYnVzeVNpZ25hbFNlcnZpY2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIGBkaWRDaGFuZ2VXYXRjaGVkRmlsZXNgIG1lc3NhZ2UgZmlsdGVyaW5nLCBvdmVycmlkZSBmb3IgY3VzdG9tIGxvZ2ljLlxuICAgKiBAcGFyYW0gZmlsZVBhdGggcGF0aCBvZiBhIGZpbGUgdGhhdCBoYXMgY2hhbmdlZCBpbiB0aGUgcHJvamVjdCBwYXRoXG4gICAqIEByZXR1cm4gZmFsc2UgPT4gbWVzc2FnZSB3aWxsIG5vdCBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgICovXG4gIHByb3RlY3RlZCBmaWx0ZXJDaGFuZ2VXYXRjaGVkRmlsZXMoX2ZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIGZhbHNlID0+IHNlcnZlcnMgd2lsbCBiZSBraWxsZWQgd2l0aG91dCBhd2FpdGluZyBzaHV0ZG93biByZXNwb25zZS4gKi9cbiAgcHJvdGVjdGVkIHNodXRkb3duU2VydmVyc0dyYWNlZnVsbHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIG9uIGxhbmd1YWdlIHNlcnZlciBzdGRlcnIgb3V0cHV0LlxuICAgKiBAcGFyYW0gc3RkZXJyIGEgY2h1bmsgb2Ygc3RkZXJyIGZyb20gYSBsYW5ndWFnZSBzZXJ2ZXIgaW5zdGFuY2VcbiAgICovXG4gIHByb3RlY3RlZCBoYW5kbGVTZXJ2ZXJTdGRlcnIoc3RkZXJyOiBzdHJpbmcsIF9wcm9qZWN0UGF0aDogc3RyaW5nKSB7XG4gICAgc3RkZXJyLnNwbGl0KCdcXG4nKS5maWx0ZXIoKGwpID0+IGwpLmZvckVhY2goKGxpbmUpID0+IHRoaXMubG9nZ2VyLndhcm4oYHN0ZGVyciAke2xpbmV9YCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGF0IHRoZSBsYW5ndWFnZSBzZXJ2ZXIgY2FuIHN1cHBvcnQgTFNQIGZ1bmN0aW9uYWxpdHkgZm9yXG4gICAqIG91dCBvZiBwcm9qZWN0IGZpbGVzIGluZGljYXRlZCBieSBgdGV4dERvY3VtZW50L2RlZmluaXRpb25gIHJlc3BvbnNlcy5cbiAgICpcbiAgICogRGVmYXVsdDogZmFsc2VcbiAgICovXG4gIHByb3RlY3RlZCBzZXJ2ZXJzU3VwcG9ydERlZmluaXRpb25EZXN0aW5hdGlvbnMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTZXJ2ZXJBZGFwdGVyPFQgZXh0ZW5kcyBrZXlvZiBTZXJ2ZXJBZGFwdGVycz4oXG4gICAgc2VydmVyOiBBY3RpdmVTZXJ2ZXIsIGFkYXB0ZXI6IFQsXG4gICk6IFNlcnZlckFkYXB0ZXJzW1RdIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBhZGFwdGVycyA9IHRoaXMuX3NlcnZlckFkYXB0ZXJzLmdldChzZXJ2ZXIpO1xuICAgIHJldHVybiBhZGFwdGVycyAmJiBhZGFwdGVyc1thZGFwdGVyXTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZXBvcnRCdXN5V2hpbGU6IFV0aWxzLlJlcG9ydEJ1c3lXaGlsZSA9IGFzeW5jICh0aXRsZSwgZikgPT4ge1xuICAgIGlmICh0aGlzLmJ1c3lTaWduYWxTZXJ2aWNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5idXN5U2lnbmFsU2VydmljZS5yZXBvcnRCdXN5V2hpbGUodGl0bGUsIGYpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXBvcnRCdXN5V2hpbGVEZWZhdWx0KHRpdGxlLCBmKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVwb3J0QnVzeVdoaWxlRGVmYXVsdDogVXRpbHMuUmVwb3J0QnVzeVdoaWxlID0gYXN5bmMgKHRpdGxlLCBmKSA9PiB7XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhgW1N0YXJ0ZWRdICR7dGl0bGV9YCk7XG4gICAgbGV0IHJlcztcbiAgICB0cnkge1xuICAgICAgcmVzID0gYXdhaXQgZigpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKGBbRmluaXNoZWRdICR7dGl0bGV9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbn1cbiJdfQ==