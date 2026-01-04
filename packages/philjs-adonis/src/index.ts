
// PhilJS Adonis Adapter
// Native IoC container support for AdonisJS integration

export interface IoCContainer {
    bind(key: string, callback: () => any): void;
    use(key: string): any;
}

export class PhilAdonisAdapter {
    constructor(private container: IoCContainer) { }

    registerService(name: string, service: any) {
        this.container.bind(`Phil/${name}`, () => service);
    }

    getService<T>(name: string): T {
        return this.container.use(`Phil/${name}`);
    }
}
