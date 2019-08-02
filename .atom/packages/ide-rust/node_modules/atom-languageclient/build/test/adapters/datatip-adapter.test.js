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
const invariant = require("assert");
const atom_1 = require("atom");
const chai_1 = require("chai");
const sinon = require("sinon");
const ls = require("../../lib/languageclient");
const datatip_adapter_1 = require("../../lib/adapters/datatip-adapter");
const helpers_js_1 = require("../helpers.js");
describe('DatatipAdapter', () => {
    let fakeEditor;
    let connection;
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
        connection = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection());
        fakeEditor = helpers_js_1.createFakeEditor();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    describe('canAdapt', () => {
        it('returns true if hoverProvider is supported', () => {
            const result = datatip_adapter_1.default.canAdapt({ hoverProvider: true });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if hoverProvider not supported', () => {
            const result = datatip_adapter_1.default.canAdapt({});
            chai_1.expect(result).to.be.false;
        });
    });
    describe('getDatatip', () => {
        it('calls LSP document/hover at the given position', () => __awaiter(this, void 0, void 0, function* () {
            sinon.stub(connection, 'hover').resolves({
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 2 },
                },
                contents: ['test', { language: 'testlang', value: 'test snippet' }],
            });
            const grammarSpy = sinon.spy(atom.grammars, 'grammarForScopeName');
            const datatipAdapter = new datatip_adapter_1.default();
            const datatip = yield datatipAdapter.getDatatip(connection, fakeEditor, new atom_1.Point(0, 0));
            chai_1.expect(datatip).to.be.ok;
            invariant(datatip != null);
            if (datatip) {
                chai_1.expect(datatip.range.start.row).equal(0);
                chai_1.expect(datatip.range.start.column).equal(1);
                chai_1.expect(datatip.range.end.row).equal(0);
                chai_1.expect(datatip.range.end.column).equal(2);
                chai_1.expect(datatip.markedStrings).to.have.lengthOf(2);
                chai_1.expect(datatip.markedStrings[0]).eql({ type: 'markdown', value: 'test' });
                const snippet = datatip.markedStrings[1];
                chai_1.expect(snippet.type).equal('snippet');
                invariant(snippet.type === 'snippet');
                chai_1.expect(snippet.grammar.scopeName).equal('text.plain.null-grammar');
                chai_1.expect(snippet.value).equal('test snippet');
                chai_1.expect(grammarSpy.calledWith('source.testlang')).to.be.true;
            }
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YXRpcC1hZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2FkYXB0ZXJzL2RhdGF0aXAtYWRhcHRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxvQ0FBcUM7QUFDckMsK0JBQTZCO0FBQzdCLCtCQUE4QjtBQUM5QiwrQkFBK0I7QUFDL0IsK0NBQStDO0FBQy9DLHdFQUFnRTtBQUNoRSw4Q0FBc0U7QUFFdEUsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixJQUFJLFVBQWUsQ0FBQztJQUNwQixJQUFJLFVBQWUsQ0FBQztJQUVwQixVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9DLFVBQVUsR0FBRyxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxnQ0FBbUIsRUFBRSxDQUFDLENBQUM7UUFDcEUsVUFBVSxHQUFHLDZCQUFnQixFQUFFLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ1osTUFBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ3hCLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7WUFDcEQsTUFBTSxNQUFNLEdBQUcseUJBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNoRSxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELE1BQU0sTUFB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QUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO2FBQzdEO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW52YXJpYW50ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IERhdGF0aXBBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9kYXRhdGlwLWFkYXB0ZXInO1xuaW1wb3J0IHsgY3JlYXRlU3B5Q29ubmVjdGlvbiwgY3JlYXRlRmFrZUVkaXRvciB9IGZyb20gJy4uL2hlbHBlcnMuanMnO1xuXG5kZXNjcmliZSgnRGF0YXRpcEFkYXB0ZXInLCAoKSA9PiB7XG4gIGxldCBmYWtlRWRpdG9yOiBhbnk7XG4gIGxldCBjb25uZWN0aW9uOiBhbnk7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnNpbm9uID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgICBjb25uZWN0aW9uID0gbmV3IGxzLkxhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbihjcmVhdGVTcHlDb25uZWN0aW9uKCkpO1xuICAgIGZha2VFZGl0b3IgPSBjcmVhdGVGYWtlRWRpdG9yKCk7XG4gIH0pO1xuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIChnbG9iYWwgYXMgYW55KS5zaW5vbi5yZXN0b3JlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjYW5BZGFwdCcsICgpID0+IHtcbiAgICBpdCgncmV0dXJucyB0cnVlIGlmIGhvdmVyUHJvdmlkZXIgaXMgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gRGF0YXRpcEFkYXB0ZXIuY2FuQWRhcHQoeyBob3ZlclByb3ZpZGVyOiB0cnVlIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUudHJ1ZTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGZhbHNlIGlmIGhvdmVyUHJvdmlkZXIgbm90IHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IERhdGF0aXBBZGFwdGVyLmNhbkFkYXB0KHt9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLmZhbHNlO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0RGF0YXRpcCcsICgpID0+IHtcbiAgICBpdCgnY2FsbHMgTFNQIGRvY3VtZW50L2hvdmVyIGF0IHRoZSBnaXZlbiBwb3NpdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoY29ubmVjdGlvbiwgJ2hvdmVyJykucmVzb2x2ZXMoe1xuICAgICAgICByYW5nZToge1xuICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMSB9LFxuICAgICAgICAgIGVuZDogeyBsaW5lOiAwLCBjaGFyYWN0ZXI6IDIgfSxcbiAgICAgICAgfSxcbiAgICAgICAgY29udGVudHM6IFsndGVzdCcsIHsgbGFuZ3VhZ2U6ICd0ZXN0bGFuZycsIHZhbHVlOiAndGVzdCBzbmlwcGV0JyB9XSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBncmFtbWFyU3B5ID0gc2lub24uc3B5KGF0b20uZ3JhbW1hcnMsICdncmFtbWFyRm9yU2NvcGVOYW1lJyk7XG5cbiAgICAgIGNvbnN0IGRhdGF0aXBBZGFwdGVyID0gbmV3IERhdGF0aXBBZGFwdGVyKCk7XG4gICAgICBjb25zdCBkYXRhdGlwID0gYXdhaXQgZGF0YXRpcEFkYXB0ZXIuZ2V0RGF0YXRpcChjb25uZWN0aW9uLCBmYWtlRWRpdG9yLCBuZXcgUG9pbnQoMCwgMCkpO1xuICAgICAgZXhwZWN0KGRhdGF0aXApLnRvLmJlLm9rO1xuICAgICAgaW52YXJpYW50KGRhdGF0aXAgIT0gbnVsbCk7XG5cbiAgICAgIGlmIChkYXRhdGlwKSB7XG4gICAgICAgIGV4cGVjdChkYXRhdGlwLnJhbmdlLnN0YXJ0LnJvdykuZXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChkYXRhdGlwLnJhbmdlLnN0YXJ0LmNvbHVtbikuZXF1YWwoMSk7XG4gICAgICAgIGV4cGVjdChkYXRhdGlwLnJhbmdlLmVuZC5yb3cpLmVxdWFsKDApO1xuICAgICAgICBleHBlY3QoZGF0YXRpcC5yYW5nZS5lbmQuY29sdW1uKS5lcXVhbCgyKTtcblxuICAgICAgICBleHBlY3QoZGF0YXRpcC5tYXJrZWRTdHJpbmdzKS50by5oYXZlLmxlbmd0aE9mKDIpO1xuICAgICAgICBleHBlY3QoZGF0YXRpcC5tYXJrZWRTdHJpbmdzWzBdKS5lcWwoeyB0eXBlOiAnbWFya2Rvd24nLCB2YWx1ZTogJ3Rlc3QnIH0pO1xuXG4gICAgICAgIGNvbnN0IHNuaXBwZXQgPSBkYXRhdGlwLm1hcmtlZFN0cmluZ3NbMV07XG4gICAgICAgIGV4cGVjdChzbmlwcGV0LnR5cGUpLmVxdWFsKCdzbmlwcGV0Jyk7XG4gICAgICAgIGludmFyaWFudChzbmlwcGV0LnR5cGUgPT09ICdzbmlwcGV0Jyk7XG4gICAgICAgIGV4cGVjdCgoc25pcHBldCBhcyBhbnkpLmdyYW1tYXIuc2NvcGVOYW1lKS5lcXVhbCgndGV4dC5wbGFpbi5udWxsLWdyYW1tYXInKTtcbiAgICAgICAgZXhwZWN0KHNuaXBwZXQudmFsdWUpLmVxdWFsKCd0ZXN0IHNuaXBwZXQnKTtcblxuICAgICAgICBleHBlY3QoZ3JhbW1hclNweS5jYWxsZWRXaXRoKCdzb3VyY2UudGVzdGxhbmcnKSkudG8uYmUudHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==