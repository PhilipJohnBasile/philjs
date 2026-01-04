
// Stub for Strapi GraphQL stitching
export function createStrapiSchema(apiUrl: string) {
    // Should introspect Strapi GraphQL and return schema
    console.log('Stitching Strapi schema from', apiUrl);
    return 'type Query { strapi: String }';
}
