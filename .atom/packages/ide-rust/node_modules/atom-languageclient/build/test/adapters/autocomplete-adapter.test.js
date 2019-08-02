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
const autocomplete_adapter_1 = require("../../lib/adapters/autocomplete-adapter");
const ls = require("../../lib/languageclient");
const sinon = require("sinon");
const atom_1 = require("atom");
const chai_1 = require("chai");
const helpers_js_1 = require("../helpers.js");
describe('AutoCompleteAdapter', () => {
    function createActiveServerSpy() {
        return {
            capabilities: { completionProvider: {} },
            connection: new ls.LanguageClientConnection(helpers_js_1.createSpyConnection()),
            disposable: new atom_1.CompositeDisposable(),
            process: undefined,
            projectPath: '/',
            additionalPaths: new Set(),
            considerDefinitionPath: (_) => { },
        };
    }
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    const request = {
        editor: helpers_js_1.createFakeEditor(),
        bufferPosition: new atom_1.Point(123, 456),
        prefix: 'lab',
        scopeDescriptor: { getScopesArray() { return ['some.scope']; } },
        activatedManually: true,
    };
    const completionItems = [
        {
            label: 'label1',
            kind: ls.CompletionItemKind.Keyword,
            detail: 'description1',
            documentation: 'a very exciting keyword',
            sortText: 'z',
        },
        {
            label: 'label2',
            kind: ls.CompletionItemKind.Field,
            detail: 'description2',
            documentation: 'a very exciting field',
            sortText: 'a',
        },
        {
            label: 'label3',
            kind: ls.CompletionItemKind.Variable,
            detail: 'description3',
            documentation: 'a very exciting variable',
        },
        {
            label: 'filteredout',
            kind: ls.CompletionItemKind.Snippet,
            detail: 'description4',
            documentation: 'should not appear',
            sortText: 'zzz',
        },
    ];
    describe('getSuggestions', () => {
        const server = createActiveServerSpy();
        sinon.stub(server.connection, 'completion').resolves(completionItems);
        it('gets AutoComplete suggestions via LSP given an AutoCompleteRequest', () => __awaiter(this, void 0, void 0, function* () {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = yield autoCompleteAdapter.getSuggestions(server, request);
            chai_1.expect(results.length).equals(3);
            chai_1.expect(results[0].text).equals('label2');
            chai_1.expect(results[1].description).equals('a very exciting variable');
            chai_1.expect(results[2].type).equals('keyword');
        }));
    });
    describe('completeSuggestion', () => {
        const partialItems = [
            {
                label: 'label1',
                kind: ls.CompletionItemKind.Keyword,
                sortText: 'z',
            },
            {
                label: 'label2',
                kind: ls.CompletionItemKind.Field,
                sortText: 'a',
            },
            {
                label: 'label3',
                kind: ls.CompletionItemKind.Variable,
            },
        ];
        const server = createActiveServerSpy();
        sinon.stub(server.connection, 'completion').resolves(partialItems);
        sinon.stub(server.connection, 'completionItemResolve').resolves({
            label: 'label3',
            kind: ls.CompletionItemKind.Variable,
            detail: 'description3',
            documentation: 'a very exciting variable',
        });
        it('resolves suggestions via LSP given an AutoCompleteRequest', () => __awaiter(this, void 0, void 0, function* () {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = yield autoCompleteAdapter.getSuggestions(server, request);
            chai_1.expect(results[2].description).equals(undefined);
            const resolvedItem = yield autoCompleteAdapter.completeSuggestion(server, results[2], request);
            chai_1.expect(resolvedItem && resolvedItem.description).equals('a very exciting variable');
        }));
    });
    describe('createCompletionParams', () => {
        it('creates CompletionParams from an AutocompleteRequest with no trigger', () => {
            const result = autocomplete_adapter_1.default.createCompletionParams(request, '', true);
            chai_1.expect(result.textDocument.uri).equals('file:///a/b/c/d.js');
            chai_1.expect(result.position).deep.equals({ line: 123, character: 456 });
            chai_1.expect(result.context && result.context.triggerKind === ls.CompletionTriggerKind.Invoked);
            chai_1.expect(result.context && result.context.triggerCharacter === undefined);
        });
        it('creates CompletionParams from an AutocompleteRequest with a trigger', () => {
            const result = autocomplete_adapter_1.default.createCompletionParams(request, '.', true);
            chai_1.expect(result.textDocument.uri).equals('file:///a/b/c/d.js');
            chai_1.expect(result.position).deep.equals({ line: 123, character: 456 });
            chai_1.expect(result.context && result.context.triggerKind === ls.CompletionTriggerKind.TriggerCharacter);
            chai_1.expect(result.context && result.context.triggerCharacter === '.');
        });
        it('creates CompletionParams from an AutocompleteRequest for a follow-up request', () => {
            const result = autocomplete_adapter_1.default.createCompletionParams(request, '.', false);
            chai_1.expect(result.textDocument.uri).equals('file:///a/b/c/d.js');
            chai_1.expect(result.position).deep.equals({ line: 123, character: 456 });
            chai_1.expect(result.context && result.context.triggerKind === ls.CompletionTriggerKind.TriggerForIncompleteCompletions);
            chai_1.expect(result.context && result.context.triggerCharacter === '.');
        });
    });
    describe('completionItemsToSuggestions', () => {
        it('converts LSP CompletionItem array to AutoComplete Suggestions array', () => {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions(completionItems, request));
            chai_1.expect(results.length).equals(4);
            chai_1.expect(results[0][0].text).equals('label2');
            chai_1.expect(results[1][0].description).equals('a very exciting variable');
            chai_1.expect(results[2][0].type).equals('keyword');
        });
        it('converts LSP CompletionList to AutoComplete Suggestions array', () => {
            const completionList = { items: completionItems, isIncomplete: false };
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions(completionList, request));
            chai_1.expect(results.length).equals(4);
            chai_1.expect(results[0][0].description).equals('a very exciting field');
            chai_1.expect(results[1][0].text).equals('label3');
        });
        it('converts LSP CompletionList to AutoComplete Suggestions array using the onDidConvertCompletionItem', () => {
            const completionList = { items: completionItems, isIncomplete: false };
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions(completionList, request, (c, a, r) => {
                a.text = c.label + ' ok';
                a.displayText = r.scopeDescriptor.getScopesArray()[0];
            }));
            chai_1.expect(results.length).equals(4);
            chai_1.expect(results[0][0].displayText).equals('some.scope');
            chai_1.expect(results[1][0].text).equals('label3 ok');
        });
        it('converts empty array into an empty AutoComplete Suggestions array', () => {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions([], request));
            chai_1.expect(results.length).equals(0);
        });
    });
    describe('completionItemToSuggestion', () => {
        it('converts LSP CompletionItem to AutoComplete Suggestion without textEdit', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'keyword',
                documentation: 'a truly useful keyword',
            };
            const result = { text: '' };
            autocomplete_adapter_1.default.completionItemToSuggestion(completionItem, result, request);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('keyword');
            chai_1.expect(result.description).equals('a truly useful keyword');
            chai_1.expect(result.descriptionMarkdown).equals('a truly useful keyword');
        });
        it('converts LSP CompletionItem to AutoComplete Suggestion with textEdit', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Variable,
                detail: 'number',
                documentation: 'a truly useful variable',
                textEdit: {
                    range: {
                        start: { line: 10, character: 20 },
                        end: { line: 30, character: 40 },
                    },
                    newText: 'newText',
                },
            };
            const autocompleteRequest = {
                editor: helpers_js_1.createFakeEditor(),
                bufferPosition: new atom_1.Point(123, 456),
                prefix: 'def',
                scopeDescriptor: { getScopesArray() { return ['some.scope']; } },
                activatedManually: false,
            };
            sinon.stub(autocompleteRequest.editor, 'getTextInBufferRange').returns('replacementPrefix');
            const result = {};
            autocomplete_adapter_1.default.completionItemToSuggestion(completionItem, result, autocompleteRequest);
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('variable');
            chai_1.expect(result.rightLabel).equals('number');
            chai_1.expect(result.description).equals('a truly useful variable');
            chai_1.expect(result.descriptionMarkdown).equals('a truly useful variable');
            chai_1.expect(result.replacementPrefix).equals('replacementPrefix');
            chai_1.expect(result.text).equals('newText');
            chai_1.expect(autocompleteRequest.editor.getTextInBufferRange.calledOnce).equals(true);
            chai_1.expect(autocompleteRequest.editor.getTextInBufferRange.getCall(0).args).deep.equals([
                new atom_1.Range(new atom_1.Point(10, 20), new atom_1.Point(30, 40)),
            ]);
        });
    });
    describe('applyCompletionItemToSuggestion', () => {
        it('converts LSP CompletionItem with insertText and filterText to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: 'a very exciting keyword',
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals('a very exciting keyword');
            chai_1.expect(result.descriptionMarkdown).equals('a very exciting keyword');
        });
        it('converts LSP CompletionItem with missing documentation to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals(undefined);
            chai_1.expect(result.descriptionMarkdown).equals(undefined);
        });
        it('converts LSP CompletionItem with markdown documentation to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: { value: 'Some *markdown*', kind: 'markdown' },
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals(undefined);
            chai_1.expect(result.descriptionMarkdown).equals('Some *markdown*');
        });
        it('converts LSP CompletionItem with plaintext documentation to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: { value: 'Some plain text', kind: 'plaintext' },
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals('Some plain text');
            chai_1.expect(result.descriptionMarkdown).equals(undefined);
        });
        it('converts LSP CompletionItem without insertText or filterText to AutoComplete Suggestion', () => {
            const completionItem = {
                label: 'label',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: 'A very useful keyword',
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('label');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals('A very useful keyword');
            // expect(result.descriptionMarkdown).equals('A very useful keyword');
        });
    });
    describe('applyTextEditToSuggestion', () => {
        it('does not do anything if there is no textEdit', () => {
            const completionItem = { text: '' };
            autocomplete_adapter_1.default.applyTextEditToSuggestion(undefined, new atom_1.TextEditor(), completionItem);
            chai_1.expect(completionItem).deep.equals({ text: '' });
        });
        it('applies changes from TextEdit to replacementPrefix and text', () => {
            const textEdit = {
                range: {
                    start: { line: 1, character: 2 },
                    end: { line: 3, character: 4 },
                },
                newText: 'newText',
            };
            const editor = new atom_1.TextEditor();
            sinon.stub(editor, 'getTextInBufferRange').returns('replacementPrefix');
            const completionItem = { text: '' };
            autocomplete_adapter_1.default.applyTextEditToSuggestion(textEdit, editor, completionItem);
            chai_1.expect(completionItem.replacementPrefix).equals('replacementPrefix');
            chai_1.expect(completionItem.text).equals('newText');
            chai_1.expect(editor.getTextInBufferRange.calledOnce).equals(true);
            chai_1.expect(editor.getTextInBufferRange.getCall(0).args).deep.equals([new atom_1.Range(new atom_1.Point(1, 2), new atom_1.Point(3, 4))]);
        });
    });
    describe('completionKindToSuggestionType', () => {
        it('converts LSP CompletionKinds to AutoComplete SuggestionTypes', () => {
            const variable = autocomplete_adapter_1.default.completionKindToSuggestionType(ls.CompletionItemKind.Variable);
            const constructor = autocomplete_adapter_1.default.completionKindToSuggestionType(ls.CompletionItemKind.Constructor);
            const module = autocomplete_adapter_1.default.completionKindToSuggestionType(ls.CompletionItemKind.Module);
            chai_1.expect(variable).equals('variable');
            chai_1.expect(constructor).equals('function');
            chai_1.expect(module).equals('module');
        });
        it('defaults to "value"', () => {
            const result = autocomplete_adapter_1.default.completionKindToSuggestionType(undefined);
            chai_1.expect(result).equals('value');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLWFkYXB0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsa0ZBQTBFO0FBRTFFLCtDQUErQztBQUMvQywrQkFBK0I7QUFDL0IsK0JBS2M7QUFFZCwrQkFBOEI7QUFDOUIsOENBQXNFO0FBRXRFLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsU0FBUyxxQkFBcUI7UUFDNUIsT0FBTztZQUNMLFlBQVksRUFBRSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRTtZQUN4QyxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsd0JBQXdCLENBQUMsZ0NBQW1CLEVBQUUsQ0FBQztZQUNsRSxVQUFVLEVBQUUsSUFBSSwwQkFBbUIsRUFBRTtZQUNyQyxPQUFPLEVBQUUsU0FBZ0I7WUFDekIsV0FBVyxFQUFFLEdBQUc7WUFDaEIsZUFBZSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQzFCLHNCQUFzQixFQUFFLENBQUMsQ0FBUyxFQUFRLEVBQUUsR0FBRSxDQUFDO1NBQ2hELENBQUM7SUFDSixDQUFDO0lBRUQsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNiLE1BQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUNILFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDWixNQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEdBQWlDO1FBQzVDLE1BQU0sRUFBRSw2QkFBZ0IsRUFBRTtRQUMxQixjQUFjLEVBQUUsSUFBSSxZQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztRQUNuQyxNQUFNLEVBQUUsS0FBSztR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SyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUM5QyxFQUFFLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO1lBQ3RFLE1BQU0sUUFBUSxHQUFHLDhCQUFtQixDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwRyxNQUFNLFdBQVcsR0FBRyw4QkFBbUIsQ0FBQyw4QkFBOEIsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDMUcsTUFBTSxNQUFNLEdBQUcsOEJBQW1CLENBQUMsOEJBQThCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hHLGFBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEMsYUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QyxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUM3QixNQUFNLE1BQU0sR0FBRyw4QkFBbUIsQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3RSxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBdXRvQ29tcGxldGVBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9hdXRvY29tcGxldGUtYWRhcHRlcic7XG5pbXBvcnQgeyBBY3RpdmVTZXJ2ZXIgfSBmcm9tICcuLi8uLi9saWIvc2VydmVyLW1hbmFnZXIuanMnO1xuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi4vLi4vbGliL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCAqIGFzIHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCB7XG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIFBvaW50LFxuICBSYW5nZSxcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgKiBhcyBhYyBmcm9tICdhdG9tL2F1dG9jb21wbGV0ZS1wbHVzJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0IHsgY3JlYXRlU3B5Q29ubmVjdGlvbiwgY3JlYXRlRmFrZUVkaXRvciB9IGZyb20gJy4uL2hlbHBlcnMuanMnO1xuXG5kZXNjcmliZSgnQXV0b0NvbXBsZXRlQWRhcHRlcicsICgpID0+IHtcbiAgZnVuY3Rpb24gY3JlYXRlQWN0aXZlU2VydmVyU3B5KCkge1xuICAgIHJldHVybiB7XG4gICAgICBjYXBhYmlsaXRpZXM6IHsgY29tcGxldGlvblByb3ZpZGVyOiB7fSB9LFxuICAgICAgY29ubmVjdGlvbjogbmV3IGxzLkxhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbihjcmVhdGVTcHlDb25uZWN0aW9uKCkpLFxuICAgICAgZGlzcG9zYWJsZTogbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKSxcbiAgICAgIHByb2Nlc3M6IHVuZGVmaW5lZCBhcyBhbnksXG4gICAgICBwcm9qZWN0UGF0aDogJy8nLFxuICAgICAgYWRkaXRpb25hbFBhdGhzOiBuZXcgU2V0KCksXG4gICAgICBjb25zaWRlckRlZmluaXRpb25QYXRoOiAoXzogc3RyaW5nKTogdm9pZCA9PiB7fSxcbiAgICB9O1xuICB9XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnNpbm9uID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgfSk7XG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnNpbm9uLnJlc3RvcmUoKTtcbiAgfSk7XG5cbiAgY29uc3QgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCA9IHtcbiAgICBlZGl0b3I6IGNyZWF0ZUZha2VFZGl0b3IoKSxcbiAgICBidWZmZXJQb3NpdGlvbjogbmV3IFBvaW50KDEyMywgNDU2KSxcbiAgICBwcmVmaXg6ICdsYWInLFxuICAgIHNjb3BlRGVzY3JpcHRvcjogeyBnZXRTY29wZXNBcnJheSgpIHsgcmV0dXJuIFsnc29tZS5zY29wZSddOyB9IH0sXG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IHRydWUsXG4gIH07XG5cbiAgY29uc3QgY29tcGxldGlvbkl0ZW1zID0gW1xuICAgIHtcbiAgICAgIGxhYmVsOiAnbGFiZWwxJyxcbiAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkLFxuICAgICAgZGV0YWlsOiAnZGVzY3JpcHRpb24xJyxcbiAgICAgIGRvY3VtZW50YXRpb246ICdhIHZlcnkgZXhjaXRpbmcga2V5d29yZCcsXG4gICAgICBzb3J0VGV4dDogJ3onLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdsYWJlbDInLFxuICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLkZpZWxkLFxuICAgICAgZGV0YWlsOiAnZGVzY3JpcHRpb24yJyxcbiAgICAgIGRvY3VtZW50YXRpb246ICdhIHZlcnkgZXhjaXRpbmcgZmllbGQnLFxuICAgICAgc29ydFRleHQ6ICdhJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiAnbGFiZWwzJyxcbiAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5WYXJpYWJsZSxcbiAgICAgIGRldGFpbDogJ2Rlc2NyaXB0aW9uMycsXG4gICAgICBkb2N1bWVudGF0aW9uOiAnYSB2ZXJ5IGV4Y2l0aW5nIHZhcmlhYmxlJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiAnZmlsdGVyZWRvdXQnLFxuICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXG4gICAgICBkZXRhaWw6ICdkZXNjcmlwdGlvbjQnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ3Nob3VsZCBub3QgYXBwZWFyJyxcbiAgICAgIHNvcnRUZXh0OiAnenp6JyxcbiAgICB9LFxuICBdO1xuXG4gIGRlc2NyaWJlKCdnZXRTdWdnZXN0aW9ucycsICgpID0+IHtcbiAgICBjb25zdCBzZXJ2ZXI6IEFjdGl2ZVNlcnZlciA9IGNyZWF0ZUFjdGl2ZVNlcnZlclNweSgpO1xuICAgIHNpbm9uLnN0dWIoc2VydmVyLmNvbm5lY3Rpb24sICdjb21wbGV0aW9uJykucmVzb2x2ZXMoY29tcGxldGlvbkl0ZW1zKTtcblxuICAgIGl0KCdnZXRzIEF1dG9Db21wbGV0ZSBzdWdnZXN0aW9ucyB2aWEgTFNQIGdpdmVuIGFuIEF1dG9Db21wbGV0ZVJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhdXRvQ29tcGxldGVBZGFwdGVyID0gbmV3IEF1dG9Db21wbGV0ZUFkYXB0ZXIoKTtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBhdXRvQ29tcGxldGVBZGFwdGVyLmdldFN1Z2dlc3Rpb25zKHNlcnZlciwgcmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0cy5sZW5ndGgpLmVxdWFscygzKTtcbiAgICAgIGV4cGVjdCgocmVzdWx0c1swXSBhcyBhYy5UZXh0U3VnZ2VzdGlvbikudGV4dCkuZXF1YWxzKCdsYWJlbDInKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzWzFdLmRlc2NyaXB0aW9uKS5lcXVhbHMoJ2EgdmVyeSBleGNpdGluZyB2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMl0udHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjb21wbGV0ZVN1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgcGFydGlhbEl0ZW1zID0gW1xuICAgICAge1xuICAgICAgICBsYWJlbDogJ2xhYmVsMScsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkLFxuICAgICAgICBzb3J0VGV4dDogJ3onLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdsYWJlbDInLFxuICAgICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuRmllbGQsXG4gICAgICAgIHNvcnRUZXh0OiAnYScsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogJ2xhYmVsMycsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5WYXJpYWJsZSxcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIGNvbnN0IHNlcnZlcjogQWN0aXZlU2VydmVyID0gY3JlYXRlQWN0aXZlU2VydmVyU3B5KCk7XG4gICAgc2lub24uc3R1YihzZXJ2ZXIuY29ubmVjdGlvbiwgJ2NvbXBsZXRpb24nKS5yZXNvbHZlcyhwYXJ0aWFsSXRlbXMpO1xuICAgIHNpbm9uLnN0dWIoc2VydmVyLmNvbm5lY3Rpb24sICdjb21wbGV0aW9uSXRlbVJlc29sdmUnKS5yZXNvbHZlcyh7XG4gICAgICBsYWJlbDogJ2xhYmVsMycsXG4gICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuVmFyaWFibGUsXG4gICAgICBkZXRhaWw6ICdkZXNjcmlwdGlvbjMnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ2EgdmVyeSBleGNpdGluZyB2YXJpYWJsZScsXG4gICAgfSk7XG5cbiAgICBpdCgncmVzb2x2ZXMgc3VnZ2VzdGlvbnMgdmlhIExTUCBnaXZlbiBhbiBBdXRvQ29tcGxldGVSZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXV0b0NvbXBsZXRlQWRhcHRlciA9IG5ldyBBdXRvQ29tcGxldGVBZGFwdGVyKCk7XG4gICAgICBjb25zdCByZXN1bHRzOiBhYy5BbnlTdWdnZXN0aW9uW10gPSBhd2FpdCBhdXRvQ29tcGxldGVBZGFwdGVyLmdldFN1Z2dlc3Rpb25zKHNlcnZlciwgcmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0c1syXS5kZXNjcmlwdGlvbikuZXF1YWxzKHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCByZXNvbHZlZEl0ZW0gPSBhd2FpdCBhdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRlU3VnZ2VzdGlvbihzZXJ2ZXIsIHJlc3VsdHNbMl0sIHJlcXVlc3QpO1xuICAgICAgZXhwZWN0KHJlc29sdmVkSXRlbSAmJiByZXNvbHZlZEl0ZW0uZGVzY3JpcHRpb24pLmVxdWFscygnYSB2ZXJ5IGV4Y2l0aW5nIHZhcmlhYmxlJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjcmVhdGVDb21wbGV0aW9uUGFyYW1zJywgKCkgPT4ge1xuICAgIGl0KCdjcmVhdGVzIENvbXBsZXRpb25QYXJhbXMgZnJvbSBhbiBBdXRvY29tcGxldGVSZXF1ZXN0IHdpdGggbm8gdHJpZ2dlcicsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEF1dG9Db21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvblBhcmFtcyhyZXF1ZXN0LCAnJywgdHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHREb2N1bWVudC51cmkpLmVxdWFscygnZmlsZTovLy9hL2IvYy9kLmpzJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnBvc2l0aW9uKS5kZWVwLmVxdWFscyh7IGxpbmU6IDEyMywgY2hhcmFjdGVyOiA0NTYgfSk7XG4gICAgICBleHBlY3QocmVzdWx0LmNvbnRleHQgJiYgcmVzdWx0LmNvbnRleHQudHJpZ2dlcktpbmQgPT09IGxzLkNvbXBsZXRpb25UcmlnZ2VyS2luZC5JbnZva2VkKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29udGV4dCAmJiByZXN1bHQuY29udGV4dC50cmlnZ2VyQ2hhcmFjdGVyID09PSB1bmRlZmluZWQpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NyZWF0ZXMgQ29tcGxldGlvblBhcmFtcyBmcm9tIGFuIEF1dG9jb21wbGV0ZVJlcXVlc3Qgd2l0aCBhIHRyaWdnZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBBdXRvQ29tcGxldGVBZGFwdGVyLmNyZWF0ZUNvbXBsZXRpb25QYXJhbXMocmVxdWVzdCwgJy4nLCB0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGV4dERvY3VtZW50LnVyaSkuZXF1YWxzKCdmaWxlOi8vL2EvYi9jL2QuanMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucG9zaXRpb24pLmRlZXAuZXF1YWxzKHsgbGluZTogMTIzLCBjaGFyYWN0ZXI6IDQ1NiB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29udGV4dCAmJiByZXN1bHQuY29udGV4dC50cmlnZ2VyS2luZCA9PT0gbHMuQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJDaGFyYWN0ZXIpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb250ZXh0ICYmIHJlc3VsdC5jb250ZXh0LnRyaWdnZXJDaGFyYWN0ZXIgPT09ICcuJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY3JlYXRlcyBDb21wbGV0aW9uUGFyYW1zIGZyb20gYW4gQXV0b2NvbXBsZXRlUmVxdWVzdCBmb3IgYSBmb2xsb3ctdXAgcmVxdWVzdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEF1dG9Db21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvblBhcmFtcyhyZXF1ZXN0LCAnLicsIGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGV4dERvY3VtZW50LnVyaSkuZXF1YWxzKCdmaWxlOi8vL2EvYi9jL2QuanMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucG9zaXRpb24pLmRlZXAuZXF1YWxzKHsgbGluZTogMTIzLCBjaGFyYWN0ZXI6IDQ1NiB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29udGV4dCAmJiByZXN1bHQuY29udGV4dC50cmlnZ2VyS2luZCA9PT0gbHMuQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJGb3JJbmNvbXBsZXRlQ29tcGxldGlvbnMpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb250ZXh0ICYmIHJlc3VsdC5jb250ZXh0LnRyaWdnZXJDaGFyYWN0ZXIgPT09ICcuJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjb21wbGV0aW9uSXRlbXNUb1N1Z2dlc3Rpb25zJywgKCkgPT4ge1xuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbkl0ZW0gYXJyYXkgdG8gQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb25zIGFycmF5JywgKCkgPT4ge1xuICAgICAgY29uc3QgYXV0b0NvbXBsZXRlQWRhcHRlciA9IG5ldyBBdXRvQ29tcGxldGVBZGFwdGVyKCk7XG4gICAgICBjb25zdCByZXN1bHRzID0gQXJyYXkuZnJvbShhdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25JdGVtc1RvU3VnZ2VzdGlvbnMoY29tcGxldGlvbkl0ZW1zLCByZXF1ZXN0KSk7XG4gICAgICBleHBlY3QocmVzdWx0cy5sZW5ndGgpLmVxdWFscyg0KTtcbiAgICAgIGV4cGVjdCgocmVzdWx0c1swXVswXSBhcyBhYy5UZXh0U3VnZ2VzdGlvbikudGV4dCkuZXF1YWxzKCdsYWJlbDInKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzWzFdWzBdLmRlc2NyaXB0aW9uKS5lcXVhbHMoJ2EgdmVyeSBleGNpdGluZyB2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMl1bMF0udHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgTFNQIENvbXBsZXRpb25MaXN0IHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9ucyBhcnJheScsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25MaXN0ID0geyBpdGVtczogY29tcGxldGlvbkl0ZW1zLCBpc0luY29tcGxldGU6IGZhbHNlIH07XG4gICAgICBjb25zdCBhdXRvQ29tcGxldGVBZGFwdGVyID0gbmV3IEF1dG9Db21wbGV0ZUFkYXB0ZXIoKTtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBBcnJheS5mcm9tKGF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhjb21wbGV0aW9uTGlzdCwgcmVxdWVzdCkpO1xuICAgICAgZXhwZWN0KHJlc3VsdHMubGVuZ3RoKS5lcXVhbHMoNCk7XG4gICAgICBleHBlY3QocmVzdWx0c1swXVswXS5kZXNjcmlwdGlvbikuZXF1YWxzKCdhIHZlcnkgZXhjaXRpbmcgZmllbGQnKTtcbiAgICAgIGV4cGVjdCgocmVzdWx0c1sxXVswXSBhcyBhYy5UZXh0U3VnZ2VzdGlvbikudGV4dCkuZXF1YWxzKCdsYWJlbDMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbkxpc3QgdG8gQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb25zIGFycmF5IHVzaW5nIHRoZSBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbScsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25MaXN0ID0geyBpdGVtczogY29tcGxldGlvbkl0ZW1zLCBpc0luY29tcGxldGU6IGZhbHNlIH07XG4gICAgICBjb25zdCBhdXRvQ29tcGxldGVBZGFwdGVyID0gbmV3IEF1dG9Db21wbGV0ZUFkYXB0ZXIoKTtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPVxuICAgICAgICBBcnJheS5mcm9tKFxuICAgICAgICAgIGF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhjb21wbGV0aW9uTGlzdCwgcmVxdWVzdCwgKGMsIGEsIHIpID0+IHtcbiAgICAgICAgICAgIChhIGFzIGFjLlRleHRTdWdnZXN0aW9uKS50ZXh0ID0gYy5sYWJlbCArICcgb2snO1xuICAgICAgICAgICAgYS5kaXNwbGF5VGV4dCA9IHIuc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KClbMF07XG4gICAgICAgICAgfSkpO1xuXG4gICAgICBleHBlY3QocmVzdWx0cy5sZW5ndGgpLmVxdWFscyg0KTtcbiAgICAgIGV4cGVjdChyZXN1bHRzWzBdWzBdLmRpc3BsYXlUZXh0KS5lcXVhbHMoJ3NvbWUuc2NvcGUnKTtcbiAgICAgIGV4cGVjdCgocmVzdWx0c1sxXVswXSBhcyBhYy5UZXh0U3VnZ2VzdGlvbikudGV4dCkuZXF1YWxzKCdsYWJlbDMgb2snKTtcbiAgICB9KTtcblxuICAgIGl0KCdjb252ZXJ0cyBlbXB0eSBhcnJheSBpbnRvIGFuIGVtcHR5IEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9ucyBhcnJheScsICgpID0+IHtcbiAgICAgIGNvbnN0IGF1dG9Db21wbGV0ZUFkYXB0ZXIgPSBuZXcgQXV0b0NvbXBsZXRlQWRhcHRlcigpO1xuICAgICAgY29uc3QgcmVzdWx0cyA9IEFycmF5LmZyb20oYXV0b0NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uSXRlbXNUb1N1Z2dlc3Rpb25zKFtdLCByZXF1ZXN0KSk7XG4gICAgICBleHBlY3QocmVzdWx0cy5sZW5ndGgpLmVxdWFscygwKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbkl0ZW0gdG8gQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb24gd2l0aG91dCB0ZXh0RWRpdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtID0ge1xuICAgICAgICBpbnNlcnRUZXh0OiAnaW5zZXJ0JyxcbiAgICAgICAgbGFiZWw6ICdsYWJlbCcsXG4gICAgICAgIGZpbHRlclRleHQ6ICdmaWx0ZXInLFxuICAgICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuS2V5d29yZCxcbiAgICAgICAgZGV0YWlsOiAna2V5d29yZCcsXG4gICAgICAgIGRvY3VtZW50YXRpb246ICdhIHRydWx5IHVzZWZ1bCBrZXl3b3JkJyxcbiAgICAgIH07XG4gICAgICBjb25zdCByZXN1bHQ6IGFjLlRleHRTdWdnZXN0aW9uID0geyB0ZXh0OiAnJyB9O1xuICAgICAgQXV0b0NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihjb21wbGV0aW9uSXRlbSwgcmVzdWx0LCByZXF1ZXN0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGV4dCkuZXF1YWxzKCdpbnNlcnQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGlzcGxheVRleHQpLmVxdWFscygnbGFiZWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJpZ2h0TGFiZWwpLmVxdWFscygna2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbikuZXF1YWxzKCdhIHRydWx5IHVzZWZ1bCBrZXl3b3JkJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlc2NyaXB0aW9uTWFya2Rvd24pLmVxdWFscygnYSB0cnVseSB1c2VmdWwga2V5d29yZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbiB3aXRoIHRleHRFZGl0JywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW06IGxzLkNvbXBsZXRpb25JdGVtID0ge1xuICAgICAgICBpbnNlcnRUZXh0OiAnaW5zZXJ0JyxcbiAgICAgICAgbGFiZWw6ICdsYWJlbCcsXG4gICAgICAgIGZpbHRlclRleHQ6ICdmaWx0ZXInLFxuICAgICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuVmFyaWFibGUsXG4gICAgICAgIGRldGFpbDogJ251bWJlcicsXG4gICAgICAgIGRvY3VtZW50YXRpb246ICdhIHRydWx5IHVzZWZ1bCB2YXJpYWJsZScsXG4gICAgICAgIHRleHRFZGl0OiB7XG4gICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDEwLCBjaGFyYWN0ZXI6IDIwIH0sXG4gICAgICAgICAgICBlbmQ6IHsgbGluZTogMzAsIGNoYXJhY3RlcjogNDAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG5ld1RleHQ6ICduZXdUZXh0JyxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBjb25zdCBhdXRvY29tcGxldGVSZXF1ZXN0OiBhYy5TdWdnZXN0aW9uc1JlcXVlc3RlZEV2ZW50ID0ge1xuICAgICAgICBlZGl0b3I6IGNyZWF0ZUZha2VFZGl0b3IoKSxcbiAgICAgICAgYnVmZmVyUG9zaXRpb246IG5ldyBQb2ludCgxMjMsIDQ1NiksXG4gICAgICAgIHByZWZpeDogJ2RlZicsXG4gICAgICAgIHNjb3BlRGVzY3JpcHRvcjogeyBnZXRTY29wZXNBcnJheSgpIHsgcmV0dXJuIFsnc29tZS5zY29wZSddOyB9IH0sXG4gICAgICAgIGFjdGl2YXRlZE1hbnVhbGx5OiBmYWxzZSxcbiAgICAgIH07XG4gICAgICBzaW5vbi5zdHViKGF1dG9jb21wbGV0ZVJlcXVlc3QuZWRpdG9yLCAnZ2V0VGV4dEluQnVmZmVyUmFuZ2UnKS5yZXR1cm5zKCdyZXBsYWNlbWVudFByZWZpeCcpO1xuICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcbiAgICAgIEF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oY29tcGxldGlvbkl0ZW0sIHJlc3VsdCwgYXV0b2NvbXBsZXRlUmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRpc3BsYXlUZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnR5cGUpLmVxdWFscygndmFyaWFibGUnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmlnaHRMYWJlbCkuZXF1YWxzKCdudW1iZXInKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb24pLmVxdWFscygnYSB0cnVseSB1c2VmdWwgdmFyaWFibGUnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKCdhIHRydWx5IHVzZWZ1bCB2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZXBsYWNlbWVudFByZWZpeCkuZXF1YWxzKCdyZXBsYWNlbWVudFByZWZpeCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50ZXh0KS5lcXVhbHMoJ25ld1RleHQnKTtcbiAgICAgIGV4cGVjdCgoYXV0b2NvbXBsZXRlUmVxdWVzdCBhcyBhbnkpLmVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZS5jYWxsZWRPbmNlKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QoKGF1dG9jb21wbGV0ZVJlcXVlc3QgYXMgYW55KS5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UuZ2V0Q2FsbCgwKS5hcmdzKS5kZWVwLmVxdWFscyhbXG4gICAgICAgIG5ldyBSYW5nZShuZXcgUG9pbnQoMTAsIDIwKSwgbmV3IFBvaW50KDMwLCA0MCkpLFxuICAgICAgXSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdhcHBseUNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbkl0ZW0gd2l0aCBpbnNlcnRUZXh0IGFuZCBmaWx0ZXJUZXh0IHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW06IGxzLkNvbXBsZXRpb25JdGVtID0ge1xuICAgICAgICBpbnNlcnRUZXh0OiAnaW5zZXJ0JyxcbiAgICAgICAgbGFiZWw6ICdsYWJlbCcsXG4gICAgICAgIGZpbHRlclRleHQ6ICdmaWx0ZXInLFxuICAgICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuS2V5d29yZCxcbiAgICAgICAgZGV0YWlsOiAnZGV0YWlsJyxcbiAgICAgICAgZG9jdW1lbnRhdGlvbjogJ2EgdmVyeSBleGNpdGluZyBrZXl3b3JkJyxcbiAgICAgIH07XG4gICAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9O1xuICAgICAgQXV0b0NvbXBsZXRlQWRhcHRlci5hcHBseUNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKGNvbXBsZXRpb25JdGVtLCByZXN1bHQpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50ZXh0KS5lcXVhbHMoJ2luc2VydCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kaXNwbGF5VGV4dCkuZXF1YWxzKCdsYWJlbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50eXBlKS5lcXVhbHMoJ2tleXdvcmQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmlnaHRMYWJlbCkuZXF1YWxzKCdkZXRhaWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb24pLmVxdWFscygnYSB2ZXJ5IGV4Y2l0aW5nIGtleXdvcmQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKCdhIHZlcnkgZXhjaXRpbmcga2V5d29yZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB3aXRoIG1pc3NpbmcgZG9jdW1lbnRhdGlvbiB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSA9IHtcbiAgICAgICAgaW5zZXJ0VGV4dDogJ2luc2VydCcsXG4gICAgICAgIGxhYmVsOiAnbGFiZWwnLFxuICAgICAgICBmaWx0ZXJUZXh0OiAnZmlsdGVyJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICAgIGRldGFpbDogJ2RldGFpbCcsXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcbiAgICAgIEF1dG9Db21wbGV0ZUFkYXB0ZXIuYXBwbHlDb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihjb21wbGV0aW9uSXRlbSwgcmVzdWx0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGV4dCkuZXF1YWxzKCdpbnNlcnQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGlzcGxheVRleHQpLmVxdWFscygnbGFiZWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJpZ2h0TGFiZWwpLmVxdWFscygnZGV0YWlsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlc2NyaXB0aW9uKS5lcXVhbHModW5kZWZpbmVkKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgTFNQIENvbXBsZXRpb25JdGVtIHdpdGggbWFya2Rvd24gZG9jdW1lbnRhdGlvbiB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSA9IHtcbiAgICAgICAgaW5zZXJ0VGV4dDogJ2luc2VydCcsXG4gICAgICAgIGxhYmVsOiAnbGFiZWwnLFxuICAgICAgICBmaWx0ZXJUZXh0OiAnZmlsdGVyJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICAgIGRldGFpbDogJ2RldGFpbCcsXG4gICAgICAgIGRvY3VtZW50YXRpb246IHsgdmFsdWU6ICdTb21lICptYXJrZG93bionLCBraW5kOiAnbWFya2Rvd24nIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcbiAgICAgIEF1dG9Db21wbGV0ZUFkYXB0ZXIuYXBwbHlDb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihjb21wbGV0aW9uSXRlbSwgcmVzdWx0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGV4dCkuZXF1YWxzKCdpbnNlcnQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGlzcGxheVRleHQpLmVxdWFscygnbGFiZWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJpZ2h0TGFiZWwpLmVxdWFscygnZGV0YWlsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlc2NyaXB0aW9uKS5lcXVhbHModW5kZWZpbmVkKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKCdTb21lICptYXJrZG93bionKTtcbiAgICB9KTtcblxuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbkl0ZW0gd2l0aCBwbGFpbnRleHQgZG9jdW1lbnRhdGlvbiB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSA9IHtcbiAgICAgICAgaW5zZXJ0VGV4dDogJ2luc2VydCcsXG4gICAgICAgIGxhYmVsOiAnbGFiZWwnLFxuICAgICAgICBmaWx0ZXJUZXh0OiAnZmlsdGVyJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICAgIGRldGFpbDogJ2RldGFpbCcsXG4gICAgICAgIGRvY3VtZW50YXRpb246IHsgdmFsdWU6ICdTb21lIHBsYWluIHRleHQnLCBraW5kOiAncGxhaW50ZXh0JyB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge307XG4gICAgICBBdXRvQ29tcGxldGVBZGFwdGVyLmFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oY29tcGxldGlvbkl0ZW0sIHJlc3VsdCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHQpLmVxdWFscygnaW5zZXJ0Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRpc3BsYXlUZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnR5cGUpLmVxdWFscygna2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yaWdodExhYmVsKS5lcXVhbHMoJ2RldGFpbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbikuZXF1YWxzKCdTb21lIHBsYWluIHRleHQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgTFNQIENvbXBsZXRpb25JdGVtIHdpdGhvdXQgaW5zZXJ0VGV4dCBvciBmaWx0ZXJUZXh0IHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW06IGxzLkNvbXBsZXRpb25JdGVtID0ge1xuICAgICAgICBsYWJlbDogJ2xhYmVsJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICAgIGRldGFpbDogJ2RldGFpbCcsXG4gICAgICAgIGRvY3VtZW50YXRpb246ICdBIHZlcnkgdXNlZnVsIGtleXdvcmQnLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge307XG4gICAgICBBdXRvQ29tcGxldGVBZGFwdGVyLmFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oY29tcGxldGlvbkl0ZW0sIHJlc3VsdCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHQpLmVxdWFscygnbGFiZWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGlzcGxheVRleHQpLmVxdWFscygnbGFiZWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJpZ2h0TGFiZWwpLmVxdWFscygnZGV0YWlsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlc2NyaXB0aW9uKS5lcXVhbHMoJ0EgdmVyeSB1c2VmdWwga2V5d29yZCcpO1xuICAgICAgLy8gZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbk1hcmtkb3duKS5lcXVhbHMoJ0EgdmVyeSB1c2VmdWwga2V5d29yZCcpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnYXBwbHlUZXh0RWRpdFRvU3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICBpdCgnZG9lcyBub3QgZG8gYW55dGhpbmcgaWYgdGhlcmUgaXMgbm8gdGV4dEVkaXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wbGV0aW9uSXRlbTogYWMuVGV4dFN1Z2dlc3Rpb24gPSB7IHRleHQ6ICcnIH07XG4gICAgICBBdXRvQ29tcGxldGVBZGFwdGVyLmFwcGx5VGV4dEVkaXRUb1N1Z2dlc3Rpb24odW5kZWZpbmVkLCBuZXcgVGV4dEVkaXRvcigpLCBjb21wbGV0aW9uSXRlbSk7XG4gICAgICBleHBlY3QoY29tcGxldGlvbkl0ZW0pLmRlZXAuZXF1YWxzKHsgdGV4dDogJycgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYXBwbGllcyBjaGFuZ2VzIGZyb20gVGV4dEVkaXQgdG8gcmVwbGFjZW1lbnRQcmVmaXggYW5kIHRleHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXh0RWRpdCA9IHtcbiAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICBzdGFydDogeyBsaW5lOiAxLCBjaGFyYWN0ZXI6IDIgfSxcbiAgICAgICAgICBlbmQ6IHsgbGluZTogMywgY2hhcmFjdGVyOiA0IH0sXG4gICAgICAgIH0sXG4gICAgICAgIG5ld1RleHQ6ICduZXdUZXh0JyxcbiAgICAgIH07XG4gICAgICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcigpO1xuICAgICAgc2lub24uc3R1YihlZGl0b3IsICdnZXRUZXh0SW5CdWZmZXJSYW5nZScpLnJldHVybnMoJ3JlcGxhY2VtZW50UHJlZml4Jyk7XG5cbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBhYy5UZXh0U3VnZ2VzdGlvbiA9IHsgdGV4dDogJycgfTtcbiAgICAgIEF1dG9Db21wbGV0ZUFkYXB0ZXIuYXBwbHlUZXh0RWRpdFRvU3VnZ2VzdGlvbih0ZXh0RWRpdCwgZWRpdG9yLCBjb21wbGV0aW9uSXRlbSk7XG4gICAgICBleHBlY3QoY29tcGxldGlvbkl0ZW0ucmVwbGFjZW1lbnRQcmVmaXgpLmVxdWFscygncmVwbGFjZW1lbnRQcmVmaXgnKTtcbiAgICAgIGV4cGVjdChjb21wbGV0aW9uSXRlbS50ZXh0KS5lcXVhbHMoJ25ld1RleHQnKTtcbiAgICAgIGV4cGVjdCgoZWRpdG9yIGFzIGFueSkuZ2V0VGV4dEluQnVmZmVyUmFuZ2UuY2FsbGVkT25jZSkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KChlZGl0b3IgYXMgYW55KS5nZXRUZXh0SW5CdWZmZXJSYW5nZS5nZXRDYWxsKDApLmFyZ3MpLmRlZXAuZXF1YWxzKFxuICAgICAgICBbbmV3IFJhbmdlKG5ldyBQb2ludCgxLCAyKSwgbmV3IFBvaW50KDMsIDQpKV0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlJywgKCkgPT4ge1xuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbktpbmRzIHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9uVHlwZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB2YXJpYWJsZSA9IEF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlKGxzLkNvbXBsZXRpb25JdGVtS2luZC5WYXJpYWJsZSk7XG4gICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IEF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlKGxzLkNvbXBsZXRpb25JdGVtS2luZC5Db25zdHJ1Y3Rvcik7XG4gICAgICBjb25zdCBtb2R1bGUgPSBBdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZShscy5Db21wbGV0aW9uSXRlbUtpbmQuTW9kdWxlKTtcbiAgICAgIGV4cGVjdCh2YXJpYWJsZSkuZXF1YWxzKCd2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KGNvbnN0cnVjdG9yKS5lcXVhbHMoJ2Z1bmN0aW9uJyk7XG4gICAgICBleHBlY3QobW9kdWxlKS5lcXVhbHMoJ21vZHVsZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2RlZmF1bHRzIHRvIFwidmFsdWVcIicsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlKHVuZGVmaW5lZCk7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoJ3ZhbHVlJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=