// Common utility types and base interfaces
// These types are shared across the entire Synapse-Hub application

// Base entity interface that all entities should extend
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Timestamp utilities
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Generic response wrapper for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: {
    pagination?: Pagination;
    timestamp: Date;
    requestId?: string;
  };
}

// Pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// Status types
export type Status = 'active' | 'inactive' | 'pending' | 'archived' | 'deleted';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Health = 'excellent' | 'good' | 'warning' | 'poor';

// UI State types
export interface UIState {
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

// Theme and appearance
export type Theme = 'light' | 'dark' | 'system';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red';

// File and media types
export interface FileReference {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  url?: string;
  uploadedAt: Date;
}

// Geolocation interface
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: Date;
}

// Generic key-value pairs
export interface KeyValuePair<T = string> {
  key: string;
  value: T;
}

// Search and filtering
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: Pick<Pagination, 'page' | 'limit'>;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Configuration value types
export type ConfigValue = string | number | boolean | string[] | Record<string, unknown>;

// Generic ID types for better type safety
export type UserId = string;
export type SessionId = string;
export type ConnectorId = string;
export type WorkflowId = string;
export type TaskId = string;
export type ProjectId = string; 