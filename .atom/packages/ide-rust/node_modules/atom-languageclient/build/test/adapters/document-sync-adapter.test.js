"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const languageclient_1 = require("../../lib/languageclient");
const document_sync_adapter_1 = require("../../lib/adapters/document-sync-adapter");
describe('DocumentSyncAdapter', () => {
    describe('canAdapt', () => {
        it('returns true if v2 incremental change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: languageclient_1.TextDocumentSyncKind.Incremental,
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns true if v2 full change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: languageclient_1.TextDocumentSyncKind.Full,
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if v2 none change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: languageclient_1.TextDocumentSyncKind.None,
            });
            chai_1.expect(result).to.be.false;
        });
        it('returns true if v3 incremental change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: { change: languageclient_1.TextDocumentSyncKind.Incremental },
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns true if v3 full change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: { change: languageclient_1.TextDocumentSyncKind.Full },
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if v3 none change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: { change: languageclient_1.TextDocumentSyncKind.None },
            });
            chai_1.expect(result).to.be.false;
        });
    });
    describe('constructor', () => {
        function create(textDocumentSync) {
            return new document_sync_adapter_1.default(null, () => false, textDocumentSync, (_t, f) => f());
        }
        it('sets _documentSync.change correctly Incremental for v2 capabilities', () => {
            const result = create(languageclient_1.TextDocumentSyncKind.Incremental)._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Incremental);
        });
        it('sets _documentSync.change correctly Full for v2 capabilities', () => {
            const result = create(languageclient_1.TextDocumentSyncKind.Full)._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Full);
        });
        it('sets _documentSync.change correctly Incremental for v3 capabilities', () => {
            const result = create({ change: languageclient_1.TextDocumentSyncKind.Incremental })._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Incremental);
        });
        it('sets _documentSync.change correctly Full for v3 capabilities', () => {
            const result = create({ change: languageclient_1.TextDocumentSyncKind.Full })._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Full);
        });
        it('sets _documentSync.change correctly Full for unset capabilities', () => {
            const result = create()._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Full);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQtc3luYy1hZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQThCO0FBQzlCLDZEQUF5RjtBQUN6RixvRkFBMkU7QUFFM0UsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN4QixFQUFFLENBQUMsbUVBQW1FLEVBQUUsR0FBRyxFQUFFO1lBQzNFLE1BQU0sTUFBTSxHQUFHLCtCQUFtQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsZ0JBQWdCLEVBQUUscUNBQW9CLENBQUMsV0FBVzthQUNuRCxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNERBQTRELEVBQUUsR0FBRyxFQUFFO1lBQ3BFLE1BQU0sTUFBTSxHQUFHLCtCQUFtQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsZ0JBQWdCLEVBQUUscUNBQW9CLENBQUMsSUFBSTthQUM1QyxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3JFLE1BQU0sTUFBTSxHQUFHLCtCQUFtQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsZ0JBQWdCLEVBQUUscUNBQW9CLENBQUMsSUFBSTthQUM1QyxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDN0IsQ0FB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LENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1lBQ3pFLE1BQU0sTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDN0MsYUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxxQ0FBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcbmltcG9ydCB7IFRleHREb2N1bWVudFN5bmNLaW5kLCBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyB9IGZyb20gJy4uLy4uL2xpYi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQgRG9jdW1lbnRTeW5jQWRhcHRlciBmcm9tICcuLi8uLi9saWIvYWRhcHRlcnMvZG9jdW1lbnQtc3luYy1hZGFwdGVyJztcblxuZGVzY3JpYmUoJ0RvY3VtZW50U3luY0FkYXB0ZXInLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdjYW5BZGFwdCcsICgpID0+IHtcbiAgICBpdCgncmV0dXJucyB0cnVlIGlmIHYyIGluY3JlbWVudGFsIGNoYW5nZSBub3RpZmljYXRpb25zIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHtcbiAgICAgICAgdGV4dERvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWwsXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLnRydWU7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyB0cnVlIGlmIHYyIGZ1bGwgY2hhbmdlIG5vdGlmaWNhdGlvbnMgYXJlIHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IERvY3VtZW50U3luY0FkYXB0ZXIuY2FuQWRhcHQoe1xuICAgICAgICB0ZXh0RG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsLFxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS50cnVlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldHVybnMgZmFsc2UgaWYgdjIgbm9uZSBjaGFuZ2Ugbm90aWZpY2F0aW9ucyBhcmUgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gRG9jdW1lbnRTeW5jQWRhcHRlci5jYW5BZGFwdCh7XG4gICAgICAgIHRleHREb2N1bWVudFN5bmM6IFRleHREb2N1bWVudFN5bmNLaW5kLk5vbmUsXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLmZhbHNlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldHVybnMgdHJ1ZSBpZiB2MyBpbmNyZW1lbnRhbCBjaGFuZ2Ugbm90aWZpY2F0aW9ucyBhcmUgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gRG9jdW1lbnRTeW5jQWRhcHRlci5jYW5BZGFwdCh7XG4gICAgICAgIHRleHREb2N1bWVudFN5bmM6IHsgY2hhbmdlOiBUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbCB9LFxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS50cnVlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldHVybnMgdHJ1ZSBpZiB2MyBmdWxsIGNoYW5nZSBub3RpZmljYXRpb25zIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHtcbiAgICAgICAgdGV4dERvY3VtZW50U3luYzogeyBjaGFuZ2U6IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwgfSxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUudHJ1ZTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGZhbHNlIGlmIHYzIG5vbmUgY2hhbmdlIG5vdGlmaWNhdGlvbnMgYXJlIHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IERvY3VtZW50U3luY0FkYXB0ZXIuY2FuQWRhcHQoe1xuICAgICAgICB0ZXh0RG9jdW1lbnRTeW5jOiB7IGNoYW5nZTogVGV4dERvY3VtZW50U3luY0tpbmQuTm9uZSB9LFxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS5mYWxzZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbnN0cnVjdG9yJywgKCkgPT4ge1xuICAgIGZ1bmN0aW9uIGNyZWF0ZSh0ZXh0RG9jdW1lbnRTeW5jPzogVGV4dERvY3VtZW50U3luY0tpbmQgfCBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucykge1xuICAgICAgcmV0dXJuIG5ldyBEb2N1bWVudFN5bmNBZGFwdGVyKG51bGwgYXMgYW55LCAoKSA9PiBmYWxzZSwgdGV4dERvY3VtZW50U3luYywgKF90LCBmKSA9PiBmKCkpO1xuICAgIH1cblxuICAgIGl0KCdzZXRzIF9kb2N1bWVudFN5bmMuY2hhbmdlIGNvcnJlY3RseSBJbmNyZW1lbnRhbCBmb3IgdjIgY2FwYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlKFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsKS5fZG9jdW1lbnRTeW5jLmNoYW5nZTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLmVxdWFscyhUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2V0cyBfZG9jdW1lbnRTeW5jLmNoYW5nZSBjb3JyZWN0bHkgRnVsbCBmb3IgdjIgY2FwYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlKFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwpLl9kb2N1bWVudFN5bmMuY2hhbmdlO1xuICAgICAgZXhwZWN0KHJlc3VsdCkuZXF1YWxzKFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NldHMgX2RvY3VtZW50U3luYy5jaGFuZ2UgY29ycmVjdGx5IEluY3JlbWVudGFsIGZvciB2MyBjYXBhYmlsaXRpZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBjcmVhdGUoeyBjaGFuZ2U6IFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsIH0pLl9kb2N1bWVudFN5bmMuY2hhbmdlO1xuICAgICAgZXhwZWN0KHJlc3VsdCkuZXF1YWxzKFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZXRzIF9kb2N1bWVudFN5bmMuY2hhbmdlIGNvcnJlY3RseSBGdWxsIGZvciB2MyBjYXBhYmlsaXRpZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBjcmVhdGUoeyBjaGFuZ2U6IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwgfSkuX2RvY3VtZW50U3luYy5jaGFuZ2U7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2V0cyBfZG9jdW1lbnRTeW5jLmNoYW5nZSBjb3JyZWN0bHkgRnVsbCBmb3IgdW5zZXQgY2FwYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlKCkuX2RvY3VtZW50U3luYy5jaGFuZ2U7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbCk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=