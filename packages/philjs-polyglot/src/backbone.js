"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBackboneModel = useBackboneModel;
exports.useBackboneCollection = useBackboneCollection;
const philjs_1 = require("philjs");
function useBackboneModel(model) {
    // We use a Signal because the Model reference itself doesn't change, 
    // but we want to trigger updates when attributes change.
    // For deep reactivity, createStore is better, but Backbone constructs are often mutable class instances.
    const [snapshot, setSnapshot] = (0, philjs_1.createSignal)(model.toJSON());
    const update = () => {
        setSnapshot(model.toJSON());
    };
    model.on('change', update);
    (0, philjs_1.onCleanup)(() => model.off('change', update));
    return snapshot;
}
function useBackboneCollection(collection) {
    const [snapshot, setSnapshot] = (0, philjs_1.createSignal)(collection.toJSON());
    const update = () => {
        setSnapshot(collection.toJSON());
    };
    // Listen to standard Backbone collection events
    collection.on('add', update);
    collection.on('remove', update);
    collection.on('reset', update);
    collection.on('sort', update);
    collection.on('change', update); // Bubble up from models
    (0, philjs_1.onCleanup)(() => {
        collection.off('add', update);
        collection.off('remove', update);
        collection.off('reset', update);
        collection.off('sort', update);
        collection.off('change', update);
    });
    return snapshot;
}
//# sourceMappingURL=backbone.js.map