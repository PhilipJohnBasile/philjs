/**
 * PhilJS MongoDB Native Driver
 */

import { signal, effect } from '@philjs/core';

let client: any = null;
let db: any = null;

export async function connect(uri: string, dbName: string) {
    const { MongoClient } = await import('mongodb');
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    return { client, db };
}

export function useCollection<T>(name: string) {
    const data = signal<T[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const collection = db?.collection(name);

    const find = async (filter = {}) => {
        loading.set(true);
        try {
            const result = await collection.find(filter).toArray();
            data.set(result);
        } catch (e) { error.set(e as Error); }
        finally { loading.set(false); }
    };

    const insertOne = async (doc: T) => {
        const result = await collection.insertOne(doc);
        return result.insertedId;
    };

    const updateOne = async (filter: any, update: any) => {
        return collection.updateOne(filter, { $set: update });
    };

    const deleteOne = async (filter: any) => {
        return collection.deleteOne(filter);
    };

    return { data, loading, error, find, insertOne, updateOne, deleteOne };
}

export function useWatch<T>(collectionName: string, pipeline: any[] = []) {
    const data = signal<T[]>([]);

    effect(() => {
        const coll = db?.collection(collectionName);
        const stream = coll?.watch(pipeline);
        stream?.on('change', async () => {
            const docs = await coll.find().toArray();
            data.set(docs);
        });
        return () => stream?.close();
    });

    return data;
}
