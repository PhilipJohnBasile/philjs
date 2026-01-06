// Minimal GraphQL Client
async function gql(url: string, query: string, variables: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export interface StrapiType {
  kind: 'collectionType' | 'singleType';
  info: {
    singularName: string;
    pluralName: string;
    displayName: string;
  };
  attributes: Record<string, any>;
}

export class StrapiClient {
  constructor(private apiUrl: string, private token?: string) { }

  async find(resource: string, fields: string[] = ['id']) {
    const query = \`query { \${resource} { data { id attributes { \${fields.join(' ')} } } } }\`;
        return gql(\`\${this.apiUrl}/graphql\`, query);
    }

    async findOne(resource: string, id: string, fields: string[] = ['id']) {
        const query = \`query { \${resource}(id: "\${id}") { data { id attributes { \${fields.join(' ')} } } } }\`;
        return gql(\`\${this.apiUrl}/graphql\`, query);
    }
}

// Deprecated: Moving towards runtime introspection
export function createStrapiSchema(apiUrl: string, types?: StrapiType[]) {
    // Return a functional client instantiator code for codegen if needed
    // But primarily we export the Client class now
    return \`
        import { StrapiClient } from '@philjs/integration';
        const strapi = new StrapiClient('\${apiUrl}');
    \`;
}
