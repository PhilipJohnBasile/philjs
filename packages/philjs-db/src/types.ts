/**
 * PhilJS Database Types
 */

export interface DatabaseConfig {
  type: 'prisma' | 'drizzle' | 'supabase';
  connectionString: string;
  options: Record<string, unknown>;
}

export interface Repository<T> {
  findAll(options?: PaginationOptions): Promise<PaginatedResult<T>>;
  findById(id: string | number): Promise<T | null>;
  findOne(where: Partial<T>): Promise<T | null>;
  findMany(where: Partial<T>): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T>;
  delete(id: string | number): Promise<void>;
  count(where?: Partial<T>): Promise<number>;
}

export interface PaginationOptions {
  page?: number;
  perPage?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
