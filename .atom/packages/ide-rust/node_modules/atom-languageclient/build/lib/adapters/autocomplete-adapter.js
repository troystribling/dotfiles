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
const fuzzaldrin_plus_1 = require("fuzzaldrin-plus");
const languageclient_1 = require("../languageclient");
const atom_1 = require("atom");
class PossiblyResolvedCompletionItem {
    constructor(completionItem, isResolved) {
        this.completionItem = completionItem;
        this.isResolved = isResolved;
    }
}
// Public: Adapts the language server protocol "textDocument/completion" to the Atom
// AutoComplete+ package.
class AutocompleteAdapter {
    constructor() {
        this._suggestionCache = new WeakMap();
        this._cancellationTokens = new WeakMap();
    }
    static canAdapt(serverCapabilities) {
        return serverCapabilities.completionProvider != null;
    }
    static canResolve(serverCapabilities) {
        return serverCapabilities.completionProvider != null &&
            serverCapabilities.completionProvider.resolveProvider === true;
    }
    // Public: Obtain suggestion list for AutoComplete+ by querying the language server using
    // the `textDocument/completion` request.
    //
    // * `server` An {ActiveServer} pointing to the language server to query.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` An optional function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Promise} of an {Array} of {atom$AutocompleteSuggestion}s containing the
    // AutoComplete+ suggestions to display.
    getSuggestions(server, request, onDidConvertCompletionItem, minimumWordLength) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerChars = server.capabilities.completionProvider != null
                ? server.capabilities.completionProvider.triggerCharacters || []
                : [];
            // triggerOnly is true if we have just typed in the trigger character, and is false if we
            // have typed additional characters following the trigger character.
            const [triggerChar, triggerOnly] = AutocompleteAdapter.getTriggerCharacter(request, triggerChars);
            if (!this.shouldTrigger(request, triggerChar, minimumWordLength || 0)) {
                return [];
            }
            // Get the suggestions either from the cache or by calling the language server
            const suggestions = yield this.getOrBuildSuggestions(server, request, triggerChar, triggerOnly, onDidConvertCompletionItem);
            // As the user types more characters to refine filter we must replace those characters on acceptance
            const replacementPrefix = (triggerChar !== '' && triggerOnly) ? '' : request.prefix;
            for (const suggestion of suggestions) {
                suggestion.replacementPrefix = replacementPrefix;
            }
            const filtered = !(request.prefix === "" || (triggerChar !== '' && triggerOnly));
            return filtered ? fuzzaldrin_plus_1.filter(suggestions, request.prefix, { key: 'text' }) : suggestions;
        });
    }
    shouldTrigger(request, triggerChar, minWordLength) {
        return request.activatedManually
            || triggerChar !== ''
            || minWordLength <= 0
            || request.prefix.length >= minWordLength;
    }
    getOrBuildSuggestions(server, request, triggerChar, triggerOnly, onDidConvertCompletionItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this._suggestionCache.get(server);
            const triggerColumn = (triggerChar !== '' && triggerOnly)
                ? request.bufferPosition.column - triggerChar.length
                : request.bufferPosition.column - request.prefix.length - triggerChar.length;
            const triggerPoint = new atom_1.Point(request.bufferPosition.row, triggerColumn);
            // Do we have complete cached suggestions that are still valid for this request?
            if (cache && !cache.isIncomplete && cache.triggerChar === triggerChar
                && cache.triggerPoint.isEqual(triggerPoint)) {
                return Array.from(cache.suggestionMap.keys());
            }
            // Our cached suggestions can't be used so obtain new ones from the language server
            const completions = yield Utils.doWithCancellationToken(server.connection, this._cancellationTokens, (cancellationToken) => server.connection.completion(AutocompleteAdapter.createCompletionParams(request, triggerChar, triggerOnly), cancellationToken));
            // Setup the cache for subsequent filtered results
            const isComplete = completions == null || Array.isArray(completions) || completions.isIncomplete === false;
            const suggestionMap = this.completionItemsToSuggestions(completions, request, onDidConvertCompletionItem);
            this._suggestionCache.set(server, { isIncomplete: !isComplete, triggerChar, triggerPoint, suggestionMap });
            return Array.from(suggestionMap.keys());
        });
    }
    // Public: Obtain a complete version of a suggestion with additional information
    // the language server can provide by way of the `completionItem/resolve` request.
    //
    // * `server` An {ActiveServer} pointing to the language server to query.
    // * `suggestion` An {atom$AutocompleteSuggestion} suggestion that should be resolved.
    // * `request` An {Object} with the AutoComplete+ request to satisfy.
    // * `onDidConvertCompletionItem` An optional function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Promise} of an {atom$AutocompleteSuggestion} with the resolved AutoComplete+ suggestion.
    completeSuggestion(server, suggestion, request, onDidConvertCompletionItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this._suggestionCache.get(server);
            if (cache) {
                const possiblyResolvedCompletionItem = cache.suggestionMap.get(suggestion);
                if (possiblyResolvedCompletionItem != null && possiblyResolvedCompletionItem.isResolved === false) {
                    const resolvedCompletionItem = yield server.connection.completionItemResolve(possiblyResolvedCompletionItem.completionItem);
                    if (resolvedCompletionItem != null) {
                        AutocompleteAdapter.completionItemToSuggestion(resolvedCompletionItem, suggestion, request, onDidConvertCompletionItem);
                        possiblyResolvedCompletionItem.isResolved = true;
                    }
                }
            }
            return suggestion;
        });
    }
    // Public: Get the trigger character that caused the autocomplete (if any).  This is required because
    // AutoComplete-plus does not have trigger characters.  Although the terminology is 'character' we treat
    // them as variable length strings as this will almost certainly change in the future to support '->' etc.
    //
    // * `request` An {Array} of {atom$AutocompleteSuggestion}s to locate the prefix, editor, bufferPosition etc.
    // * `triggerChars` The {Array} of {string}s that can be trigger characters.
    //
    // Returns a [{string}, boolean] where the string is the matching trigger character or an empty string
    // if one was not matched, and the boolean is true if the trigger character is in request.prefix, and false
    // if it is in the word before request.prefix. The boolean return value has no meaning if the string return
    // value is an empty string.
    static getTriggerCharacter(request, triggerChars) {
        // AutoComplete-Plus considers text after a symbol to be a new trigger. So we should look backward
        // from the current cursor position to see if one is there and thus simulate it.
        const buffer = request.editor.getBuffer();
        const cursor = request.bufferPosition;
        const prefixStartColumn = cursor.column - request.prefix.length;
        for (const triggerChar of triggerChars) {
            if (request.prefix.endsWith(triggerChar)) {
                return [triggerChar, true];
            }
            if (prefixStartColumn >= triggerChar.length) { // Far enough along a line to fit the trigger char
                const start = new atom_1.Point(cursor.row, prefixStartColumn - triggerChar.length);
                const possibleTrigger = buffer.getTextInRange([start, [cursor.row, prefixStartColumn]]);
                if (possibleTrigger === triggerChar) { // The text before our trigger is a trigger char!
                    return [triggerChar, false];
                }
            }
        }
        // There was no explicit trigger char
        return ['', false];
    }
    // Public: Create TextDocumentPositionParams to be sent to the language server
    // based on the editor and position from the AutoCompleteRequest.
    //
    // * `request` The {atom$AutocompleteRequest} to obtain the editor from.
    // * `triggerPoint` The {atom$Point} where the trigger started.
    //
    // Returns a {string} containing the prefix including the trigger character.
    static getPrefixWithTrigger(request, triggerPoint) {
        return request.editor
            .getBuffer()
            .getTextInRange([[triggerPoint.row, triggerPoint.column], request.bufferPosition]);
    }
    // Public: Create {CompletionParams} to be sent to the language server
    // based on the editor and position from the Autocomplete request etc.
    //
    // * `request` The {atom$AutocompleteRequest} containing the request details.
    // * `triggerCharacter` The {string} containing the trigger character (empty if none).
    // * `triggerOnly` A {boolean} representing whether this completion is triggered right after a trigger character.
    //
    // Returns an {CompletionParams} with the keys:
    //  * `textDocument` the language server protocol textDocument identification.
    //  * `position` the position within the text document to display completion request for.
    //  * `context` containing the trigger character and kind.
    static createCompletionParams(request, triggerCharacter, triggerOnly) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(request.editor),
            position: convert_1.default.pointToPosition(request.bufferPosition),
            context: AutocompleteAdapter.createCompletionContext(triggerCharacter, triggerOnly),
        };
    }
    // Public: Create {CompletionContext} to be sent to the language server
    // based on the trigger character.
    //
    // * `triggerCharacter` The {string} containing the trigger character or '' if none.
    // * `triggerOnly` A {boolean} representing whether this completion is triggered right after a trigger character.
    //
    // Returns an {CompletionContext} that specifies the triggerKind and the triggerCharacter
    // if there is one.
    static createCompletionContext(triggerCharacter, triggerOnly) {
        if (triggerCharacter === '') {
            return { triggerKind: languageclient_1.CompletionTriggerKind.Invoked };
        }
        else {
            return triggerOnly
                ? { triggerKind: languageclient_1.CompletionTriggerKind.TriggerCharacter, triggerCharacter }
                : { triggerKind: languageclient_1.CompletionTriggerKind.TriggerForIncompleteCompletions, triggerCharacter };
        }
    }
    // Public: Convert a language server protocol CompletionItem array or CompletionList to
    // an array of ordered AutoComplete+ suggestions.
    //
    // * `completionItems` An {Array} of {CompletionItem} objects or a {CompletionList} containing completion
    //           items to be converted.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` A function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Map} of AutoComplete+ suggestions ordered by the CompletionItems sortText.
    completionItemsToSuggestions(completionItems, request, onDidConvertCompletionItem) {
        return new Map((Array.isArray(completionItems) ? completionItems : completionItems.items || [])
            .sort((a, b) => (a.sortText || a.label).localeCompare(b.sortText || b.label))
            .map((s) => [
            AutocompleteAdapter.completionItemToSuggestion(s, {}, request, onDidConvertCompletionItem),
            new PossiblyResolvedCompletionItem(s, false)
        ]));
    }
    // Public: Convert a language server protocol CompletionItem to an AutoComplete+ suggestion.
    //
    // * `item` An {CompletionItem} containing a completion item to be converted.
    // * `suggestion` A {atom$AutocompleteSuggestion} to have the conversion applied to.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` A function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns the {atom$AutocompleteSuggestion} passed in as suggestion with the conversion applied.
    static completionItemToSuggestion(item, suggestion, request, onDidConvertCompletionItem) {
        AutocompleteAdapter.applyCompletionItemToSuggestion(item, suggestion);
        AutocompleteAdapter.applyTextEditToSuggestion(item.textEdit, request.editor, suggestion);
        AutocompleteAdapter.applySnippetToSuggestion(item, suggestion);
        if (onDidConvertCompletionItem != null) {
            onDidConvertCompletionItem(item, suggestion, request);
        }
        return suggestion;
    }
    // Public: Convert the primary parts of a language server protocol CompletionItem to an AutoComplete+ suggestion.
    //
    // * `item` An {CompletionItem} containing the completion items to be merged into.
    // * `suggestion` The {atom$AutocompleteSuggestion} to merge the conversion into.
    //
    // Returns an {atom$AutocompleteSuggestion} created from the {CompletionItem}.
    static applyCompletionItemToSuggestion(item, suggestion) {
        suggestion.text = item.insertText || item.label;
        suggestion.displayText = item.label;
        suggestion.type = AutocompleteAdapter.completionKindToSuggestionType(item.kind);
        suggestion.rightLabel = item.detail;
        // Older format, can't know what it is so assign to both and hope for best
        if (typeof (item.documentation) === 'string') {
            suggestion.descriptionMarkdown = item.documentation;
            suggestion.description = item.documentation;
        }
        if (item.documentation != null && typeof (item.documentation) === 'object') {
            // Newer format specifies the kind of documentation, assign appropriately
            if (item.documentation.kind === 'markdown') {
                suggestion.descriptionMarkdown = item.documentation.value;
            }
            else {
                suggestion.description = item.documentation.value;
            }
        }
    }
    // Public: Applies the textEdit part of a language server protocol CompletionItem to an
    // AutoComplete+ Suggestion via the replacementPrefix and text properties.
    //
    // * `textEdit` A {TextEdit} from a CompletionItem to apply.
    // * `editor` An Atom {TextEditor} used to obtain the necessary text replacement.
    // * `suggestion` An {atom$AutocompleteSuggestion} to set the replacementPrefix and text properties of.
    static applyTextEditToSuggestion(textEdit, editor, suggestion) {
        if (textEdit) {
            suggestion.replacementPrefix = editor.getTextInBufferRange(convert_1.default.lsRangeToAtomRange(textEdit.range));
            suggestion.text = textEdit.newText;
        }
    }
    // Public: Adds a snippet to the suggestion if the CompletionItem contains
    // snippet-formatted text
    //
    // * `item` An {CompletionItem} containing the completion items to be merged into.
    // * `suggestion` The {atom$AutocompleteSuggestion} to merge the conversion into.
    //
    static applySnippetToSuggestion(item, suggestion) {
        if (item.insertTextFormat === languageclient_1.InsertTextFormat.Snippet) {
            suggestion.snippet = item.textEdit != null ? item.textEdit.newText : (item.insertText || '');
        }
    }
    // Public: Obtain the textual suggestion type required by AutoComplete+ that
    // most closely maps to the numeric completion kind supplies by the language server.
    //
    // * `kind` A {Number} that represents the suggestion kind to be converted.
    //
    // Returns a {String} containing the AutoComplete+ suggestion type equivalent
    // to the given completion kind.
    static completionKindToSuggestionType(kind) {
        switch (kind) {
            case languageclient_1.CompletionItemKind.Constant:
                return 'constant';
            case languageclient_1.CompletionItemKind.Method:
                return 'method';
            case languageclient_1.CompletionItemKind.Function:
            case languageclient_1.CompletionItemKind.Constructor:
                return 'function';
            case languageclient_1.CompletionItemKind.Field:
            case languageclient_1.CompletionItemKind.Property:
                return 'property';
            case languageclient_1.CompletionItemKind.Variable:
                return 'variable';
            case languageclient_1.CompletionItemKind.Class:
                return 'class';
            case languageclient_1.CompletionItemKind.Struct:
            case languageclient_1.CompletionItemKind.TypeParameter:
                return 'type';
            case languageclient_1.CompletionItemKind.Operator:
                return 'selector';
            case languageclient_1.CompletionItemKind.Interface:
                return 'mixin';
            case languageclient_1.CompletionItemKind.Module:
                return 'module';
            case languageclient_1.CompletionItemKind.Unit:
                return 'builtin';
            case languageclient_1.CompletionItemKind.Enum:
            case languageclient_1.CompletionItemKind.EnumMember:
                return 'enum';
            case languageclient_1.CompletionItemKind.Keyword:
                return 'keyword';
            case languageclient_1.CompletionItemKind.Snippet:
                return 'snippet';
            case languageclient_1.CompletionItemKind.File:
            case languageclient_1.CompletionItemKind.Folder:
                return 'import';
            case languageclient_1.CompletionItemKind.Reference:
                return 'require';
            default:
                return 'value';
        }
    }
}
exports.default = AutocompleteAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHdDQUFpQztBQUNqQyxrQ0FBa0M7QUFHbEMscURBQXlDO0FBQ3pDLHNEQVcyQjtBQUMzQiwrQkFHYztBQWFkLE1BQU0sOEJBQThCO0lBQ2xDLFlBQ1MsY0FBOEIsRUFDOUIsVUFBbUI7UUFEbkIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1FBQzlCLGVBQVUsR0FBVixVQUFVLENBQVM7SUFFNUIsQ0FBQztDQUNGO0FBRUQsb0ZBQW9GO0FBQ3BGLHlCQUF5QjtBQUN6QixNQUFxQixtQkFBbUI7SUFBeEM7UUFVVSxxQkFBZ0IsR0FBZ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUM5RSx3QkFBbUIsR0FBK0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztJQXNYMUcsQ0FBQztJQWhZUSxNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLGtCQUFrQixDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQztJQUN2RCxDQUFDO0lBRU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxrQkFBc0M7UUFDN0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsSUFBSSxJQUFJO1lBQ2xELGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUM7SUFDbkUsQ0FBQztJQUtELHlGQUF5RjtJQUN6Rix5Q0FBeUM7SUFDekMsRUFBRTtJQUNGLHlFQUF5RTtJQUN6RSx5REFBeUQ7SUFDekQsc0hBQXNIO0lBQ3RILDZFQUE2RTtJQUM3RSxFQUFFO0lBQ0YscUZBQXFGO0lBQ3JGLHdDQUF3QztJQUMzQixjQUFjLENBQ3pCLE1BQW9CLEVBQ3BCLE9BQXFDLEVBQ3JDLDBCQUFtRCxFQUNuRCxpQkFBMEI7O1lBRTFCLE1BQU0sWUFBWSxHQUFH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QUFLLENBQUM7WUFDOUIsS0FBSyxtQ0FBa0IsQ0FBQyxRQUFRO2dCQUM5QixPQUFPLFVBQVUsQ0FBQztZQUNwQixLQUFLLG1DQUFrQixDQUFDLFFBQVE7Z0JBQzlCLE9BQU8sVUFBVSxDQUFDO1lBQ3BCLEtBQUssbUNBQWtCLENBQUMsS0FBSztnQkFDM0IsT0FBTyxPQUFPLENBQUM7WUFDakIsS0FBSyxtQ0FBa0IsQ0FBQyxNQUFNLENBQUM7WUFDL0IsS0FBSyxtQ0FBa0IsQ0FBQyxhQUFhO2dCQUNuQyxPQUFPLE1BQU0sQ0FBQztZQUNoQixLQUFLLG1DQUFrQixDQUFDLFFBQVE7Z0JBQzlCLE9BQU8sVUFBVSxDQUFDO1lBQ3BCLEtBQUssbUNBQWtCLENBQUMsU0FBUztnQkFDL0IsT0FBTyxPQUFPLENBQUM7WUFDakIsS0FBSyxtQ0FBa0IsQ0FBQyxNQUFNO2dCQUM1QixPQUFPLFFBQVEsQ0FBQztZQUNsQixLQUFLLG1DQUFrQixDQUFDLElBQUk7Z0JBQzFCLE9BQU8sU0FBUyxDQUFDO1lBQ25CLEtBQUssbUNBQWtCLENBQUMsSUFBSSxDQUFDO1lBQzdCLEtBQUssbUNBQWtCLENBQUMsVUFBVTtnQkFDaEMsT0FBTyxNQUFNLENBQUM7WUFDaEIsS0FBSyxtQ0FBa0IsQ0FBQyxPQUFPO2dCQUM3QixPQUFPLFNBQVMsQ0FBQztZQUNuQixLQUFLLG1DQUFrQixDQUFDLE9BQU87Z0JBQzdCLE9BQU8sU0FBUyxDQUFDO1lBQ25CLEtBQUssbUNBQWtCLENBQUMsSUFBSSxDQUFDO1lBQzdCLEtBQUssbUNBQWtCLENBQUMsTUFBTTtnQkFDNUIsT0FBTyxRQUFRLENBQUM7WUFDbEIsS0FBSyxtQ0FBa0IsQ0FBQyxTQUFTO2dCQUMvQixPQUFPLFNBQVMsQ0FBQztZQUNuQjtnQkFDRSxPQUFPLE9BQU8sQ0FBQztTQUNsQjtJQUNILENBQUM7Q0FDRjtBQWpZRCxzQ0FpWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IENhbmNlbGxhdGlvblRva2VuU291cmNlIH0gZnJvbSAndnNjb2RlLWpzb25ycGMnO1xuaW1wb3J0IHsgQWN0aXZlU2VydmVyIH0gZnJvbSAnLi4vc2VydmVyLW1hbmFnZXInO1xuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSAnZnV6emFsZHJpbi1wbHVzJztcbmltcG9ydCB7XG4gIENvbXBsZXRpb25Db250ZXh0LFxuICBDb21wbGV0aW9uSXRlbSxcbiAgQ29tcGxldGlvbkl0ZW1LaW5kLFxuICBDb21wbGV0aW9uTGlzdCxcbiAgQ29tcGxldGlvblBhcmFtcyxcbiAgQ29tcGxldGlvblRyaWdnZXJLaW5kLFxuICBJbnNlcnRUZXh0Rm9ybWF0LFxuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcbiAgVGV4dEVkaXQsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcbmltcG9ydCAqIGFzIGFjIGZyb20gJ2F0b20vYXV0b2NvbXBsZXRlLXBsdXMnO1xuXG5pbnRlcmZhY2UgU3VnZ2VzdGlvbkNhY2hlRW50cnkge1xuICBpc0luY29tcGxldGU6IGJvb2xlYW47XG4gIHRyaWdnZXJQb2ludDogUG9pbnQ7XG4gIHRyaWdnZXJDaGFyOiBzdHJpbmc7XG4gIHN1Z2dlc3Rpb25NYXA6IE1hcDxhYy5BbnlTdWdnZXN0aW9uLCBQb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW0+O1xufVxuXG50eXBlIENvbXBsZXRpb25JdGVtQWRqdXN0ZXIgPVxuICAoaXRlbTogQ29tcGxldGlvbkl0ZW0sIHN1Z2dlc3Rpb246IGFjLkFueVN1Z2dlc3Rpb24sIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQpID0+IHZvaWQ7XG5cbmNsYXNzIFBvc3NpYmx5UmVzb2x2ZWRDb21wbGV0aW9uSXRlbSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjb21wbGV0aW9uSXRlbTogQ29tcGxldGlvbkl0ZW0sXG4gICAgcHVibGljIGlzUmVzb2x2ZWQ6IGJvb2xlYW4sXG4gICkge1xuICB9XG59XG5cbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgXCJ0ZXh0RG9jdW1lbnQvY29tcGxldGlvblwiIHRvIHRoZSBBdG9tXG4vLyBBdXRvQ29tcGxldGUrIHBhY2thZ2UuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRvY29tcGxldGVBZGFwdGVyIHtcbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuY29tcGxldGlvblByb3ZpZGVyICE9IG51bGw7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGNhblJlc29sdmUoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmNvbXBsZXRpb25Qcm92aWRlciAhPSBudWxsICYmXG4gICAgICBzZXJ2ZXJDYXBhYmlsaXRpZXMuY29tcGxldGlvblByb3ZpZGVyLnJlc29sdmVQcm92aWRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX3N1Z2dlc3Rpb25DYWNoZTogV2Vha01hcDxBY3RpdmVTZXJ2ZXIsIFN1Z2dlc3Rpb25DYWNoZUVudHJ5PiA9IG5ldyBXZWFrTWFwKCk7XG4gIHByaXZhdGUgX2NhbmNlbGxhdGlvblRva2VuczogV2Vha01hcDxMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sIENhbmNlbGxhdGlvblRva2VuU291cmNlPiA9IG5ldyBXZWFrTWFwKCk7XG5cbiAgLy8gUHVibGljOiBPYnRhaW4gc3VnZ2VzdGlvbiBsaXN0IGZvciBBdXRvQ29tcGxldGUrIGJ5IHF1ZXJ5aW5nIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdXNpbmdcbiAgLy8gdGhlIGB0ZXh0RG9jdW1lbnQvY29tcGxldGlvbmAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgc2VydmVyYCBBbiB7QWN0aXZlU2VydmVyfSBwb2ludGluZyB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIHF1ZXJ5LlxuICAvLyAqIGByZXF1ZXN0YCBUaGUge2F0b20kQXV0b2NvbXBsZXRlUmVxdWVzdH0gdG8gc2F0aXNmeS5cbiAgLy8gKiBgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW1gIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7Q29tcGxldGlvbkl0ZW19LCBhbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufVxuICAvLyAgIGFuZCBhIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IGFsbG93aW5nIHlvdSB0byBhZGp1c3QgY29udmVydGVkIGl0ZW1zLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHtBcnJheX0gb2Yge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1zIGNvbnRhaW5pbmcgdGhlXG4gIC8vIEF1dG9Db21wbGV0ZSsgc3VnZ2VzdGlvbnMgdG8gZGlzcGxheS5cbiAgcHVibGljIGFzeW5jIGdldFN1Z2dlc3Rpb25zKFxuICAgIHNlcnZlcjogQWN0aXZlU2VydmVyLFxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXG4gICAgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0/OiBDb21wbGV0aW9uSXRlbUFkanVzdGVyLFxuICAgIG1pbmltdW1Xb3JkTGVuZ3RoPzogbnVtYmVyLFxuICApOiBQcm9taXNlPGFjLkFueVN1Z2dlc3Rpb25bXT4ge1xuICAgIGNvbnN0IHRyaWdnZXJDaGFycyA9IHNlcnZlci5jYXBhYmlsaXRpZXMuY29tcGxldGlvblByb3ZpZGVyICE9IG51bGxcbiAgICAgID8gc2VydmVyLmNhcGFiaWxpdGllcy5jb21wbGV0aW9uUHJvdmlkZXIudHJpZ2dlckNoYXJhY3RlcnMgfHwgW11cbiAgICAgIDogW107XG5cbiAgICAvLyB0cmlnZ2VyT25seSBpcyB0cnVlIGlmIHdlIGhhdmUganVzdCB0eXBlZCBpbiB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIsIGFuZCBpcyBmYWxzZSBpZiB3ZVxuICAgIC8vIGhhdmUgdHlwZWQgYWRkaXRpb25hbCBjaGFyYWN0ZXJzIGZvbGxvd2luZyB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIuXG4gICAgY29uc3QgW3RyaWdnZXJDaGFyLCB0cmlnZ2VyT25seV0gPSBBdXRvY29tcGxldGVBZGFwdGVyLmdldFRyaWdnZXJDaGFyYWN0ZXIocmVxdWVzdCwgdHJpZ2dlckNoYXJzKTtcblxuICAgIGlmICghdGhpcy5zaG91bGRUcmlnZ2VyKHJlcXVlc3QsIHRyaWdnZXJDaGFyLCBtaW5pbXVtV29yZExlbmd0aCB8fCAwKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgc3VnZ2VzdGlvbnMgZWl0aGVyIGZyb20gdGhlIGNhY2hlIG9yIGJ5IGNhbGxpbmcgdGhlIGxhbmd1YWdlIHNlcnZlclxuICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gYXdhaXRcbiAgICAgIHRoaXMuZ2V0T3JCdWlsZFN1Z2dlc3Rpb25zKHNlcnZlciwgcmVxdWVzdCwgdHJpZ2dlckNoYXIsIHRyaWdnZXJPbmx5LCBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbSk7XG5cbiAgICAvLyBBcyB0aGUgdXNlciB0eXBlcyBtb3JlIGNoYXJhY3RlcnMgdG8gcmVmaW5lIGZpbHRlciB3ZSBtdXN0IHJlcGxhY2UgdGhvc2UgY2hhcmFjdGVycyBvbiBhY2NlcHRhbmNlXG4gICAgY29uc3QgcmVwbGFjZW1lbnRQcmVmaXggPSAodHJpZ2dlckNoYXIgIT09ICcnICYmIHRyaWdnZXJPbmx5KSA/ICcnIDogcmVxdWVzdC5wcmVmaXg7XG4gICAgZm9yIChjb25zdCBzdWdnZXN0aW9uIG9mIHN1Z2dlc3Rpb25zKSB7XG4gICAgICBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4ID0gcmVwbGFjZW1lbnRQcmVmaXg7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsdGVyZWQgPSAhKHJlcXVlc3QucHJlZml4ID09PSBcIlwiIHx8ICh0cmlnZ2VyQ2hhciAhPT0gJycgJiYgdHJpZ2dlck9ubHkpKTtcbiAgICByZXR1cm4gZmlsdGVyZWQgPyBmaWx0ZXIoc3VnZ2VzdGlvbnMsIHJlcXVlc3QucHJlZml4LCB7IGtleTogJ3RleHQnIH0pIDogc3VnZ2VzdGlvbnM7XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFRyaWdnZXIoXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcbiAgICB0cmlnZ2VyQ2hhcjogc3RyaW5nLFxuICAgIG1pbldvcmRMZW5ndGg6IG51bWJlcixcbiAgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHJlcXVlc3QuYWN0aXZhdGVkTWFudWFsbHlcbiAgICAgIHx8IHRyaWdnZXJDaGFyICE9PSAnJ1xuICAgICAgfHwgbWluV29yZExlbmd0aCA8PSAwXG4gICAgICB8fCByZXF1ZXN0LnByZWZpeC5sZW5ndGggPj0gbWluV29yZExlbmd0aDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0T3JCdWlsZFN1Z2dlc3Rpb25zKFxuICAgIHNlcnZlcjogQWN0aXZlU2VydmVyLFxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXG4gICAgdHJpZ2dlckNoYXI6IHN0cmluZyxcbiAgICB0cmlnZ2VyT25seTogYm9vbGVhbixcbiAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbT86IENvbXBsZXRpb25JdGVtQWRqdXN0ZXIsXG4gICk6IFByb21pc2U8YWMuQW55U3VnZ2VzdGlvbltdPiB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLl9zdWdnZXN0aW9uQ2FjaGUuZ2V0KHNlcnZlcik7XG5cbiAgICBjb25zdCB0cmlnZ2VyQ29sdW1uID0gKHRyaWdnZXJDaGFyICE9PSAnJyAmJiB0cmlnZ2VyT25seSlcbiAgICAgID8gcmVxdWVzdC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSB0cmlnZ2VyQ2hhci5sZW5ndGhcbiAgICAgIDogcmVxdWVzdC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSByZXF1ZXN0LnByZWZpeC5sZW5ndGggLSB0cmlnZ2VyQ2hhci5sZW5ndGg7XG4gICAgY29uc3QgdHJpZ2dlclBvaW50ID0gbmV3IFBvaW50KHJlcXVlc3QuYnVmZmVyUG9zaXRpb24ucm93LCB0cmlnZ2VyQ29sdW1uKTtcblxuICAgIC8vIERvIHdlIGhhdmUgY29tcGxldGUgY2FjaGVkIHN1Z2dlc3Rpb25zIHRoYXQgYXJlIHN0aWxsIHZhbGlkIGZvciB0aGlzIHJlcXVlc3Q/XG4gICAgaWYgKGNhY2hlICYmICFjYWNoZS5pc0luY29tcGxldGUgJiYgY2FjaGUudHJpZ2dlckNoYXIgPT09IHRyaWdnZXJDaGFyXG4gICAgICAmJiBjYWNoZS50cmlnZ2VyUG9pbnQuaXNFcXVhbCh0cmlnZ2VyUG9pbnQpKSB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShjYWNoZS5zdWdnZXN0aW9uTWFwLmtleXMoKSk7XG4gICAgfVxuXG4gICAgLy8gT3VyIGNhY2hlZCBzdWdnZXN0aW9ucyBjYW4ndCBiZSB1c2VkIHNvIG9idGFpbiBuZXcgb25lcyBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgICBjb25zdCBjb21wbGV0aW9ucyA9IGF3YWl0IFV0aWxzLmRvV2l0aENhbmNlbGxhdGlvblRva2VuKHNlcnZlci5jb25uZWN0aW9uLCB0aGlzLl9jYW5jZWxsYXRpb25Ub2tlbnMsXG4gICAgICAoY2FuY2VsbGF0aW9uVG9rZW4pID0+IHNlcnZlci5jb25uZWN0aW9uLmNvbXBsZXRpb24oXG4gICAgICAgIEF1dG9jb21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvblBhcmFtcyhyZXF1ZXN0LCB0cmlnZ2VyQ2hhciwgdHJpZ2dlck9ubHkpLCBjYW5jZWxsYXRpb25Ub2tlbiksXG4gICAgKTtcblxuICAgIC8vIFNldHVwIHRoZSBjYWNoZSBmb3Igc3Vic2VxdWVudCBmaWx0ZXJlZCByZXN1bHRzXG4gICAgY29uc3QgaXNDb21wbGV0ZSA9IGNvbXBsZXRpb25zID09IG51bGwgfHwgQXJyYXkuaXNBcnJheShjb21wbGV0aW9ucykgfHwgY29tcGxldGlvbnMuaXNJbmNvbXBsZXRlID09PSBmYWxzZTtcbiAgICBjb25zdCBzdWdnZXN0aW9uTWFwID0gdGhpcy5jb21wbGV0aW9uSXRlbXNUb1N1Z2dlc3Rpb25zKGNvbXBsZXRpb25zLCByZXF1ZXN0LCBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbSk7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbkNhY2hlLnNldChzZXJ2ZXIsIHsgaXNJbmNvbXBsZXRlOiAhaXNDb21wbGV0ZSwgdHJpZ2dlckNoYXIsIHRyaWdnZXJQb2ludCwgc3VnZ2VzdGlvbk1hcCB9KTtcblxuICAgIHJldHVybiBBcnJheS5mcm9tKHN1Z2dlc3Rpb25NYXAua2V5cygpKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIGEgY29tcGxldGUgdmVyc2lvbiBvZiBhIHN1Z2dlc3Rpb24gd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gIC8vIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgY2FuIHByb3ZpZGUgYnkgd2F5IG9mIHRoZSBgY29tcGxldGlvbkl0ZW0vcmVzb2x2ZWAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgc2VydmVyYCBBbiB7QWN0aXZlU2VydmVyfSBwb2ludGluZyB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIHF1ZXJ5LlxuICAvLyAqIGBzdWdnZXN0aW9uYCBBbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSBzdWdnZXN0aW9uIHRoYXQgc2hvdWxkIGJlIHJlc29sdmVkLlxuICAvLyAqIGByZXF1ZXN0YCBBbiB7T2JqZWN0fSB3aXRoIHRoZSBBdXRvQ29tcGxldGUrIHJlcXVlc3QgdG8gc2F0aXNmeS5cbiAgLy8gKiBgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW1gIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7Q29tcGxldGlvbkl0ZW19LCBhbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufVxuICAvLyAgIGFuZCBhIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IGFsbG93aW5nIHlvdSB0byBhZGp1c3QgY29udmVydGVkIGl0ZW1zLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IHdpdGggdGhlIHJlc29sdmVkIEF1dG9Db21wbGV0ZSsgc3VnZ2VzdGlvbi5cbiAgcHVibGljIGFzeW5jIGNvbXBsZXRlU3VnZ2VzdGlvbihcbiAgICBzZXJ2ZXI6IEFjdGl2ZVNlcnZlcixcbiAgICBzdWdnZXN0aW9uOiBhYy5BbnlTdWdnZXN0aW9uLFxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXG4gICAgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0/OiBDb21wbGV0aW9uSXRlbUFkanVzdGVyLFxuICApOiBQcm9taXNlPGFjLkFueVN1Z2dlc3Rpb24+IHtcbiAgICBjb25zdCBjYWNoZSA9IHRoaXMuX3N1Z2dlc3Rpb25DYWNoZS5nZXQoc2VydmVyKTtcbiAgICBpZiAoY2FjaGUpIHtcbiAgICAgIGNvbnN0IHBvc3NpYmx5UmVzb2x2ZWRDb21wbGV0aW9uSXRlbSA9IGNhY2hlLnN1Z2dlc3Rpb25NYXAuZ2V0KHN1Z2dlc3Rpb24pO1xuICAgICAgaWYgKHBvc3NpYmx5UmVzb2x2ZWRDb21wbGV0aW9uSXRlbSAhPSBudWxsICYmIHBvc3NpYmx5UmVzb2x2ZWRDb21wbGV0aW9uSXRlbS5pc1Jlc29sdmVkID09PSBmYWxzZSkge1xuICAgICAgICBjb25zdCByZXNvbHZlZENvbXBsZXRpb25JdGVtID0gYXdhaXRcbiAgICAgICAgICBzZXJ2ZXIuY29ubmVjdGlvbi5jb21wbGV0aW9uSXRlbVJlc29sdmUocG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtLmNvbXBsZXRpb25JdGVtKTtcbiAgICAgICAgaWYgKHJlc29sdmVkQ29tcGxldGlvbkl0ZW0gIT0gbnVsbCkge1xuICAgICAgICAgIEF1dG9jb21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oXG4gICAgICAgICAgICByZXNvbHZlZENvbXBsZXRpb25JdGVtLCBzdWdnZXN0aW9uLCByZXF1ZXN0LCBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbSk7XG4gICAgICAgICAgcG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdWdnZXN0aW9uO1xuICB9XG5cbiAgLy8gUHVibGljOiBHZXQgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIHRoYXQgY2F1c2VkIHRoZSBhdXRvY29tcGxldGUgKGlmIGFueSkuICBUaGlzIGlzIHJlcXVpcmVkIGJlY2F1c2VcbiAgLy8gQXV0b0NvbXBsZXRlLXBsdXMgZG9lcyBub3QgaGF2ZSB0cmlnZ2VyIGNoYXJhY3RlcnMuICBBbHRob3VnaCB0aGUgdGVybWlub2xvZ3kgaXMgJ2NoYXJhY3Rlcicgd2UgdHJlYXRcbiAgLy8gdGhlbSBhcyB2YXJpYWJsZSBsZW5ndGggc3RyaW5ncyBhcyB0aGlzIHdpbGwgYWxtb3N0IGNlcnRhaW5seSBjaGFuZ2UgaW4gdGhlIGZ1dHVyZSB0byBzdXBwb3J0ICctPicgZXRjLlxuICAvL1xuICAvLyAqIGByZXF1ZXN0YCBBbiB7QXJyYXl9IG9mIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259cyB0byBsb2NhdGUgdGhlIHByZWZpeCwgZWRpdG9yLCBidWZmZXJQb3NpdGlvbiBldGMuXG4gIC8vICogYHRyaWdnZXJDaGFyc2AgVGhlIHtBcnJheX0gb2Yge3N0cmluZ31zIHRoYXQgY2FuIGJlIHRyaWdnZXIgY2hhcmFjdGVycy5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIFt7c3RyaW5nfSwgYm9vbGVhbl0gd2hlcmUgdGhlIHN0cmluZyBpcyB0aGUgbWF0Y2hpbmcgdHJpZ2dlciBjaGFyYWN0ZXIgb3IgYW4gZW1wdHkgc3RyaW5nXG4gIC8vIGlmIG9uZSB3YXMgbm90IG1hdGNoZWQsIGFuZCB0aGUgYm9vbGVhbiBpcyB0cnVlIGlmIHRoZSB0cmlnZ2VyIGNoYXJhY3RlciBpcyBpbiByZXF1ZXN0LnByZWZpeCwgYW5kIGZhbHNlXG4gIC8vIGlmIGl0IGlzIGluIHRoZSB3b3JkIGJlZm9yZSByZXF1ZXN0LnByZWZpeC4gVGhlIGJvb2xlYW4gcmV0dXJuIHZhbHVlIGhhcyBubyBtZWFuaW5nIGlmIHRoZSBzdHJpbmcgcmV0dXJuXG4gIC8vIHZhbHVlIGlzIGFuIGVtcHR5IHN0cmluZy5cbiAgcHVibGljIHN0YXRpYyBnZXRUcmlnZ2VyQ2hhcmFjdGVyKFxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXG4gICAgdHJpZ2dlckNoYXJzOiBzdHJpbmdbXSxcbiAgKTogW3N0cmluZywgYm9vbGVhbl0ge1xuICAgIC8vIEF1dG9Db21wbGV0ZS1QbHVzIGNvbnNpZGVycyB0ZXh0IGFmdGVyIGEgc3ltYm9sIHRvIGJlIGEgbmV3IHRyaWdnZXIuIFNvIHdlIHNob3VsZCBsb29rIGJhY2t3YXJkXG4gICAgLy8gZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gc2VlIGlmIG9uZSBpcyB0aGVyZSBhbmQgdGh1cyBzaW11bGF0ZSBpdC5cbiAgICBjb25zdCBidWZmZXIgPSByZXF1ZXN0LmVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICBjb25zdCBjdXJzb3IgPSByZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uO1xuICAgIGNvbnN0IHByZWZpeFN0YXJ0Q29sdW1uID0gY3Vyc29yLmNvbHVtbiAtIHJlcXVlc3QucHJlZml4Lmxlbmd0aDtcbiAgICBmb3IgKGNvbnN0IHRyaWdnZXJDaGFyIG9mIHRyaWdnZXJDaGFycykge1xuICAgICAgaWYgKHJlcXVlc3QucHJlZml4LmVuZHNXaXRoKHRyaWdnZXJDaGFyKSkge1xuICAgICAgICByZXR1cm4gW3RyaWdnZXJDaGFyLCB0cnVlXTtcbiAgICAgIH1cbiAgICAgIGlmIChwcmVmaXhTdGFydENvbHVtbiA+PSB0cmlnZ2VyQ2hhci5sZW5ndGgpIHsgLy8gRmFyIGVub3VnaCBhbG9uZyBhIGxpbmUgdG8gZml0IHRoZSB0cmlnZ2VyIGNoYXJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBuZXcgUG9pbnQoY3Vyc29yLnJvdywgcHJlZml4U3RhcnRDb2x1bW4gLSB0cmlnZ2VyQ2hhci5sZW5ndGgpO1xuICAgICAgICBjb25zdCBwb3NzaWJsZVRyaWdnZXIgPSBidWZmZXIuZ2V0VGV4dEluUmFuZ2UoW3N0YXJ0LCBbY3Vyc29yLnJvdywgcHJlZml4U3RhcnRDb2x1bW5dXSk7XG4gICAgICAgIGlmIChwb3NzaWJsZVRyaWdnZXIgPT09IHRyaWdnZXJDaGFyKSB7IC8vIFRoZSB0ZXh0IGJlZm9yZSBvdXIgdHJpZ2dlciBpcyBhIHRyaWdnZXIgY2hhciFcbiAgICAgICAgICByZXR1cm4gW3RyaWdnZXJDaGFyLCBmYWxzZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGVyZSB3YXMgbm8gZXhwbGljaXQgdHJpZ2dlciBjaGFyXG4gICAgcmV0dXJuIFsnJywgZmFsc2VdO1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUgVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMgdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGJhc2VkIG9uIHRoZSBlZGl0b3IgYW5kIHBvc2l0aW9uIGZyb20gdGhlIEF1dG9Db21wbGV0ZVJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHJlcXVlc3RgIFRoZSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSB0byBvYnRhaW4gdGhlIGVkaXRvciBmcm9tLlxuICAvLyAqIGB0cmlnZ2VyUG9pbnRgIFRoZSB7YXRvbSRQb2ludH0gd2hlcmUgdGhlIHRyaWdnZXIgc3RhcnRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtzdHJpbmd9IGNvbnRhaW5pbmcgdGhlIHByZWZpeCBpbmNsdWRpbmcgdGhlIHRyaWdnZXIgY2hhcmFjdGVyLlxuICBwdWJsaWMgc3RhdGljIGdldFByZWZpeFdpdGhUcmlnZ2VyKFxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXG4gICAgdHJpZ2dlclBvaW50OiBQb2ludCxcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmVxdWVzdC5lZGl0b3JcbiAgICAgIC5nZXRCdWZmZXIoKVxuICAgICAgLmdldFRleHRJblJhbmdlKFtbdHJpZ2dlclBvaW50LnJvdywgdHJpZ2dlclBvaW50LmNvbHVtbl0sIHJlcXVlc3QuYnVmZmVyUG9zaXRpb25dKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIHtDb21wbGV0aW9uUGFyYW1zfSB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gYmFzZWQgb24gdGhlIGVkaXRvciBhbmQgcG9zaXRpb24gZnJvbSB0aGUgQXV0b2NvbXBsZXRlIHJlcXVlc3QgZXRjLlxuICAvL1xuICAvLyAqIGByZXF1ZXN0YCBUaGUge2F0b20kQXV0b2NvbXBsZXRlUmVxdWVzdH0gY29udGFpbmluZyB0aGUgcmVxdWVzdCBkZXRhaWxzLlxuICAvLyAqIGB0cmlnZ2VyQ2hhcmFjdGVyYCBUaGUge3N0cmluZ30gY29udGFpbmluZyB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIgKGVtcHR5IGlmIG5vbmUpLlxuICAvLyAqIGB0cmlnZ2VyT25seWAgQSB7Ym9vbGVhbn0gcmVwcmVzZW50aW5nIHdoZXRoZXIgdGhpcyBjb21wbGV0aW9uIGlzIHRyaWdnZXJlZCByaWdodCBhZnRlciBhIHRyaWdnZXIgY2hhcmFjdGVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtDb21wbGV0aW9uUGFyYW1zfSB3aXRoIHRoZSBrZXlzOlxuICAvLyAgKiBgdGV4dERvY3VtZW50YCB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIHRleHREb2N1bWVudCBpZGVudGlmaWNhdGlvbi5cbiAgLy8gICogYHBvc2l0aW9uYCB0aGUgcG9zaXRpb24gd2l0aGluIHRoZSB0ZXh0IGRvY3VtZW50IHRvIGRpc3BsYXkgY29tcGxldGlvbiByZXF1ZXN0IGZvci5cbiAgLy8gICogYGNvbnRleHRgIGNvbnRhaW5pbmcgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIGFuZCBraW5kLlxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUNvbXBsZXRpb25QYXJhbXMoXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcbiAgICB0cmlnZ2VyQ2hhcmFjdGVyOiBzdHJpbmcsXG4gICAgdHJpZ2dlck9ubHk6IGJvb2xlYW4sXG4gICk6IENvbXBsZXRpb25QYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKHJlcXVlc3QuZWRpdG9yKSxcbiAgICAgIHBvc2l0aW9uOiBDb252ZXJ0LnBvaW50VG9Qb3NpdGlvbihyZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uKSxcbiAgICAgIGNvbnRleHQ6IEF1dG9jb21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvbkNvbnRleHQodHJpZ2dlckNoYXJhY3RlciwgdHJpZ2dlck9ubHkpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSB7Q29tcGxldGlvbkNvbnRleHR9IHRvIGJlIHNlbnQgdG8gdGhlIGxhbmd1YWdlIHNlcnZlclxuICAvLyBiYXNlZCBvbiB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIuXG4gIC8vXG4gIC8vICogYHRyaWdnZXJDaGFyYWN0ZXJgIFRoZSB7c3RyaW5nfSBjb250YWluaW5nIHRoZSB0cmlnZ2VyIGNoYXJhY3RlciBvciAnJyBpZiBub25lLlxuICAvLyAqIGB0cmlnZ2VyT25seWAgQSB7Ym9vbGVhbn0gcmVwcmVzZW50aW5nIHdoZXRoZXIgdGhpcyBjb21wbGV0aW9uIGlzIHRyaWdnZXJlZCByaWdodCBhZnRlciBhIHRyaWdnZXIgY2hhcmFjdGVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtDb21wbGV0aW9uQ29udGV4dH0gdGhhdCBzcGVjaWZpZXMgdGhlIHRyaWdnZXJLaW5kIGFuZCB0aGUgdHJpZ2dlckNoYXJhY3RlclxuICAvLyBpZiB0aGVyZSBpcyBvbmUuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlQ29tcGxldGlvbkNvbnRleHQodHJpZ2dlckNoYXJhY3Rlcjogc3RyaW5nLCB0cmlnZ2VyT25seTogYm9vbGVhbik6IENvbXBsZXRpb25Db250ZXh0IHtcbiAgICBpZiAodHJpZ2dlckNoYXJhY3RlciA9PT0gJycpIHtcbiAgICAgIHJldHVybiB7IHRyaWdnZXJLaW5kOiBDb21wbGV0aW9uVHJpZ2dlcktpbmQuSW52b2tlZCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJpZ2dlck9ubHlcbiAgICAgICAgPyB7IHRyaWdnZXJLaW5kOiBDb21wbGV0aW9uVHJpZ2dlcktpbmQuVHJpZ2dlckNoYXJhY3RlciwgdHJpZ2dlckNoYXJhY3RlciB9XG4gICAgICAgIDogeyB0cmlnZ2VyS2luZDogQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJGb3JJbmNvbXBsZXRlQ29tcGxldGlvbnMsIHRyaWdnZXJDaGFyYWN0ZXIgfTtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgQ29tcGxldGlvbkl0ZW0gYXJyYXkgb3IgQ29tcGxldGlvbkxpc3QgdG9cbiAgLy8gYW4gYXJyYXkgb2Ygb3JkZXJlZCBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb25zLlxuICAvL1xuICAvLyAqIGBjb21wbGV0aW9uSXRlbXNgIEFuIHtBcnJheX0gb2Yge0NvbXBsZXRpb25JdGVtfSBvYmplY3RzIG9yIGEge0NvbXBsZXRpb25MaXN0fSBjb250YWluaW5nIGNvbXBsZXRpb25cbiAgLy8gICAgICAgICAgIGl0ZW1zIHRvIGJlIGNvbnZlcnRlZC5cbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IHRvIHNhdGlzZnkuXG4gIC8vICogYG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtYCBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7Q29tcGxldGlvbkl0ZW19LCBhbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufVxuICAvLyAgIGFuZCBhIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IGFsbG93aW5nIHlvdSB0byBhZGp1c3QgY29udmVydGVkIGl0ZW1zLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge01hcH0gb2YgQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9ucyBvcmRlcmVkIGJ5IHRoZSBDb21wbGV0aW9uSXRlbXMgc29ydFRleHQuXG4gIHB1YmxpYyBjb21wbGV0aW9uSXRlbXNUb1N1Z2dlc3Rpb25zKFxuICAgIGNvbXBsZXRpb25JdGVtczogQ29tcGxldGlvbkl0ZW1bXSB8IENvbXBsZXRpb25MaXN0LFxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXG4gICAgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0/OiBDb21wbGV0aW9uSXRlbUFkanVzdGVyLFxuICApOiBNYXA8YWMuQW55U3VnZ2VzdGlvbiwgUG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtPiB7XG4gICAgcmV0dXJuIG5ldyBNYXAoKEFycmF5LmlzQXJyYXkoY29tcGxldGlvbkl0ZW1zKSA/IGNvbXBsZXRpb25JdGVtcyA6IGNvbXBsZXRpb25JdGVtcy5pdGVtcyB8fCBbXSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYS5zb3J0VGV4dCB8fCBhLmxhYmVsKS5sb2NhbGVDb21wYXJlKGIuc29ydFRleHQgfHwgYi5sYWJlbCkpXG4gICAgICAubWFwPFthYy5BbnlTdWdnZXN0aW9uLCBQb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW1dPihcbiAgICAgICAgKHMpID0+IFtcbiAgICAgICAgICBBdXRvY29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKFxuICAgICAgICAgICAgcywge30gYXMgYWMuQW55U3VnZ2VzdGlvbiwgcmVxdWVzdCwgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0pLFxuICAgICAgICAgIG5ldyBQb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW0ocywgZmFsc2UpXSkpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIENvbXBsZXRpb25JdGVtIHRvIGFuIEF1dG9Db21wbGV0ZSsgc3VnZ2VzdGlvbi5cbiAgLy9cbiAgLy8gKiBgaXRlbWAgQW4ge0NvbXBsZXRpb25JdGVtfSBjb250YWluaW5nIGEgY29tcGxldGlvbiBpdGVtIHRvIGJlIGNvbnZlcnRlZC5cbiAgLy8gKiBgc3VnZ2VzdGlvbmAgQSB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBoYXZlIHRoZSBjb252ZXJzaW9uIGFwcGxpZWQgdG8uXG4gIC8vICogYHJlcXVlc3RgIFRoZSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSB0byBzYXRpc2Z5LlxuICAvLyAqIGBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbWAgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEge0NvbXBsZXRpb25JdGVtfSwgYW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1cbiAgLy8gICBhbmQgYSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGNvbnZlcnRlZCBpdGVtcy5cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gcGFzc2VkIGluIGFzIHN1Z2dlc3Rpb24gd2l0aCB0aGUgY29udmVyc2lvbiBhcHBsaWVkLlxuICBwdWJsaWMgc3RhdGljIGNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKFxuICAgIGl0ZW06IENvbXBsZXRpb25JdGVtLFxuICAgIHN1Z2dlc3Rpb246IGFjLkFueVN1Z2dlc3Rpb24sXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcbiAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbT86IENvbXBsZXRpb25JdGVtQWRqdXN0ZXIsXG4gICk6IGFjLkFueVN1Z2dlc3Rpb24ge1xuICAgIEF1dG9jb21wbGV0ZUFkYXB0ZXIuYXBwbHlDb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihpdGVtLCBzdWdnZXN0aW9uIGFzIGFjLlRleHRTdWdnZXN0aW9uKTtcbiAgICBBdXRvY29tcGxldGVBZGFwdGVyLmFwcGx5VGV4dEVkaXRUb1N1Z2dlc3Rpb24oaXRlbS50ZXh0RWRpdCwgcmVxdWVzdC5lZGl0b3IsIHN1Z2dlc3Rpb24gYXMgYWMuVGV4dFN1Z2dlc3Rpb24pO1xuICAgIEF1dG9jb21wbGV0ZUFkYXB0ZXIuYXBwbHlTbmlwcGV0VG9TdWdnZXN0aW9uKGl0ZW0sIHN1Z2dlc3Rpb24gYXMgYWMuU25pcHBldFN1Z2dlc3Rpb24pO1xuICAgIGlmIChvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbSAhPSBudWxsKSB7XG4gICAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbShpdGVtLCBzdWdnZXN0aW9uLCByZXF1ZXN0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbjtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCB0aGUgcHJpbWFyeSBwYXJ0cyBvZiBhIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBDb21wbGV0aW9uSXRlbSB0byBhbiBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb24uXG4gIC8vXG4gIC8vICogYGl0ZW1gIEFuIHtDb21wbGV0aW9uSXRlbX0gY29udGFpbmluZyB0aGUgY29tcGxldGlvbiBpdGVtcyB0byBiZSBtZXJnZWQgaW50by5cbiAgLy8gKiBgc3VnZ2VzdGlvbmAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IHRvIG1lcmdlIHRoZSBjb252ZXJzaW9uIGludG8uXG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gY3JlYXRlZCBmcm9tIHRoZSB7Q29tcGxldGlvbkl0ZW19LlxuICBwdWJsaWMgc3RhdGljIGFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oXG4gICAgaXRlbTogQ29tcGxldGlvbkl0ZW0sXG4gICAgc3VnZ2VzdGlvbjogYWMuVGV4dFN1Z2dlc3Rpb24sXG4gICkge1xuICAgIHN1Z2dlc3Rpb24udGV4dCA9IGl0ZW0uaW5zZXJ0VGV4dCB8fCBpdGVtLmxhYmVsO1xuICAgIHN1Z2dlc3Rpb24uZGlzcGxheVRleHQgPSBpdGVtLmxhYmVsO1xuICAgIHN1Z2dlc3Rpb24udHlwZSA9IEF1dG9jb21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlKGl0ZW0ua2luZCk7XG4gICAgc3VnZ2VzdGlvbi5yaWdodExhYmVsID0gaXRlbS5kZXRhaWw7XG5cbiAgICAvLyBPbGRlciBmb3JtYXQsIGNhbid0IGtub3cgd2hhdCBpdCBpcyBzbyBhc3NpZ24gdG8gYm90aCBhbmQgaG9wZSBmb3IgYmVzdFxuICAgIGlmICh0eXBlb2YgKGl0ZW0uZG9jdW1lbnRhdGlvbikgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzdWdnZXN0aW9uLmRlc2NyaXB0aW9uTWFya2Rvd24gPSBpdGVtLmRvY3VtZW50YXRpb247XG4gICAgICBzdWdnZXN0aW9uLmRlc2NyaXB0aW9uID0gaXRlbS5kb2N1bWVudGF0aW9uO1xuICAgIH1cblxuICAgIGlmIChpdGVtLmRvY3VtZW50YXRpb24gIT0gbnVsbCAmJiB0eXBlb2YgKGl0ZW0uZG9jdW1lbnRhdGlvbikgPT09ICdvYmplY3QnKSB7XG4gICAgICAvLyBOZXdlciBmb3JtYXQgc3BlY2lmaWVzIHRoZSBraW5kIG9mIGRvY3VtZW50YXRpb24sIGFzc2lnbiBhcHByb3ByaWF0ZWx5XG4gICAgICBpZiAoaXRlbS5kb2N1bWVudGF0aW9uLmtpbmQgPT09ICdtYXJrZG93bicpIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5kZXNjcmlwdGlvbk1hcmtkb3duID0gaXRlbS5kb2N1bWVudGF0aW9uLnZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5kZXNjcmlwdGlvbiA9IGl0ZW0uZG9jdW1lbnRhdGlvbi52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IEFwcGxpZXMgdGhlIHRleHRFZGl0IHBhcnQgb2YgYSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgQ29tcGxldGlvbkl0ZW0gdG8gYW5cbiAgLy8gQXV0b0NvbXBsZXRlKyBTdWdnZXN0aW9uIHZpYSB0aGUgcmVwbGFjZW1lbnRQcmVmaXggYW5kIHRleHQgcHJvcGVydGllcy5cbiAgLy9cbiAgLy8gKiBgdGV4dEVkaXRgIEEge1RleHRFZGl0fSBmcm9tIGEgQ29tcGxldGlvbkl0ZW0gdG8gYXBwbHkuXG4gIC8vICogYGVkaXRvcmAgQW4gQXRvbSB7VGV4dEVkaXRvcn0gdXNlZCB0byBvYnRhaW4gdGhlIG5lY2Vzc2FyeSB0ZXh0IHJlcGxhY2VtZW50LlxuICAvLyAqIGBzdWdnZXN0aW9uYCBBbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBzZXQgdGhlIHJlcGxhY2VtZW50UHJlZml4IGFuZCB0ZXh0IHByb3BlcnRpZXMgb2YuXG4gIHB1YmxpYyBzdGF0aWMgYXBwbHlUZXh0RWRpdFRvU3VnZ2VzdGlvbihcbiAgICB0ZXh0RWRpdDogVGV4dEVkaXQgfCB1bmRlZmluZWQsXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHN1Z2dlc3Rpb246IGFjLlRleHRTdWdnZXN0aW9uLFxuICApOiB2b2lkIHtcbiAgICBpZiAodGV4dEVkaXQpIHtcbiAgICAgIHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UodGV4dEVkaXQucmFuZ2UpKTtcbiAgICAgIHN1Z2dlc3Rpb24udGV4dCA9IHRleHRFZGl0Lm5ld1RleHQ7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBBZGRzIGEgc25pcHBldCB0byB0aGUgc3VnZ2VzdGlvbiBpZiB0aGUgQ29tcGxldGlvbkl0ZW0gY29udGFpbnNcbiAgLy8gc25pcHBldC1mb3JtYXR0ZWQgdGV4dFxuICAvL1xuICAvLyAqIGBpdGVtYCBBbiB7Q29tcGxldGlvbkl0ZW19IGNvbnRhaW5pbmcgdGhlIGNvbXBsZXRpb24gaXRlbXMgdG8gYmUgbWVyZ2VkIGludG8uXG4gIC8vICogYHN1Z2dlc3Rpb25gIFRoZSB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBtZXJnZSB0aGUgY29udmVyc2lvbiBpbnRvLlxuICAvL1xuICBwdWJsaWMgc3RhdGljIGFwcGx5U25pcHBldFRvU3VnZ2VzdGlvbihpdGVtOiBDb21wbGV0aW9uSXRlbSwgc3VnZ2VzdGlvbjogYWMuU25pcHBldFN1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICBpZiAoaXRlbS5pbnNlcnRUZXh0Rm9ybWF0ID09PSBJbnNlcnRUZXh0Rm9ybWF0LlNuaXBwZXQpIHtcbiAgICAgIHN1Z2dlc3Rpb24uc25pcHBldCA9IGl0ZW0udGV4dEVkaXQgIT0gbnVsbCA/IGl0ZW0udGV4dEVkaXQubmV3VGV4dCA6IChpdGVtLmluc2VydFRleHQgfHwgJycpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIHRoZSB0ZXh0dWFsIHN1Z2dlc3Rpb24gdHlwZSByZXF1aXJlZCBieSBBdXRvQ29tcGxldGUrIHRoYXRcbiAgLy8gbW9zdCBjbG9zZWx5IG1hcHMgdG8gdGhlIG51bWVyaWMgY29tcGxldGlvbiBraW5kIHN1cHBsaWVzIGJ5IHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXG4gIC8vXG4gIC8vICogYGtpbmRgIEEge051bWJlcn0gdGhhdCByZXByZXNlbnRzIHRoZSBzdWdnZXN0aW9uIGtpbmQgdG8gYmUgY29udmVydGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1N0cmluZ30gY29udGFpbmluZyB0aGUgQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9uIHR5cGUgZXF1aXZhbGVudFxuICAvLyB0byB0aGUgZ2l2ZW4gY29tcGxldGlvbiBraW5kLlxuICBwdWJsaWMgc3RhdGljIGNvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZShraW5kOiBudW1iZXIgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuQ29uc3RhbnQ6XG4gICAgICAgIHJldHVybiAnY29uc3RhbnQnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuTWV0aG9kOlxuICAgICAgICByZXR1cm4gJ21ldGhvZCc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5GdW5jdGlvbjpcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkNvbnN0cnVjdG9yOlxuICAgICAgICByZXR1cm4gJ2Z1bmN0aW9uJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkZpZWxkOlxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHk6XG4gICAgICAgIHJldHVybiAncHJvcGVydHknO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuVmFyaWFibGU6XG4gICAgICAgIHJldHVybiAndmFyaWFibGUnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuQ2xhc3M6XG4gICAgICAgIHJldHVybiAnY2xhc3MnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuU3RydWN0OlxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuVHlwZVBhcmFtZXRlcjpcbiAgICAgICAgcmV0dXJuICd0eXBlJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLk9wZXJhdG9yOlxuICAgICAgICByZXR1cm4gJ3NlbGVjdG9yJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkludGVyZmFjZTpcbiAgICAgICAgcmV0dXJuICdtaXhpbic7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5Nb2R1bGU6XG4gICAgICAgIHJldHVybiAnbW9kdWxlJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLlVuaXQ6XG4gICAgICAgIHJldHVybiAnYnVpbHRpbic7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5FbnVtOlxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuRW51bU1lbWJlcjpcbiAgICAgICAgcmV0dXJuICdlbnVtJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQ6XG4gICAgICAgIHJldHVybiAna2V5d29yZCc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0OlxuICAgICAgICByZXR1cm4gJ3NuaXBwZXQnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuRmlsZTpcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkZvbGRlcjpcbiAgICAgICAgcmV0dXJuICdpbXBvcnQnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuUmVmZXJlbmNlOlxuICAgICAgICByZXR1cm4gJ3JlcXVpcmUnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICd2YWx1ZSc7XG4gICAgfVxuICB9XG59XG4iXX0=