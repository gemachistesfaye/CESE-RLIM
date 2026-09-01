import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface UserManagementUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  status: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  researcher?: {
    id: string;
    employeeOrStudentId: string;
    department: string;
  } | null;
}

export interface UserManagementDetail extends UserManagementUser {
  researcher?: {
    id: string;
    employeeOrStudentId: string;
    department: string;
    academicPosition: string | null;
    expertise: string | null;
    bio: string | null;
  } | null;
  _count: {
    auditLogs: number;
    notifications: number;
    createdActivities: number;
    uploadedDocuments: number;
    createdPublications: number;
  };
}

export interface UserManagementSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  admins: number;
  coordinators: number;
  researchers: number;
  technicians: number;
  recentRegistrations: number;
}

export interface SecuritySummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  adminCount: number;
  coordinatorCount: number;
  researcherCount: number;
  technicianCount: number;
  recentRoleChanges: Array<{
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; email: string } | null;
  }>;
  recentStatusChanges: Array<{
    id: string;
    description: string | null;
    metadata: unknown;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; email: string } | null;
  }>;
  recentLogins: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    lastLoginAt: string | null;
    role: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    description: string | null;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string } | null;
  }>;
}

export interface UserActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  COORDINATOR: 'Coordinator',
  RESEARCHER: 'Researcher',
  TECHNICIAN: 'Technician',
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  COORDINATOR: 'bg-blue-100 text-blue-700',
  RESEARCHER: 'bg-emerald-100 text-emerald-700',
  TECHNICIAN: 'bg-amber-100 text-amber-700',
};

export function useUserManagementList(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  const { page = 1, limit = 20, search, role, status } = params;

  return useQuery({
    queryKey: ['userManagement', { page, limit, search, role, status }],
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) queryParams.search = search;
      if (role) queryParams.role = role;
      if (status) queryParams.status = status;

      const { data } = await apiClient.get<ApiResponse<{ items: UserManagementUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(
        '/user-management/users',
        { params: queryParams },
      );
      return data.data;
    },
  });
}

export function useUserManagementDetail(id: string) {
  return useQuery({
    queryKey: ['userManagement', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<UserManagementDetail>>(`/user-management/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUserManagementSummary() {
  return useQuery({
    queryKey: ['userManagementSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<UserManagementSummary>>('/user-management/summary');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useSecuritySummary() {
  return useQuery({
    queryKey: ['securitySummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SecuritySummary>>('/user-management/security-summary');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useUserActivity(id: string, params: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['userActivity', id, { page, limit }],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ items: UserActivity[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(
        `/user-management/users/${id}/activity`,
        { params: { page: String(page), limit: String(limit) } },
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateUserManagementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<ApiResponse<UserManagementUser>>(
        `/user-management/users/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userManagement'] });
      queryClient.invalidateQueries({ queryKey: ['userManagementSummary'] });
      queryClient.invalidateQueries({ queryKey: ['securitySummary'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const { data } = await apiClient.patch<ApiResponse<{ success: boolean; message: string }>>(
        `/user-management/users/${id}/reset-password`,
        { password },
      );
      return data.data;
    },
  });
}
