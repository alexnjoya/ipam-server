import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// Extended Request type with user information
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface JwtUserPayload extends JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// IP Address calculation types
export interface IpRange {
  start: string;
  end: string;
  total: number;
}

export interface SubnetUtilization {
  totalIPs: number;
  usedIPs: number;
  availableIPs: number;
  reservedIPs: number;
  utilizationPercentage: number;
}

