// Minimal GraphQL Client
async function gql(url, query, variables = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors)
        throw new Error(json.errors[0].message);
    return json.data;
}
export class StrapiClient {
    apiUrl;
    token;
    constructor(apiUrl, token) {
        this.apiUrl = apiUrl;
        this.token = token;
    }
    async find(resource, fields = ['id']) {
        const query = `query { ${resource} { data { id attributes { ${fields.join(' ')} } } } }`;
        return gql(`${this.apiUrl}/graphql`, query);
    }
    async findOne(resource, id, fields = ['id']) {
        const query = `query { ${resource}(id: "${id}") { data { id attributes { ${fields.join(' ')} } } } }`;
        return gql(`${this.apiUrl}/graphql`, query);
    }
}
// Deprecated: Moving towards runtime introspection
export function createStrapiSchema(apiUrl, types) {
    // Return a functional client instantiator code for codegen if needed
    // But primarily we export the Client class now
    return `
    import { StrapiClient } from '@philjs/integration';
    const strapi = new StrapiClient('${apiUrl}');
  `;
}
//# sourceMappingURL=strapi.js.map