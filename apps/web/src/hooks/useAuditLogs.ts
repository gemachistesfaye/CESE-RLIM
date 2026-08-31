import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogDetail extends AuditLogItem {
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLogPagination {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditSummary {
  totalEvents: number;
  todayEvents: number;
  weekEvents: number;
  monthEvents: number;
  actionsByType: { action: string; count: number }[];
  entityByType: { entityType: string; count: number }[];
  recentActivity: AuditLogItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  ISSUE: 'Issued',
  RETURN: 'Returned',
  MAINTENANCE: 'Maintenance',
  STATUS_CHANGE: 'Status Change',
  PROGRESS_UPDATE: 'Progress Update',
  VERSION_UPLOAD: 'Version Upload',
  DOWNLOAD: 'Download',
  ARCHIVE: 'Archived',
  AUTHOR_UPDATE: 'Author Update',
  WITHDRAW: 'Withdrawn',
  SPENDING_UPDATE: 'Spending Update',
  SUBMIT: 'Submitted',
  REQUEST_REVISION: 'Request Revision',
  ASSIGN_REVIEWER: 'Assign Reviewer',
  OTHER: 'Other',
};

export const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-violet-100 text-violet-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  APPROVE: 'bg-green-100 text-green-700',
  REJECT: 'bg-red-100 text-red-700',
  ISSUE: 'bg-orange-100 text-orange-700',
  RETURN: 'bg-teal-100 text-teal-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  STATUS_CHANGE: 'bg-sky-100 text-sky-700',
  PROGRESS_UPDATE: 'bg-indigo-100 text-indigo-700',
  VERSION_UPLOAD: 'bg-purple-100 text-purple-700',
  DOWNLOAD: 'bg-cyan-100 text-cyan-700',
  ARCHIVE: 'bg-slate-100 text-slate-600',
  AUTHOR_UPDATE: 'bg-pink-100 text-pink-700',
  WITHDRAW: 'bg-rose-100 text-rose-700',
  SPENDING_UPDATE: 'bg-lime-100 text-lime-700',
  SUBMIT: 'bg-blue-100 text-blue-700',
  REQUEST_REVISION: 'bg-amber-100 text-amber-700',
  ASSIGN_REVIEWER: 'bg-violet-100 text-violet-700',
  OTHER: 'bg-slate-100 text-slate-600',
};

export const ENTITY_COLORS: Record<string, string> = {
  User: 'bg-violet-100 text-violet-700',
  Researcher: 'bg-blue-100 text-blue-700',
  Laboratory: 'bg-purple-100 text-purple-700',
  Equipment: 'bg-orange-100 text-orange-700',
  EquipmentRequest: 'bg-amber-100 text-amber-700',
  EquipmentAssignment: 'bg-teal-100 text-teal-700',
  MaintenanceRecord: 'bg-yellow-100 text-yellow-700',
  ResearchProject: 'bg-emerald-100 text-emerald-700',
  ProjectActivity: 'bg-indigo-100 text-indigo-700',
  Innovation: 'bg-pink-100 text-pink-700',
  ResearchDocument: 'bg-slate-100 text-slate-700',
  ResearchPublication: 'bg-sky-100 text-sky-700',
  FundingOpportunity: 'bg-green-100 text-green-700',
  GrantApplication: 'bg-teal-100 text-teal-700',
  ResearchGrant: 'bg-cyan-100 text-cyan-700',
  ResearchExpense: 'bg-lime-100 text-lime-700',
  EthicsApplication: 'bg-rose-100 text-rose-700',
  ResearchEvent: 'bg-violet-100 text-violet-700',
  ResearchMilestone: 'bg-amber-100 text-amber-700',
  ResearchReport: 'bg-sky-100 text-sky-700',
  BudgetAllocation: 'bg-green-100 text-green-700',
};

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useAuditLogs(params: AuditLogQueryParams = {}) {
  const { page = 1, limit = 20, search, userId, action, entityType, entityId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = params;

  return useQuery({
    queryKey: ['auditLogs', { page, limit, search, userId, action, entityType, entityId, startDate, endDate, sortBy, sortOrder }],
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      };
      if (search) queryParams.search = search;
      if (userId) queryParams.userId = userId;
      if (action) queryParams.action = action;
      if (entityType) queryParams.entityType = entityType;
      if (entityId) queryParams.entityId = entityId;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const { data } = await apiClient.get<ApiResponse<AuditLogPagination>>('/audit-logs', { params: queryParams });
      return data.data;
    },
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['auditLog', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuditLogDetail>>(`/audit-logs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useAuditSummary() {
  return useQuery({
    queryKey: ['auditSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuditSummary>>('/audit-logs/summary');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useUserActivity(userId: string, params: AuditLogQueryParams = {}) {
  const { page = 1, limit = 20, action, entityType, startDate, endDate, sortOrder = 'desc' } = params;

  return useQuery({
    queryKey: ['userActivity', userId, { page, limit, action, entityType, startDate, endDate, sortOrder }],
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sortOrder,
      };
      if (action) queryParams.action = action;
      if (entityType) queryParams.entityType = entityType;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const { data } = await apiClient.get<ApiResponse<AuditLogPagination>>(`/audit-logs/user/${userId}`, { params: queryParams });
      return data.data;
    },
    enabled: !!userId,
  });
}

export function useEntityActivity(entityType: string, entityId: string, params: AuditLogQueryParams = {}) {
  const { page = 1, limit = 20, startDate, endDate, sortOrder = 'desc' } = params;

  return useQuery({
    queryKey: ['entityActivity', entityType, entityId, { page, limit, startDate, endDate, sortOrder }],
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sortOrder,
      };
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const { data } = await apiClient.get<ApiResponse<AuditLogPagination>>(`/audit-logs/entity/${entityType}/${entityId}`, { params: queryParams });
      return data.data;
    },
    enabled: !!entityType && !!entityId,
  });
}
