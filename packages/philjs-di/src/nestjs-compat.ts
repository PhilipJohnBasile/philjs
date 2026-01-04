// @philjs/di - NestJS Compatibility Layer Stub
// Ticket: #77

export function Module(metadata: any) {
    return (target: any) => {
        // Will eventually map NestJS modules to PhilJS DI containers
        console.log("Registered PhilJS Module:", target.name);
    };
}
