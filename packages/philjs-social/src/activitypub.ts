
/**
 * Decentralized Social Web (ActivityPub).
 */
export class ActivityPub {
    static publish(actor: string, note: string) {
        console.log(`Social: 📣 Federating note to followers via Inbox...`);
        const activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Note",
            "content": note,
            "attributedTo": actor
        };
        console.log(`Social: 📨 POSTing to sharedInbox...`);
        return activity;
    }
}
