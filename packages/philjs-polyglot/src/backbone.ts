import { createSignal, createStore, onCleanup } from 'philjs';

export interface BackboneModel {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    attributes: Record<string, any>;
    set(key: string, val: any): void;
    cid: string;
    toJSON(): any;
}

export interface BackboneCollection {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    models: BackboneModel[];
    toJSON(): any[];
}

export function useBackboneModel<T>(model: BackboneModel) {
    // We use a Signal because the Model reference itself doesn't change, 
    // but we want to trigger updates when attributes change.
    // For deep reactivity, createStore is better, but Backbone constructs are often mutable class instances.
    const [snapshot, setSnapshot] = createSignal<T>(model.toJSON());

    const update = () => {
        setSnapshot(model.toJSON());
    };

    model.on('change', update);
    onCleanup(() => model.off('change', update));

    return snapshot;
}

export function useBackboneCollection<T>(collection: BackboneCollection) {
    const [snapshot, setSnapshot] = createSignal<T[]>(collection.toJSON());

    const update = () => {
        setSnapshot(collection.toJSON());
    };

    // Listen to standard Backbone collection events
    collection.on('add', update);
    collection.on('remove', update);
    collection.on('reset', update);
    collection.on('sort', update);
    collection.on('change', update); // Bubble up from models

    onCleanup(() => {
        collection.off('add', update);
        collection.off('remove', update);
        collection.off('reset', update);
        collection.off('sort', update);
        collection.off('change', update);
    });

    return snapshot;
}
