
export interface ActivityPubObject {
    '@context': string | string[];
    id?: string;
    type: string;
    [key: string]: any;
}

export interface Actor extends ActivityPubObject {
    type: 'Person' | 'Service' | 'Application';
    inbox: string;
    outbox: string;
    following?: string;
    followers?: string;
    preferredUsername?: string;
    publicKey?: {
        id: string;
        owner: string;
        publicKeyPem: string;
    };
}

export class ActivityPub {
    private static CONTEXT = "https://www.w3.org/ns/activitystreams";

    static createNote(content: string, attributedTo: string, to: string[] = ['https://www.w3.org/ns/activitystreams#Public']): ActivityPubObject {
        return {
            '@context': ActivityPub.CONTEXT,
            type: 'Note',
            content,
            attributedTo,
            to,
            published: new Date().toISOString()
        };
    }

    static createActivity(type: 'Create' | 'Follow' | 'Like', object: ActivityPubObject, actor: string): ActivityPubObject {
        return {
            '@context': ActivityPub.CONTEXT,
            type,
            actor,
            object
        };
    }

    static async send(activity: ActivityPubObject, inboxUrl: string, privateKeyPem: string, keyId: string) {
        // In a real implementation, this would sign the HTTP request with RSA-SHA256 (HTTP Signatures)
        // Here we implement the fetch logic

        const body = JSON.stringify(activity);
        const date = new Date().toUTCString();

        // Mocking the signature generation for this implementation
        const signature = `keyId="${keyId}",headers="(request-target) host date",signature="<mock_sig>"`;

        const response = await fetch(inboxUrl, {
            method: 'POST',
            headers: {
                'Date': date,
                'Content-Type': 'application/activity+json',
                'Signature': signature,
                'Accept': 'application/activity+json'
            },
            body
        });

        if (!response.ok) {
            throw new Error(`ActivityPub Send Failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }
}
