/**
 * PhilJS Sequelize Adapter
 */

import { signal, effect } from '@philjs/core';
import type { Model, ModelStatic, FindOptions, CreateOptions, UpdateOptions } from 'sequelize';

export function useSequelize<T extends Model>(model: ModelStatic<T>, options: FindOptions = {}) {
    const data = signal<T[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const fetch = async () => {
        loading.set(true);
        try {
            const result = await model.findAll(options);
            data.set(result);
        } catch (e) { error.set(e as Error); }
        finally { loading.set(false); }
    };

    fetch();
    return { data, loading, error, refetch: fetch };
}

export function useSequelizeMutation<T extends Model>(model: ModelStatic<T>) {
    const loading = signal(false);

    return {
        loading,
        create: async (values: any) => { loading.set(true); const r = await model.create(values); loading.set(false); return r; },
        update: async (id: any, values: any) => { loading.set(true); await model.update(values, { where: { id } }); loading.set(false); },
        destroy: async (id: any) => { loading.set(true); await model.destroy({ where: { id } }); loading.set(false); },
    };
}
