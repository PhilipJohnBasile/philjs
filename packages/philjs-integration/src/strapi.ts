
export interface StrapiType {
    kind: 'collectionType' | 'singleType';
    info: {
        singularName: string;
        pluralName: string;
        displayName: string;
    };
    attributes: Record<string, any>;
}

// Stub for Strapi GraphQL stitching
export function createStrapiSchema(apiUrl: string, types?: StrapiType[]) {
    console.log(`Strapi: Fetching schema from ${apiUrl}/graphql`);

    if (!types || types.length === 0) {
        // Generate mock schema if no types provided
        return `
      type StrapiMeta {
        page: Int
        pageSize: Int
        total: Int
      }
      
      type Query { 
        strapi_health: String
      }
    `;
    }

    // Convert Strapi Content Types to GraphQL Mock
    const typeDefs = types.map(t => {
        const fields = Object.entries(t.attributes).map(([key, attr]) => {
            return `  ${key}: String`; // Simplified
        }).join('\n');

        return `type ${t.info.displayName} {\n  id: ID!\n${fields}\n}`;
    }).join('\n\n');

    return typeDefs;
}
