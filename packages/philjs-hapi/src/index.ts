
export const plugin = {
    name: 'philjs-hapi',
    version: '1.0.0',
    register: async function (server: any, options: any) {
        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: (request: any, h: any) => {
                return 'PhilJS on Hapi';
            }
        });
    }
};
