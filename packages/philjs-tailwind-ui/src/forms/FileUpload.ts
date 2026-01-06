/**
 * FileUpload Component
 * File input with drag and drop support
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, DisableableProps, Size, MaybeSignal } from '../types.js';

export interface FileUploadProps extends BaseProps, DisableableProps {
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error state/message */
  error?: boolean | string | MaybeSignal<boolean | string>;
  /** Accepted file types */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Size variant */
  size?: Size;
  /** Upload variant */
  variant?: 'dropzone' | 'button' | 'minimal';
  /** Name for form submission */
  name?: string;
  /** Required field */
  required?: boolean;
  /** Current files */
  files?: File[] | MaybeSignal<File[]>;
  /** Change handler */
  onChange?: (files: File[]) => void;
  /** Custom upload icon */
  icon?: JSX.Element;
  /** Dropzone text */
  dropzoneText?: string;
  /** Button text */
  buttonText?: string;
  /** Show file preview */
  showPreview?: boolean;
  /** Aria label */
  ariaLabel?: string;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const dropzoneSizeClasses = {
  xs: 'p-4',
  sm: 'p-6',
  md: 'p-8',
  lg: 'p-10',
  xl: 'p-12',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUpload(props: FileUploadProps): JSX.Element {
  const {
    label,
    helperText,
    error,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    size = 'md',
    variant = 'dropzone',
    name,
    required,
    disabled,
    files,
    onChange,
    icon,
    dropzoneText = 'Drag and drop files here, or click to select',
    buttonText = 'Choose files',
    showPreview = true,
    ariaLabel,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('file-upload');
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  // Internal state
  const internalFiles = signal<File[]>([]);
  const isDragging = signal(false);
  const uploadError = signal<string | null>(null);

  const getCurrentFiles = (): File[] => files !== undefined ? getValue(files) : internalFiles();

  const validateFiles = (newFiles: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const fileArray = Array.from(newFiles);

    for (const file of fileArray) {
      // Check file size
      if (maxSize && file.size > maxSize) {
        uploadError.set(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`);
        continue;
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()}`;

        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension.toLowerCase() === type.toLowerCase();
          }
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.slice(0, -1));
          }
          return fileType === type;
        });

        if (!isAccepted) {
          uploadError.set(`File type "${fileType}" is not accepted`);
          continue;
        }
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    uploadError.set(null);

    const validFiles = validateFiles(newFiles);
    let allFiles = multiple ? [...getCurrentFiles(), ...validFiles] : validFiles;

    // Limit number of files
    if (maxFiles && allFiles.length > maxFiles) {
      allFiles = allFiles.slice(0, maxFiles);
      uploadError.set(`Maximum of ${maxFiles} files allowed`);
    }

    if (files === undefined) {
      internalFiles.set(allFiles);
    }
    onChange?.(allFiles);
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      handleFiles(target.files);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.set(false);

    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    isDragging.set(true);
  };

  const handleDragLeave = () => {
    isDragging.set(false);
  };

  const removeFile = (index: number) => {
    const currentFiles = getCurrentFiles();
    const newFiles = [...currentFiles.slice(0, index), ...currentFiles.slice(index + 1)];

    if (files === undefined) {
      internalFiles.set(newFiles);
    }
    onChange?.(newFiles);
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const hasError = !!getValue(error as MaybeSignal<boolean | string>) || !!uploadError();
  const errorMessage = uploadError() ||
    (typeof getValue(error as MaybeSignal<boolean | string>) === 'string'
      ? getValue(error as MaybeSignal<string>)
      : undefined);

  const children: JSX.Element[] = [];

  // Label
  if (label) {
    children.push(
      jsx('label', {
        for: id,
        class: cn(
          'block text-sm font-medium mb-1.5',
          'text-gray-700 dark:text-gray-300',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        ),
        children: label,
      })
    );
  }

  // Hidden file input
  const fileInput = jsx('input', {
    type: 'file',
    id,
    name,
    accept,
    multiple,
    disabled: isDisabled,
    required,
    class: 'sr-only',
    'aria-label': ariaLabel || label,
    'aria-describedby': cn(helperText && helperId, hasError && errorId),
    'data-testid': testId,
    onchange: handleInputChange,
    ...rest,
  });

  if (variant === 'dropzone') {
    children.push(
      jsx('div', {
        class: cn(
          'relative rounded-lg border-2 border-dashed',
          'transition-colors duration-200',
          'flex flex-col items-center justify-center',
          dropzoneSizeClasses[size],
          isDragging()
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
          hasError && 'border-red-500 dark:border-red-400',
          isDisabled && 'opacity-50 cursor-not-allowed',
          !isDisabled && 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500',
          className
        ),
        ondrop: handleDrop,
        ondragover: handleDragOver,
        ondragleave: handleDragLeave,
        onclick: () => !isDisabled && document.getElementById(id)?.click(),
        children: [
          fileInput,
          // Icon
          icon || jsx('svg', {
            class: 'w-10 h-10 text-gray-400 dark:text-gray-500 mb-3',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: jsx('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
            }),
          }),
          // Text
          jsx('p', {
            class: cn(
              'text-gray-500 dark:text-gray-400',
              sizeClasses[size]
            ),
            children: dropzoneText,
          }),
          // Accepted types hint
          accept && jsx('p', {
            class: 'text-xs text-gray-400 dark:text-gray-500 mt-1',
            children: `Accepted: ${accept}`,
          }),
          // Max size hint
          maxSize && jsx('p', {
            class: 'text-xs text-gray-400 dark:text-gray-500',
            children: `Max size: ${formatFileSize(maxSize)}`,
          }),
        ],
      })
    );
  } else if (variant === 'button') {
    children.push(
      jsx('label', {
        for: id,
        class: cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-md',
          'bg-blue-600 text-white',
          'hover:bg-blue-700 transition-colors duration-200',
          'cursor-pointer',
          isDisabled && 'opacity-50 cursor-not-allowed',
          sizeClasses[size],
          className
        ),
        children: [
          fileInput,
          jsx('svg', {
            class: 'w-5 h-5',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: jsx('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
            }),
          }),
          buttonText,
        ],
      })
    );
  } else {
    // Minimal variant
    children.push(
      jsx('label', {
        for: id,
        class: cn(
          'inline-flex items-center gap-2 text-blue-600 dark:text-blue-400',
          'hover:underline cursor-pointer',
          isDisabled && 'opacity-50 cursor-not-allowed',
          sizeClasses[size],
          className
        ),
        children: [
          fileInput,
          buttonText,
        ],
      })
    );
  }

  // File preview
  const currentFiles = getCurrentFiles();
  if (showPreview && currentFiles.length > 0) {
    children.push(
      jsx('ul', {
        class: 'mt-3 space-y-2',
        role: 'list',
        'aria-label': 'Uploaded files',
        children: currentFiles.map((file, index) =>
          jsx('li', {
            class: cn(
              'flex items-center justify-between gap-2 p-2 rounded-md',
              'bg-gray-50 dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700'
            ),
            children: [
              jsx('div', {
                class: 'flex items-center gap-2 overflow-hidden',
                children: [
                  // File icon
                  jsx('svg', {
                    class: 'w-5 h-5 text-gray-400 flex-shrink-0',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24',
                    children: jsx('path', {
                      'stroke-linecap': 'round',
                      'stroke-linejoin': 'round',
                      'stroke-width': '2',
                      d: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
                    }),
                  }),
                  jsx('span', {
                    class: 'text-sm text-gray-700 dark:text-gray-300 truncate',
                    children: file.name,
                  }),
                  jsx('span', {
                    class: 'text-xs text-gray-400 dark:text-gray-500 flex-shrink-0',
                    children: formatFileSize(file.size),
                  }),
                ],
              }),
              // Remove button
              jsx('button', {
                type: 'button',
                class: cn(
                  'p-1 rounded-md text-gray-400 hover:text-red-500',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-red-500/20'
                ),
                onclick: () => removeFile(index),
                'aria-label': `Remove ${file.name}`,
                children: jsx('svg', {
                  class: 'w-4 h-4',
                  fill: 'none',
                  stroke: 'currentColor',
                  viewBox: '0 0 24 24',
                  children: jsx('path', {
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    'stroke-width': '2',
                    d: 'M6 18L18 6M6 6l12 12',
                  }),
                }),
              }),
            ],
          })
        ),
      })
    );
  }

  // Helper text and error
  if (helperText && !hasError) {
    children.push(
      jsx('p', {
        id: helperId,
        class: 'text-sm text-gray-500 dark:text-gray-400 mt-1.5',
        children: helperText,
      })
    );
  }

  if (hasError && errorMessage) {
    children.push(
      jsx('p', {
        id: errorId,
        class: 'text-sm text-red-500 dark:text-red-400 mt-1.5',
        role: 'alert',
        children: errorMessage,
      })
    );
  }

  return jsx('div', {
    class: 'w-full',
    children,
  });
}
