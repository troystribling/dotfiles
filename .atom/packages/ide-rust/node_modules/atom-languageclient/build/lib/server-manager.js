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
const convert_1 = require("./convert");
const path = require("path");
const atom_1 = require("atom");
// Manages the language server lifecycles and their associated objects necessary
// for adapting them to Atom IDE.
class ServerManager {
    constructor(_startServer, _logger, _startForEditor, _changeWatchedFileFilter, _reportBusyWhile, _languageServerName, _stopServersGracefully) {
        this._startServer = _startServer;
        this._logger = _logger;
        this._startForEditor = _startForEditor;
        this._changeWatchedFileFilter = _changeWatchedFileFilter;
        this._reportBusyWhile = _reportBusyWhile;
        this._languageServerName = _languageServerName;
        this._stopServersGracefully = _stopServersGracefully;
        this._activeServers = [];
        this._startingServerPromises = new Map();
        this._restartCounterPerProject = new Map();
        this._stoppingServers = [];
        this._disposable = new atom_1.CompositeDisposable();
        this._editorToServer = new Map();
        this._normalizedProjectPaths = [];
        this._isStarted = false;
        this.updateNormalizedProjectPaths();
    }
    startListening() {
        if (!this._isStarted) {
            this._disposable = new atom_1.CompositeDisposable();
            this._disposable.add(atom.textEditors.observe(this.observeTextEditors.bind(this)));
            this._disposable.add(atom.project.onDidChangePaths(this.projectPathsChanged.bind(this)));
            if (atom.project.onDidChangeFiles) {
                this._disposable.add(atom.project.onDidChangeFiles(this.projectFilesChanged.bind(this)));
            }
        }
    }
    stopListening() {
        if (this._isStarted) {
            this._disposable.dispose();
            this._isStarted = false;
        }
    }
    observeTextEditors(editor) {
        // Track grammar changes for opened editors
        const listener = editor.observeGrammar((_grammar) => this._handleGrammarChange(editor));
        this._disposable.add(editor.onDidDestroy(() => listener.dispose()));
        // Try to see if editor can have LS connected to it
        this._handleTextEditor(editor);
    }
    _handleTextEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._editorToServer.has(editor)) {
                // editor hasn't been processed yet, so process it by allocating LS for it if necessary
                const server = yield this.getServer(editor, { shouldStart: true });
                if (server != null) {
                    // There LS for the editor (either started now and already running)
                    this._editorToServer.set(editor, server);
                    this._disposable.add(editor.onDidDestroy(() => {
                        this._editorToServer.delete(editor);
                        this.stopUnusedServers();
                    }));
                }
            }
        });
    }
    _handleGrammarChange(editor) {
        if (this._startForEditor(editor)) {
            // If editor is interesting for LS process the editor further to attempt to start LS if needed
            this._handleTextEditor(editor);
        }
        else {
            // Editor is not supported by the LS
            const server = this._editorToServer.get(editor);
            // If LS is running for the unsupported editor then disconnect the editor from LS and shut down LS if necessary
            if (server) {
                // Remove editor from the cache
                this._editorToServer.delete(editor);
                // Shut down LS if it's used by any other editor
                this.stopUnusedServers();
            }
        }
    }
    getActiveServers() {
        return this._activeServers.slice();
    }
    getServer(textEditor, { shouldStart } = { shouldStart: false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalProjectPath = this.determineProjectPath(textEditor);
            if (finalProjectPath == null) {
                // Files not yet saved have no path
                return null;
            }
            const foundActiveServer = this._activeServers.find((s) => finalProjectPath === s.projectPath);
            if (foundActiveServer) {
                return foundActiveServer;
            }
            const startingPromise = this._startingServerPromises.get(finalProjectPath);
            if (startingPromise) {
                return startingPromise;
            }
            return shouldStart && this._startForEditor(textEditor) ? yield this.startServer(finalProjectPath) : null;
        });
    }
    startServer(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.debug(`Server starting "${projectPath}"`);
            const startingPromise = this._startServer(projectPath);
            this._startingServerPromises.set(projectPath, startingPromise);
            try {
                const startedActiveServer = yield startingPromise;
                this._activeServers.push(startedActiveServer);
                this._startingServerPromises.delete(projectPath);
                this._logger.debug(`Server started "${projectPath}" (pid ${startedActiveServer.process.pid})`);
                return startedActiveServer;
            }
            catch (e) {
                this._startingServerPromises.delete(projectPath);
                throw e;
            }
        });
    }
    stopUnusedServers() {
        return __awaiter(this, void 0, void 0, function* () {
            const usedServers = new Set(this._editorToServer.values());
            const unusedServers = this._activeServers.filter((s) => !usedServers.has(s));
            if (unusedServers.length > 0) {
                this._logger.debug(`Stopping ${unusedServers.length} unused servers`);
                yield Promise.all(unusedServers.map((s) => this.stopServer(s)));
            }
        });
    }
    stopAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [projectPath, restartCounter] of this._restartCounterPerProject) {
                clearTimeout(restartCounter.timerId);
                this._restartCounterPerProject.delete(projectPath);
            }
            yield Promise.all(this._activeServers.map((s) => this.stopServer(s)));
        });
    }
    restartAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stopListening();
            yield this.stopAllServers();
            this._editorToServer = new Map();
            this.startListening();
        });
    }
    hasServerReachedRestartLimit(server) {
        let restartCounter = this._restartCounterPerProject.get(server.projectPath);
        if (!restartCounter) {
            restartCounter = {
                restarts: 0,
                timerId: setTimeout(() => {
                    this._restartCounterPerProject.delete(server.projectPath);
                }, 3 * 60 * 1000 /* 3 minutes */),
            };
            this._restartCounterPerProject.set(server.projectPath, restartCounter);
        }
        return ++restartCounter.restarts > 5;
    }
    stopServer(server) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._reportBusyWhile(`Stopping ${this._languageServerName} for ${path.basename(server.projectPath)}`, () => __awaiter(this, void 0, void 0, function* () {
                this._logger.debug(`Server stopping "${server.projectPath}"`);
                // Immediately remove the server to prevent further usage.
                // If we re-open the file after this point, we'll get a new server.
                this._activeServers.splice(this._activeServers.indexOf(server), 1);
                this._stoppingServers.push(server);
                server.disposable.dispose();
                if (this._stopServersGracefully && server.connection.isConnected) {
                    yield server.connection.shutdown();
                }
                for (const [editor, mappedServer] of this._editorToServer) {
                    if (mappedServer === server) {
                        this._editorToServer.delete(editor);
                    }
                }
                this.exitServer(server);
                this._stoppingServers.splice(this._stoppingServers.indexOf(server), 1);
            }));
        });
    }
    exitServer(server) {
        const pid = server.process.pid;
        try {
            if (server.connection.isConnected) {
                server.connection.exit();
                server.connection.dispose();
            }
        }
        finally {
            server.process.kill();
        }
        this._logger.debug(`Server stopped "${server.projectPath}" (pid ${pid})`);
    }
    terminate() {
        this._stoppingServers.forEach((server) => {
            this._logger.debug(`Server terminating "${server.projectPath}"`);
            this.exitServer(server);
        });
    }
    determineProjectPath(textEditor) {
        const filePath = textEditor.getPath();
        if (filePath == null) {
            return null;
        }
        const projectPath = this._normalizedProjectPaths.find((d) => filePath.startsWith(d));
        if (projectPath) {
            return projectPath;
        }
        const serverWithClaim = this._activeServers
            .find((s) => s.additionalPaths.has(path.dirname(filePath)));
        return serverWithClaim && this.normalizePath(serverWithClaim.projectPath) || null;
    }
    updateNormalizedProjectPaths() {
        this._normalizedProjectPaths = atom.project.getDirectories().map((d) => this.normalizePath(d.getPath()));
    }
    normalizePath(projectPath) {
        return !projectPath.endsWith(path.sep) ? path.join(projectPath, path.sep) : projectPath;
    }
    projectPathsChanged(projectPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const pathsSet = new Set(projectPaths.map(this.normalizePath));
            const serversToStop = this._activeServers.filter((s) => !pathsSet.has(s.projectPath));
            yield Promise.all(serversToStop.map((s) => this.stopServer(s)));
            this.updateNormalizedProjectPaths();
        });
    }
    projectFilesChanged(fileEvents) {
        if (this._activeServers.length === 0) {
            return;
        }
        for (const activeServer of this._activeServers) {
            const changes = [];
            for (const fileEvent of fileEvents) {
                if (fileEvent.path.startsWith(activeServer.projectPath) && this._changeWatchedFileFilter(fileEvent.path)) {
                    changes.push(convert_1.default.atomFileEventToLSFileEvents(fileEvent)[0]);
                }
                if (fileEvent.action === 'renamed' &&
                    fileEvent.oldPath.startsWith(activeServer.projectPath) &&
                    this._changeWatchedFileFilter(fileEvent.oldPath)) {
                    changes.push(convert_1.default.atomFileEventToLSFileEvents(fileEvent)[1]);
                }
            }
            if (changes.length > 0) {
                activeServer.connection.didChangeWatchedFiles({ changes });
            }
        }
    }
}
exports.ServerManager = ServerManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc2VydmVyLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHVDQUFnQztBQUNoQyw2QkFBNkI7QUFLN0IsK0JBSWM7QUFvQ2QsZ0ZBQWdGO0FBQ2hGLGlDQUFpQztBQUNqQyxNQUFhLGFBQWE7SUFVeEIsWUFDVSxZQUE0RCxFQUM1RCxPQUFlLEVBQ2YsZUFBZ0QsRUFDaEQsd0JBQXVELEVBQ3ZELGdCQUFpQyxFQUNqQyxtQkFBMkIsRUFDM0Isc0JBQStCO1FBTi9CLGlCQUFZLEdBQVosWUFBWSxDQUFnRDtRQUM1RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2Ysb0JBQWUsR0FBZixlQUFlLENBQWlDO1FBQ2hELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBK0I7UUFDdkQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtRQUNqQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQVE7UUFDM0IsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFTO1FBaEJqQyxtQkFBYyxHQUFtQixFQUFFLENBQUM7UUFDcEMsNEJBQXVCLEdBQXVDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEUsOEJBQXlCLEdBQWdDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkUscUJBQWdCLEdBQW1CLEVBQUUsQ0FBQztRQUN0QyxnQkFBVyxHQUF3QixJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFDN0Qsb0JBQWUsR0FBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMzRCw0QkFBdUIsR0FBYSxFQUFFLENBQUM7UUFDdkMsZUFBVSxHQUFHLEtBQUssQ0FBQztRQVd6QixJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBRU0sY0FBYztRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksMEJB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Y2VzQ29udGVudCI6WyJpbXBvcnQgQ29udmVydCBmcm9tICcuL2NvbnZlcnQnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHtcbiAgQ29tcG9zaXRlRGlzcG9zYWJsZSxcbiAgRmlsZXN5c3RlbUNoYW5nZUV2ZW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcbmltcG9ydCB7IFJlcG9ydEJ1c3lXaGlsZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vLyBQdWJsaWM6IERlZmluZXMgdGhlIG1pbmltdW0gc3VyZmFjZSBhcmVhIGZvciBhbiBvYmplY3QgdGhhdCByZXNlbWJsZXMgYVxuLy8gQ2hpbGRQcm9jZXNzLiAgVGhpcyBpcyB1c2VkIHNvIHRoYXQgbGFuZ3VhZ2UgcGFja2FnZXMgd2l0aCBhbHRlcm5hdGl2ZVxuLy8gbGFuZ3VhZ2Ugc2VydmVyIHByb2Nlc3MgaG9zdGluZyBzdHJhdGVnaWVzIGNhbiByZXR1cm4gc29tZXRoaW5nIGNvbXBhdGlibGVcbi8vIHdpdGggQXV0b0xhbmd1YWdlQ2xpZW50LnN0YXJ0U2VydmVyUHJvY2Vzcy5cbmV4cG9ydCBpbnRlcmZhY2UgTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgc3RkaW46IHN0cmVhbS5Xcml0YWJsZTtcbiAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGU7XG4gIHN0ZGVycjogc3RyZWFtLlJlYWRhYmxlO1xuICBwaWQ6IG51bWJlcjtcblxuICBraWxsKHNpZ25hbD86IHN0cmluZyk6IHZvaWQ7XG4gIG9uKGV2ZW50OiAnZXJyb3InLCBsaXN0ZW5lcjogKGVycjogRXJyb3IpID0+IHZvaWQpOiB0aGlzO1xuICBvbihldmVudDogJ2V4aXQnLCBsaXN0ZW5lcjogKGNvZGU6IG51bWJlciwgc2lnbmFsOiBzdHJpbmcpID0+IHZvaWQpOiB0aGlzO1xufVxuXG4vLyBUaGUgbmVjZXNzYXJ5IGVsZW1lbnRzIGZvciBhIHNlcnZlciB0aGF0IGhhcyBzdGFydGVkIG9yIGlzIHN0YXJ0aW5nLlxuZXhwb3J0IGludGVyZmFjZSBBY3RpdmVTZXJ2ZXIge1xuICBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBwcm9qZWN0UGF0aDogc3RyaW5nO1xuICBwcm9jZXNzOiBMYW5ndWFnZVNlcnZlclByb2Nlc3M7XG4gIGNvbm5lY3Rpb246IGxzLkxhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbjtcbiAgY2FwYWJpbGl0aWVzOiBscy5TZXJ2ZXJDYXBhYmlsaXRpZXM7XG4gIC8vIE91dCBvZiBwcm9qZWN0IGRpcmVjdG9yaWVzIHRoYXQgdGhpcyBzZXJ2ZXIgY2FuIGFsc28gc3VwcG9ydC5cbiAgYWRkaXRpb25hbFBhdGhzOiBTZXQ8c3RyaW5nPjtcbiAgLy8gQ29uc2lkZXJzIGEgcGF0aCBmcm9tIGB0ZXh0RG9jdW1lbnQvZGVmaW5pdGlvbmAgZm9yIGluY2x1c2lvbiBpbiBgYWRkaXRpb25hbFBhdGhzYC5cbiAgY29uc2lkZXJEZWZpbml0aW9uUGF0aChwYXRoOiBzdHJpbmcpOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgUmVzdGFydENvdW50ZXIge1xuICByZXN0YXJ0czogbnVtYmVyO1xuICB0aW1lcklkOiBOb2RlSlMuVGltZXI7XG59XG5cbi8vIE1hbmFnZXMgdGhlIGxhbmd1YWdlIHNlcnZlciBsaWZlY3ljbGVzIGFuZCB0aGVpciBhc3NvY2lhdGVkIG9iamVjdHMgbmVjZXNzYXJ5XG4vLyBmb3IgYWRhcHRpbmcgdGhlbSB0byBBdG9tIElERS5cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBfYWN0aXZlU2VydmVyczogQWN0aXZlU2VydmVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfc3RhcnRpbmdTZXJ2ZXJQcm9taXNlczogTWFwPHN0cmluZywgUHJvbWlzZTxBY3RpdmVTZXJ2ZXI+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfcmVzdGFydENvdW50ZXJQZXJQcm9qZWN0OiBNYXA8c3RyaW5nLCBSZXN0YXJ0Q291bnRlcj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX3N0b3BwaW5nU2VydmVyczogQWN0aXZlU2VydmVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIHByaXZhdGUgX2VkaXRvclRvU2VydmVyOiBNYXA8VGV4dEVkaXRvciwgQWN0aXZlU2VydmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfbm9ybWFsaXplZFByb2plY3RQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBfaXNTdGFydGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfc3RhcnRTZXJ2ZXI6IChwcm9qZWN0UGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPEFjdGl2ZVNlcnZlcj4sXG4gICAgcHJpdmF0ZSBfbG9nZ2VyOiBMb2dnZXIsXG4gICAgcHJpdmF0ZSBfc3RhcnRGb3JFZGl0b3I6IChlZGl0b3I6IFRleHRFZGl0b3IpID0+IGJvb2xlYW4sXG4gICAgcHJpdmF0ZSBfY2hhbmdlV2F0Y2hlZEZpbGVGaWx0ZXI6IChmaWxlUGF0aDogc3RyaW5nKSA9PiBib29sZWFuLFxuICAgIHByaXZhdGUgX3JlcG9ydEJ1c3lXaGlsZTogUmVwb3J0QnVzeVdoaWxlLFxuICAgIHByaXZhdGUgX2xhbmd1YWdlU2VydmVyTmFtZTogc3RyaW5nLFxuICAgIHByaXZhdGUgX3N0b3BTZXJ2ZXJzR3JhY2VmdWxseTogYm9vbGVhbixcbiAgKSB7XG4gICAgdGhpcy51cGRhdGVOb3JtYWxpemVkUHJvamVjdFBhdGhzKCk7XG4gIH1cblxuICBwdWJsaWMgc3RhcnRMaXN0ZW5pbmcoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc1N0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS50ZXh0RWRpdG9ycy5vYnNlcnZlKHRoaXMub2JzZXJ2ZVRleHRFZGl0b3JzLmJpbmQodGhpcykpKTtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKHRoaXMucHJvamVjdFBhdGhzQ2hhbmdlZC5iaW5kKHRoaXMpKSk7XG4gICAgICBpZiAoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlRmlsZXMpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlRmlsZXModGhpcy5wcm9qZWN0RmlsZXNDaGFuZ2VkLmJpbmQodGhpcykpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc3RvcExpc3RlbmluZygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faXNTdGFydGVkKSB7XG4gICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX2lzU3RhcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb2JzZXJ2ZVRleHRFZGl0b3JzKGVkaXRvcjogVGV4dEVkaXRvcik6IHZvaWQge1xuICAgIC8vIFRyYWNrIGdyYW1tYXIgY2hhbmdlcyBmb3Igb3BlbmVkIGVkaXRvcnNcbiAgICBjb25zdCBsaXN0ZW5lciA9IGVkaXRvci5vYnNlcnZlR3JhbW1hcigoX2dyYW1tYXIpID0+IHRoaXMuX2hhbmRsZUdyYW1tYXJDaGFuZ2UoZWRpdG9yKSk7XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiBsaXN0ZW5lci5kaXNwb3NlKCkpKTtcbiAgICAvLyBUcnkgdG8gc2VlIGlmIGVkaXRvciBjYW4gaGF2ZSBMUyBjb25uZWN0ZWQgdG8gaXRcbiAgICB0aGlzLl9oYW5kbGVUZXh0RWRpdG9yKGVkaXRvcik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9oYW5kbGVUZXh0RWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuaGFzKGVkaXRvcikpIHtcbiAgICAgIC8vIGVkaXRvciBoYXNuJ3QgYmVlbiBwcm9jZXNzZWQgeWV0LCBzbyBwcm9jZXNzIGl0IGJ5IGFsbG9jYXRpbmcgTFMgZm9yIGl0IGlmIG5lY2Vzc2FyeVxuICAgICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5nZXRTZXJ2ZXIoZWRpdG9yLCB7IHNob3VsZFN0YXJ0OiB0cnVlIH0pO1xuICAgICAgaWYgKHNlcnZlciAhPSBudWxsKSB7XG4gICAgICAgIC8vIFRoZXJlIExTIGZvciB0aGUgZWRpdG9yIChlaXRoZXIgc3RhcnRlZCBub3cgYW5kIGFscmVhZHkgcnVubmluZylcbiAgICAgICAgdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuc2V0KGVkaXRvciwgc2VydmVyKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXG4gICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JUb1NlcnZlci5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgICAgIHRoaXMuc3RvcFVudXNlZFNlcnZlcnMoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oYW5kbGVHcmFtbWFyQ2hhbmdlKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGlmICh0aGlzLl9zdGFydEZvckVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAvLyBJZiBlZGl0b3IgaXMgaW50ZXJlc3RpbmcgZm9yIExTIHByb2Nlc3MgdGhlIGVkaXRvciBmdXJ0aGVyIHRvIGF0dGVtcHQgdG8gc3RhcnQgTFMgaWYgbmVlZGVkXG4gICAgICB0aGlzLl9oYW5kbGVUZXh0RWRpdG9yKGVkaXRvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVkaXRvciBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBMU1xuICAgICAgY29uc3Qgc2VydmVyID0gdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuZ2V0KGVkaXRvcik7XG4gICAgICAvLyBJZiBMUyBpcyBydW5uaW5nIGZvciB0aGUgdW5zdXBwb3J0ZWQgZWRpdG9yIHRoZW4gZGlzY29ubmVjdCB0aGUgZWRpdG9yIGZyb20gTFMgYW5kIHNodXQgZG93biBMUyBpZiBuZWNlc3NhcnlcbiAgICAgIGlmIChzZXJ2ZXIpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGVkaXRvciBmcm9tIHRoZSBjYWNoZVxuICAgICAgICB0aGlzLl9lZGl0b3JUb1NlcnZlci5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgLy8gU2h1dCBkb3duIExTIGlmIGl0J3MgdXNlZCBieSBhbnkgb3RoZXIgZWRpdG9yXG4gICAgICAgIHRoaXMuc3RvcFVudXNlZFNlcnZlcnMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0QWN0aXZlU2VydmVycygpOiBBY3RpdmVTZXJ2ZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNlcnZlcnMuc2xpY2UoKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRTZXJ2ZXIoXG4gICAgdGV4dEVkaXRvcjogVGV4dEVkaXRvcixcbiAgICB7IHNob3VsZFN0YXJ0IH06IHsgc2hvdWxkU3RhcnQ/OiBib29sZWFuIH0gPSB7IHNob3VsZFN0YXJ0OiBmYWxzZSB9LFxuICApOiBQcm9taXNlPEFjdGl2ZVNlcnZlciB8IG51bGw+IHtcbiAgICBjb25zdCBmaW5hbFByb2plY3RQYXRoID0gdGhpcy5kZXRlcm1pbmVQcm9qZWN0UGF0aCh0ZXh0RWRpdG9yKTtcbiAgICBpZiAoZmluYWxQcm9qZWN0UGF0aCA9PSBudWxsKSB7XG4gICAgICAvLyBGaWxlcyBub3QgeWV0IHNhdmVkIGhhdmUgbm8gcGF0aFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmRBY3RpdmVTZXJ2ZXIgPSB0aGlzLl9hY3RpdmVTZXJ2ZXJzLmZpbmQoKHMpID0+IGZpbmFsUHJvamVjdFBhdGggPT09IHMucHJvamVjdFBhdGgpO1xuICAgIGlmIChmb3VuZEFjdGl2ZVNlcnZlcikge1xuICAgICAgcmV0dXJuIGZvdW5kQWN0aXZlU2VydmVyO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0aW5nUHJvbWlzZSA9IHRoaXMuX3N0YXJ0aW5nU2VydmVyUHJvbWlzZXMuZ2V0KGZpbmFsUHJvamVjdFBhdGgpO1xuICAgIGlmIChzdGFydGluZ1Byb21pc2UpIHtcbiAgICAgIHJldHVybiBzdGFydGluZ1Byb21pc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNob3VsZFN0YXJ0ICYmIHRoaXMuX3N0YXJ0Rm9yRWRpdG9yKHRleHRFZGl0b3IpID8gYXdhaXQgdGhpcy5zdGFydFNlcnZlcihmaW5hbFByb2plY3RQYXRoKSA6IG51bGw7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8QWN0aXZlU2VydmVyPiB7XG4gICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RhcnRpbmcgXCIke3Byb2plY3RQYXRofVwiYCk7XG4gICAgY29uc3Qgc3RhcnRpbmdQcm9taXNlID0gdGhpcy5fc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGgpO1xuICAgIHRoaXMuX3N0YXJ0aW5nU2VydmVyUHJvbWlzZXMuc2V0KHByb2plY3RQYXRoLCBzdGFydGluZ1Byb21pc2UpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGFydGVkQWN0aXZlU2VydmVyID0gYXdhaXQgc3RhcnRpbmdQcm9taXNlO1xuICAgICAgdGhpcy5fYWN0aXZlU2VydmVycy5wdXNoKHN0YXJ0ZWRBY3RpdmVTZXJ2ZXIpO1xuICAgICAgdGhpcy5fc3RhcnRpbmdTZXJ2ZXJQcm9taXNlcy5kZWxldGUocHJvamVjdFBhdGgpO1xuICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RhcnRlZCBcIiR7cHJvamVjdFBhdGh9XCIgKHBpZCAke3N0YXJ0ZWRBY3RpdmVTZXJ2ZXIucHJvY2Vzcy5waWR9KWApO1xuICAgICAgcmV0dXJuIHN0YXJ0ZWRBY3RpdmVTZXJ2ZXI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fc3RhcnRpbmdTZXJ2ZXJQcm9taXNlcy5kZWxldGUocHJvamVjdFBhdGgpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RvcFVudXNlZFNlcnZlcnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdXNlZFNlcnZlcnMgPSBuZXcgU2V0KHRoaXMuX2VkaXRvclRvU2VydmVyLnZhbHVlcygpKTtcbiAgICBjb25zdCB1bnVzZWRTZXJ2ZXJzID0gdGhpcy5fYWN0aXZlU2VydmVycy5maWx0ZXIoKHMpID0+ICF1c2VkU2VydmVycy5oYXMocykpO1xuICAgIGlmICh1bnVzZWRTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhgU3RvcHBpbmcgJHt1bnVzZWRTZXJ2ZXJzLmxlbmd0aH0gdW51c2VkIHNlcnZlcnNgKTtcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHVudXNlZFNlcnZlcnMubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RvcEFsbFNlcnZlcnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChjb25zdCBbcHJvamVjdFBhdGgsIHJlc3RhcnRDb3VudGVyXSBvZiB0aGlzLl9yZXN0YXJ0Q291bnRlclBlclByb2plY3QpIHtcbiAgICAgIGNsZWFyVGltZW91dChyZXN0YXJ0Q291bnRlci50aW1lcklkKTtcbiAgICAgIHRoaXMuX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdC5kZWxldGUocHJvamVjdFBhdGgpO1xuICAgIH1cblxuICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuX2FjdGl2ZVNlcnZlcnMubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZXN0YXJ0QWxsU2VydmVycygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3BMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BBbGxTZXJ2ZXJzKCk7XG4gICAgdGhpcy5fZWRpdG9yVG9TZXJ2ZXIgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5zdGFydExpc3RlbmluZygpO1xuICB9XG5cbiAgcHVibGljIGhhc1NlcnZlclJlYWNoZWRSZXN0YXJ0TGltaXQoc2VydmVyOiBBY3RpdmVTZXJ2ZXIpIHtcbiAgICBsZXQgcmVzdGFydENvdW50ZXIgPSB0aGlzLl9yZXN0YXJ0Q291bnRlclBlclByb2plY3QuZ2V0KHNlcnZlci5wcm9qZWN0UGF0aCk7XG5cbiAgICBpZiAoIXJlc3RhcnRDb3VudGVyKSB7XG4gICAgICByZXN0YXJ0Q291bnRlciA9IHtcbiAgICAgICAgcmVzdGFydHM6IDAsXG4gICAgICAgIHRpbWVySWQ6IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdC5kZWxldGUoc2VydmVyLnByb2plY3RQYXRoKTtcbiAgICAgICAgfSwgMyAqIDYwICogMTAwMCAvKiAzIG1pbnV0ZXMgKi8pLFxuICAgICAgfTtcblxuICAgICAgdGhpcy5fcmVzdGFydENvdW50ZXJQZXJQcm9qZWN0LnNldChzZXJ2ZXIucHJvamVjdFBhdGgsIHJlc3RhcnRDb3VudGVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKytyZXN0YXJ0Q291bnRlci5yZXN0YXJ0cyA+IDU7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RvcFNlcnZlcihzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3JlcG9ydEJ1c3lXaGlsZShcbiAgICAgIGBTdG9wcGluZyAke3RoaXMuX2xhbmd1YWdlU2VydmVyTmFtZX0gZm9yICR7cGF0aC5iYXNlbmFtZShzZXJ2ZXIucHJvamVjdFBhdGgpfWAsXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhgU2VydmVyIHN0b3BwaW5nIFwiJHtzZXJ2ZXIucHJvamVjdFBhdGh9XCJgKTtcbiAgICAgICAgLy8gSW1tZWRpYXRlbHkgcmVtb3ZlIHRoZSBzZXJ2ZXIgdG8gcHJldmVudCBmdXJ0aGVyIHVzYWdlLlxuICAgICAgICAvLyBJZiB3ZSByZS1vcGVuIHRoZSBmaWxlIGFmdGVyIHRoaXMgcG9pbnQsIHdlJ2xsIGdldCBhIG5ldyBzZXJ2ZXIuXG4gICAgICAgIHRoaXMuX2FjdGl2ZVNlcnZlcnMuc3BsaWNlKHRoaXMuX2FjdGl2ZVNlcnZlcnMuaW5kZXhPZihzZXJ2ZXIpLCAxKTtcbiAgICAgICAgdGhpcy5fc3RvcHBpbmdTZXJ2ZXJzLnB1c2goc2VydmVyKTtcbiAgICAgICAgc2VydmVyLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICBpZiAodGhpcy5fc3RvcFNlcnZlcnNHcmFjZWZ1bGx5ICYmIHNlcnZlci5jb25uZWN0aW9uLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgYXdhaXQgc2VydmVyLmNvbm5lY3Rpb24uc2h1dGRvd24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgW2VkaXRvciwgbWFwcGVkU2VydmVyXSBvZiB0aGlzLl9lZGl0b3JUb1NlcnZlcikge1xuICAgICAgICAgIGlmIChtYXBwZWRTZXJ2ZXIgPT09IHNlcnZlcikge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuZGVsZXRlKGVkaXRvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5leGl0U2VydmVyKHNlcnZlcik7XG4gICAgICAgIHRoaXMuX3N0b3BwaW5nU2VydmVycy5zcGxpY2UodGhpcy5fc3RvcHBpbmdTZXJ2ZXJzLmluZGV4T2Yoc2VydmVyKSwgMSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZXhpdFNlcnZlcihzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IHZvaWQge1xuICAgIGNvbnN0IHBpZCA9IHNlcnZlci5wcm9jZXNzLnBpZDtcbiAgICB0cnkge1xuICAgICAgaWYgKHNlcnZlci5jb25uZWN0aW9uLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgIHNlcnZlci5jb25uZWN0aW9uLmV4aXQoKTtcbiAgICAgICAgc2VydmVyLmNvbm5lY3Rpb24uZGlzcG9zZSgpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXJ2ZXIucHJvY2Vzcy5raWxsKCk7XG4gICAgfVxuICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhgU2VydmVyIHN0b3BwZWQgXCIke3NlcnZlci5wcm9qZWN0UGF0aH1cIiAocGlkICR7cGlkfSlgKTtcbiAgfVxuXG4gIHB1YmxpYyB0ZXJtaW5hdGUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RvcHBpbmdTZXJ2ZXJzLmZvckVhY2goKHNlcnZlcikgPT4ge1xuICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgdGVybWluYXRpbmcgXCIke3NlcnZlci5wcm9qZWN0UGF0aH1cImApO1xuICAgICAgdGhpcy5leGl0U2VydmVyKHNlcnZlcik7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgZGV0ZXJtaW5lUHJvamVjdFBhdGgodGV4dEVkaXRvcjogVGV4dEVkaXRvcik6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgaWYgKGZpbGVQYXRoID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2plY3RQYXRoID0gdGhpcy5fbm9ybWFsaXplZFByb2plY3RQYXRocy5maW5kKChkKSA9PiBmaWxlUGF0aC5zdGFydHNXaXRoKGQpKTtcbiAgICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICAgIHJldHVybiBwcm9qZWN0UGF0aDtcbiAgICB9XG5cbiAgICBjb25zdCBzZXJ2ZXJXaXRoQ2xhaW0gPSB0aGlzLl9hY3RpdmVTZXJ2ZXJzXG4gICAgICAuZmluZCgocykgPT4gcy5hZGRpdGlvbmFsUGF0aHMuaGFzKHBhdGguZGlybmFtZShmaWxlUGF0aCkpKTtcbiAgICByZXR1cm4gc2VydmVyV2l0aENsYWltICYmIHRoaXMubm9ybWFsaXplUGF0aChzZXJ2ZXJXaXRoQ2xhaW0ucHJvamVjdFBhdGgpIHx8IG51bGw7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlTm9ybWFsaXplZFByb2plY3RQYXRocygpOiB2b2lkIHtcbiAgICB0aGlzLl9ub3JtYWxpemVkUHJvamVjdFBhdGhzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubWFwKChkKSA9PiB0aGlzLm5vcm1hbGl6ZVBhdGgoZC5nZXRQYXRoKCkpKTtcbiAgfVxuXG4gIHB1YmxpYyBub3JtYWxpemVQYXRoKHByb2plY3RQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiAhcHJvamVjdFBhdGguZW5kc1dpdGgocGF0aC5zZXApID8gcGF0aC5qb2luKHByb2plY3RQYXRoLCBwYXRoLnNlcCkgOiBwcm9qZWN0UGF0aDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBwcm9qZWN0UGF0aHNDaGFuZ2VkKHByb2plY3RQYXRoczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXRoc1NldCA9IG5ldyBTZXQocHJvamVjdFBhdGhzLm1hcCh0aGlzLm5vcm1hbGl6ZVBhdGgpKTtcbiAgICBjb25zdCBzZXJ2ZXJzVG9TdG9wID0gdGhpcy5fYWN0aXZlU2VydmVycy5maWx0ZXIoKHMpID0+ICFwYXRoc1NldC5oYXMocy5wcm9qZWN0UGF0aCkpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHNlcnZlcnNUb1N0b3AubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcbiAgICB0aGlzLnVwZGF0ZU5vcm1hbGl6ZWRQcm9qZWN0UGF0aHMoKTtcbiAgfVxuXG4gIHB1YmxpYyBwcm9qZWN0RmlsZXNDaGFuZ2VkKGZpbGVFdmVudHM6IEZpbGVzeXN0ZW1DaGFuZ2VFdmVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9hY3RpdmVTZXJ2ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgYWN0aXZlU2VydmVyIG9mIHRoaXMuX2FjdGl2ZVNlcnZlcnMpIHtcbiAgICAgIGNvbnN0IGNoYW5nZXM6IGxzLkZpbGVFdmVudFtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGZpbGVFdmVudCBvZiBmaWxlRXZlbnRzKSB7XG4gICAgICAgIGlmIChmaWxlRXZlbnQucGF0aC5zdGFydHNXaXRoKGFjdGl2ZVNlcnZlci5wcm9qZWN0UGF0aCkgJiYgdGhpcy5fY2hhbmdlV2F0Y2hlZEZpbGVGaWx0ZXIoZmlsZUV2ZW50LnBhdGgpKSB7XG4gICAgICAgICAgY2hhbmdlcy5wdXNoKENvbnZlcnQuYXRvbUZpbGVFdmVudFRvTFNGaWxlRXZlbnRzKGZpbGVFdmVudClbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICBmaWxlRXZlbnQuYWN0aW9uID09PSAncmVuYW1lZCcgJiZcbiAgICAgICAgICBmaWxlRXZlbnQub2xkUGF0aC5zdGFydHNXaXRoKGFjdGl2ZVNlcnZlci5wcm9qZWN0UGF0aCkgJiZcbiAgICAgICAgICB0aGlzLl9jaGFuZ2VXYXRjaGVkRmlsZUZpbHRlcihmaWxlRXZlbnQub2xkUGF0aClcbiAgICAgICAgKSB7XG4gICAgICAgICAgY2hhbmdlcy5wdXNoKENvbnZlcnQuYXRvbUZpbGVFdmVudFRvTFNGaWxlRXZlbnRzKGZpbGVFdmVudClbMV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFjdGl2ZVNlcnZlci5jb25uZWN0aW9uLmRpZENoYW5nZVdhdGNoZWRGaWxlcyh7IGNoYW5nZXMgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=