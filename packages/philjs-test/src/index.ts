
// Stubbing exports to fix Vitest transform error in ghost file 'src/art...'

export const describeAI = async (suite: string, desc: string) => {
    console.log('[STUB] describeAI', suite);
    return { suite, status: 'stub' };
};

export const fuzzAI = async (fn: Function) => {
    console.log('[STUB] fuzzAI');
    return { total: 0, failures: [], score: 100 };
};

export const attemptTestFix = async (failure: any) => {
    console.log('[STUB] attemptTestFix');
    return { status: 'unresolved' };
};
