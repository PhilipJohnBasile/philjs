/**
 * @philjs/antd - Ant Design Integration for PhilJS
 *
 * Seamless integration between Ant Design components and PhilJS's
 * signal-based reactivity system. All Ant Design components work
 * with PhilJS signals out of the box.
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { Form, Input, Button, useAntdForm } from '@philjs/antd';
 *
 * function LoginForm() {
 *   const form = useAntdForm();
 *   const loading = signal(false);
 *
 *   const onFinish = async (values) => {
 *     loading.set(true);
 *     await login(values);
 *     loading.set(false);
 *   };
 *
 *   return (
 *     <Form form={form} onFinish={onFinish}>
 *       <Form.Item name="email" rules={[{ required: true }]}>
 *         <Input placeholder="Email" />
 *       </Form.Item>
 *       <Button type="primary" htmlType="submit" loading={loading()}>
 *         Login
 *       </Button>
 *     </Form>
 *   );
 * }
 * ```
 */

import { signal, effect, computed, batch, memo } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'compact';

export interface PhilJSTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  mode: ThemeMode;
  borderRadius: number;
  fontSize: number;
}

export interface AntdThemeToken {
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  colorBgBase: string;
  colorBgContainer: string;
  colorTextBase: string;
  colorTextSecondary: string;
  colorBorder: string;
  borderRadius: number;
  fontSize: number;
}

export interface AntdThemeConfig {
  token: AntdThemeToken;
  algorithm?: 'default' | 'dark' | 'compact';
  components?: Record<string, Record<string, unknown>>;
}

export interface FormInstance<T = unknown> {
  getFieldsValue: () => T;
  getFieldValue: (name: string | string[]) => unknown;
  setFieldsValue: (values: Partial<T>) => void;
  setFieldValue: (name: string | string[], value: unknown) => void;
  resetFields: (fields?: string[]) => void;
  validateFields: (fields?: string[]) => Promise<T>;
  submit: () => void;
  isFieldsTouched: (fields?: string[], allTouched?: boolean) => boolean;
  isFieldTouched: (name: string | string[]) => boolean;
  isFieldValidating: (name: string | string[]) => boolean;
  getFieldError: (name: string | string[]) => string[];
  getFieldsError: (fields?: string[]) => Array<{ name: string[]; errors: string[] }>;
  scrollToField: (name: string | string[], options?: ScrollOptions) => void;
}

export interface TableColumn<T = unknown> {
  title: string;
  dataIndex?: string | string[];
  key?: string;
  render?: (value: unknown, record: T, index: number) => unknown;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: string; value: string }>;
  onFilter?: (value: string, record: T) => boolean;
  width?: number | string;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
}

// ============================================================================
// Default Theme
// ============================================================================

export const PhilJSAntdTheme: AntdThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorTextBase: '#000000',
    colorTextSecondary: '#00000073',
    colorBorder: '#d9d9d9',
    borderRadius: 6,
    fontSize: 14,
  },
  algorithm: 'default',
};

export const PhilJSAntdDarkTheme: AntdThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorTextBase: '#ffffffd9',
    colorTextSecondary: '#ffffff73',
    colorBorder: '#424242',
    borderRadius: 6,
    fontSize: 14,
  },
  algorithm: 'dark',
};

// ============================================================================
// Theme Conversion
// ============================================================================

/**
 * Convert PhilJS theme to Ant Design theme config
 */
export function convertThemeToAntd(theme: PhilJSTheme): AntdThemeConfig {
  return {
    token: {
      colorPrimary: theme.colors.primary,
      colorSuccess: theme.colors.success,
      colorWarning: theme.colors.warning,
      colorError: theme.colors.error,
      colorInfo: theme.colors.info || theme.colors.primary,
      colorBgBase: theme.colors.background,
      colorBgContainer: theme.colors.surface,
      colorTextBase: theme.colors.text,
      colorTextSecondary: theme.colors.textSecondary,
      colorBorder: theme.colors.border,
      borderRadius: theme.borderRadius,
      fontSize: theme.fontSize,
    },
    algorithm: theme.mode === 'dark' ? 'dark' : theme.mode === 'compact' ? 'compact' : 'default',
  };
}

/**
 * Create a synced Ant Design theme from a PhilJS theme signal
 */
export function createAntdSyncedTheme(themeSignal: ReturnType<typeof signal<PhilJSTheme>>) {
  return computed(() => convertThemeToAntd(themeSignal()));
}

// ============================================================================
// Form Integration
// ============================================================================

interface FormFieldState<T = unknown> {
  value: T;
  errors: string[];
  touched: boolean;
  validating: boolean;
}

interface FormState<T extends Record<string, unknown> = Record<string, unknown>> {
  values: T;
  fields: Map<string, FormFieldState>;
  submitting: boolean;
  dirty: boolean;
}

/**
 * Create a PhilJS-integrated form instance
 */
export function useAntdForm<T extends Record<string, unknown> = Record<string, unknown>>(
  initialValues?: Partial<T>
): {
  form: FormInstance<T>;
  values: ReturnType<typeof signal<T>>;
  errors: ReturnType<typeof signal<Record<string, string[]>>>;
  touched: ReturnType<typeof signal<Record<string, boolean>>>;
  submitting: ReturnType<typeof signal<boolean>>;
  dirty: ReturnType<typeof computed<boolean>>;
  reset: () => void;
  setFieldValue: (name: keyof T, value: T[keyof T]) => void;
  setFieldError: (name: keyof T, errors: string[]) => void;
  validate: () => Promise<T>;
} {
  const values = signal<T>((initialValues || {}) as T);
  const errors = signal<Record<string, string[]>>({});
  const touched = signal<Record<string, boolean>>({});
  const submitting = signal(false);
  const initialValuesRef = { ...initialValues };

  const dirty = computed(() => {
    const current = values();
    return Object.keys(current).some(
      key => current[key as keyof T] !== initialValuesRef[key as keyof T]
    );
  });

  const setFieldValue = (name: keyof T, value: T[keyof T]) => {
    values.set({ ...values(), [name]: value });
    touched.set({ ...touched(), [name as string]: true });
  };

  const setFieldError = (name: keyof T, fieldErrors: string[]) => {
    errors.set({ ...errors(), [name as string]: fieldErrors });
  };

  const reset = () => {
    values.set((initialValues || {}) as T);
    errors.set({});
    touched.set({});
  };

  const validate = async (): Promise<T> => {
    // In a real implementation, this would integrate with Ant Design's form validation
    return values();
  };

  const form: FormInstance<T> = {
    getFieldsValue: () => values(),
    getFieldValue: (name) => {
      const v = values();
      if (Array.isArray(name)) {
        return name.reduce((obj, key) => (obj as Record<string, unknown>)?.[key], v);
      }
      return v[name as keyof T];
    },
    setFieldsValue: (newValues) => {
      values.set({ ...values(), ...newValues });
    },
    setFieldValue: (name, value) => {
      if (Array.isArray(name)) {
        // Handle nested paths
        const current = { ...values() };
        let obj: Record<string, unknown> = current;
        for (let i = 0; i < name.length - 1; i++) {
          const key = name[i]!;
          obj[key] = { ...(obj[key] as Record<string, unknown> || {}) };
          obj = obj[key] as Record<string, unknown>;
        }
        obj[name[name.length - 1]!] = value;
        values.set(current);
      } else {
        values.set({ ...values(), [name]: value });
      }
    },
    resetFields: (fields) => {
      if (fields) {
        const current = values();
        const newValues = { ...current };
        fields.forEach(field => {
          (newValues as Record<string, unknown>)[field] = (initialValues as Record<string, unknown>)?.[field];
        });
        values.set(newValues);
      } else {
        reset();
      }
    },
    validateFields: async () => validate(),
    submit: () => {
      // Trigger form submission
    },
    isFieldsTouched: (fields, allTouched) => {
      const t = touched();
      if (!fields) {
        const touchedFields = Object.values(t);
        return allTouched ? touchedFields.every(Boolean) : touchedFields.some(Boolean);
      }
      return allTouched
        ? fields.every(f => t[f])
        : fields.some(f => t[f]);
    },
    isFieldTouched: (name) => {
      const key = Array.isArray(name) ? name.join('.') : name;
      return touched()[key] || false;
    },
    isFieldValidating: () => false,
    getFieldError: (name) => {
      const key = Array.isArray(name) ? name.join('.') : name;
      return errors()[key] || [];
    },
    getFieldsError: (fields) => {
      const e = errors();
      const keys = fields || Object.keys(e);
      return keys.map(key => ({
        name: [key],
        errors: e[key] || [],
      }));
    },
    scrollToField: () => {
      // Would scroll to the field element
    },
  };

  return {
    form,
    values,
    errors,
    touched,
    submitting,
    dirty,
    reset,
    setFieldValue,
    setFieldError,
    validate,
  };
}

// ============================================================================
// Table Integration
// ============================================================================

export interface UseTableOptions<T> {
  data: T[] | ReturnType<typeof signal<T[]>>;
  columns: TableColumn<T>[];
  pagination?: boolean | TablePagination;
  rowKey?: string | ((record: T) => string);
  loading?: boolean | ReturnType<typeof signal<boolean>>;
  onSort?: (field: string, order: 'ascend' | 'descend' | null) => void;
  onFilter?: (filters: Record<string, string[]>) => void;
  onPageChange?: (page: number, pageSize: number) => void;
}

export interface TableState<T> {
  data: T[];
  sortField: string | null;
  sortOrder: 'ascend' | 'descend' | null;
  filters: Record<string, string[]>;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  selectedRowKeys: (string | number)[];
  loading: boolean;
}

/**
 * Create a PhilJS-integrated table state
 */
export function useAntdTable<T extends Record<string, unknown>>(
  options: UseTableOptions<T>
): {
  tableProps: {
    dataSource: T[];
    columns: TableColumn<T>[];
    pagination: TablePagination | false;
    loading: boolean;
    rowKey: string | ((record: T) => string);
    onChange: (pagination: TablePagination, filters: Record<string, string[]>, sorter: { field?: string; order?: 'ascend' | 'descend' }) => void;
  };
  state: ReturnType<typeof signal<TableState<T>>>;
  setData: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
} {
  const initialData = typeof options.data === 'function'
    ? (options.data as () => T[])()
    : options.data;

  const state = signal<TableState<T>>({
    data: initialData,
    sortField: null,
    sortOrder: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: typeof options.pagination === 'object' ? options.pagination.pageSize : 10,
      total: initialData.length,
    },
    selectedRowKeys: [],
    loading: typeof options.loading === 'boolean' ? options.loading : false,
  });

  // Sync data if it's a signal
  if (typeof options.data === 'function' && 'subscribe' in (options.data as object)) {
    effect(() => {
      const data = (options.data as () => T[])();
      const current = state();
      state.set({ ...current, data, pagination: { ...current.pagination, total: data.length } });
    });
  }

  // Sync loading if it's a signal
  if (typeof options.loading === 'function' && 'subscribe' in (options.loading as object)) {
    effect(() => {
      const loading = (options.loading as () => boolean)();
      state.set({ ...state(), loading });
    });
  }

  const setData = (data: T[]) => {
    const current = state();
    state.set({ ...current, data, pagination: { ...current.pagination, total: data.length } });
  };

  const setLoading = (loading: boolean) => {
    state.set({ ...state(), loading });
  };

  const setPage = (page: number) => {
    const current = state();
    state.set({ ...current, pagination: { ...current.pagination, current: page } });
    options.onPageChange?.(page, current.pagination.pageSize);
  };

  const setPageSize = (size: number) => {
    const current = state();
    state.set({ ...current, pagination: { ...current.pagination, pageSize: size, current: 1 } });
    options.onPageChange?.(1, size);
  };

  const refresh = () => {
    // Trigger data refresh
    options.onPageChange?.(state().pagination.current, state().pagination.pageSize);
  };

  const handleChange = (
    pagination: TablePagination,
    filters: Record<string, string[]>,
    sorter: { field?: string; order?: 'ascend' | 'descend' }
  ) => {
    batch(() => {
      const current = state();
      state.set({
        ...current,
        pagination: {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
        },
        filters,
        sortField: sorter.field || null,
        sortOrder: sorter.order || null,
      });
    });

    if (sorter.field) {
      options.onSort?.(sorter.field, sorter.order || null);
    }
    if (Object.keys(filters).length > 0) {
      options.onFilter?.(filters);
    }
    options.onPageChange?.(pagination.current, pagination.pageSize);
  };

  const tableProps = computed(() => {
    const s = state();
    return {
      dataSource: s.data,
      columns: options.columns,
      pagination: options.pagination === false ? false : s.pagination,
      loading: s.loading,
      rowKey: options.rowKey || 'id',
      onChange: handleChange,
    };
  });

  return {
    tableProps: tableProps(),
    state,
    setData,
    setLoading,
    setPage,
    setPageSize,
    refresh,
  };
}

// ============================================================================
// Message & Notification Integration
// ============================================================================

export interface MessageOptions {
  content: string;
  duration?: number;
  key?: string;
  onClose?: () => void;
}

export interface NotificationOptions {
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  key?: string;
  onClose?: () => void;
}

const messageQueue = signal<Array<{ type: string; options: MessageOptions }>>([]);
const notificationQueue = signal<Array<{ type: string; options: NotificationOptions }>>([]);

/**
 * PhilJS-integrated message API
 */
export const message = {
  success: (content: string | MessageOptions) => {
    const options = typeof content === 'string' ? { content } : content;
    messageQueue.set([...messageQueue(), { type: 'success', options }]);
  },
  error: (content: string | MessageOptions) => {
    const options = typeof content === 'string' ? { content } : content;
    messageQueue.set([...messageQueue(), { type: 'error', options }]);
  },
  warning: (content: string | MessageOptions) => {
    const options = typeof content === 'string' ? { content } : content;
    messageQueue.set([...messageQueue(), { type: 'warning', options }]);
  },
  info: (content: string | MessageOptions) => {
    const options = typeof content === 'string' ? { content } : content;
    messageQueue.set([...messageQueue(), { type: 'info', options }]);
  },
  loading: (content: string | MessageOptions) => {
    const options = typeof content === 'string' ? { content } : content;
    const key = options.key || `loading-${Date.now()}`;
    messageQueue.set([...messageQueue(), { type: 'loading', options: { ...options, key } }]);
    return key;
  },
  destroy: (key?: string) => {
    if (key) {
      messageQueue.set(messageQueue().filter(m => m.options.key !== key));
    } else {
      messageQueue.set([]);
    }
  },
};

/**
 * PhilJS-integrated notification API
 */
export const notification = {
  success: (options: NotificationOptions) => {
    notificationQueue.set([...notificationQueue(), { type: 'success', options }]);
  },
  error: (options: NotificationOptions) => {
    notificationQueue.set([...notificationQueue(), { type: 'error', options }]);
  },
  warning: (options: NotificationOptions) => {
    notificationQueue.set([...notificationQueue(), { type: 'warning', options }]);
  },
  info: (options: NotificationOptions) => {
    notificationQueue.set([...notificationQueue(), { type: 'info', options }]);
  },
  open: (options: NotificationOptions & { type?: 'success' | 'error' | 'warning' | 'info' }) => {
    const type = options.type || 'info';
    notificationQueue.set([...notificationQueue(), { type, options }]);
  },
  destroy: (key?: string) => {
    if (key) {
      notificationQueue.set(notificationQueue().filter(n => n.options.key !== key));
    } else {
      notificationQueue.set([]);
    }
  },
};

// ============================================================================
// Modal Integration
// ============================================================================

export interface ModalConfirmOptions {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger' | 'default';
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
}

const modalQueue = signal<Array<{ type: string; options: ModalConfirmOptions; resolve: (value: boolean) => void }>>([]);

/**
 * PhilJS-integrated modal confirm API
 */
export const modal = {
  confirm: (options: ModalConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      modalQueue.set([...modalQueue(), { type: 'confirm', options, resolve }]);
    });
  },
  info: (options: ModalConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      modalQueue.set([...modalQueue(), { type: 'info', options, resolve }]);
    });
  },
  success: (options: ModalConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      modalQueue.set([...modalQueue(), { type: 'success', options, resolve }]);
    });
  },
  error: (options: ModalConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      modalQueue.set([...modalQueue(), { type: 'error', options, resolve }]);
    });
  },
  warning: (options: ModalConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      modalQueue.set([...modalQueue(), { type: 'warning', options, resolve }]);
    });
  },
  destroyAll: () => {
    const queue = modalQueue();
    queue.forEach(m => m.resolve(false));
    modalQueue.set([]);
  },
};

// ============================================================================
// Upload Integration
// ============================================================================

export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  percent?: number;
  url?: string;
  thumbUrl?: string;
  response?: unknown;
  error?: Error;
  originFileObj?: File;
}

export interface UseUploadOptions {
  action?: string;
  multiple?: boolean;
  accept?: string;
  maxCount?: number;
  maxSize?: number; // in bytes
  onUpload?: (file: File) => Promise<{ url: string; [key: string]: unknown }>;
  onRemove?: (file: UploadFile) => Promise<boolean> | boolean;
  onChange?: (fileList: UploadFile[]) => void;
}

/**
 * Create a PhilJS-integrated upload state
 */
export function useAntdUpload(options: UseUploadOptions = {}): {
  fileList: ReturnType<typeof signal<UploadFile[]>>;
  uploading: ReturnType<typeof computed<boolean>>;
  uploadProps: {
    fileList: UploadFile[];
    multiple: boolean;
    accept?: string;
    maxCount?: number;
    customRequest: (options: { file: File; onSuccess: (response: unknown) => void; onError: (error: Error) => void; onProgress: (event: { percent: number }) => void }) => void;
    onRemove: (file: UploadFile) => Promise<boolean>;
    onChange: (info: { fileList: UploadFile[] }) => void;
  };
  upload: (file: File) => Promise<void>;
  remove: (uid: string) => Promise<void>;
  clear: () => void;
} {
  const fileList = signal<UploadFile[]>([]);

  const uploading = computed(() => fileList().some(f => f.status === 'uploading'));

  const upload = async (file: File) => {
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File size exceeds limit of ${options.maxSize} bytes`);
    }

    const uid = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const uploadFile: UploadFile = {
      uid,
      name: file.name,
      status: 'uploading',
      percent: 0,
      originFileObj: file,
    };

    fileList.set([...fileList(), uploadFile]);

    try {
      if (options.onUpload) {
        const result = await options.onUpload(file);
        const updated = fileList().map(f =>
          f.uid === uid
            ? { ...f, status: 'done' as const, percent: 100, url: result.url, response: result }
            : f
        );
        fileList.set(updated);
      } else if (options.action) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(options.action, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        const updated = fileList().map(f =>
          f.uid === uid
            ? { ...f, status: 'done' as const, percent: 100, url: result.url, response: result }
            : f
        );
        fileList.set(updated);
      }
    } catch (error) {
      const updated = fileList().map(f =>
        f.uid === uid
          ? { ...f, status: 'error' as const, error: error as Error }
          : f
      );
      fileList.set(updated);
      throw error;
    }

    options.onChange?.(fileList());
  };

  const remove = async (uid: string) => {
    const file = fileList().find(f => f.uid === uid);
    if (!file) return;

    if (options.onRemove) {
      const canRemove = await options.onRemove(file);
      if (!canRemove) return;
    }

    fileList.set(fileList().filter(f => f.uid !== uid));
    options.onChange?.(fileList());
  };

  const clear = () => {
    fileList.set([]);
    options.onChange?.([]);
  };

  const customRequest = ({
    file,
    onSuccess,
    onError,
    onProgress,
  }: {
    file: File;
    onSuccess: (response: unknown) => void;
    onError: (error: Error) => void;
    onProgress: (event: { percent: number }) => void;
  }) => {
    upload(file as File)
      .then(() => {
        const uploaded = fileList().find(f => f.originFileObj === file);
        onSuccess(uploaded?.response);
      })
      .catch(error => {
        onError(error);
      });
  };

  const uploadProps = computed(() => ({
    fileList: fileList(),
    multiple: options.multiple ?? false,
    accept: options.accept,
    maxCount: options.maxCount,
    customRequest,
    onRemove: async (file: UploadFile) => {
      await remove(file.uid);
      return true;
    },
    onChange: (info: { fileList: UploadFile[] }) => {
      fileList.set(info.fileList);
      options.onChange?.(info.fileList);
    },
  }));

  return {
    fileList,
    uploading,
    uploadProps: uploadProps(),
    upload,
    remove,
    clear,
  };
}

// ============================================================================
// Select/Cascader Integration
// ============================================================================

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: SelectOption[];
}

export interface UseSelectOptions<T> {
  options: SelectOption[] | ReturnType<typeof signal<SelectOption[]>>;
  value?: T;
  multiple?: boolean;
  searchable?: boolean;
  onSearch?: (value: string) => void | Promise<SelectOption[]>;
  onChange?: (value: T) => void;
  loading?: boolean | ReturnType<typeof signal<boolean>>;
}

/**
 * Create a PhilJS-integrated select state
 */
export function useAntdSelect<T = string | string[]>(options: UseSelectOptions<T>): {
  value: ReturnType<typeof signal<T | undefined>>;
  searchValue: ReturnType<typeof signal<string>>;
  filteredOptions: ReturnType<typeof computed<SelectOption[]>>;
  loading: ReturnType<typeof signal<boolean>>;
  selectProps: {
    value: T | undefined;
    options: SelectOption[];
    loading: boolean;
    showSearch: boolean;
    filterOption: boolean;
    onSearch: (value: string) => void;
    onChange: (value: T) => void;
  };
  setValue: (value: T) => void;
  clear: () => void;
} {
  const value = signal<T | undefined>(options.value);
  const searchValue = signal('');
  const loading = signal(typeof options.loading === 'boolean' ? options.loading : false);

  const allOptions = typeof options.options === 'function'
    ? options.options
    : () => options.options as SelectOption[];

  const filteredOptions = computed(() => {
    const opts = allOptions();
    const search = searchValue().toLowerCase();
    if (!search || !options.searchable) return opts;
    return opts.filter(opt =>
      opt.label.toLowerCase().includes(search) ||
      String(opt.value).toLowerCase().includes(search)
    );
  });

  // Sync loading if it's a signal
  if (typeof options.loading === 'function' && 'subscribe' in (options.loading as object)) {
    effect(() => {
      loading.set((options.loading as () => boolean)());
    });
  }

  const handleSearch = async (val: string) => {
    searchValue.set(val);
    if (options.onSearch) {
      loading.set(true);
      await options.onSearch(val);
      loading.set(false);
    }
  };

  const handleChange = (val: T) => {
    value.set(val);
    options.onChange?.(val);
  };

  const setValue = (val: T) => {
    value.set(val);
    options.onChange?.(val);
  };

  const clear = () => {
    value.set(undefined);
    searchValue.set('');
  };

  const selectProps = computed(() => ({
    value: value(),
    options: filteredOptions(),
    loading: loading(),
    showSearch: options.searchable ?? false,
    filterOption: false,
    onSearch: handleSearch,
    onChange: handleChange,
  }));

  return {
    value,
    searchValue,
    filteredOptions,
    loading,
    selectProps: selectProps(),
    setValue,
    clear,
  };
}

// ============================================================================
// Drawer Integration
// ============================================================================

export interface UseDrawerOptions {
  defaultVisible?: boolean;
  width?: number | string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  onClose?: () => void;
  onOpen?: () => void;
}

/**
 * Create a PhilJS-integrated drawer state
 */
export function useAntdDrawer(options: UseDrawerOptions = {}): {
  visible: ReturnType<typeof signal<boolean>>;
  drawerProps: {
    open: boolean;
    width: number | string;
    placement: 'left' | 'right' | 'top' | 'bottom';
    onClose: () => void;
  };
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const visible = signal(options.defaultVisible ?? false);

  const open = () => {
    visible.set(true);
    options.onOpen?.();
  };

  const close = () => {
    visible.set(false);
    options.onClose?.();
  };

  const toggle = () => {
    if (visible()) {
      close();
    } else {
      open();
    }
  };

  const drawerProps = computed(() => ({
    open: visible(),
    width: options.width ?? 378,
    placement: options.placement ?? 'right',
    onClose: close,
  }));

  return {
    visible,
    drawerProps: drawerProps(),
    open,
    close,
    toggle,
  };
}

// ============================================================================
// Popconfirm Integration
// ============================================================================

export interface UsePopconfirmOptions {
  title: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Create a PhilJS-integrated popconfirm state
 */
export function useAntdPopconfirm(options: UsePopconfirmOptions): {
  open: ReturnType<typeof signal<boolean>>;
  loading: ReturnType<typeof signal<boolean>>;
  popconfirmProps: {
    title: string;
    description?: string;
    okText: string;
    cancelText: string;
    open: boolean;
    okButtonProps: { loading: boolean };
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    onOpenChange: (open: boolean) => void;
  };
  confirm: () => Promise<void>;
  cancel: () => void;
} {
  const open = signal(false);
  const loading = signal(false);

  const confirm = async () => {
    loading.set(true);
    try {
      await options.onConfirm?.();
      open.set(false);
    } finally {
      loading.set(false);
    }
  };

  const cancel = () => {
    open.set(false);
    options.onCancel?.();
  };

  const popconfirmProps = computed(() => ({
    title: options.title,
    description: options.description,
    okText: options.okText ?? 'OK',
    cancelText: options.cancelText ?? 'Cancel',
    open: open(),
    okButtonProps: { loading: loading() },
    onConfirm: confirm,
    onCancel: cancel,
    onOpenChange: (isOpen: boolean) => open.set(isOpen),
  }));

  return {
    open,
    loading,
    popconfirmProps: popconfirmProps(),
    confirm,
    cancel,
  };
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export {
  signal,
  effect,
  computed,
  batch,
  memo,
} from '@philjs/core';
