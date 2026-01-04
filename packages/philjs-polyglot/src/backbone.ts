
export interface BackboneModel {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    attributes: Record<string, any>;
    cid: string;
}

export interface BackboneCollection {
    on(event: string, callback: Function): void;
    startSync(): void;
    models: BackboneModel[];
}

export class BackboneAdapter<T extends BackboneModel = BackboneModel> {
    private disposeHandlers: Array<() => void> = [];

    constructor(private entity: T | BackboneCollection) {
        this.bindEvents();
    }

    bindEvents() {
        this.listenTo('change', this.updateSignal);
        this.listenTo('add', this.updateSignal);
        this.listenTo('remove', this.updateSignal);
        this.listenTo('sync', () => console.log('Backbone: Synced with server'));
    }

    private listenTo(event: string, handler: Function) {
        this.entity.on(event, handler);
        this.disposeHandlers.push(() => this.entity.off(event, handler));
    }

    private updateSignal = (model?: any) => {
        console.log('Backbone: Entity changed, triggering PhilJS signal update');
        if (model && model.cid) {
            console.log('Changed Model CID:', model.cid);
        }
    }

    dispose() {
        this.disposeHandlers.forEach(h => h());
    }
}
