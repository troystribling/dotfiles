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
const Utils = require("../utils");
// Public: Adapts the language server protocol "textDocument/hover" to the
// Atom IDE UI Datatip package.
class DatatipAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a hoverProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.hoverProvider === true;
    }
    // Public: Get the Datatip for this {Point} in a {TextEditor} by querying
    // the language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the hover text/datatip.
    // * `editor` The Atom {TextEditor} containing the text the Datatip should relate to.
    // * `point` The Atom {Point} containing the point within the text the Datatip should relate to.
    //
    // Returns a {Promise} containing the {Datatip} to display or {null} if no Datatip is available.
    getDatatip(connection, editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentPositionParams = convert_1.default.editorToTextDocumentPositionParams(editor, point);
            const hover = yield connection.hover(documentPositionParams);
            if (hover == null || DatatipAdapter.isEmptyHover(hover)) {
                return null;
            }
            const range = hover.range == null ? Utils.getWordAtPosition(editor, point) : convert_1.default.lsRangeToAtomRange(hover.range);
            const markedStrings = (Array.isArray(hover.contents) ? hover.contents : [hover.contents]).map((str) => DatatipAdapter.convertMarkedString(editor, str));
            return { range, markedStrings };
        });
    }
    static isEmptyHover(hover) {
        return hover.contents == null ||
            (typeof hover.contents === 'string' && hover.contents.length === 0) ||
            (Array.isArray(hover.contents) &&
                (hover.contents.length === 0 || hover.contents[0] === ""));
    }
    static convertMarkedString(editor, markedString) {
        if (typeof markedString === 'string') {
            return { type: 'markdown', value: markedString };
        }
        if (markedString.kind) {
            return {
                type: 'markdown',
                value: markedString.value,
            };
        }
        // Must check as <{language: string}> to disambiguate between
        // string and the more explicit object type because MarkedString
        // is a union of the two types
        if (markedString.language) {
            return {
                type: 'snippet',
                // TODO: find a better mapping from language -> grammar
                grammar: atom.grammars.grammarForScopeName(`source.${markedString.language}`) || editor.getGrammar(),
                value: markedString.value,
            };
        }
        // Catch-all case
        return { type: 'markdown', value: markedString.toString() };
    }
}
exports.default = DatatipAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YXRpcC1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RhdGF0aXAtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBQ2pDLGtDQUFrQztBQWFsQywwRUFBMEU7QUFDMUUsK0JBQStCO0FBQy9CLE1BQXFCLGNBQWM7SUFDakMsZ0ZBQWdGO0lBQ2hGLHFFQUFxRTtJQUNyRSxFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQztJQUNuRCxDQUFDO0lBRUQseUVBQXlFO0lBQ3pFLHVCQUF1QjtJQUN2QixFQUFFO0lBQ0YsMEZBQTBGO0lBQzFGLDZDQUE2QztJQUM3QyxxRkFBcUY7SUFDckYsZ0dBQWdHO0lBQ2hHLEVBQUU7SUFDRixnR0FBZ0c7SUFDbkYsVUFBVSxDQUNyQixVQUFvQyxFQUNwQyxNQUFrQixFQUNsQixLQUFZOztZQUVaLE1BQU0sc0JBQXNCLEdBQUcsaUJBQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFekYsTUFBTSxLQUFLLEdBQUcsTUFBTSxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDN0QsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLGNBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxNQUFNLEtBQUssR0FDVCxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFekcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNwRyxjQUFjLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUNoRCxDQUFDO1lBRUYsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0tBQUE7SUFFTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQVk7UUFDdEMsT0FBTyxLQUFLLENBQUMsUUFBUSxJQUFJLElBQUk7WUFDM0IsQ0FBQyxPQUFPLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztZQUNuRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztnQkFDNUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFTyxNQUFNLENBQUMsbUJBQW1CLENBQ2hDLE1BQWtCLEVBQ2xCLFlBQTBDO1FBRTFDLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQztTQUNsRDtRQUVELElBQUssWUFBOEIsQ0FBQyxJQUFJLEVBQUU7WUFDeEMsT0FBTztnQkFDTCxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLO2FBQzFCLENBQUM7U0FDSDtRQUVELDZEQUE2RDtRQUM3RCxnRUFBZ0U7UUFDaEUsOEJBQThCO1FBQzlCLElBQUssWUFBcUMsQ0FBQyxRQUFRLEVBQUU7WUFDbkQsT0FBTztnQkFDTCxJQUFJLEVBQUUsU0FBUztnQkFDZix1REFBdUQ7Z0JBQ3ZELE9BQU8sRUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUMvQixVQUFXLFlBQXFDLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO2dCQUN2RixLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7YUFDMUIsQ0FBQztTQUNIO1FBRUQsaUJBQWlCO1FBQ2pCLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0NBQ0Y7QUFsRkQsaUNBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7XG4gIEhvdmVyLFxuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIE1hcmt1cENvbnRlbnQsXG4gIE1hcmtlZFN0cmluZyxcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQge1xuICBQb2ludCxcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5cbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgXCJ0ZXh0RG9jdW1lbnQvaG92ZXJcIiB0byB0aGVcbi8vIEF0b20gSURFIFVJIERhdGF0aXAgcGFja2FnZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERhdGF0aXBBZGFwdGVyIHtcbiAgLy8gUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGFkYXB0ZXIgY2FuIGJlIHVzZWQgdG8gYWRhcHQgYSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gYmFzZWQgb24gdGhlIHNlcnZlckNhcGFiaWxpdGllcyBtYXRyaXggY29udGFpbmluZyBhIGhvdmVyUHJvdmlkZXIuXG4gIC8vXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmhvdmVyUHJvdmlkZXIgPT09IHRydWU7XG4gIH1cblxuICAvLyBQdWJsaWM6IEdldCB0aGUgRGF0YXRpcCBmb3IgdGhpcyB7UG9pbnR9IGluIGEge1RleHRFZGl0b3J9IGJ5IHF1ZXJ5aW5nXG4gIC8vIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgYmUgcXVlcmllZFxuICAvLyAgICAgICAgICAgICAgICBmb3IgdGhlIGhvdmVyIHRleHQvZGF0YXRpcC5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgdGV4dCB0aGUgRGF0YXRpcCBzaG91bGQgcmVsYXRlIHRvLlxuICAvLyAqIGBwb2ludGAgVGhlIEF0b20ge1BvaW50fSBjb250YWluaW5nIHRoZSBwb2ludCB3aXRoaW4gdGhlIHRleHQgdGhlIERhdGF0aXAgc2hvdWxkIHJlbGF0ZSB0by5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIHRoZSB7RGF0YXRpcH0gdG8gZGlzcGxheSBvciB7bnVsbH0gaWYgbm8gRGF0YXRpcCBpcyBhdmFpbGFibGUuXG4gIHB1YmxpYyBhc3luYyBnZXREYXRhdGlwKFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ6IFBvaW50LFxuICApOiBQcm9taXNlPGF0b21JZGUuRGF0YXRpcCB8IG51bGw+IHtcbiAgICBjb25zdCBkb2N1bWVudFBvc2l0aW9uUGFyYW1zID0gQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKGVkaXRvciwgcG9pbnQpO1xuXG4gICAgY29uc3QgaG92ZXIgPSBhd2FpdCBjb25uZWN0aW9uLmhvdmVyKGRvY3VtZW50UG9zaXRpb25QYXJhbXMpO1xuICAgIGlmIChob3ZlciA9PSBudWxsIHx8IERhdGF0aXBBZGFwdGVyLmlzRW1wdHlIb3Zlcihob3ZlcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHJhbmdlID1cbiAgICAgIGhvdmVyLnJhbmdlID09IG51bGwgPyBVdGlscy5nZXRXb3JkQXRQb3NpdGlvbihlZGl0b3IsIHBvaW50KSA6IENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGhvdmVyLnJhbmdlKTtcblxuICAgIGNvbnN0IG1hcmtlZFN0cmluZ3MgPSAoQXJyYXkuaXNBcnJheShob3Zlci5jb250ZW50cykgPyBob3Zlci5jb250ZW50cyA6IFtob3Zlci5jb250ZW50c10pLm1hcCgoc3RyKSA9PlxuICAgICAgRGF0YXRpcEFkYXB0ZXIuY29udmVydE1hcmtlZFN0cmluZyhlZGl0b3IsIHN0ciksXG4gICAgKTtcblxuICAgIHJldHVybiB7IHJhbmdlLCBtYXJrZWRTdHJpbmdzIH07XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBpc0VtcHR5SG92ZXIoaG92ZXI6IEhvdmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGhvdmVyLmNvbnRlbnRzID09IG51bGwgfHxcbiAgICAgICh0eXBlb2YgaG92ZXIuY29udGVudHMgPT09ICdzdHJpbmcnICYmIGhvdmVyLmNvbnRlbnRzLmxlbmd0aCA9PT0gMCkgfHxcbiAgICAgIChBcnJheS5pc0FycmF5KGhvdmVyLmNvbnRlbnRzKSAmJlxuICAgICAgICAoaG92ZXIuY29udGVudHMubGVuZ3RoID09PSAwIHx8IGhvdmVyLmNvbnRlbnRzWzBdID09PSBcIlwiKSk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBjb252ZXJ0TWFya2VkU3RyaW5nKFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICBtYXJrZWRTdHJpbmc6IE1hcmtlZFN0cmluZyB8IE1hcmt1cENvbnRlbnQsXG4gICk6IGF0b21JZGUuTWFya2VkU3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIG1hcmtlZFN0cmluZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6ICdtYXJrZG93bicsIHZhbHVlOiBtYXJrZWRTdHJpbmcgfTtcbiAgICB9XG5cbiAgICBpZiAoKG1hcmtlZFN0cmluZyBhcyBNYXJrdXBDb250ZW50KS5raW5kKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnbWFya2Rvd24nLFxuICAgICAgICB2YWx1ZTogbWFya2VkU3RyaW5nLnZhbHVlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBNdXN0IGNoZWNrIGFzIDx7bGFuZ3VhZ2U6IHN0cmluZ30+IHRvIGRpc2FtYmlndWF0ZSBiZXR3ZWVuXG4gICAgLy8gc3RyaW5nIGFuZCB0aGUgbW9yZSBleHBsaWNpdCBvYmplY3QgdHlwZSBiZWNhdXNlIE1hcmtlZFN0cmluZ1xuICAgIC8vIGlzIGEgdW5pb24gb2YgdGhlIHR3byB0eXBlc1xuICAgIGlmICgobWFya2VkU3RyaW5nIGFzIHsgbGFuZ3VhZ2U6IHN0cmluZyB9KS5sYW5ndWFnZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ3NuaXBwZXQnLFxuICAgICAgICAvLyBUT0RPOiBmaW5kIGEgYmV0dGVyIG1hcHBpbmcgZnJvbSBsYW5ndWFnZSAtPiBncmFtbWFyXG4gICAgICAgIGdyYW1tYXI6XG4gICAgICAgICAgYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKFxuICAgICAgICAgICAgYHNvdXJjZS4keyhtYXJrZWRTdHJpbmcgYXMgeyBsYW5ndWFnZTogc3RyaW5nIH0pLmxhbmd1YWdlfWApIHx8IGVkaXRvci5nZXRHcmFtbWFyKCksXG4gICAgICAgIHZhbHVlOiBtYXJrZWRTdHJpbmcudmFsdWUsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENhdGNoLWFsbCBjYXNlXG4gICAgcmV0dXJuIHsgdHlwZTogJ21hcmtkb3duJywgdmFsdWU6IG1hcmtlZFN0cmluZy50b1N0cmluZygpIH07XG4gIH1cbn1cbiJdfQ==