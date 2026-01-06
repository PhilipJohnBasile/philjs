import { describe, it, expect } from 'vitest';
import { ActivityPub } from '../activitypub.js';

describe('PhilJS Social: ActivityPub', () => {
    it('should generate Actor JSON-LD', () => {
        const actor = ActivityPub.createActor({
            username: 'alice',
            domain: 'social.example.com',
            name: 'Alice'
        });

        expect(actor['@context']).toBeDefined();
        expect(actor.id).toBe('https://social.example.com/users/alice');
        expect(actor.type).toBe('Person');
        expect(actor.inbox).toBe('https://social.example.com/users/alice/inbox');
    });

    it('should create Note activity', () => {
        const note = ActivityPub.createNote({
            content: 'Hello World',
            attributedTo: 'https://social.example.com/users/alice'
        });

        expect(note.type).toBe('Note');
        expect(note.content).toBe('Hello World');
    });
});
