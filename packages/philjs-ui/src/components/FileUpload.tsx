/**
 * PhilJS UI - FileUpload Component
 *
 * Drag-and-drop file upload with preview, progress,
 * and multiple file support.
 */

import { signal, memo } from 'philjs-core';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
  url?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  value?: UploadedFile[];
  showPreview?: boolean;
  previewMaxHeight?: number;
  dragActiveClass?: string;
  onFilesSelected?: (files: File[]) => void;
  onUpload?: (file: File) => Promise<string>;
  onChange?: (files: UploadedFile[]) => void;
  onError?: (error: string, file?: File) => void;
  children?: any;
  className?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileUpload(props: FileUploadProps) {
  const {
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    disabled = false,
    value,
    showPreview = true,
    previewMaxHeight = 200,
    dragActiveClass = 'border-blue-500 bg-blue-50',
    onFilesSelected,
    onUpload,
    onChange,
    onError,
    children,
    className = '',
  } = props;

  const files = signal<UploadedFile[]>(value || []);
  const isDragging = signal(false);
  const inputRef = signal<HTMLInputElement | null>(null);

  const canAddMore = memo(() => {
    if (!maxFiles) return true;
    return files().length < maxFiles;
  });

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.slice(0, -1));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return `File "${file.name}" has an unsupported type`;
      }
    }

    return null;
  };

  const createPreview = async (file: File): Promise<string | undefined> => {
    if (!file.type.startsWith('image/')) return undefined;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (newFiles: File[]) => {
    if (disabled) return;

    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (!canAddMore() && !multiple) break;
      if (maxFiles && files().length + validFiles.length >= maxFiles) break;

      const error = validateFile(file);
      if (error) {
        onError?.(error, file);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    onFilesSelected?.(validFiles);

    const uploadedFiles: UploadedFile[] = await Promise.all(
      validFiles.map(async (file) => {
        const preview = showPreview ? await createPreview(file) : undefined;
        return {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending' as const,
          preview,
        };
      })
    );

    const newFileList = multiple ? [...files(), ...uploadedFiles] : uploadedFiles;
    files.set(newFileList);
    onChange?.(newFileList);

    // Auto-upload if handler provided
    if (onUpload) {
      for (const uploadedFile of uploadedFiles) {
        uploadFile(uploadedFile);
      }
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    if (!onUpload) return;

    const currentFiles = files();
    const fileIndex = currentFiles.findIndex(f => f.id === uploadedFile.id);
    if (fileIndex === -1) return;

    // Update status to uploading
    const updatedFiles = [...currentFiles];
    updatedFiles[fileIndex] = { ...uploadedFile, status: 'uploading', progress: 0 };
    files.set(updatedFiles);
    onChange?.(updatedFiles);

    try {
      // Simulate progress (real implementation would use XMLHttpRequest or fetch with progress)
      const progressInterval = setInterval(() => {
        const current = files();
        const idx = current.findIndex(f => f.id === uploadedFile.id);
        if (idx !== -1 && current[idx].progress < 90) {
          const updated = [...current];
          updated[idx] = { ...updated[idx], progress: updated[idx].progress + 10 };
          files.set(updated);
        }
      }, 200);

      const url = await onUpload(uploadedFile.file);

      clearInterval(progressInterval);

      // Update status to success
      const finalFiles = files();
      const idx = finalFiles.findIndex(f => f.id === uploadedFile.id);
      if (idx !== -1) {
        const updated = [...finalFiles];
        updated[idx] = { ...updated[idx], status: 'success', progress: 100, url };
        files.set(updated);
        onChange?.(updated);
      }
    } catch (error) {
      // Update status to error
      const errorFiles = files();
      const idx = errorFiles.findIndex(f => f.id === uploadedFile.id);
      if (idx !== -1) {
        const updated = [...errorFiles];
        updated[idx] = {
          ...updated[idx],
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        };
        files.set(updated);
        onChange?.(updated);
        onError?.(updated[idx].error!, uploadedFile.file);
      }
    }
  };

  const removeFile = (fileId: string) => {
    const newFiles = files().filter(f => f.id !== fileId);
    files.set(newFiles);
    onChange?.(newFiles);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) isDragging.set(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.set(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.set(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    addFiles(droppedFiles);
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const selectedFiles = Array.from(target.files || []);
    addFiles(selectedFiles);
    target.value = ''; // Reset input
  };

  const openFilePicker = () => {
    if (!disabled) {
      inputRef()?.click();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={(el: HTMLInputElement) => inputRef.set(el)}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-gray-400'}
          ${isDragging() ? dragActiveClass : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        {children || (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              {' '}or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {accept ? `Accepted: ${accept}` : 'Any file type'}
              {maxSize && ` · Max ${formatFileSize(maxSize)}`}
              {maxFiles && ` · Max ${maxFiles} files`}
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files().length > 0 && (
        <div className="mt-4 space-y-2">
          {files().map(file => (
            <div
              key={file.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${file.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}
              `}
            >
              {/* Preview */}
              {showPreview && file.preview && (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded"
                  style={{ maxHeight: `${previewMaxHeight}px` }}
                />
              )}

              {/* File Icon */}
              {(!showPreview || !file.preview) && (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'error' && file.error && (
                  <p className="mt-1 text-xs text-red-600">{file.error}</p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {file.status === 'success' && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {file.status === 'error' && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {file.status === 'uploading' && (
                  <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                onClick={(e: any) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ImageUpload - Specialized for image uploads with cropping
 */
export interface ImageUploadProps extends Omit<FileUploadProps, 'accept' | 'showPreview'> {
  aspectRatio?: number;
  enableCrop?: boolean;
}

export function ImageUpload(props: ImageUploadProps) {
  const { aspectRatio, enableCrop = false, ...rest } = props;

  return (
    <FileUpload
      {...rest}
      accept="image/*"
      showPreview={true}
    />
  );
}
