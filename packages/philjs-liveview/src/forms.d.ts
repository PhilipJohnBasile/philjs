/**
 * PhilJS LiveView - Form Handling
 *
 * Handles form submissions, validation, and file uploads.
 */
import type { FormValidation, UploadConfig, UploadEntry } from './types.js';
interface FormState {
    data: Record<string, any>;
    errors: Record<string, string[]>;
    submitting: boolean;
    submitted: boolean;
    valid: boolean;
}
/**
 * Create a form state manager
 */
export declare function createFormState(initialData?: Record<string, any>): FormState;
/**
 * Update form field
 */
export declare function updateField(state: FormState, field: string, value: any): FormState;
/**
 * Set form errors
 */
export declare function setErrors(state: FormState, errors: Record<string, string[]>): FormState;
export interface ValidationRule {
    validate: (value: any, params?: any) => boolean;
    message: (field: string, params?: any) => string;
}
/**
 * Validate form data against rules
 */
export declare function validateForm(data: Record<string, any>, validations: FormValidation[]): Record<string, string[]>;
/**
 * Validate a single field
 */
export declare function validateField(field: string, value: any, validations: FormValidation[], data?: Record<string, any>): string[];
/**
 * Serialize form element to object
 */
export declare function serializeForm(form: HTMLFormElement): Record<string, any>;
/**
 * Deserialize object to form
 */
export declare function deserializeToForm(form: HTMLFormElement, data: Record<string, any>): void;
interface UploadState {
    entries: Map<string, UploadEntry>;
    configs: Map<string, UploadConfig>;
}
/**
 * Create upload state manager
 */
export declare function createUploadState(): UploadState;
/**
 * Configure an upload
 */
export declare function configureUpload(state: UploadState, config: UploadConfig): void;
/**
 * Add files to upload queue
 */
export declare function addFiles(state: UploadState, uploadName: string, files: FileList): {
    valid: UploadEntry[];
    invalid: Array<{
        file: File;
        error: string;
    }>;
};
/**
 * Update upload progress
 */
export declare function updateProgress(state: UploadState, entryId: string, progress: number): void;
/**
 * Mark upload as error
 */
export declare function markUploadError(state: UploadState, entryId: string, error: string): void;
/**
 * Remove an upload entry
 */
export declare function removeEntry(state: UploadState, entryId: string): void;
/**
 * Get all entries for an upload
 */
export declare function getEntries(state: UploadState, uploadName: string): UploadEntry[];
/**
 * Create a form configuration for a LiveView
 */
export interface FormConfig {
    validations?: FormValidation[];
    uploads?: UploadConfig[];
    debounce?: number;
    throttle?: number;
}
/**
 * Create form submit handler
 */
export declare function createSubmitHandler(config: FormConfig, onSubmit: (data: Record<string, any>) => void, onError?: (errors: Record<string, string[]>) => void): (event: Event) => void;
/**
 * Create change handler with validation
 */
export declare function createChangeHandler(config: FormConfig, onChange: (field: string, value: any, errors: string[]) => void): (event: Event) => void;
export type { FormState, UploadState };
//# sourceMappingURL=forms.d.ts.map