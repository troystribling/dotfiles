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
const assert = require("assert");
const convert_1 = require("../convert");
const apply_edit_adapter_1 = require("./apply-edit-adapter");
const languageclient_1 = require("../languageclient");
class CodeActionAdapter {
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.codeActionProvider === true;
    }
    // Public: Retrieves code actions for a given editor, range, and context (diagnostics).
    // Throws an error if codeActionProvider is not a registered capability.
    //
    // * `connection` A {LanguageClientConnection} to the language server that provides highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the diagnostics.
    // * `range` The Atom {Range} to fetch code actions for.
    // * `diagnostics` An {Array<atomIde$Diagnostic>} to fetch code actions for.
    //                 This is typically a list of diagnostics intersecting `range`.
    //
    // Returns a {Promise} of an {Array} of {atomIde$CodeAction}s to display.
    static getCodeActions(connection, serverCapabilities, linterAdapter, editor, range, diagnostics) {
        return __awaiter(this, void 0, void 0, function* () {
            if (linterAdapter == null) {
                return [];
            }
            assert(serverCapabilities.codeActionProvider, 'Must have the textDocument/codeAction capability');
            const params = CodeActionAdapter.createCodeActionParams(linterAdapter, editor, range, diagnostics);
            const actions = yield connection.codeAction(params);
            return actions.map((action) => CodeActionAdapter.createCodeAction(action, connection));
        });
    }
    static createCodeAction(action, connection) {
        return {
            apply() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (languageclient_1.CodeAction.is(action)) {
                        CodeActionAdapter.applyWorkspaceEdit(action.edit);
                        yield CodeActionAdapter.executeCommand(action.command, connection);
                    }
                    else {
                        yield CodeActionAdapter.executeCommand(action, connection);
                    }
                });
            },
            getTitle() {
                return Promise.resolve(action.title);
            },
            // tslint:disable-next-line:no-empty
            dispose() { },
        };
    }
    static applyWorkspaceEdit(edit) {
        if (languageclient_1.WorkspaceEdit.is(edit)) {
            apply_edit_adapter_1.default.onApplyEdit({ edit });
        }
    }
    static executeCommand(command, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (languageclient_1.Command.is(command)) {
                yield connection.executeCommand({
                    command: command.command,
                    arguments: command.arguments,
                });
            }
        });
    }
    static createCodeActionParams(linterAdapter, editor, range, diagnostics) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            range: convert_1.default.atomRangeToLSRange(range),
            context: {
                diagnostics: diagnostics.map((diagnostic) => {
                    // Retrieve the stored diagnostic code if it exists.
                    // Until the Linter API provides a place to store the code,
                    // there's no real way for the code actions API to give it back to us.
                    const converted = convert_1.default.atomIdeDiagnosticToLSDiagnostic(diagnostic);
                    if (diagnostic.range != null && diagnostic.text != null) {
                        const code = linterAdapter.getDiagnosticCode(editor, diagnostic.range, diagnostic.text);
                        if (code != null) {
                            converted.code = code;
                        }
                    }
                    return converted;
                }),
            },
        };
    }
}
exports.default = CodeActionAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1hY3Rpb24tYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWFjdGlvbi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFDbEMsd0NBQWlDO0FBQ2pDLDZEQUFvRDtBQUNwRCxzREFPMkI7QUFNM0IsTUFBcUIsaUJBQWlCO0lBQ3BDLGdGQUFnRjtJQUNoRiw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLENBQUM7SUFDeEQsQ0FBQztJQUVELHVGQUF1RjtJQUN2Rix3RUFBd0U7SUFDeEUsRUFBRTtJQUNGLCtGQUErRjtJQUMvRiw0RkFBNEY7SUFDNUYsK0RBQStEO0lBQy9ELHdEQUF3RDtJQUN4RCw0RUFBNEU7SUFDNUUsZ0ZBQWdGO0lBQ2hGLEVBQUU7SUFDRix5RUFBeUU7SUFDbEUsTUFBTSxDQUFPLGNBQWMsQ0FDaEMsVUFBb0MsRUFDcEMsa0JBQXNDLEVBQ3RDLGFBQThDLEVBQzlDLE1BQWtCLEVBQ2xCLEtBQVksRUFDWixXQUFpQzs7WUFFakMsSUFBSSxhQUFhLElBQUksSUFBSSxFQUFFO2dCQUN6QixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixFQUFFLGtEQUFrRCxDQUFDLENBQUM7WUFFbEcsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbkcsTUFBTSxPQUFPLEdBQUcsTUFBTSxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztLQUFBO0lBRU8sTUFBTSxDQUFDLGdCQUFnQixDQUM3QixNQUE0QixFQUM1QixVQUFvQztRQUVwQyxPQUFPO1lBQ0MsS0FBSzs7b0JBQ1QsSUFBSSwyQkFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDekIsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNsRCxNQUFNLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO3FCQUNwRTt5QkFBTTt3QkFDTCxNQUFNLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7cUJBQzVEO2dCQUNILENBQUM7YUFBQTtZQUNELFFBQVE7Z0JBQ04sT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0Qsb0NBQW9DO1lBQ3BDLE9BQU8sS0FBVyxDQUFDO1NBQ3BCLENBQUM7SUFDSixDQUFDO0lBRU8sTUFBTSxDQUFDLGtCQUFrQixDQUMvQixJQUErQjtRQUUvQixJQUFJLDhCQUFhLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzFCLDRCQUFnQixDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDO0lBRU8sTUFBTSxDQUFPLGNBQWMsQ0FDakMsT0FBWSxFQUNaLFVBQW9DOztZQUVwQyxJQUFJLHdCQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN2QixNQUFNLFVBQVUsQ0FBQyxjQUFjLENBQUM7b0JBQzlCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztvQkFDeEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO2lCQUM3QixDQUFDLENBQUM7YUFDSjtRQUNILENBQUM7S0FBQTtJQUVPLE1BQU0sQ0FBQyxzQkFBc0IsQ0FDbkMsYUFBa0MsRUFDbEMsTUFBa0IsRUFDbEIsS0FBWSxFQUNaLFdBQWlDO1FBRWpDLE9BQU87WUFDTCxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUM7WUFDNUQsS0FBSyxFQUFFLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ3hDLE9BQU8sRUFBRTtnQkFDUCxXQUFXLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO29CQUMxQyxvREFBb0Q7b0JBQ3BELDJEQUEyRDtvQkFDM0Qsc0VBQXNFO29CQUN0RSxNQUFNLFNBQVMsR0FBRyxpQkFBTyxDQUFDLCtCQUErQixDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN0RSxJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFO3dCQUN2RCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN4RixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7NEJBQ2hCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO3lCQUN2QjtxQkFDRjtvQkFDRCxPQUFPLFNBQVMsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDO2FBQ0g7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBdkdELG9DQXVHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IExpbnRlclB1c2hWMkFkYXB0ZXIgZnJvbSAnLi9saW50ZXItcHVzaC12Mi1hZGFwdGVyJztcbmltcG9ydCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IEFwcGx5RWRpdEFkYXB0ZXIgZnJvbSAnLi9hcHBseS1lZGl0LWFkYXB0ZXInO1xuaW1wb3J0IHtcbiAgQ29kZUFjdGlvbixcbiAgQ29kZUFjdGlvblBhcmFtcyxcbiAgQ29tbWFuZCxcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG4gIFdvcmtzcGFjZUVkaXQsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFJhbmdlLFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29kZUFjdGlvbkFkYXB0ZXIge1xuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgdGhpcyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmNvZGVBY3Rpb25Qcm92aWRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmV0cmlldmVzIGNvZGUgYWN0aW9ucyBmb3IgYSBnaXZlbiBlZGl0b3IsIHJhbmdlLCBhbmQgY29udGV4dCAoZGlhZ25vc3RpY3MpLlxuICAvLyBUaHJvd3MgYW4gZXJyb3IgaWYgY29kZUFjdGlvblByb3ZpZGVyIGlzIG5vdCBhIHJlZ2lzdGVyZWQgY2FwYWJpbGl0eS5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgcHJvdmlkZXMgaGlnaGxpZ2h0cy5cbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgYmUgdXNlZC5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZGlhZ25vc3RpY3MuXG4gIC8vICogYHJhbmdlYCBUaGUgQXRvbSB7UmFuZ2V9IHRvIGZldGNoIGNvZGUgYWN0aW9ucyBmb3IuXG4gIC8vICogYGRpYWdub3N0aWNzYCBBbiB7QXJyYXk8YXRvbUlkZSREaWFnbm9zdGljPn0gdG8gZmV0Y2ggY29kZSBhY3Rpb25zIGZvci5cbiAgLy8gICAgICAgICAgICAgICAgIFRoaXMgaXMgdHlwaWNhbGx5IGEgbGlzdCBvZiBkaWFnbm9zdGljcyBpbnRlcnNlY3RpbmcgYHJhbmdlYC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBvZiBhbiB7QXJyYXl9IG9mIHthdG9tSWRlJENvZGVBY3Rpb259cyB0byBkaXNwbGF5LlxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGdldENvZGVBY3Rpb25zKFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyxcbiAgICBsaW50ZXJBZGFwdGVyOiBMaW50ZXJQdXNoVjJBZGFwdGVyIHwgdW5kZWZpbmVkLFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICByYW5nZTogUmFuZ2UsXG4gICAgZGlhZ25vc3RpY3M6IGF0b21JZGUuRGlhZ25vc3RpY1tdLFxuICApOiBQcm9taXNlPGF0b21JZGUuQ29kZUFjdGlvbltdPiB7XG4gICAgaWYgKGxpbnRlckFkYXB0ZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBhc3NlcnQoc2VydmVyQ2FwYWJpbGl0aWVzLmNvZGVBY3Rpb25Qcm92aWRlciwgJ011c3QgaGF2ZSB0aGUgdGV4dERvY3VtZW50L2NvZGVBY3Rpb24gY2FwYWJpbGl0eScpO1xuXG4gICAgY29uc3QgcGFyYW1zID0gQ29kZUFjdGlvbkFkYXB0ZXIuY3JlYXRlQ29kZUFjdGlvblBhcmFtcyhsaW50ZXJBZGFwdGVyLCBlZGl0b3IsIHJhbmdlLCBkaWFnbm9zdGljcyk7XG4gICAgY29uc3QgYWN0aW9ucyA9IGF3YWl0IGNvbm5lY3Rpb24uY29kZUFjdGlvbihwYXJhbXMpO1xuICAgIHJldHVybiBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiBDb2RlQWN0aW9uQWRhcHRlci5jcmVhdGVDb2RlQWN0aW9uKGFjdGlvbiwgY29ubmVjdGlvbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlQ29kZUFjdGlvbihcbiAgICBhY3Rpb246IENvbW1hbmQgfCBDb2RlQWN0aW9uLFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgKTogYXRvbUlkZS5Db2RlQWN0aW9uIHtcbiAgICByZXR1cm4ge1xuICAgICAgYXN5bmMgYXBwbHkoKSB7XG4gICAgICAgIGlmIChDb2RlQWN0aW9uLmlzKGFjdGlvbikpIHtcbiAgICAgICAgICBDb2RlQWN0aW9uQWRhcHRlci5hcHBseVdvcmtzcGFjZUVkaXQoYWN0aW9uLmVkaXQpO1xuICAgICAgICAgIGF3YWl0IENvZGVBY3Rpb25BZGFwdGVyLmV4ZWN1dGVDb21tYW5kKGFjdGlvbi5jb21tYW5kLCBjb25uZWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCBDb2RlQWN0aW9uQWRhcHRlci5leGVjdXRlQ29tbWFuZChhY3Rpb24sIGNvbm5lY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZ2V0VGl0bGUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY3Rpb24udGl0bGUpO1xuICAgICAgfSxcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1lbXB0eVxuICAgICAgZGlzcG9zZSgpOiB2b2lkIHsgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgYXBwbHlXb3Jrc3BhY2VFZGl0KFxuICAgIGVkaXQ6IFdvcmtzcGFjZUVkaXQgfCB1bmRlZmluZWQsXG4gICk6IHZvaWQge1xuICAgIGlmIChXb3Jrc3BhY2VFZGl0LmlzKGVkaXQpKSB7XG4gICAgICBBcHBseUVkaXRBZGFwdGVyLm9uQXBwbHlFZGl0KHsgZWRpdCB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBhc3luYyBleGVjdXRlQ29tbWFuZChcbiAgICBjb21tYW5kOiBhbnksXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoQ29tbWFuZC5pcyhjb21tYW5kKSkge1xuICAgICAgYXdhaXQgY29ubmVjdGlvbi5leGVjdXRlQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6IGNvbW1hbmQuY29tbWFuZCxcbiAgICAgICAgYXJndW1lbnRzOiBjb21tYW5kLmFyZ3VtZW50cyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGNyZWF0ZUNvZGVBY3Rpb25QYXJhbXMoXG4gICAgbGludGVyQWRhcHRlcjogTGludGVyUHVzaFYyQWRhcHRlcixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcmFuZ2U6IFJhbmdlLFxuICAgIGRpYWdub3N0aWNzOiBhdG9tSWRlLkRpYWdub3N0aWNbXSxcbiAgKTogQ29kZUFjdGlvblBhcmFtcyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yKSxcbiAgICAgIHJhbmdlOiBDb252ZXJ0LmF0b21SYW5nZVRvTFNSYW5nZShyYW5nZSksXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIGRpYWdub3N0aWNzOiBkaWFnbm9zdGljcy5tYXAoKGRpYWdub3N0aWMpID0+IHtcbiAgICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgc3RvcmVkIGRpYWdub3N0aWMgY29kZSBpZiBpdCBleGlzdHMuXG4gICAgICAgICAgLy8gVW50aWwgdGhlIExpbnRlciBBUEkgcHJvdmlkZXMgYSBwbGFjZSB0byBzdG9yZSB0aGUgY29kZSxcbiAgICAgICAgICAvLyB0aGVyZSdzIG5vIHJlYWwgd2F5IGZvciB0aGUgY29kZSBhY3Rpb25zIEFQSSB0byBnaXZlIGl0IGJhY2sgdG8gdXMuXG4gICAgICAgICAgY29uc3QgY29udmVydGVkID0gQ29udmVydC5hdG9tSWRlRGlhZ25vc3RpY1RvTFNEaWFnbm9zdGljKGRpYWdub3N0aWMpO1xuICAgICAgICAgIGlmIChkaWFnbm9zdGljLnJhbmdlICE9IG51bGwgJiYgZGlhZ25vc3RpYy50ZXh0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBsaW50ZXJBZGFwdGVyLmdldERpYWdub3N0aWNDb2RlKGVkaXRvciwgZGlhZ25vc3RpYy5yYW5nZSwgZGlhZ25vc3RpYy50ZXh0KTtcbiAgICAgICAgICAgIGlmIChjb2RlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY29udmVydGVkLmNvZGUgPSBjb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY29udmVydGVkO1xuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuIl19