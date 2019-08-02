"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const outline_view_adapter_1 = require("../../lib/adapters/outline-view-adapter");
const ls = require("../../lib/languageclient");
const sinon = require("sinon");
const chai_1 = require("chai");
const atom_1 = require("atom");
describe('OutlineViewAdapter', () => {
    const createRange = (a, b, c, d) => ({ start: { line: a, character: b }, end: { line: c, character: d } });
    const createLocation = (a, b, c, d) => ({
        uri: '',
        range: createRange(a, b, c, d),
    });
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    describe('canAdapt', () => {
        it('returns true if documentSymbolProvider is supported', () => {
            const result = outline_view_adapter_1.default.canAdapt({ documentSymbolProvider: true });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if documentSymbolProvider not supported', () => {
            const result = outline_view_adapter_1.default.canAdapt({});
            chai_1.expect(result).to.be.false;
        });
    });
    describe('createHierarchicalOutlineTrees', () => {
        it('creates an empty array given an empty array', () => {
            const result = outline_view_adapter_1.default.createHierarchicalOutlineTrees([]);
            chai_1.expect(result).to.deep.equal([]);
        });
        it('converts symbols without the children field', () => {
            const sourceItem = {
                name: 'test',
                kind: ls.SymbolKind.Function,
                range: createRange(1, 1, 2, 2),
                selectionRange: createRange(1, 1, 2, 2),
            };
            const expected = [outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceItem)];
            const result = outline_view_adapter_1.default.createHierarchicalOutlineTrees([sourceItem]);
            chai_1.expect(result).to.deep.equal(expected);
        });
        it('converts symbols with an empty children list', () => {
            const sourceItem = {
                name: 'test',
                kind: ls.SymbolKind.Function,
                range: createRange(1, 1, 2, 2),
                selectionRange: createRange(1, 1, 2, 2),
                children: [],
            };
            const expected = [outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceItem)];
            const result = outline_view_adapter_1.default.createHierarchicalOutlineTrees([sourceItem]);
            chai_1.expect(result).to.deep.equal(expected);
        });
        it('sorts symbols by location', () => {
            const sourceA = {
                name: 'test',
                kind: ls.SymbolKind.Function,
                range: createRange(2, 2, 3, 3),
                selectionRange: createRange(2, 2, 3, 3),
            };
            const sourceB = {
                name: 'test',
                kind: ls.SymbolKind.Function,
                range: createRange(1, 1, 2, 2),
                selectionRange: createRange(1, 1, 2, 2),
            };
            const expected = [
                outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceB),
                outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceA),
            ];
            const result = outline_view_adapter_1.default.createHierarchicalOutlineTrees([
                sourceA,
                sourceB,
            ]);
            chai_1.expect(result).to.deep.equal(expected);
        });
        it('converts symbols with children', () => {
            const sourceChildA = {
                name: 'childA',
                kind: ls.SymbolKind.Function,
                range: createRange(2, 2, 3, 3),
                selectionRange: createRange(2, 2, 3, 3),
            };
            const sourceChildB = {
                name: 'childB',
                kind: ls.SymbolKind.Function,
                range: createRange(1, 1, 2, 2),
                selectionRange: createRange(1, 1, 2, 2),
            };
            const sourceParent = {
                name: 'parent',
                kind: ls.SymbolKind.Function,
                range: createRange(1, 1, 3, 3),
                selectionRange: createRange(1, 1, 3, 3),
                children: [sourceChildA, sourceChildB],
            };
            const expectedParent = outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceParent);
            expectedParent.children = [
                outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceChildB),
                outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceChildA),
            ];
            const result = outline_view_adapter_1.default.createHierarchicalOutlineTrees([
                sourceParent,
            ]);
            chai_1.expect(result).to.deep.equal([expectedParent]);
        });
    });
    describe('createOutlineTrees', () => {
        it('creates an empty array given an empty array', () => {
            const result = outline_view_adapter_1.default.createOutlineTrees([]);
            chai_1.expect(result).to.deep.equal([]);
        });
        it('creates a single converted root item from a single source item', () => {
            const sourceItem = { kind: ls.SymbolKind.Namespace, name: 'R', location: createLocation(5, 6, 7, 8) };
            const expected = outline_view_adapter_1.default.symbolToOutline(sourceItem);
            const result = outline_view_adapter_1.default.createOutlineTrees([sourceItem]);
            chai_1.expect(result).to.deep.equal([expected]);
        });
        it('creates an empty root container with a single source item when containerName missing', () => {
            const sourceItem = {
                kind: ls.SymbolKind.Class,
                name: 'Program',
                location: createLocation(1, 2, 3, 4),
            };
            const expected = outline_view_adapter_1.default.symbolToOutline(sourceItem);
            sourceItem.containerName = 'missing';
            const result = outline_view_adapter_1.default.createOutlineTrees([sourceItem]);
            chai_1.expect(result.length).to.equal(1);
            chai_1.expect(result[0].representativeName).to.equal('missing');
            chai_1.expect(result[0].startPosition.row).to.equal(0);
            chai_1.expect(result[0].startPosition.column).to.equal(0);
            chai_1.expect(result[0].children).to.deep.equal([expected]);
        });
        // tslint:disable-next-line:max-line-length
        it('creates an empty root container with a single source item when containerName is missing and matches own name', () => {
            const sourceItem = {
                kind: ls.SymbolKind.Class,
                name: 'simple',
                location: createLocation(1, 2, 3, 4),
            };
            const expected = outline_view_adapter_1.default.symbolToOutline(sourceItem);
            sourceItem.containerName = 'simple';
            const result = outline_view_adapter_1.default.createOutlineTrees([sourceItem]);
            chai_1.expect(result.length).to.equal(1);
            chai_1.expect(result[0].representativeName).to.equal('simple');
            chai_1.expect(result[0].startPosition.row).to.equal(0);
            chai_1.expect(result[0].startPosition.column).to.equal(0);
            chai_1.expect(result[0].children).to.deep.equal([expected]);
        });
        it('creates a simple named hierarchy', () => {
            const sourceItems = [
                { kind: ls.SymbolKind.Namespace, name: 'java.com', location: createLocation(1, 0, 10, 0) },
                {
                    kind: ls.SymbolKind.Class,
                    name: 'Program',
                    location: createLocation(2, 0, 7, 0),
                    containerName: 'java.com',
                },
                {
                    kind: ls.SymbolKind.Function,
                    name: 'main',
                    location: createLocation(4, 0, 5, 0),
                    containerName: 'Program',
                },
            ];
            const result = outline_view_adapter_1.default.createOutlineTrees(sourceItems);
            chai_1.expect(result.length).to.equal(1);
            chai_1.expect(result[0].children.length).to.equal(1);
            chai_1.expect(result[0].children[0].representativeName).to.equal('Program');
            chai_1.expect(result[0].children[0].children.length).to.equal(1);
            chai_1.expect(result[0].children[0].children[0].representativeName).to.equal('main');
        });
        it('retains duplicate named items', () => {
            const sourceItems = [
                { kind: ls.SymbolKind.Namespace, name: 'duplicate', location: createLocation(1, 0, 5, 0) },
                { kind: ls.SymbolKind.Namespace, name: 'duplicate', location: createLocation(6, 0, 10, 0) },
                {
                    kind: ls.SymbolKind.Function,
                    name: 'main',
                    location: createLocation(7, 0, 8, 0),
                    containerName: 'duplicate',
                },
            ];
            const result = outline_view_adapter_1.default.createOutlineTrees(sourceItems);
            chai_1.expect(result.length).to.equal(2);
            chai_1.expect(result[0].representativeName).to.equal('duplicate');
            chai_1.expect(result[1].representativeName).to.equal('duplicate');
        });
        it('disambiguates containerName based on range', () => {
            const sourceItems = [
                { kind: ls.SymbolKind.Namespace, name: 'duplicate', location: createLocation(1, 0, 5, 0) },
                { kind: ls.SymbolKind.Namespace, name: 'duplicate', location: createLocation(6, 0, 10, 0) },
                {
                    kind: ls.SymbolKind.Function,
                    name: 'main',
                    location: createLocation(7, 0, 8, 0),
                    containerName: 'duplicate',
                },
            ];
            const result = outline_view_adapter_1.default.createOutlineTrees(sourceItems);
            chai_1.expect(result[1].children.length).to.equal(1);
            chai_1.expect(result[1].children[0].representativeName).to.equal('main');
        });
        it("does not become it's own parent", () => {
            const sourceItems = [
                { kind: ls.SymbolKind.Namespace, name: 'duplicate', location: createLocation(1, 0, 10, 0) },
                {
                    kind: ls.SymbolKind.Namespace,
                    name: 'duplicate',
                    location: createLocation(6, 0, 7, 0),
                    containerName: 'duplicate',
                },
            ];
            const result = outline_view_adapter_1.default.createOutlineTrees(sourceItems);
            chai_1.expect(result.length).to.equal(1);
            const outline = result[0];
            chai_1.expect(outline.endPosition).to.not.be.undefined;
            if (outline.endPosition) {
                chai_1.expect(outline.endPosition.row).to.equal(10);
                chai_1.expect(outline.children.length).to.equal(1);
                const outlineChild = outline.children[0];
                chai_1.expect(outlineChild.endPosition).to.not.be.undefined;
                if (outlineChild.endPosition) {
                    chai_1.expect(outlineChild.endPosition.row).to.equal(7);
                }
            }
        });
        it('parents to the innnermost named container', () => {
            const sourceItems = [
                { kind: ls.SymbolKind.Namespace, name: 'turtles', location: createLocation(1, 0, 10, 0) },
                {
                    kind: ls.SymbolKind.Namespace,
                    name: 'turtles',
                    location: createLocation(4, 0, 8, 0),
                    containerName: 'turtles',
                },
                { kind: ls.SymbolKind.Class, name: 'disc', location: createLocation(4, 0, 5, 0), containerName: 'turtles' },
            ];
            const result = outline_view_adapter_1.default.createOutlineTrees(sourceItems);
            chai_1.expect(result.length).to.equal(1);
            const outline = result[0];
            chai_1.expect(outline).to.not.be.undefined;
            if (outline) {
                chai_1.expect(outline.endPosition).to.not.be.undefined;
                if (outline.endPosition) {
                    chai_1.expect(outline.endPosition.row).to.equal(10);
                    chai_1.expect(outline.children.length).to.equal(1);
                    const outlineChild = outline.children[0];
                    chai_1.expect(outlineChild.endPosition).to.not.be.undefined;
                    if (outlineChild.endPosition) {
                        chai_1.expect(outlineChild.endPosition.row).to.equal(8);
                        chai_1.expect(outlineChild.children.length).to.equal(1);
                        const outlineGrandChild = outlineChild.children[0];
                        chai_1.expect(outlineGrandChild.endPosition).to.not.be.undefined;
                        if (outlineGrandChild.endPosition) {
                            chai_1.expect(outlineGrandChild.endPosition.row).to.equal(5);
                        }
                    }
                }
            }
        });
    });
    describe('hierarchicalSymbolToOutline', () => {
        it('converts an individual item', () => {
            const sourceItem = {
                name: 'test',
                kind: ls.SymbolKind.Function,
                range: createRange(1, 1, 2, 2),
                selectionRange: createRange(1, 1, 2, 2),
            };
            const expected = {
                tokenizedText: [
                    {
                        kind: 'method',
                        value: 'test',
                    },
                ],
                icon: 'type-function',
                representativeName: 'test',
                startPosition: new atom_1.Point(1, 1),
                endPosition: new atom_1.Point(2, 2),
                children: [],
            };
            const result = outline_view_adapter_1.default.hierarchicalSymbolToOutline(sourceItem);
            chai_1.expect(result).to.deep.equal(expected);
        });
    });
    describe('symbolToOutline', () => {
        it('converts an individual item', () => {
            const sourceItem = { kind: ls.SymbolKind.Class, name: 'Program', location: createLocation(1, 2, 3, 4) };
            const result = outline_view_adapter_1.default.symbolToOutline(sourceItem);
            chai_1.expect(result.icon).to.equal('type-class');
            chai_1.expect(result.representativeName).to.equal('Program');
            chai_1.expect(result.children).to.deep.equal([]);
            chai_1.expect(result.tokenizedText).to.not.be.undefined;
            if (result.tokenizedText) {
                chai_1.expect(result.tokenizedText[0].kind).to.equal('type');
                chai_1.expect(result.tokenizedText[0].value).to.equal('Program');
                chai_1.expect(result.startPosition.row).to.equal(1);
                chai_1.expect(result.startPosition.column).to.equal(2);
                chai_1.expect(result.endPosition).to.not.be.undefined;
                if (result.endPosition) {
                    chai_1.expect(result.endPosition.row).to.equal(3);
                    chai_1.expect(result.endPosition.column).to.equal(4);
                }
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS12aWV3LWFkYXB0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvYWRhcHRlcnMvb3V0bGluZS12aWV3LWFkYXB0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtGQUF5RTtBQUN6RSwrQ0FBK0M7QUFDL0MsK0JBQStCO0FBQy9CLCtCQUE4QjtBQUM5QiwrQkFBNkI7QUFFN0IsUUFBUSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtJQUNsQyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsQ0FBTSxFQUFFLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FDdEQsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUNyRSxDQUFDO0lBRUYsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFNLEVBQUUsQ0FBTSxFQUFFLENBQU0sRUFBRSxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDMUQsR0FBRyxFQUFFLEVBQUU7UUFDUCxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUMvQixDQUFDLENBQUM7SUFFSCxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ0gsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNaLE1BQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN4QixFQUFFLENB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QUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDO2dCQUMvQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7b0JBQ3RCLGFBQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLGFBQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQy9DO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3V0bGluZVZpZXdBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9vdXRsaW5lLXZpZXctYWRhcHRlcic7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0ICogYXMgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJ2F0b20nO1xuXG5kZXNjcmliZSgnT3V0bGluZVZpZXdBZGFwdGVyJywgKCkgPT4ge1xuICBjb25zdCBjcmVhdGVSYW5nZSA9IChhOiBhbnksIGI6IGFueSwgYzogYW55LCBkOiBhbnkpID0+IChcbiAgICB7IHN0YXJ0OiB7IGxpbmU6IGEsIGNoYXJhY3RlcjogYiB9LCBlbmQ6IHsgbGluZTogYywgY2hhcmFjdGVyOiBkIH0gfVxuICApO1xuXG4gIGNvbnN0IGNyZWF0ZUxvY2F0aW9uID0gKGE6IGFueSwgYjogYW55LCBjOiBhbnksIGQ6IGFueSkgPT4gKHtcbiAgICB1cmk6ICcnLFxuICAgIHJhbmdlOiBjcmVhdGVSYW5nZShhLCBiLCBjLCBkKSxcbiAgfSk7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnNpbm9uID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgfSk7XG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnNpbm9uLnJlc3RvcmUoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NhbkFkYXB0JywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm5zIHRydWUgaWYgZG9jdW1lbnRTeW1ib2xQcm92aWRlciBpcyBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY2FuQWRhcHQoeyBkb2N1bWVudFN5bWJvbFByb3ZpZGVyOiB0cnVlIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUudHJ1ZTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGZhbHNlIGlmIGRvY3VtZW50U3ltYm9sUHJvdmlkZXIgbm90IHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IE91dGxpbmVWaWV3QWRhcHRlci5jYW5BZGFwdCh7fSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS5mYWxzZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NyZWF0ZUhpZXJhcmNoaWNhbE91dGxpbmVUcmVlcycsICgpID0+IHtcbiAgICBpdCgnY3JlYXRlcyBhbiBlbXB0eSBhcnJheSBnaXZlbiBhbiBlbXB0eSBhcnJheScsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVIaWVyYXJjaGljYWxPdXRsaW5lVHJlZXMoW10pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uZGVlcC5lcXVhbChbXSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgc3ltYm9scyB3aXRob3V0IHRoZSBjaGlsZHJlbiBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUl0ZW0gPSB7XG4gICAgICAgIG5hbWU6ICd0ZXN0JyxcbiAgICAgICAga2luZDogbHMuU3ltYm9sS2luZC5GdW5jdGlvbixcbiAgICAgICAgcmFuZ2U6IGNyZWF0ZVJhbmdlKDEsIDEsIDIsIDIpLFxuICAgICAgICBzZWxlY3Rpb25SYW5nZTogY3JlYXRlUmFuZ2UoMSwgMSwgMiwgMiksXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBleHBlY3RlZCA9IFtPdXRsaW5lVmlld0FkYXB0ZXIuaGllcmFyY2hpY2FsU3ltYm9sVG9PdXRsaW5lKHNvdXJjZUl0ZW0pXTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVIaWVyYXJjaGljYWxPdXRsaW5lVHJlZXMoW3NvdXJjZUl0ZW1dKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uZGVlcC5lcXVhbChleHBlY3RlZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgc3ltYm9scyB3aXRoIGFuIGVtcHR5IGNoaWxkcmVuIGxpc3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VJdGVtID0ge1xuICAgICAgICBuYW1lOiAndGVzdCcsXG4gICAgICAgIGtpbmQ6IGxzLlN5bWJvbEtpbmQuRnVuY3Rpb24sXG4gICAgICAgIHJhbmdlOiBjcmVhdGVSYW5nZSgxLCAxLCAyLCAyKSxcbiAgICAgICAgc2VsZWN0aW9uUmFuZ2U6IGNyZWF0ZVJhbmdlKDEsIDEsIDIsIDIpLFxuICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBleHBlY3RlZCA9IFtPdXRsaW5lVmlld0FkYXB0ZXIuaGllcmFyY2hpY2FsU3ltYm9sVG9PdXRsaW5lKHNvdXJjZUl0ZW0pXTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVIaWVyYXJjaGljYWxPdXRsaW5lVHJlZXMoW3NvdXJjZUl0ZW1dKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uZGVlcC5lcXVhbChleHBlY3RlZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc29ydHMgc3ltYm9scyBieSBsb2NhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUEgPSB7XG4gICAgICAgIG5hbWU6ICd0ZXN0JyxcbiAgICAgICAga2luZDogbHMuU3ltYm9sS2luZC5GdW5jdGlvbixcbiAgICAgICAgcmFuZ2U6IGNyZWF0ZVJhbmdlKDIsIDIsIDMsIDMpLFxuICAgICAgICBzZWxlY3Rpb25SYW5nZTogY3JlYXRlUmFuZ2UoMiwgMiwgMywgMyksXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBzb3VyY2VCID0ge1xuICAgICAgICBuYW1lOiAndGVzdCcsXG4gICAgICAgIGtpbmQ6IGxzLlN5bWJvbEtpbmQuRnVuY3Rpb24sXG4gICAgICAgIHJhbmdlOiBjcmVhdGVSYW5nZSgxLCAxLCAyLCAyKSxcbiAgICAgICAgc2VsZWN0aW9uUmFuZ2U6IGNyZWF0ZVJhbmdlKDEsIDEsIDIsIDIpLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBbXG4gICAgICAgIE91dGxpbmVWaWV3QWRhcHRlci5oaWVyYXJjaGljYWxTeW1ib2xUb091dGxpbmUoc291cmNlQiksXG4gICAgICAgIE91dGxpbmVWaWV3QWRhcHRlci5oaWVyYXJjaGljYWxTeW1ib2xUb091dGxpbmUoc291cmNlQSksXG4gICAgICBdO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlSGllcmFyY2hpY2FsT3V0bGluZVRyZWVzKFtcbiAgICAgICAgc291cmNlQSxcbiAgICAgICAgc291cmNlQixcbiAgICAgIF0pO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50by5kZWVwLmVxdWFsKGV4cGVjdGVkKTtcbiAgICB9KTtcblxuICAgIGl0KCdjb252ZXJ0cyBzeW1ib2xzIHdpdGggY2hpbGRyZW4nLCAoKSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VDaGlsZEEgPSB7XG4gICAgICAgIG5hbWU6ICdjaGlsZEEnLFxuICAgICAgICBraW5kOiBscy5TeW1ib2xLaW5kLkZ1bmN0aW9uLFxuICAgICAgICByYW5nZTogY3JlYXRlUmFuZ2UoMiwgMiwgMywgMyksXG4gICAgICAgIHNlbGVjdGlvblJhbmdlOiBjcmVhdGVSYW5nZSgyLCAyLCAzLCAzKSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHNvdXJjZUNoaWxkQiA9IHtcbiAgICAgICAgbmFtZTogJ2NoaWxkQicsXG4gICAgICAgIGtpbmQ6IGxzLlN5bWJvbEtpbmQuRnVuY3Rpb24sXG4gICAgICAgIHJhbmdlOiBjcmVhdGVSYW5nZSgxLCAxLCAyLCAyKSxcbiAgICAgICAgc2VsZWN0aW9uUmFuZ2U6IGNyZWF0ZVJhbmdlKDEsIDEsIDIsIDIpLFxuICAgICAgfTtcblxuICAgICAgY29uc3Qgc291cmNlUGFyZW50ID0ge1xuICAgICAgICBuYW1lOiAncGFyZW50JyxcbiAgICAgICAga2luZDogbHMuU3ltYm9sS2luZC5GdW5jdGlvbixcbiAgICAgICAgcmFuZ2U6IGNyZWF0ZVJhbmdlKDEsIDEsIDMsIDMpLFxuICAgICAgICBzZWxlY3Rpb25SYW5nZTogY3JlYXRlUmFuZ2UoMSwgMSwgMywgMyksXG4gICAgICAgIGNoaWxkcmVuOiBbc291cmNlQ2hpbGRBLCBzb3VyY2VDaGlsZEJdLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgZXhwZWN0ZWRQYXJlbnQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuaGllcmFyY2hpY2FsU3ltYm9sVG9PdXRsaW5lKFxuICAgICAgICBzb3VyY2VQYXJlbnQpO1xuXG4gICAgICBleHBlY3RlZFBhcmVudC5jaGlsZHJlbiA9IFtcbiAgICAgICAgT3V0bGluZVZpZXdBZGFwdGVyLmhpZXJhcmNoaWNhbFN5bWJvbFRvT3V0bGluZShzb3VyY2VDaGlsZEIpLFxuICAgICAgICBPdXRsaW5lVmlld0FkYXB0ZXIuaGllcmFyY2hpY2FsU3ltYm9sVG9PdXRsaW5lKHNvdXJjZUNoaWxkQSksXG4gICAgICBdO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlSGllcmFyY2hpY2FsT3V0bGluZVRyZWVzKFtcbiAgICAgICAgc291cmNlUGFyZW50LFxuICAgICAgXSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmRlZXAuZXF1YWwoW2V4cGVjdGVkUGFyZW50XSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjcmVhdGVPdXRsaW5lVHJlZXMnLCAoKSA9PiB7XG4gICAgaXQoJ2NyZWF0ZXMgYW4gZW1wdHkgYXJyYXkgZ2l2ZW4gYW4gZW1wdHkgYXJyYXknLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlT3V0bGluZVRyZWVzKFtdKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmRlZXAuZXF1YWwoW10pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NyZWF0ZXMgYSBzaW5nbGUgY29udmVydGVkIHJvb3QgaXRlbSBmcm9tIGEgc2luZ2xlIHNvdXJjZSBpdGVtJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc291cmNlSXRlbSA9IHsga2luZDogbHMuU3ltYm9sS2luZC5OYW1lc3BhY2UsIG5hbWU6ICdSJywgbG9jYXRpb246IGNyZWF0ZUxvY2F0aW9uKDUsIDYsIDcsIDgpIH07XG4gICAgICBjb25zdCBleHBlY3RlZCA9IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xUb091dGxpbmUoc291cmNlSXRlbSk7XG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlT3V0bGluZVRyZWVzKFtzb3VyY2VJdGVtXSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5kZWVwLmVxdWFsKFtleHBlY3RlZF0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NyZWF0ZXMgYW4gZW1wdHkgcm9vdCBjb250YWluZXIgd2l0aCBhIHNpbmdsZSBzb3VyY2UgaXRlbSB3aGVuIGNvbnRhaW5lck5hbWUgbWlzc2luZycsICgpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUl0ZW06IGxzLlN5bWJvbEluZm9ybWF0aW9uID0ge1xuICAgICAgICBraW5kOiBscy5TeW1ib2xLaW5kLkNsYXNzLFxuICAgICAgICBuYW1lOiAnUHJvZ3JhbScsXG4gICAgICAgIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbigxLCAyLCAzLCA0KSxcbiAgICAgIH07XG4gICAgICBjb25zdCBleHBlY3RlZCA9IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xUb091dGxpbmUoc291cmNlSXRlbSk7XG4gICAgICBzb3VyY2VJdGVtLmNvbnRhaW5lck5hbWUgPSAnbWlzc2luZyc7XG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlT3V0bGluZVRyZWVzKFtzb3VyY2VJdGVtXSk7XG4gICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG8uZXF1YWwoMSk7XG4gICAgICBleHBlY3QocmVzdWx0WzBdLnJlcHJlc2VudGF0aXZlTmFtZSkudG8uZXF1YWwoJ21pc3NpbmcnKTtcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0uc3RhcnRQb3NpdGlvbi5yb3cpLnRvLmVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdFswXS5zdGFydFBvc2l0aW9uLmNvbHVtbikudG8uZXF1YWwoMCk7XG4gICAgICBleHBlY3QocmVzdWx0WzBdLmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFtleHBlY3RlZF0pO1xuICAgIH0pO1xuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxuICAgIGl0KCdjcmVhdGVzIGFuIGVtcHR5IHJvb3QgY29udGFpbmVyIHdpdGggYSBzaW5nbGUgc291cmNlIGl0ZW0gd2hlbiBjb250YWluZXJOYW1lIGlzIG1pc3NpbmcgYW5kIG1hdGNoZXMgb3duIG5hbWUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VJdGVtOiBscy5TeW1ib2xJbmZvcm1hdGlvbiA9IHtcbiAgICAgICAga2luZDogbHMuU3ltYm9sS2luZC5DbGFzcyxcbiAgICAgICAgbmFtZTogJ3NpbXBsZScsXG4gICAgICAgIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbigxLCAyLCAzLCA0KSxcbiAgICAgIH07XG4gICAgICBjb25zdCBleHBlY3RlZCA9IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xUb091dGxpbmUoc291cmNlSXRlbSk7XG4gICAgICBzb3VyY2VJdGVtLmNvbnRhaW5lck5hbWUgPSAnc2ltcGxlJztcbiAgICAgIGNvbnN0IHJlc3VsdCA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVPdXRsaW5lVHJlZXMoW3NvdXJjZUl0ZW1dKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubGVuZ3RoKS50by5lcXVhbCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0ucmVwcmVzZW50YXRpdmVOYW1lKS50by5lcXVhbCgnc2ltcGxlJyk7XG4gICAgICBleHBlY3QocmVzdWx0WzBdLnN0YXJ0UG9zaXRpb24ucm93KS50by5lcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0uc3RhcnRQb3NpdGlvbi5jb2x1bW4pLnRvLmVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdFswXS5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbZXhwZWN0ZWRdKTtcbiAgICB9KTtcblxuICAgIGl0KCdjcmVhdGVzIGEgc2ltcGxlIG5hbWVkIGhpZXJhcmNoeScsICgpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUl0ZW1zID0gW1xuICAgICAgICB7IGtpbmQ6IGxzLlN5bWJvbEtpbmQuTmFtZXNwYWNlLCBuYW1lOiAnamF2YS5jb20nLCBsb2NhdGlvbjogY3JlYXRlTG9jYXRpb24oMSwgMCwgMTAsIDApIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBraW5kOiBscy5TeW1ib2xLaW5kLkNsYXNzLFxuICAgICAgICAgIG5hbWU6ICdQcm9ncmFtJyxcbiAgICAgICAgICBsb2NhdGlvbjogY3JlYXRlTG9jYXRpb24oMiwgMCwgNywgMCksXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogJ2phdmEuY29tJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGtpbmQ6IGxzLlN5bWJvbEtpbmQuRnVuY3Rpb24sXG4gICAgICAgICAgbmFtZTogJ21haW4nLFxuICAgICAgICAgIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbig0LCAwLCA1LCAwKSxcbiAgICAgICAgICBjb250YWluZXJOYW1lOiAnUHJvZ3JhbScsXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgICAgY29uc3QgcmVzdWx0ID0gT3V0bGluZVZpZXdBZGFwdGVyLmNyZWF0ZU91dGxpbmVUcmVlcyhzb3VyY2VJdGVtcyk7XG4gICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG8uZXF1YWwoMSk7XG4gICAgICBleHBlY3QocmVzdWx0WzBdLmNoaWxkcmVuLmxlbmd0aCkudG8uZXF1YWwoMSk7XG4gICAgICBleHBlY3QocmVzdWx0WzBdLmNoaWxkcmVuWzBdLnJlcHJlc2VudGF0aXZlTmFtZSkudG8uZXF1YWwoJ1Byb2dyYW0nKTtcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoKS50by5lcXVhbCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0ucmVwcmVzZW50YXRpdmVOYW1lKS50by5lcXVhbCgnbWFpbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldGFpbnMgZHVwbGljYXRlIG5hbWVkIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc291cmNlSXRlbXMgPSBbXG4gICAgICAgIHsga2luZDogbHMuU3ltYm9sS2luZC5OYW1lc3BhY2UsIG5hbWU6ICdkdXBsaWNhdGUnLCBsb2NhdGlvbjogY3JlYXRlTG9jYXRpb24oMSwgMCwgNSwgMCkgfSxcbiAgICAgICAgeyBraW5kOiBscy5TeW1ib2xLaW5kLk5hbWVzcGFjZSwgbmFtZTogJ2R1cGxpY2F0ZScsIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbig2LCAwLCAxMCwgMCkgfSxcbiAgICAgICAge1xuICAgICAgICAgIGtpbmQ6IGxzLlN5bWJvbEtpbmQuRnVuY3Rpb24sXG4gICAgICAgICAgbmFtZTogJ21haW4nLFxuICAgICAgICAgIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbig3LCAwLCA4LCAwKSxcbiAgICAgICAgICBjb250YWluZXJOYW1lOiAnZHVwbGljYXRlJyxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlT3V0bGluZVRyZWVzKHNvdXJjZUl0ZW1zKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubGVuZ3RoKS50by5lcXVhbCgyKTtcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0ucmVwcmVzZW50YXRpdmVOYW1lKS50by5lcXVhbCgnZHVwbGljYXRlJyk7XG4gICAgICBleHBlY3QocmVzdWx0WzFdLnJlcHJlc2VudGF0aXZlTmFtZSkudG8uZXF1YWwoJ2R1cGxpY2F0ZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Rpc2FtYmlndWF0ZXMgY29udGFpbmVyTmFtZSBiYXNlZCBvbiByYW5nZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUl0ZW1zID0gW1xuICAgICAgICB7IGtpbmQ6IGxzLlN5bWJvbEtpbmQuTmFtZXNwYWNlLCBuYW1lOiAnZHVwbGljYXRlJywgbG9jYXRpb246IGNyZWF0ZUxvY2F0aW9uKDEsIDAsIDUsIDApIH0sXG4gICAgICAgIHsga2luZDogbHMuU3ltYm9sS2luZC5OYW1lc3BhY2UsIG5hbWU6ICdkdXBsaWNhdGUnLCBsb2NhdGlvbjogY3JlYXRlTG9jYXRpb24oNiwgMCwgMTAsIDApIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBraW5kOiBscy5TeW1ib2xLaW5kLkZ1bmN0aW9uLFxuICAgICAgICAgIG5hbWU6ICdtYWluJyxcbiAgICAgICAgICBsb2NhdGlvbjogY3JlYXRlTG9jYXRpb24oNywgMCwgOCwgMCksXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogJ2R1cGxpY2F0ZScsXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgICAgY29uc3QgcmVzdWx0ID0gT3V0bGluZVZpZXdBZGFwdGVyLmNyZWF0ZU91dGxpbmVUcmVlcyhzb3VyY2VJdGVtcyk7XG4gICAgICBleHBlY3QocmVzdWx0WzFdLmNoaWxkcmVuLmxlbmd0aCkudG8uZXF1YWwoMSk7XG4gICAgICBleHBlY3QocmVzdWx0WzFdLmNoaWxkcmVuWzBdLnJlcHJlc2VudGF0aXZlTmFtZSkudG8uZXF1YWwoJ21haW4nKTtcbiAgICB9KTtcblxuICAgIGl0KFwiZG9lcyBub3QgYmVjb21lIGl0J3Mgb3duIHBhcmVudFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VJdGVtcyA9IFtcbiAgICAgICAgeyBraW5kOiBscy5TeW1ib2xLaW5kLk5hbWVzcGFjZSwgbmFtZTogJ2R1cGxpY2F0ZScsIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbigxLCAwLCAxMCwgMCkgfSxcbiAgICAgICAge1xuICAgICAgICAgIGtpbmQ6IGxzLlN5bWJvbEtpbmQuTmFtZXNwYWNlLFxuICAgICAgICAgIG5hbWU6ICdkdXBsaWNhdGUnLFxuICAgICAgICAgIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbig2LCAwLCA3LCAwKSxcbiAgICAgICAgICBjb250YWluZXJOYW1lOiAnZHVwbGljYXRlJyxcbiAgICAgICAgfSxcbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVPdXRsaW5lVHJlZXMoc291cmNlSXRlbXMpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5sZW5ndGgpLnRvLmVxdWFsKDEpO1xuXG4gICAgICBjb25zdCBvdXRsaW5lID0gcmVzdWx0WzBdO1xuICAgICAgZXhwZWN0KG91dGxpbmUuZW5kUG9zaXRpb24pLnRvLm5vdC5iZS51bmRlZmluZWQ7XG4gICAgICBpZiAob3V0bGluZS5lbmRQb3NpdGlvbikge1xuICAgICAgICBleHBlY3Qob3V0bGluZS5lbmRQb3NpdGlvbi5yb3cpLnRvLmVxdWFsKDEwKTtcbiAgICAgICAgZXhwZWN0KG91dGxpbmUuY2hpbGRyZW4ubGVuZ3RoKS50by5lcXVhbCgxKTtcblxuICAgICAgICBjb25zdCBvdXRsaW5lQ2hpbGQgPSBvdXRsaW5lLmNoaWxkcmVuWzBdO1xuICAgICAgICBleHBlY3Qob3V0bGluZUNoaWxkLmVuZFBvc2l0aW9uKS50by5ub3QuYmUudW5kZWZpbmVkO1xuICAgICAgICBpZiAob3V0bGluZUNoaWxkLmVuZFBvc2l0aW9uKSB7XG4gICAgICAgICAgZXhwZWN0KG91dGxpbmVDaGlsZC5lbmRQb3NpdGlvbi5yb3cpLnRvLmVxdWFsKDcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgncGFyZW50cyB0byB0aGUgaW5ubmVybW9zdCBuYW1lZCBjb250YWluZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VJdGVtcyA9IFtcbiAgICAgICAgeyBraW5kOiBscy5TeW1ib2xLaW5kLk5hbWVzcGFjZSwgbmFtZTogJ3R1cnRsZXMnLCBsb2NhdGlvbjogY3JlYXRlTG9jYXRpb24oMSwgMCwgMTAsIDApIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBraW5kOiBscy5TeW1ib2xLaW5kLk5hbWVzcGFjZSxcbiAgICAgICAgICBuYW1lOiAndHVydGxlcycsXG4gICAgICAgICAgbG9jYXRpb246IGNyZWF0ZUxvY2F0aW9uKDQsIDAsIDgsIDApLFxuICAgICAgICAgIGNvbnRhaW5lck5hbWU6ICd0dXJ0bGVzJyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBraW5kOiBscy5TeW1ib2xLaW5kLkNsYXNzLCBuYW1lOiAnZGlzYycsIGxvY2F0aW9uOiBjcmVhdGVMb2NhdGlvbig0LCAwLCA1LCAwKSwgY29udGFpbmVyTmFtZTogJ3R1cnRsZXMnIH0sXG4gICAgICBdO1xuICAgICAgY29uc3QgcmVzdWx0ID0gT3V0bGluZVZpZXdBZGFwdGVyLmNyZWF0ZU91dGxpbmVUcmVlcyhzb3VyY2VJdGVtcyk7XG4gICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG8uZXF1YWwoMSk7XG5cbiAgICAgIGNvbnN0IG91dGxpbmUgPSByZXN1bHRbMF07XG4gICAgICBleHBlY3Qob3V0bGluZSkudG8ubm90LmJlLnVuZGVmaW5lZDtcbiAgICAgIGlmIChvdXRsaW5lKSB7XG4gICAgICAgIGV4cGVjdChvdXRsaW5lLmVuZFBvc2l0aW9uKS50by5ub3QuYmUudW5kZWZpbmVkO1xuICAgICAgICBpZiAob3V0bGluZS5lbmRQb3NpdGlvbikge1xuICAgICAgICAgIGV4cGVjdChvdXRsaW5lLmVuZFBvc2l0aW9uLnJvdykudG8uZXF1YWwoMTApO1xuICAgICAgICAgIGV4cGVjdChvdXRsaW5lLmNoaWxkcmVuLmxlbmd0aCkudG8uZXF1YWwoMSk7XG5cbiAgICAgICAgICBjb25zdCBvdXRsaW5lQ2hpbGQgPSBvdXRsaW5lLmNoaWxkcmVuWzBdO1xuICAgICAgICAgIGV4cGVjdChvdXRsaW5lQ2hpbGQuZW5kUG9zaXRpb24pLnRvLm5vdC5iZS51bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKG91dGxpbmVDaGlsZC5lbmRQb3NpdGlvbikge1xuICAgICAgICAgICAgZXhwZWN0KG91dGxpbmVDaGlsZC5lbmRQb3NpdGlvbi5yb3cpLnRvLmVxdWFsKDgpO1xuICAgICAgICAgICAgZXhwZWN0KG91dGxpbmVDaGlsZC5jaGlsZHJlbi5sZW5ndGgpLnRvLmVxdWFsKDEpO1xuXG4gICAgICAgICAgICBjb25zdCBvdXRsaW5lR3JhbmRDaGlsZCA9IG91dGxpbmVDaGlsZC5jaGlsZHJlblswXTtcbiAgICAgICAgICAgIGV4cGVjdChvdXRsaW5lR3JhbmRDaGlsZC5lbmRQb3NpdGlvbikudG8ubm90LmJlLnVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChvdXRsaW5lR3JhbmRDaGlsZC5lbmRQb3NpdGlvbikge1xuICAgICAgICAgICAgICBleHBlY3Qob3V0bGluZUdyYW5kQ2hpbGQuZW5kUG9zaXRpb24ucm93KS50by5lcXVhbCg1KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2hpZXJhcmNoaWNhbFN5bWJvbFRvT3V0bGluZScsICgpID0+IHtcbiAgICBpdCgnY29udmVydHMgYW4gaW5kaXZpZHVhbCBpdGVtJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc291cmNlSXRlbSA9IHtcbiAgICAgICAgbmFtZTogJ3Rlc3QnLFxuICAgICAgICBraW5kOiBscy5TeW1ib2xLaW5kLkZ1bmN0aW9uLFxuICAgICAgICByYW5nZTogY3JlYXRlUmFuZ2UoMSwgMSwgMiwgMiksXG4gICAgICAgIHNlbGVjdGlvblJhbmdlOiBjcmVhdGVSYW5nZSgxLCAxLCAyLCAyKSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGV4cGVjdGVkID0ge1xuICAgICAgICB0b2tlbml6ZWRUZXh0OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAga2luZDogJ21ldGhvZCcsXG4gICAgICAgICAgICB2YWx1ZTogJ3Rlc3QnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGljb246ICd0eXBlLWZ1bmN0aW9uJyxcbiAgICAgICAgcmVwcmVzZW50YXRpdmVOYW1lOiAndGVzdCcsXG4gICAgICAgIHN0YXJ0UG9zaXRpb246IG5ldyBQb2ludCgxLCAxKSxcbiAgICAgICAgZW5kUG9zaXRpb246IG5ldyBQb2ludCgyLCAyKSxcbiAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gT3V0bGluZVZpZXdBZGFwdGVyLmhpZXJhcmNoaWNhbFN5bWJvbFRvT3V0bGluZShzb3VyY2VJdGVtKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uZGVlcC5lcXVhbChleHBlY3RlZCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzeW1ib2xUb091dGxpbmUnLCAoKSA9PiB7XG4gICAgaXQoJ2NvbnZlcnRzIGFuIGluZGl2aWR1YWwgaXRlbScsICgpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUl0ZW0gPSB7IGtpbmQ6IGxzLlN5bWJvbEtpbmQuQ2xhc3MsIG5hbWU6ICdQcm9ncmFtJywgbG9jYXRpb246IGNyZWF0ZUxvY2F0aW9uKDEsIDIsIDMsIDQpIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuc3ltYm9sVG9PdXRsaW5lKHNvdXJjZUl0ZW0pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pY29uKS50by5lcXVhbCgndHlwZS1jbGFzcycpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZXByZXNlbnRhdGl2ZU5hbWUpLnRvLmVxdWFsKCdQcm9ncmFtJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFtdKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudG9rZW5pemVkVGV4dCkudG8ubm90LmJlLnVuZGVmaW5lZDtcbiAgICAgIGlmIChyZXN1bHQudG9rZW5pemVkVGV4dCkge1xuICAgICAgICBleHBlY3QocmVzdWx0LnRva2VuaXplZFRleHRbMF0ua2luZCkudG8uZXF1YWwoJ3R5cGUnKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC50b2tlbml6ZWRUZXh0WzBdLnZhbHVlKS50by5lcXVhbCgnUHJvZ3JhbScpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXJ0UG9zaXRpb24ucm93KS50by5lcXVhbCgxKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGFydFBvc2l0aW9uLmNvbHVtbikudG8uZXF1YWwoMik7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuZW5kUG9zaXRpb24pLnRvLm5vdC5iZS51bmRlZmluZWQ7XG4gICAgICAgIGlmIChyZXN1bHQuZW5kUG9zaXRpb24pIHtcbiAgICAgICAgICBleHBlY3QocmVzdWx0LmVuZFBvc2l0aW9uLnJvdykudG8uZXF1YWwoMyk7XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdC5lbmRQb3NpdGlvbi5jb2x1bW4pLnRvLmVxdWFsKDQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=