/**
 * PhilJS Tailwind Types
 */
export type ClassValue = string | number | boolean | null | undefined | ClassValue[] | {
    [key: string]: boolean | null | undefined;
};
export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0] extends undefined ? {} : Omit<NonNullable<Parameters<T>[0]>, 'class' | 'className'>;
//# sourceMappingURL=types.d.ts.map