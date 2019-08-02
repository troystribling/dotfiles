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
const atom_1 = require("atom");
const signature_help_adapter_1 = require("../../lib/adapters/signature-help-adapter");
const helpers_1 = require("../helpers");
const chai_1 = require("chai");
const sinon = require("sinon");
describe('SignatureHelpAdapter', () => {
    describe('canAdapt', () => {
        it('checks for signatureHelpProvider', () => {
            chai_1.expect(signature_help_adapter_1.default.canAdapt({})).to.equal(false);
            chai_1.expect(signature_help_adapter_1.default.canAdapt({ signatureHelpProvider: {} })).to.equal(true);
        });
    });
    describe('can attach to a server', () => {
        it('subscribes to onPublishDiagnostics', () => __awaiter(this, void 0, void 0, function* () {
            const connection = helpers_1.createSpyConnection();
            connection.signatureHelp = sinon.stub().resolves({ signatures: [] });
            const adapter = new signature_help_adapter_1.default({
                connection,
                capabilities: {
                    signatureHelpProvider: {
                        triggerCharacters: ['(', ','],
                    },
                },
            }, ['source.js']);
            const spy = sinon.stub().returns(new atom_1.Disposable());
            adapter.attach(spy);
            chai_1.expect(spy.calledOnce).to.be.true;
            const provider = spy.firstCall.args[0];
            chai_1.expect(provider.priority).to.equal(1);
            chai_1.expect(provider.grammarScopes).to.deep.equal(['source.js']);
            chai_1.expect(provider.triggerCharacters).to.deep.equal(new Set(['(', ',']));
            chai_1.expect(typeof provider.getSignatureHelp).to.equal('function');
            const result = yield provider.getSignatureHelp(helpers_1.createFakeEditor('test.txt'), new atom_1.Point(0, 1));
            chai_1.expect(connection.signatureHelp.calledOnce).to.be.true;
            const params = connection.signatureHelp.firstCall.args[0];
            chai_1.expect(params).to.deep.equal({
                textDocument: { uri: 'file:///test.txt' },
                position: { line: 0, character: 1 },
            });
            chai_1.expect(result).to.deep.equal({ signatures: [] });
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlLWhlbHAtYWRhcHRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9hZGFwdGVycy9zaWduYXR1cmUtaGVscC1hZGFwdGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQUF5QztBQUN6QyxzRkFBNkU7QUFDN0Usd0NBQW1FO0FBQ25FLCtCQUE4QjtBQUM5QiwrQkFBK0I7QUFFL0IsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtJQUNwQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN4QixFQUFFLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzFDLGFBQU0sQ0FBQyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFELGFBQU0sQ0FBQyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0RixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUN0QyxFQUFFLENBQUMsb0NBQW9DLEVBQUUsR0FBUyxFQUFFO1lBQ2xELE1BQU0sVUFBVSxHQUFHLDZCQUFtQixFQUFFLENBQUM7WUFDeEMsVUFBa0IsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTlFLE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQW9CLENBQ3RDO2dCQUNFLFVBQVU7Z0JBQ1YsWUFBWSxFQUFFO29CQUNaLHFCQUFxQixFQUFFO3dCQUNyQixpQkFBaUIsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7cUJBQzlCO2lCQUNGO2FBQ0ssRUFDUixDQUFDLFdBQVcsQ0FBQyxDQUNkLENBQUM7WUFDRixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksaUJBQVUsRUFBRSxDQUFDLENBQUM7WUFDbkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixhQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGFBQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxhQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUM1RCxhQUFNLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLGFBQU0sQ0FBQyxPQUFPLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFOUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsMEJBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxZQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUYsYUFBTSxDQUFFLFVBQWtCLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2hFLE1BQU0sTUFBTSxHQUFJLFVBQWtCLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkUsYUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUMzQixZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQ3pDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTthQUNwQyxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpc3Bvc2FibGUsIFBvaW50IH0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgU2lnbmF0dXJlSGVscEFkYXB0ZXIgZnJvbSAnLi4vLi4vbGliL2FkYXB0ZXJzL3NpZ25hdHVyZS1oZWxwLWFkYXB0ZXInO1xuaW1wb3J0IHsgY3JlYXRlRmFrZUVkaXRvciwgY3JlYXRlU3B5Q29ubmVjdGlvbiB9IGZyb20gJy4uL2hlbHBlcnMnO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5cbmRlc2NyaWJlKCdTaWduYXR1cmVIZWxwQWRhcHRlcicsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2NhbkFkYXB0JywgKCkgPT4ge1xuICAgIGl0KCdjaGVja3MgZm9yIHNpZ25hdHVyZUhlbHBQcm92aWRlcicsICgpID0+IHtcbiAgICAgIGV4cGVjdChTaWduYXR1cmVIZWxwQWRhcHRlci5jYW5BZGFwdCh7fSkpLnRvLmVxdWFsKGZhbHNlKTtcbiAgICAgIGV4cGVjdChTaWduYXR1cmVIZWxwQWRhcHRlci5jYW5BZGFwdCh7IHNpZ25hdHVyZUhlbHBQcm92aWRlcjoge30gfSkpLnRvLmVxdWFsKHRydWUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY2FuIGF0dGFjaCB0byBhIHNlcnZlcicsICgpID0+IHtcbiAgICBpdCgnc3Vic2NyaWJlcyB0byBvblB1Ymxpc2hEaWFnbm9zdGljcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBjcmVhdGVTcHlDb25uZWN0aW9uKCk7XG4gICAgICAoY29ubmVjdGlvbiBhcyBhbnkpLnNpZ25hdHVyZUhlbHAgPSBzaW5vbi5zdHViKCkucmVzb2x2ZXMoeyBzaWduYXR1cmVzOiBbXSB9KTtcblxuICAgICAgY29uc3QgYWRhcHRlciA9IG5ldyBTaWduYXR1cmVIZWxwQWRhcHRlcihcbiAgICAgICAge1xuICAgICAgICAgIGNvbm5lY3Rpb24sXG4gICAgICAgICAgY2FwYWJpbGl0aWVzOiB7XG4gICAgICAgICAgICBzaWduYXR1cmVIZWxwUHJvdmlkZXI6IHtcbiAgICAgICAgICAgICAgdHJpZ2dlckNoYXJhY3RlcnM6IFsnKCcsICcsJ10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0gYXMgYW55LFxuICAgICAgICBbJ3NvdXJjZS5qcyddLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IHNweSA9IHNpbm9uLnN0dWIoKS5yZXR1cm5zKG5ldyBEaXNwb3NhYmxlKCkpO1xuICAgICAgYWRhcHRlci5hdHRhY2goc3B5KTtcbiAgICAgIGV4cGVjdChzcHkuY2FsbGVkT25jZSkudG8uYmUudHJ1ZTtcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gc3B5LmZpcnN0Q2FsbC5hcmdzWzBdO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyLnByaW9yaXR5KS50by5lcXVhbCgxKTtcbiAgICAgIGV4cGVjdChwcm92aWRlci5ncmFtbWFyU2NvcGVzKS50by5kZWVwLmVxdWFsKFsnc291cmNlLmpzJ10pO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyLnRyaWdnZXJDaGFyYWN0ZXJzKS50by5kZWVwLmVxdWFsKG5ldyBTZXQoWycoJywgJywnXSkpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBwcm92aWRlci5nZXRTaWduYXR1cmVIZWxwKS50by5lcXVhbCgnZnVuY3Rpb24nKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcHJvdmlkZXIuZ2V0U2lnbmF0dXJlSGVscChjcmVhdGVGYWtlRWRpdG9yKCd0ZXN0LnR4dCcpLCBuZXcgUG9pbnQoMCwgMSkpO1xuICAgICAgZXhwZWN0KChjb25uZWN0aW9uIGFzIGFueSkuc2lnbmF0dXJlSGVscC5jYWxsZWRPbmNlKS50by5iZS50cnVlO1xuICAgICAgY29uc3QgcGFyYW1zID0gKGNvbm5lY3Rpb24gYXMgYW55KS5zaWduYXR1cmVIZWxwLmZpcnN0Q2FsbC5hcmdzWzBdO1xuICAgICAgZXhwZWN0KHBhcmFtcykudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIHRleHREb2N1bWVudDogeyB1cmk6ICdmaWxlOi8vL3Rlc3QudHh0JyB9LFxuICAgICAgICBwb3NpdGlvbjogeyBsaW5lOiAwLCBjaGFyYWN0ZXI6IDEgfSxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uZGVlcC5lcXVhbCh7IHNpZ25hdHVyZXM6IFtdIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19