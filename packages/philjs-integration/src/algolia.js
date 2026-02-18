export class AlgoliaAdapter {
    appId;
    apiKey;
    constructor(appId, apiKey) {
        this.appId = appId;
        this.apiKey = apiKey;
    }
    index(name) {
        return {
            search: async (query, options) => {
                const url = `https://${this.appId}-dsn.algolia.net/1/indexes/${name}/query`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Algolia-Application-Id': this.appId,
                        'X-Algolia-API-Key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query,
                        ...options
                    })
                });
                if (!response.ok) {
                    throw new Error(`Algolia Error: ${response.statusText}`);
                }
                return await response.json();
            },
            saveObjects: async (objects) => {
                const url = `https://${this.appId}.algolia.net/1/indexes/${name}/batch`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Algolia-Application-Id': this.appId,
                        'X-Algolia-API-Key': this.apiKey, // Note: Should be Write Key
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        requests: objects.map(body => ({
                            action: 'updateObject',
                            body
                        }))
                    })
                });
                if (!response.ok) {
                    throw new Error(`Algolia Indexing Error: ${response.statusText}`);
                }
                return await response.json();
            }
        };
    }
}
//# sourceMappingURL=algolia.js.map