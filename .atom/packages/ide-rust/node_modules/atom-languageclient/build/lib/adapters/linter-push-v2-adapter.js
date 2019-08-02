"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("../convert");
const languageclient_1 = require("../languageclient");
// Public: Listen to diagnostics messages from the language server and publish them
// to the user by way of the Linter Push (Indie) v2 API supported by Atom IDE UI.
class LinterPushV2Adapter {
    // Public: Create a new {LinterPushV2Adapter} that will listen for diagnostics
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide diagnostics.
    constructor(connection) {
        this._diagnosticMap = new Map();
        this._diagnosticCodes = new Map();
        this._indies = new Set();
        connection.onPublishDiagnostics(this.captureDiagnostics.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LinterPushV2Adapter} to a given {V2IndieDelegate} registry.
    //
    // * `indie` A {V2IndieDelegate} that wants to receive messages.
    attach(indie) {
        this._indies.add(indie);
        this._diagnosticMap.forEach((value, key) => indie.setMessages(key, value));
        indie.onDidDestroy(() => {
            this._indies.delete(indie);
        });
    }
    // Public: Remove all {V2IndieDelegate} registries attached to this adapter and clear them.
    detachAll() {
        this._indies.forEach((i) => i.clearMessages());
        this._indies.clear();
    }
    // Public: Capture the diagnostics sent from a langguage server, convert them to the
    // Linter V2 format and forward them on to any attached {V2IndieDelegate}s.
    //
    // * `params` The {PublishDiagnosticsParams} received from the language server that should
    //            be captured and forwarded on to any attached {V2IndieDelegate}s.
    captureDiagnostics(params) {
        const path = convert_1.default.uriToPath(params.uri);
        const codeMap = new Map();
        const messages = params.diagnostics.map((d) => {
            const linterMessage = this.diagnosticToV2Message(path, d);
            codeMap.set(getCodeKey(linterMessage.location.position, d.message), d.code);
            return linterMessage;
        });
        this._diagnosticMap.set(path, messages);
        this._diagnosticCodes.set(path, codeMap);
        this._indies.forEach((i) => i.setMessages(path, messages));
    }
    // Public: Convert a single {Diagnostic} received from a language server into a single
    // {V2Message} expected by the Linter V2 API.
    //
    // * `path` A string representing the path of the file the diagnostic belongs to.
    // * `diagnostics` A {Diagnostic} object received from the language server.
    //
    // Returns a {V2Message} equivalent to the {Diagnostic} object supplied by the language server.
    diagnosticToV2Message(path, diagnostic) {
        return {
            location: {
                file: path,
                position: convert_1.default.lsRangeToAtomRange(diagnostic.range),
            },
            excerpt: diagnostic.message,
            linterName: diagnostic.source,
            severity: LinterPushV2Adapter.diagnosticSeverityToSeverity(diagnostic.severity || -1),
        };
    }
    // Public: Convert a diagnostic severity number obtained from the language server into
    // the textual equivalent for a Linter {V2Message}.
    //
    // * `severity` A number representing the severity of the diagnostic.
    //
    // Returns a string of 'error', 'warning' or 'info' depending on the severity.
    static diagnosticSeverityToSeverity(severity) {
        switch (severity) {
            case languageclient_1.DiagnosticSeverity.Error:
                return 'error';
            case languageclient_1.DiagnosticSeverity.Warning:
                return 'warning';
            case languageclient_1.DiagnosticSeverity.Information:
            case languageclient_1.DiagnosticSeverity.Hint:
            default:
                return 'info';
        }
    }
    // Private: Get the recorded diagnostic code for a range/message.
    // Diagnostic codes are tricky because there's no suitable place in the Linter API for them.
    // For now, we'll record the original code for each range/message combination and retrieve it
    // when needed (e.g. for passing back into code actions)
    getDiagnosticCode(editor, range, text) {
        const path = editor.getPath();
        if (path != null) {
            const diagnosticCodes = this._diagnosticCodes.get(path);
            if (diagnosticCodes != null) {
                return diagnosticCodes.get(getCodeKey(range, text)) || null;
            }
        }
        return null;
    }
}
exports.default = LinterPushV2Adapter;
function getCodeKey(range, text) {
    return [].concat(...range.serialize(), text).join(',');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGludGVyLXB1c2gtdjItYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsd0NBQWlDO0FBQ2pDLHNEQU0yQjtBQUUzQixtRkFBbUY7QUFDbkYsaUZBQWlGO0FBQ2pGLE1BQXFCLG1CQUFtQjtJQUt0Qyw4RUFBOEU7SUFDOUUsK0NBQStDO0lBQy9DLEVBQUU7SUFDRixvR0FBb0c7SUFDcEcsWUFBWSxVQUFvQztRQVJ4QyxtQkFBYyxHQUFrQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzFELHFCQUFnQixHQUFvRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzlFLFlBQU8sR0FBOEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQU9yRCxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCw2RUFBNkU7SUFDdEUsT0FBTztRQUNaLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQsbUZBQW1GO0lBQ25GLEVBQUU7SUFDRixnRUFBZ0U7SUFDekQsTUFBTSxDQUFDLEtBQTJCO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzRSxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztJQUNMLENB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Q2hCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEQsSUFBSSxlQUFlLElBQUksSUFBSSxFQUFFO2dCQUMzQixPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQzthQUM3RDtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUF6R0Qsc0NBeUdDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBaUIsRUFBRSxJQUFZO0lBQ2pELE9BQVEsRUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxpbnRlciBmcm9tICdhdG9tL2xpbnRlcic7XG5pbXBvcnQgKiBhcyBhdG9tIGZyb20gJ2F0b20nO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQge1xuICBEaWFnbm9zdGljLFxuICBEaWFnbm9zdGljQ29kZSxcbiAgRGlhZ25vc3RpY1NldmVyaXR5LFxuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIFB1Ymxpc2hEaWFnbm9zdGljc1BhcmFtcyxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuXG4vLyBQdWJsaWM6IExpc3RlbiB0byBkaWFnbm9zdGljcyBtZXNzYWdlcyBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgYW5kIHB1Ymxpc2ggdGhlbVxuLy8gdG8gdGhlIHVzZXIgYnkgd2F5IG9mIHRoZSBMaW50ZXIgUHVzaCAoSW5kaWUpIHYyIEFQSSBzdXBwb3J0ZWQgYnkgQXRvbSBJREUgVUkuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW50ZXJQdXNoVjJBZGFwdGVyIHtcbiAgcHJpdmF0ZSBfZGlhZ25vc3RpY01hcDogTWFwPHN0cmluZywgbGludGVyLk1lc3NhZ2VbXT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX2RpYWdub3N0aWNDb2RlczogTWFwPHN0cmluZywgTWFwPHN0cmluZywgRGlhZ25vc3RpY0NvZGUgfCBudWxsPj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX2luZGllczogU2V0PGxpbnRlci5JbmRpZURlbGVnYXRlPiA9IG5ldyBTZXQoKTtcblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIG5ldyB7TGludGVyUHVzaFYyQWRhcHRlcn0gdGhhdCB3aWxsIGxpc3RlbiBmb3IgZGlhZ25vc3RpY3NcbiAgLy8gdmlhIHRoZSBzdXBwbGllZCB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufS5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBwcm92aWRlIGRpYWdub3N0aWNzLlxuICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24pIHtcbiAgICBjb25uZWN0aW9uLm9uUHVibGlzaERpYWdub3N0aWNzKHRoaXMuY2FwdHVyZURpYWdub3N0aWNzLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLy8gRGlzcG9zZSB0aGlzIGFkYXB0ZXIgZW5zdXJpbmcgYW55IHJlc291cmNlcyBhcmUgZnJlZWQgYW5kIGV2ZW50cyB1bmhvb2tlZC5cbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5kZXRhY2hBbGwoKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQXR0YWNoIHRoaXMge0xpbnRlclB1c2hWMkFkYXB0ZXJ9IHRvIGEgZ2l2ZW4ge1YySW5kaWVEZWxlZ2F0ZX0gcmVnaXN0cnkuXG4gIC8vXG4gIC8vICogYGluZGllYCBBIHtWMkluZGllRGVsZWdhdGV9IHRoYXQgd2FudHMgdG8gcmVjZWl2ZSBtZXNzYWdlcy5cbiAgcHVibGljIGF0dGFjaChpbmRpZTogbGludGVyLkluZGllRGVsZWdhdGUpOiB2b2lkIHtcbiAgICB0aGlzLl9pbmRpZXMuYWRkKGluZGllKTtcbiAgICB0aGlzLl9kaWFnbm9zdGljTWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IGluZGllLnNldE1lc3NhZ2VzKGtleSwgdmFsdWUpKTtcbiAgICBpbmRpZS5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy5faW5kaWVzLmRlbGV0ZShpbmRpZSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlbW92ZSBhbGwge1YySW5kaWVEZWxlZ2F0ZX0gcmVnaXN0cmllcyBhdHRhY2hlZCB0byB0aGlzIGFkYXB0ZXIgYW5kIGNsZWFyIHRoZW0uXG4gIHB1YmxpYyBkZXRhY2hBbGwoKTogdm9pZCB7XG4gICAgdGhpcy5faW5kaWVzLmZvckVhY2goKGkpID0+IGkuY2xlYXJNZXNzYWdlcygpKTtcbiAgICB0aGlzLl9pbmRpZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ2FwdHVyZSB0aGUgZGlhZ25vc3RpY3Mgc2VudCBmcm9tIGEgbGFuZ2d1YWdlIHNlcnZlciwgY29udmVydCB0aGVtIHRvIHRoZVxuICAvLyBMaW50ZXIgVjIgZm9ybWF0IGFuZCBmb3J3YXJkIHRoZW0gb24gdG8gYW55IGF0dGFjaGVkIHtWMkluZGllRGVsZWdhdGV9cy5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge1B1Ymxpc2hEaWFnbm9zdGljc1BhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgc2hvdWxkXG4gIC8vICAgICAgICAgICAgYmUgY2FwdHVyZWQgYW5kIGZvcndhcmRlZCBvbiB0byBhbnkgYXR0YWNoZWQge1YySW5kaWVEZWxlZ2F0ZX1zLlxuICBwdWJsaWMgY2FwdHVyZURpYWdub3N0aWNzKHBhcmFtczogUHVibGlzaERpYWdub3N0aWNzUGFyYW1zKTogdm9pZCB7XG4gICAgY29uc3QgcGF0aCA9IENvbnZlcnQudXJpVG9QYXRoKHBhcmFtcy51cmkpO1xuICAgIGNvbnN0IGNvZGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgbWVzc2FnZXMgPSBwYXJhbXMuZGlhZ25vc3RpY3MubWFwKChkKSA9PiB7XG4gICAgICBjb25zdCBsaW50ZXJNZXNzYWdlID0gdGhpcy5kaWFnbm9zdGljVG9WMk1lc3NhZ2UocGF0aCwgZCk7XG4gICAgICBjb2RlTWFwLnNldChnZXRDb2RlS2V5KGxpbnRlck1lc3NhZ2UubG9jYXRpb24ucG9zaXRpb24sIGQubWVzc2FnZSksIGQuY29kZSk7XG4gICAgICByZXR1cm4gbGludGVyTWVzc2FnZTtcbiAgICB9KTtcbiAgICB0aGlzLl9kaWFnbm9zdGljTWFwLnNldChwYXRoLCBtZXNzYWdlcyk7XG4gICAgdGhpcy5fZGlhZ25vc3RpY0NvZGVzLnNldChwYXRoLCBjb2RlTWFwKTtcbiAgICB0aGlzLl9pbmRpZXMuZm9yRWFjaCgoaSkgPT4gaS5zZXRNZXNzYWdlcyhwYXRoLCBtZXNzYWdlcykpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgc2luZ2xlIHtEaWFnbm9zdGljfSByZWNlaXZlZCBmcm9tIGEgbGFuZ3VhZ2Ugc2VydmVyIGludG8gYSBzaW5nbGVcbiAgLy8ge1YyTWVzc2FnZX0gZXhwZWN0ZWQgYnkgdGhlIExpbnRlciBWMiBBUEkuXG4gIC8vXG4gIC8vICogYHBhdGhgIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcGF0aCBvZiB0aGUgZmlsZSB0aGUgZGlhZ25vc3RpYyBiZWxvbmdzIHRvLlxuICAvLyAqIGBkaWFnbm9zdGljc2AgQSB7RGlhZ25vc3RpY30gb2JqZWN0IHJlY2VpdmVkIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtWMk1lc3NhZ2V9IGVxdWl2YWxlbnQgdG8gdGhlIHtEaWFnbm9zdGljfSBvYmplY3Qgc3VwcGxpZWQgYnkgdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgcHVibGljIGRpYWdub3N0aWNUb1YyTWVzc2FnZShwYXRoOiBzdHJpbmcsIGRpYWdub3N0aWM6IERpYWdub3N0aWMpOiBsaW50ZXIuTWVzc2FnZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgIGZpbGU6IHBhdGgsXG4gICAgICAgIHBvc2l0aW9uOiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZShkaWFnbm9zdGljLnJhbmdlKSxcbiAgICAgIH0sXG4gICAgICBleGNlcnB0OiBkaWFnbm9zdGljLm1lc3NhZ2UsXG4gICAgICBsaW50ZXJOYW1lOiBkaWFnbm9zdGljLnNvdXJjZSxcbiAgICAgIHNldmVyaXR5OiBMaW50ZXJQdXNoVjJBZGFwdGVyLmRpYWdub3N0aWNTZXZlcml0eVRvU2V2ZXJpdHkoZGlhZ25vc3RpYy5zZXZlcml0eSB8fCAtMSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGRpYWdub3N0aWMgc2V2ZXJpdHkgbnVtYmVyIG9idGFpbmVkIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlciBpbnRvXG4gIC8vIHRoZSB0ZXh0dWFsIGVxdWl2YWxlbnQgZm9yIGEgTGludGVyIHtWMk1lc3NhZ2V9LlxuICAvL1xuICAvLyAqIGBzZXZlcml0eWAgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBzZXZlcml0eSBvZiB0aGUgZGlhZ25vc3RpYy5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHN0cmluZyBvZiAnZXJyb3InLCAnd2FybmluZycgb3IgJ2luZm8nIGRlcGVuZGluZyBvbiB0aGUgc2V2ZXJpdHkuXG4gIHB1YmxpYyBzdGF0aWMgZGlhZ25vc3RpY1NldmVyaXR5VG9TZXZlcml0eShzZXZlcml0eTogbnVtYmVyKTogJ2Vycm9yJyB8ICd3YXJuaW5nJyB8ICdpbmZvJyB7XG4gICAgc3dpdGNoIChzZXZlcml0eSkge1xuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3I6XG4gICAgICAgIHJldHVybiAnZXJyb3InO1xuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuV2FybmluZzpcbiAgICAgICAgcmV0dXJuICd3YXJuaW5nJztcbiAgICAgIGNhc2UgRGlhZ25vc3RpY1NldmVyaXR5LkluZm9ybWF0aW9uOlxuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuSGludDpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAnaW5mbyc7XG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0IHRoZSByZWNvcmRlZCBkaWFnbm9zdGljIGNvZGUgZm9yIGEgcmFuZ2UvbWVzc2FnZS5cbiAgLy8gRGlhZ25vc3RpYyBjb2RlcyBhcmUgdHJpY2t5IGJlY2F1c2UgdGhlcmUncyBubyBzdWl0YWJsZSBwbGFjZSBpbiB0aGUgTGludGVyIEFQSSBmb3IgdGhlbS5cbiAgLy8gRm9yIG5vdywgd2UnbGwgcmVjb3JkIHRoZSBvcmlnaW5hbCBjb2RlIGZvciBlYWNoIHJhbmdlL21lc3NhZ2UgY29tYmluYXRpb24gYW5kIHJldHJpZXZlIGl0XG4gIC8vIHdoZW4gbmVlZGVkIChlLmcuIGZvciBwYXNzaW5nIGJhY2sgaW50byBjb2RlIGFjdGlvbnMpXG4gIHB1YmxpYyBnZXREaWFnbm9zdGljQ29kZShlZGl0b3I6IGF0b20uVGV4dEVkaXRvciwgcmFuZ2U6IGF0b20uUmFuZ2UsIHRleHQ6IHN0cmluZyk6IERpYWdub3N0aWNDb2RlIHwgbnVsbCB7XG4gICAgY29uc3QgcGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgaWYgKHBhdGggIT0gbnVsbCkge1xuICAgICAgY29uc3QgZGlhZ25vc3RpY0NvZGVzID0gdGhpcy5fZGlhZ25vc3RpY0NvZGVzLmdldChwYXRoKTtcbiAgICAgIGlmIChkaWFnbm9zdGljQ29kZXMgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZGlhZ25vc3RpY0NvZGVzLmdldChnZXRDb2RlS2V5KHJhbmdlLCB0ZXh0KSkgfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q29kZUtleShyYW5nZTogYXRvbS5SYW5nZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIChbXSBhcyBhbnlbXSkuY29uY2F0KC4uLnJhbmdlLnNlcmlhbGl6ZSgpLCB0ZXh0KS5qb2luKCcsJyk7XG59XG4iXX0=