"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ls = require("./languageclient");
const URL = require("url");
const atom_1 = require("atom");
// Public: Class that contains a number of helper methods for general conversions
// between the language server protocol and Atom/Atom packages.
class Convert {
    // Public: Convert a path to a Uri.
    //
    // * `filePath` A file path to convert to a Uri.
    //
    // Returns the Uri corresponding to the path. e.g. file:///a/b/c.txt
    static pathToUri(filePath) {
        let newPath = filePath.replace(/\\/g, '/');
        if (newPath[0] !== '/') {
            newPath = `/${newPath}`;
        }
        return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
    }
    // Public: Convert a Uri to a path.
    //
    // * `uri` A Uri to convert to a file path.
    //
    // Returns a file path corresponding to the Uri. e.g. /a/b/c.txt
    // If the Uri does not begin file: then it is returned as-is to allow Atom
    // to deal with http/https sources in the future.
    static uriToPath(uri) {
        const url = URL.parse(uri);
        if (url.protocol !== 'file:' || url.path === undefined) {
            return uri;
        }
        let filePath = decodeURIComponent(url.path);
        if (process.platform === 'win32') {
            // Deal with Windows drive names
            if (filePath[0] === '/') {
                filePath = filePath.substr(1);
            }
            return filePath.replace(/\//g, '\\');
        }
        return filePath;
    }
    // Public: Convert an Atom {Point} to a language server {Position}.
    //
    // * `point` An Atom {Point} to convert from.
    //
    // Returns the {Position} representation of the Atom {PointObject}.
    static pointToPosition(point) {
        return { line: point.row, character: point.column };
    }
    // Public: Convert a language server {Position} into an Atom {PointObject}.
    //
    // * 'position' A language server {Position} to convert from.
    //
    // Returns the Atom {PointObject} representation of the given {Position}.
    static positionToPoint(position) {
        return new atom_1.Point(position.line, position.character);
    }
    // Public: Convert a language server {Range} into an Atom {Range}.
    //
    // * 'range' A language server {Range} to convert from.
    //
    // Returns the Atom {Range} representation of the given language server {Range}.
    static lsRangeToAtomRange(range) {
        return new atom_1.Range(Convert.positionToPoint(range.start), Convert.positionToPoint(range.end));
    }
    // Public: Convert an Atom {Range} into an language server {Range}.
    //
    // * 'range' An Atom {Range} to convert from.
    //
    // Returns the language server {Range} representation of the given Atom {Range}.
    static atomRangeToLSRange(range) {
        return {
            start: Convert.pointToPosition(range.start),
            end: Convert.pointToPosition(range.end),
        };
    }
    // Public: Create a {TextDocumentIdentifier} from an Atom {TextEditor}.
    //
    // * `editor` A {TextEditor} that will be used to form the uri property.
    //
    // Returns a {TextDocumentIdentifier} that has a `uri` property with the Uri for the
    // given editor's path.
    static editorToTextDocumentIdentifier(editor) {
        return { uri: Convert.pathToUri(editor.getPath() || '') };
    }
    // Public: Create a {TextDocumentPositionParams} from a {TextEditor} and optional {Point}.
    //
    // * `editor` A {TextEditor} that will be used to form the uri property.
    // * `point`  An optional {Point} that will supply the position property. If not specified
    //            the current cursor position will be used.
    //
    // Returns a {TextDocumentPositionParams} that has textDocument property with the editors {TextDocumentIdentifier}
    // and a position property with the supplied point (or current cursor position when not specified).
    static editorToTextDocumentPositionParams(editor, point) {
        return {
            textDocument: Convert.editorToTextDocumentIdentifier(editor),
            position: Convert.pointToPosition(point != null ? point : editor.getCursorBufferPosition()),
        };
    }
    // Public: Create a string of scopes for the atom text editor using the data-grammar selector from an
    // {Array} of grammarScope strings.
    //
    // * `grammarScopes` An {Array} of grammar scope string to convert from.
    //
    // Returns a single comma-separated list of CSS selectors targetting the grammars of Atom text editors.
    // e.g. `['c', 'cpp']` => `'atom-text-editor[data-grammar='c'], atom-text-editor[data-grammar='cpp']`
    static grammarScopesToTextEditorScopes(grammarScopes) {
        return grammarScopes
            .map((g) => `atom-text-editor[data-grammar="${Convert.encodeHTMLAttribute(g.replace(/\./g, ' '))}"]`)
            .join(', ');
    }
    // Public: Encode a string so that it can be safely used within a HTML attribute - i.e. replacing all quoted
    // values with their HTML entity encoded versions.  e.g. `Hello"` becomes `Hello&quot;`
    //
    // * 's' A string to be encoded.
    //
    // Returns a string that is HTML attribute encoded by replacing &, <, >, " and ' with their HTML entity
    // named equivalents.
    static encodeHTMLAttribute(s) {
        const attributeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;',
        };
        return s.replace(/[&<>'"]/g, (c) => attributeMap[c]);
    }
    // Public: Convert an Atom File Event as received from atom.project.onDidChangeFiles and convert
    // it into an Array of Language Server Protocol {FileEvent} objects. Normally this will be a 1-to-1
    // but renames will be represented by a deletion and a subsequent creation as LSP does not know about
    // renames.
    //
    // * 'fileEvent' An {atom$ProjectFileEvent} to be converted.
    //
    // Returns an array of LSP {ls.FileEvent} objects that equivalent conversions to the fileEvent parameter.
    static atomFileEventToLSFileEvents(fileEvent) {
        switch (fileEvent.action) {
            case 'created':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Created }];
            case 'modified':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Changed }];
            case 'deleted':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Deleted }];
            case 'renamed': {
                const results = [];
                if (fileEvent.oldPath) {
                    results.push({ uri: Convert.pathToUri(fileEvent.oldPath), type: ls.FileChangeType.Deleted });
                }
                if (fileEvent.path) {
                    results.push({ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Created });
                }
                return results;
            }
            default:
                return [];
        }
    }
    static atomIdeDiagnosticToLSDiagnostic(diagnostic) {
        return {
            range: Convert.atomRangeToLSRange(diagnostic.range),
            severity: Convert.diagnosticTypeToLSSeverity(diagnostic.type),
            source: diagnostic.providerName,
            message: diagnostic.text || '',
        };
    }
    static diagnosticTypeToLSSeverity(type) {
        switch (type) {
            case 'Error':
                return ls.DiagnosticSeverity.Error;
            case 'Warning':
                return ls.DiagnosticSeverity.Warning;
            case 'Info':
                return ls.DiagnosticSeverity.Information;
            default:
                throw Error(`Unexpected diagnostic type ${type}`);
        }
    }
    // Public: Convert an array of language server protocol {TextEdit} objects to an
    // equivalent array of Atom {TextEdit} objects.
    //
    // * `textEdits` The language server protocol {TextEdit} objects to convert.
    //
    // Returns an {Array} of Atom {TextEdit} objects.
    static convertLsTextEdits(textEdits) {
        return (textEdits || []).map(Convert.convertLsTextEdit);
    }
    // Public: Convert a language server protocol {TextEdit} object to the
    // Atom equivalent {TextEdit}.
    //
    // * `textEdits` The language server protocol {TextEdit} objects to convert.
    //
    // Returns an Atom {TextEdit} object.
    static convertLsTextEdit(textEdit) {
        return {
            oldRange: Convert.lsRangeToAtomRange(textEdit.range),
            newText: textEdit.newText,
        };
    }
}
exports.default = Convert;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb252ZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsdUNBQXVDO0FBQ3ZDLDJCQUEyQjtBQUMzQiwrQkFLYztBQU9kLGlGQUFpRjtBQUNqRiwrREFBK0Q7QUFDL0QsTUFBcUIsT0FBTztJQUMxQixtQ0FBbUM7SUFDbkMsRUFBRTtJQUNGLGdEQUFnRDtJQUNoRCxFQUFFO0lBQ0Ysb0VBQW9FO0lBQzdELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBZ0I7UUFDdEMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0MsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ3RCLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxTQUFTLENBQUMsVUFBVSxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLEVBQUU7SUFDRiwyQ0FBMkM7SUFDM0MsRUFBRTtJQUNGLGdFQUFnRTtJQUNoRSwwRUFBMEU7SUFDMUUsaURBQWlEO0lBQzFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBVztRQUNqQyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDdEQsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELElBQUksUUFBUSxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO1lBQ2hDLGdD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TyxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ3JDLEtBQUssU0FBUztnQkFDWixPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDdkMsS0FBSyxNQUFNO2dCQUNULE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQztZQUMzQztnQkFDRSxNQUFNLEtBQUssQ0FBQyw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7SUFFRCxnRkFBZ0Y7SUFDaEYsK0NBQStDO0lBQy9DLEVBQUU7SUFDRiw0RUFBNEU7SUFDNUUsRUFBRTtJQUNGLGlEQUFpRDtJQUMxQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsU0FBK0I7UUFDOUQsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELHNFQUFzRTtJQUN0RSw4QkFBOEI7SUFDOUIsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSxFQUFFO0lBQ0YscUNBQXFDO0lBQzlCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFxQjtRQUNuRCxPQUFPO1lBQ0wsUUFBUSxFQUFFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3BELE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztTQUMxQixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbk5ELDBCQW1OQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQgKiBhcyBVUkwgZnJvbSAndXJsJztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBGaWxlc3lzdGVtQ2hhbmdlLFxuICBSYW5nZSxcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5pbXBvcnQge1xuICBEaWFnbm9zdGljLFxuICBEaWFnbm9zdGljVHlwZSxcbiAgVGV4dEVkaXQsXG59IGZyb20gJ2F0b20taWRlJztcblxuLy8gUHVibGljOiBDbGFzcyB0aGF0IGNvbnRhaW5zIGEgbnVtYmVyIG9mIGhlbHBlciBtZXRob2RzIGZvciBnZW5lcmFsIGNvbnZlcnNpb25zXG4vLyBiZXR3ZWVuIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgYW5kIEF0b20vQXRvbSBwYWNrYWdlcy5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnZlcnQge1xuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBwYXRoIHRvIGEgVXJpLlxuICAvL1xuICAvLyAqIGBmaWxlUGF0aGAgQSBmaWxlIHBhdGggdG8gY29udmVydCB0byBhIFVyaS5cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUgVXJpIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHBhdGguIGUuZy4gZmlsZTovLy9hL2IvYy50eHRcbiAgcHVibGljIHN0YXRpYyBwYXRoVG9VcmkoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IG5ld1BhdGggPSBmaWxlUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgaWYgKG5ld1BhdGhbMF0gIT09ICcvJykge1xuICAgICAgbmV3UGF0aCA9IGAvJHtuZXdQYXRofWA7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVVUkkoYGZpbGU6Ly8ke25ld1BhdGh9YCkucmVwbGFjZSgvWz8jXS9nLCBlbmNvZGVVUklDb21wb25lbnQpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgVXJpIHRvIGEgcGF0aC5cbiAgLy9cbiAgLy8gKiBgdXJpYCBBIFVyaSB0byBjb252ZXJ0IHRvIGEgZmlsZSBwYXRoLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgZmlsZSBwYXRoIGNvcnJlc3BvbmRpbmcgdG8gdGhlIFVyaS4gZS5nLiAvYS9iL2MudHh0XG4gIC8vIElmIHRoZSBVcmkgZG9lcyBub3QgYmVnaW4gZmlsZTogdGhlbiBpdCBpcyByZXR1cm5lZCBhcy1pcyB0byBhbGxvdyBBdG9tXG4gIC8vIHRvIGRlYWwgd2l0aCBodHRwL2h0dHBzIHNvdXJjZXMgaW4gdGhlIGZ1dHVyZS5cbiAgcHVibGljIHN0YXRpYyB1cmlUb1BhdGgodXJpOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHVybCA9IFVSTC5wYXJzZSh1cmkpO1xuICAgIGlmICh1cmwucHJvdG9jb2wgIT09ICdmaWxlOicgfHwgdXJsLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVyaTtcbiAgICB9XG5cbiAgICBsZXQgZmlsZVBhdGggPSBkZWNvZGVVUklDb21wb25lbnQodXJsLnBhdGgpO1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAvLyBEZWFsIHdpdGggV2luZG93cyBkcml2ZSBuYW1lc1xuICAgICAgaWYgKGZpbGVQYXRoWzBdID09PSAnLycpIHtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5zdWJzdHIoMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsZVBhdGgucmVwbGFjZSgvXFwvL2csICdcXFxcJyk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlUGF0aDtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhbiBBdG9tIHtQb2ludH0gdG8gYSBsYW5ndWFnZSBzZXJ2ZXIge1Bvc2l0aW9ufS5cbiAgLy9cbiAgLy8gKiBgcG9pbnRgIEFuIEF0b20ge1BvaW50fSB0byBjb252ZXJ0IGZyb20uXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIHtQb3NpdGlvbn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIEF0b20ge1BvaW50T2JqZWN0fS5cbiAgcHVibGljIHN0YXRpYyBwb2ludFRvUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogbHMuUG9zaXRpb24ge1xuICAgIHJldHVybiB7IGxpbmU6IHBvaW50LnJvdywgY2hhcmFjdGVyOiBwb2ludC5jb2x1bW4gfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciB7UG9zaXRpb259IGludG8gYW4gQXRvbSB7UG9pbnRPYmplY3R9LlxuICAvL1xuICAvLyAqICdwb3NpdGlvbicgQSBsYW5ndWFnZSBzZXJ2ZXIge1Bvc2l0aW9ufSB0byBjb252ZXJ0IGZyb20uXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIEF0b20ge1BvaW50T2JqZWN0fSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4ge1Bvc2l0aW9ufS5cbiAgcHVibGljIHN0YXRpYyBwb3NpdGlvblRvUG9pbnQocG9zaXRpb246IGxzLlBvc2l0aW9uKTogUG9pbnQge1xuICAgIHJldHVybiBuZXcgUG9pbnQocG9zaXRpb24ubGluZSwgcG9zaXRpb24uY2hhcmFjdGVyKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciB7UmFuZ2V9IGludG8gYW4gQXRvbSB7UmFuZ2V9LlxuICAvL1xuICAvLyAqICdyYW5nZScgQSBsYW5ndWFnZSBzZXJ2ZXIge1JhbmdlfSB0byBjb252ZXJ0IGZyb20uXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIEF0b20ge1JhbmdlfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbGFuZ3VhZ2Ugc2VydmVyIHtSYW5nZX0uXG4gIHB1YmxpYyBzdGF0aWMgbHNSYW5nZVRvQXRvbVJhbmdlKHJhbmdlOiBscy5SYW5nZSk6IFJhbmdlIHtcbiAgICByZXR1cm4gbmV3IFJhbmdlKENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHJhbmdlLnN0YXJ0KSwgQ29udmVydC5wb3NpdGlvblRvUG9pbnQocmFuZ2UuZW5kKSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gQXRvbSB7UmFuZ2V9IGludG8gYW4gbGFuZ3VhZ2Ugc2VydmVyIHtSYW5nZX0uXG4gIC8vXG4gIC8vICogJ3JhbmdlJyBBbiBBdG9tIHtSYW5nZX0gdG8gY29udmVydCBmcm9tLlxuICAvL1xuICAvLyBSZXR1cm5zIHRoZSBsYW5ndWFnZSBzZXJ2ZXIge1JhbmdlfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gQXRvbSB7UmFuZ2V9LlxuICBwdWJsaWMgc3RhdGljIGF0b21SYW5nZVRvTFNSYW5nZShyYW5nZTogUmFuZ2UpOiBscy5SYW5nZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXJ0OiBDb252ZXJ0LnBvaW50VG9Qb3NpdGlvbihyYW5nZS5zdGFydCksXG4gICAgICBlbmQ6IENvbnZlcnQucG9pbnRUb1Bvc2l0aW9uKHJhbmdlLmVuZCksXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1RleHREb2N1bWVudElkZW50aWZpZXJ9IGZyb20gYW4gQXRvbSB7VGV4dEVkaXRvcn0uXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgQSB7VGV4dEVkaXRvcn0gdGhhdCB3aWxsIGJlIHVzZWQgdG8gZm9ybSB0aGUgdXJpIHByb3BlcnR5LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1RleHREb2N1bWVudElkZW50aWZpZXJ9IHRoYXQgaGFzIGEgYHVyaWAgcHJvcGVydHkgd2l0aCB0aGUgVXJpIGZvciB0aGVcbiAgLy8gZ2l2ZW4gZWRpdG9yJ3MgcGF0aC5cbiAgcHVibGljIHN0YXRpYyBlZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yOiBUZXh0RWRpdG9yKTogbHMuVGV4dERvY3VtZW50SWRlbnRpZmllciB7XG4gICAgcmV0dXJuIHsgdXJpOiBDb252ZXJ0LnBhdGhUb1VyaShlZGl0b3IuZ2V0UGF0aCgpIHx8ICcnKSB9O1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUgYSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IGZyb20gYSB7VGV4dEVkaXRvcn0gYW5kIG9wdGlvbmFsIHtQb2ludH0uXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgQSB7VGV4dEVkaXRvcn0gdGhhdCB3aWxsIGJlIHVzZWQgdG8gZm9ybSB0aGUgdXJpIHByb3BlcnR5LlxuICAvLyAqIGBwb2ludGAgIEFuIG9wdGlvbmFsIHtQb2ludH0gdGhhdCB3aWxsIHN1cHBseSB0aGUgcG9zaXRpb24gcHJvcGVydHkuIElmIG5vdCBzcGVjaWZpZWRcbiAgLy8gICAgICAgICAgICB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gd2lsbCBiZSB1c2VkLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSB0aGF0IGhhcyB0ZXh0RG9jdW1lbnQgcHJvcGVydHkgd2l0aCB0aGUgZWRpdG9ycyB7VGV4dERvY3VtZW50SWRlbnRpZmllcn1cbiAgLy8gYW5kIGEgcG9zaXRpb24gcHJvcGVydHkgd2l0aCB0aGUgc3VwcGxpZWQgcG9pbnQgKG9yIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIHdoZW4gbm90IHNwZWNpZmllZCkuXG4gIHB1YmxpYyBzdGF0aWMgZWRpdG9yVG9UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyhcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ/OiBQb2ludCxcbiAgKTogbHMuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXG4gICAgICBwb3NpdGlvbjogQ29udmVydC5wb2ludFRvUG9zaXRpb24ocG9pbnQgIT0gbnVsbCA/IHBvaW50IDogZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIHN0cmluZyBvZiBzY29wZXMgZm9yIHRoZSBhdG9tIHRleHQgZWRpdG9yIHVzaW5nIHRoZSBkYXRhLWdyYW1tYXIgc2VsZWN0b3IgZnJvbSBhblxuICAvLyB7QXJyYXl9IG9mIGdyYW1tYXJTY29wZSBzdHJpbmdzLlxuICAvL1xuICAvLyAqIGBncmFtbWFyU2NvcGVzYCBBbiB7QXJyYXl9IG9mIGdyYW1tYXIgc2NvcGUgc3RyaW5nIHRvIGNvbnZlcnQgZnJvbS5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHNpbmdsZSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBDU1Mgc2VsZWN0b3JzIHRhcmdldHRpbmcgdGhlIGdyYW1tYXJzIG9mIEF0b20gdGV4dCBlZGl0b3JzLlxuICAvLyBlLmcuIGBbJ2MnLCAnY3BwJ11gID0+IGAnYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J2MnXSwgYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J2NwcCddYFxuICBwdWJsaWMgc3RhdGljIGdyYW1tYXJTY29wZXNUb1RleHRFZGl0b3JTY29wZXMoZ3JhbW1hclNjb3Blczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBncmFtbWFyU2NvcGVzXG4gICAgICAubWFwKChnKSA9PiBgYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9XCIke0NvbnZlcnQuZW5jb2RlSFRNTEF0dHJpYnV0ZShnLnJlcGxhY2UoL1xcLi9nLCAnICcpKX1cIl1gKVxuICAgICAgLmpvaW4oJywgJyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IEVuY29kZSBhIHN0cmluZyBzbyB0aGF0IGl0IGNhbiBiZSBzYWZlbHkgdXNlZCB3aXRoaW4gYSBIVE1MIGF0dHJpYnV0ZSAtIGkuZS4gcmVwbGFjaW5nIGFsbCBxdW90ZWRcbiAgLy8gdmFsdWVzIHdpdGggdGhlaXIgSFRNTCBlbnRpdHkgZW5jb2RlZCB2ZXJzaW9ucy4gIGUuZy4gYEhlbGxvXCJgIGJlY29tZXMgYEhlbGxvJnF1b3Q7YFxuICAvL1xuICAvLyAqICdzJyBBIHN0cmluZyB0byBiZSBlbmNvZGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgc3RyaW5nIHRoYXQgaXMgSFRNTCBhdHRyaWJ1dGUgZW5jb2RlZCBieSByZXBsYWNpbmcgJiwgPCwgPiwgXCIgYW5kICcgd2l0aCB0aGVpciBIVE1MIGVudGl0eVxuICAvLyBuYW1lZCBlcXVpdmFsZW50cy5cbiAgcHVibGljIHN0YXRpYyBlbmNvZGVIVE1MQXR0cmlidXRlKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYXR0cmlidXRlTWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmYXBvczsnLFxuICAgIH07XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWyY8PidcIl0vZywgKGMpID0+IGF0dHJpYnV0ZU1hcFtjXSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gQXRvbSBGaWxlIEV2ZW50IGFzIHJlY2VpdmVkIGZyb20gYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlRmlsZXMgYW5kIGNvbnZlcnRcbiAgLy8gaXQgaW50byBhbiBBcnJheSBvZiBMYW5ndWFnZSBTZXJ2ZXIgUHJvdG9jb2wge0ZpbGVFdmVudH0gb2JqZWN0cy4gTm9ybWFsbHkgdGhpcyB3aWxsIGJlIGEgMS10by0xXG4gIC8vIGJ1dCByZW5hbWVzIHdpbGwgYmUgcmVwcmVzZW50ZWQgYnkgYSBkZWxldGlvbiBhbmQgYSBzdWJzZXF1ZW50IGNyZWF0aW9uIGFzIExTUCBkb2VzIG5vdCBrbm93IGFib3V0XG4gIC8vIHJlbmFtZXMuXG4gIC8vXG4gIC8vICogJ2ZpbGVFdmVudCcgQW4ge2F0b20kUHJvamVjdEZpbGVFdmVudH0gdG8gYmUgY29udmVydGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIExTUCB7bHMuRmlsZUV2ZW50fSBvYmplY3RzIHRoYXQgZXF1aXZhbGVudCBjb252ZXJzaW9ucyB0byB0aGUgZmlsZUV2ZW50IHBhcmFtZXRlci5cbiAgcHVibGljIHN0YXRpYyBhdG9tRmlsZUV2ZW50VG9MU0ZpbGVFdmVudHMoZmlsZUV2ZW50OiBGaWxlc3lzdGVtQ2hhbmdlKTogbHMuRmlsZUV2ZW50W10ge1xuICAgIHN3aXRjaCAoZmlsZUV2ZW50LmFjdGlvbikge1xuICAgICAgY2FzZSAnY3JlYXRlZCc6XG4gICAgICAgIHJldHVybiBbeyB1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5wYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuQ3JlYXRlZCB9XTtcbiAgICAgIGNhc2UgJ21vZGlmaWVkJzpcbiAgICAgICAgcmV0dXJuIFt7IHVyaTogQ29udmVydC5wYXRoVG9VcmkoZmlsZUV2ZW50LnBhdGgpLCB0eXBlOiBscy5GaWxlQ2hhbmdlVHlwZS5DaGFuZ2VkIH1dO1xuICAgICAgY2FzZSAnZGVsZXRlZCc6XG4gICAgICAgIHJldHVybiBbeyB1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5wYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuRGVsZXRlZCB9XTtcbiAgICAgIGNhc2UgJ3JlbmFtZWQnOiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PHsgdXJpOiBzdHJpbmcsIHR5cGU6IGxzLkZpbGVDaGFuZ2VUeXBlIH0+ID0gW107XG4gICAgICAgIGlmIChmaWxlRXZlbnQub2xkUGF0aCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHVyaTogQ29udmVydC5wYXRoVG9VcmkoZmlsZUV2ZW50Lm9sZFBhdGgpLCB0eXBlOiBscy5GaWxlQ2hhbmdlVHlwZS5EZWxldGVkIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlRXZlbnQucGF0aCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHVyaTogQ29udmVydC5wYXRoVG9VcmkoZmlsZUV2ZW50LnBhdGgpLCB0eXBlOiBscy5GaWxlQ2hhbmdlVHlwZS5DcmVhdGVkIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYXRvbUlkZURpYWdub3N0aWNUb0xTRGlhZ25vc3RpYyhkaWFnbm9zdGljOiBEaWFnbm9zdGljKTogbHMuRGlhZ25vc3RpYyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJhbmdlOiBDb252ZXJ0LmF0b21SYW5nZVRvTFNSYW5nZShkaWFnbm9zdGljLnJhbmdlKSxcbiAgICAgIHNldmVyaXR5OiBDb252ZXJ0LmRpYWdub3N0aWNUeXBlVG9MU1NldmVyaXR5KGRpYWdub3N0aWMudHlwZSksXG4gICAgICBzb3VyY2U6IGRpYWdub3N0aWMucHJvdmlkZXJOYW1lLFxuICAgICAgbWVzc2FnZTogZGlhZ25vc3RpYy50ZXh0IHx8ICcnLFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGRpYWdub3N0aWNUeXBlVG9MU1NldmVyaXR5KHR5cGU6IERpYWdub3N0aWNUeXBlKTogbHMuRGlhZ25vc3RpY1NldmVyaXR5IHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ0Vycm9yJzpcbiAgICAgICAgcmV0dXJuIGxzLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcjtcbiAgICAgIGNhc2UgJ1dhcm5pbmcnOlxuICAgICAgICByZXR1cm4gbHMuRGlhZ25vc3RpY1NldmVyaXR5Lldhcm5pbmc7XG4gICAgICBjYXNlICdJbmZvJzpcbiAgICAgICAgcmV0dXJuIGxzLkRpYWdub3N0aWNTZXZlcml0eS5JbmZvcm1hdGlvbjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IEVycm9yKGBVbmV4cGVjdGVkIGRpYWdub3N0aWMgdHlwZSAke3R5cGV9YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIGFycmF5IG9mIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB7VGV4dEVkaXR9IG9iamVjdHMgdG8gYW5cbiAgLy8gZXF1aXZhbGVudCBhcnJheSBvZiBBdG9tIHtUZXh0RWRpdH0gb2JqZWN0cy5cbiAgLy9cbiAgLy8gKiBgdGV4dEVkaXRzYCBUaGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIHtUZXh0RWRpdH0gb2JqZWN0cyB0byBjb252ZXJ0LlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtBcnJheX0gb2YgQXRvbSB7VGV4dEVkaXR9IG9iamVjdHMuXG4gIHB1YmxpYyBzdGF0aWMgY29udmVydExzVGV4dEVkaXRzKHRleHRFZGl0czogbHMuVGV4dEVkaXRbXSB8IG51bGwpOiBUZXh0RWRpdFtdIHtcbiAgICByZXR1cm4gKHRleHRFZGl0cyB8fCBbXSkubWFwKENvbnZlcnQuY29udmVydExzVGV4dEVkaXQpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIHtUZXh0RWRpdH0gb2JqZWN0IHRvIHRoZVxuICAvLyBBdG9tIGVxdWl2YWxlbnQge1RleHRFZGl0fS5cbiAgLy9cbiAgLy8gKiBgdGV4dEVkaXRzYCBUaGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIHtUZXh0RWRpdH0gb2JqZWN0cyB0byBjb252ZXJ0LlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIEF0b20ge1RleHRFZGl0fSBvYmplY3QuXG4gIHB1YmxpYyBzdGF0aWMgY29udmVydExzVGV4dEVkaXQodGV4dEVkaXQ6IGxzLlRleHRFZGl0KTogVGV4dEVkaXQge1xuICAgIHJldHVybiB7XG4gICAgICBvbGRSYW5nZTogQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UodGV4dEVkaXQucmFuZ2UpLFxuICAgICAgbmV3VGV4dDogdGV4dEVkaXQubmV3VGV4dCxcbiAgICB9O1xuICB9XG59XG4iXX0=