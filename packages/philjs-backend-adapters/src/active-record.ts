
export class ActiveRecordWrapper {
    static find(id: number | string) {
        // ORM Stub
        return Promise.resolve({ id });
    }

    static where(conditions: any) {
        // Query builder stub
        return {
            get: () => Promise.resolve([])
        };
    }

    save() {
        return Promise.resolve(true);
    }
}
