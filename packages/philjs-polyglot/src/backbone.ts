
// Stub for Backbone Adapter
export class BackboneAdapter {
    constructor(private model: any) {
        this.bindEvents();
    }

    bindEvents() {
        this.model.on('change', () => {
            console.log('Backbone model changed, updating Signal...');
        });
    }
}
