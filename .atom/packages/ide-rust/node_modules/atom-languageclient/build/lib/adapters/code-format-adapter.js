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
// Public: Adapts the language server protocol "textDocument/completion" to the
// Atom IDE UI Code-format package.
class CodeFormatAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing either a documentFormattingProvider
    // or a documentRangeFormattingProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return (serverCapabilities.documentRangeFormattingProvider === true ||
            serverCapabilities.documentFormattingProvider === true);
    }
    // Public: Format text in the editor using the given language server connection and an optional range.
    // If the server does not support range formatting then range will be ignored and the entire document formatted.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the text that will be formatted.
    // * `range` The optional Atom {Range} containing the subset of the text to be formatted.
    //
    // Returns a {Promise} of an {Array} of {Object}s containing the AutoComplete+
    // suggestions to display.
    static format(connection, serverCapabilities, editor, range) {
        if (serverCapabilities.documentRangeFormattingProvider) {
            return CodeFormatAdapter.formatRange(connection, editor, range);
        }
        if (serverCapabilities.documentFormattingProvider) {
            return CodeFormatAdapter.formatDocument(connection, editor);
        }
        throw new Error('Can not format document, language server does not support it');
    }
    // Public: Format the entire document of an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatDocument(connection, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentFormatting(CodeFormatAdapter.createDocumentFormattingParams(editor));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns {DocumentFormattingParams} containing the identity of the text document as well as
    // options to be used in formatting the document such as tab size and tabs vs spaces.
    static createDocumentFormattingParams(editor) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Format a range within an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `range` The Atom {Range} containing the range of text that should be formatted.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatRange(connection, editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentRangeFormatting(CodeFormatAdapter.createDocumentRangeFormattingParams(editor, range));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentRangeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `range` The Atom {Range} containing the range of text that should be formatted.
    //
    // Returns {DocumentRangeFormattingParams} containing the identity of the text document, the
    // range of the text to be formatted as well as the options to be used in formatting the
    // document such as tab size and tabs vs spaces.
    static createDocumentRangeFormattingParams(editor, range) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            range: convert_1.default.atomRangeToLSRange(range),
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Format on type within an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `point` The {Point} at which the document to be formatted.
    // * `character` A character that triggered formatting request.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatOnType(connection, editor, point, character) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentOnTypeFormatting(CodeFormatAdapter.createDocumentOnTypeFormattingParams(editor, point, character));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentOnTypeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `point` The {Point} at which the document to be formatted.
    // * `character` A character that triggered formatting request.
    //
    // Returns {DocumentOnTypeFormattingParams} containing the identity of the text document, the
    // position of the text to be formatted, the character that triggered formatting request
    // as well as the options to be used in formatting the document such as tab size and tabs vs spaces.
    static createDocumentOnTypeFormattingParams(editor, point, character) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            position: convert_1.default.pointToPosition(point),
            ch: character,
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Create {DocumentRangeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `range` The Atom {Range} containing the range of document that should be formatted.
    //
    // Returns the {FormattingOptions} to be used containing the keys:
    //  * `tabSize` The number of spaces a tab represents.
    //  * `insertSpaces` {True} if spaces should be used, {False} for tab characters.
    static getFormatOptions(editor) {
        return {
            tabSize: editor.getTabLength(),
            insertSpaces: editor.getSoftTabs(),
        };
    }
}
exports.default = CodeFormatAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWZvcm1hdC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQSx3Q0FBaUM7QUFlakMsK0VBQStFO0FBQy9FLG1DQUFtQztBQUNuQyxNQUFxQixpQkFBaUI7SUFDcEMsZ0ZBQWdGO0lBQ2hGLHdGQUF3RjtJQUN4Rix3Q0FBd0M7SUFDeEMsRUFBRTtJQUNGLHNGQUFzRjtJQUN0RixFQUFFO0lBQ0YsZ0ZBQWdGO0lBQ2hGLDRCQUE0QjtJQUNyQixNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLENBQ0wsa0JBQWtCLENBQUMsK0JBQStCLEtBQUssSUFBSTtZQUMzRCxrQkFBa0IsQ0FBQywwQkFBMEIsS0FBSyxJQUFJLENBQ3ZELENBQUM7SUFDSixDQUFDO0lBRUQsc0dBQXNHO0lBQ3RHLGdIQUFnSDtJQUNoSCxFQUFFO0lBQ0YsZ0dBQWdHO0lBQ2hHLDRGQUE0RjtJQUM1RiwrRUFBK0U7SUFDL0UseUZBQXlGO0lBQ3pGLEVBQUU7SUFDRiw4RUFBOEU7SUFDOUUsMEJBQTBCO0lBQ25CLE1BQU0sQ0FBQyxNQUFNLENBQ2xCLFVBQW9DLEVBQ3BDLGtCQUFzQyxFQUN0QyxNQUFrQixFQUNsQixLQUFZO1FBRVosSUFBSSxrQkFBa0IsQ0FBQywrQkFBK0IsRUFBRTtZQUN0RCxPQUFPLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2pFO1FBRUQsSUFBSSxrQkFBa0IsQ0FBQywwQkFBMEIsRUFBRTtZQUNqRCxPQUFPLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDN0Q7UUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELCtG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Q0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQ3hDLEVBQUUsRUFBRSxTQUFTO1lBQ2IsT0FBTyxFQUFFLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztTQUNwRCxDQUFDO0lBQ0osQ0FBQztJQUVELHNHQUFzRztJQUN0RyxnQ0FBZ0M7SUFDaEMsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSx3RkFBd0Y7SUFDeEYsRUFBRTtJQUNGLGtFQUFrRTtJQUNsRSxzREFBc0Q7SUFDdEQsaUZBQWlGO0lBQzFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFrQjtRQUMvQyxPQUFPO1lBQ0wsT0FBTyxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUU7WUFDOUIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUU7U0FDbkMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTFLRCxvQ0EwS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdG9tSWRlIGZyb20gJ2F0b20taWRlJztcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IHtcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBEb2N1bWVudEZvcm1hdHRpbmdQYXJhbXMsXG4gIERvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zLFxuICBEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXMsXG4gIEZvcm1hdHRpbmdPcHRpb25zLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFRleHRFZGl0b3IsXG4gIFJhbmdlLFxuICBQb2ludCxcbn0gZnJvbSAnYXRvbSc7XG5cbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgXCJ0ZXh0RG9jdW1lbnQvY29tcGxldGlvblwiIHRvIHRoZVxuLy8gQXRvbSBJREUgVUkgQ29kZS1mb3JtYXQgcGFja2FnZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvZGVGb3JtYXRBZGFwdGVyIHtcbiAgLy8gUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGFkYXB0ZXIgY2FuIGJlIHVzZWQgdG8gYWRhcHQgYSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gYmFzZWQgb24gdGhlIHNlcnZlckNhcGFiaWxpdGllcyBtYXRyaXggY29udGFpbmluZyBlaXRoZXIgYSBkb2N1bWVudEZvcm1hdHRpbmdQcm92aWRlclxuICAvLyBvciBhIGRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIuXG4gIC8vXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB0aGlzIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQcm92aWRlciA9PT0gdHJ1ZSB8fFxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyID09PSB0cnVlXG4gICAgKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogRm9ybWF0IHRleHQgaW4gdGhlIGVkaXRvciB1c2luZyB0aGUgZ2l2ZW4gbGFuZ3VhZ2Ugc2VydmVyIGNvbm5lY3Rpb24gYW5kIGFuIG9wdGlvbmFsIHJhbmdlLlxuICAvLyBJZiB0aGUgc2VydmVyIGRvZXMgbm90IHN1cHBvcnQgcmFuZ2UgZm9ybWF0dGluZyB0aGVuIHJhbmdlIHdpbGwgYmUgaWdub3JlZCBhbmQgdGhlIGVudGlyZSBkb2N1bWVudCBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgZm9ybWF0IHRoZSB0ZXh0LlxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSB1c2VkLlxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSB0ZXh0IHRoYXQgd2lsbCBiZSBmb3JtYXR0ZWQuXG4gIC8vICogYHJhbmdlYCBUaGUgb3B0aW9uYWwgQXRvbSB7UmFuZ2V9IGNvbnRhaW5pbmcgdGhlIHN1YnNldCBvZiB0aGUgdGV4dCB0byBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7T2JqZWN0fXMgY29udGFpbmluZyB0aGUgQXV0b0NvbXBsZXRlK1xuICAvLyBzdWdnZXN0aW9ucyB0byBkaXNwbGF5LlxuICBwdWJsaWMgc3RhdGljIGZvcm1hdChcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHJhbmdlOiBSYW5nZSxcbiAgKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIpIHtcbiAgICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXRSYW5nZShjb25uZWN0aW9uLCBlZGl0b3IsIHJhbmdlKTtcbiAgICB9XG5cbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gQ29kZUZvcm1hdEFkYXB0ZXIuZm9ybWF0RG9jdW1lbnQoY29ubmVjdGlvbiwgZWRpdG9yKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgZm9ybWF0IGRvY3VtZW50LCBsYW5ndWFnZSBzZXJ2ZXIgZG9lcyBub3Qgc3VwcG9ydCBpdCcpO1xuICB9XG5cbiAgLy8gUHVibGljOiBGb3JtYXQgdGhlIGVudGlyZSBkb2N1bWVudCBvZiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBvZiBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdH0gb2JqZWN0cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBBdG9tIFRleHRFZGl0b3JcbiAgLy8gdG8gZm9ybWF0IHRoZSBkb2N1bWVudC5cbiAgcHVibGljIHN0YXRpYyBhc3luYyBmb3JtYXREb2N1bWVudChcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICApOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xuICAgIGNvbnN0IGVkaXRzID0gYXdhaXQgY29ubmVjdGlvbi5kb2N1bWVudEZvcm1hdHRpbmcoQ29kZUZvcm1hdEFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zKGVkaXRvcikpO1xuICAgIHJldHVybiBDb252ZXJ0LmNvbnZlcnRMc1RleHRFZGl0cyhlZGl0cyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSB7RG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zfSB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgd2hlbiByZXF1ZXN0aW5nIGFuXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyB7RG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zfSBjb250YWluaW5nIHRoZSBpZGVudGl0eSBvZiB0aGUgdGV4dCBkb2N1bWVudCBhcyB3ZWxsIGFzXG4gIC8vIG9wdGlvbnMgdG8gYmUgdXNlZCBpbiBmb3JtYXR0aW5nIHRoZSBkb2N1bWVudCBzdWNoIGFzIHRhYiBzaXplIGFuZCB0YWJzIHZzIHNwYWNlcy5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVEb2N1bWVudEZvcm1hdHRpbmdQYXJhbXMoZWRpdG9yOiBUZXh0RWRpdG9yKTogRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dERvY3VtZW50OiBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50SWRlbnRpZmllcihlZGl0b3IpLFxuICAgICAgb3B0aW9uczogQ29kZUZvcm1hdEFkYXB0ZXIuZ2V0Rm9ybWF0T3B0aW9ucyhlZGl0b3IpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IEZvcm1hdCBhIHJhbmdlIHdpdGhpbiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXG4gIC8vICogYHJhbmdlYCBUaGUgQXRvbSB7UmFuZ2V9IGNvbnRhaW5pbmcgdGhlIHJhbmdlIG9mIHRleHQgdGhhdCBzaG91bGQgYmUgZm9ybWF0dGVkLlxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9IG9iamVjdHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0byB0aGUgQXRvbSBUZXh0RWRpdG9yXG4gIC8vIHRvIGZvcm1hdCB0aGUgZG9jdW1lbnQuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgZm9ybWF0UmFuZ2UoXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICByYW5nZTogUmFuZ2UsXG4gICk6IFByb21pc2U8YXRvbUlkZS5UZXh0RWRpdFtdPiB7XG4gICAgY29uc3QgZWRpdHMgPSBhd2FpdCBjb25uZWN0aW9uLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nKFxuICAgICAgQ29kZUZvcm1hdEFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXMoZWRpdG9yLCByYW5nZSksXG4gICAgKTtcbiAgICByZXR1cm4gQ29udmVydC5jb252ZXJ0THNUZXh0RWRpdHMoZWRpdHMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUge0RvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zfSB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgd2hlbiByZXF1ZXN0aW5nIGFuXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy8gKiBgcmFuZ2VgIFRoZSBBdG9tIHtSYW5nZX0gY29udGFpbmluZyB0aGUgcmFuZ2Ugb2YgdGV4dCB0aGF0IHNob3VsZCBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMge0RvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zfSBjb250YWluaW5nIHRoZSBpZGVudGl0eSBvZiB0aGUgdGV4dCBkb2N1bWVudCwgdGhlXG4gIC8vIHJhbmdlIG9mIHRoZSB0ZXh0IHRvIGJlIGZvcm1hdHRlZCBhcyB3ZWxsIGFzIHRoZSBvcHRpb25zIHRvIGJlIHVzZWQgaW4gZm9ybWF0dGluZyB0aGVcbiAgLy8gZG9jdW1lbnQgc3VjaCBhcyB0YWIgc2l6ZSBhbmQgdGFicyB2cyBzcGFjZXMuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXMoXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHJhbmdlOiBSYW5nZSxcbiAgKTogRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UocmFuZ2UpLFxuICAgICAgb3B0aW9uczogQ29kZUZvcm1hdEFkYXB0ZXIuZ2V0Rm9ybWF0T3B0aW9ucyhlZGl0b3IpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IEZvcm1hdCBvbiB0eXBlIHdpdGhpbiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy8gKiBgcG9pbnRgIFRoZSB7UG9pbnR9IGF0IHdoaWNoIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXG4gIC8vICogYGNoYXJhY3RlcmAgQSBjaGFyYWN0ZXIgdGhhdCB0cmlnZ2VyZWQgZm9ybWF0dGluZyByZXF1ZXN0LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHtBcnJheX0gb2Yge1RleHRFZGl0fSBvYmplY3RzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG8gdGhlIEF0b20gVGV4dEVkaXRvclxuICAvLyB0byBmb3JtYXQgdGhlIGRvY3VtZW50LlxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGZvcm1hdE9uVHlwZShcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHBvaW50OiBQb2ludCxcbiAgICBjaGFyYWN0ZXI6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcbiAgICBjb25zdCBlZGl0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nKFxuICAgICAgQ29kZUZvcm1hdEFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUGFyYW1zKGVkaXRvciwgcG9pbnQsIGNoYXJhY3RlciksXG4gICAgKTtcbiAgICByZXR1cm4gQ29udmVydC5jb252ZXJ0THNUZXh0RWRpdHMoZWRpdHMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUge0RvY3VtZW50T25UeXBlRm9ybWF0dGluZ1BhcmFtc30gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHdoZW4gcmVxdWVzdGluZyBhblxuICAvLyBlbnRpcmUgZG9jdW1lbnQgaXMgZm9ybWF0dGVkLlxuICAvL1xuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXG4gIC8vICogYHBvaW50YCBUaGUge1BvaW50fSBhdCB3aGljaCB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkLlxuICAvLyAqIGBjaGFyYWN0ZXJgIEEgY2hhcmFjdGVyIHRoYXQgdHJpZ2dlcmVkIGZvcm1hdHRpbmcgcmVxdWVzdC5cbiAgLy9cbiAgLy8gUmV0dXJucyB7RG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUGFyYW1zfSBjb250YWluaW5nIHRoZSBpZGVudGl0eSBvZiB0aGUgdGV4dCBkb2N1bWVudCwgdGhlXG4gIC8vIHBvc2l0aW9uIG9mIHRoZSB0ZXh0IHRvIGJlIGZvcm1hdHRlZCwgdGhlIGNoYXJhY3RlciB0aGF0IHRyaWdnZXJlZCBmb3JtYXR0aW5nIHJlcXVlc3RcbiAgLy8gYXMgd2VsbCBhcyB0aGUgb3B0aW9ucyB0byBiZSB1c2VkIGluIGZvcm1hdHRpbmcgdGhlIGRvY3VtZW50IHN1Y2ggYXMgdGFiIHNpemUgYW5kIHRhYnMgdnMgc3BhY2VzLlxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZURvY3VtZW50T25UeXBlRm9ybWF0dGluZ1BhcmFtcyhcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ6IFBvaW50LFxuICAgIGNoYXJhY3Rlcjogc3RyaW5nLFxuICApOiBEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXG4gICAgICBwb3NpdGlvbjogQ29udmVydC5wb2ludFRvUG9zaXRpb24ocG9pbnQpLFxuICAgICAgY2g6IGNoYXJhY3RlcixcbiAgICAgIG9wdGlvbnM6IENvZGVGb3JtYXRBZGFwdGVyLmdldEZvcm1hdE9wdGlvbnMoZWRpdG9yKSxcbiAgICB9O1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUge0RvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zfSB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgd2hlbiByZXF1ZXN0aW5nIGFuXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy8gKiBgcmFuZ2VgIFRoZSBBdG9tIHtSYW5nZX0gY29udGFpbmluZyB0aGUgcmFuZ2Ugb2YgZG9jdW1lbnQgdGhhdCBzaG91bGQgYmUgZm9ybWF0dGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIHRoZSB7Rm9ybWF0dGluZ09wdGlvbnN9IHRvIGJlIHVzZWQgY29udGFpbmluZyB0aGUga2V5czpcbiAgLy8gICogYHRhYlNpemVgIFRoZSBudW1iZXIgb2Ygc3BhY2VzIGEgdGFiIHJlcHJlc2VudHMuXG4gIC8vICAqIGBpbnNlcnRTcGFjZXNgIHtUcnVlfSBpZiBzcGFjZXMgc2hvdWxkIGJlIHVzZWQsIHtGYWxzZX0gZm9yIHRhYiBjaGFyYWN0ZXJzLlxuICBwdWJsaWMgc3RhdGljIGdldEZvcm1hdE9wdGlvbnMoZWRpdG9yOiBUZXh0RWRpdG9yKTogRm9ybWF0dGluZ09wdGlvbnMge1xuICAgIHJldHVybiB7XG4gICAgICB0YWJTaXplOiBlZGl0b3IuZ2V0VGFiTGVuZ3RoKCksXG4gICAgICBpbnNlcnRTcGFjZXM6IGVkaXRvci5nZXRTb2Z0VGFicygpLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==