import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  researchers: number;
  laboratories: number;
  equipment: number;
  projects: number;
  publications: number;
  documents: number;
  innovations: number;
  pendingOperations: {
    ethicsApplications: number;
    equipmentRequests: number;
    grantApplications: number;
  };
  activeGrants: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string | null;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; email: string } | null;
  }>;
  activityChart: Array<{ date: string; count: number }>;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface SystemInfo {
  applicationName: string;
  applicationVersion: string;
  environment: string;
  apiVersion: string;
  serverTime: string;
  nodeVersion: string;
  uptime: number;
}

export interface SystemHealth {
  status: string;
  database: string;
  api: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const PERMISSION_MATRIX = [
  { module: 'Users', admin: 'Full', coordinator: 'Limited', researcher: 'No', technician: 'No' },
  { module: 'Researchers', admin: 'Full', coordinator: 'Manage', researcher: 'View', technician: 'View' },
  { module: 'Laboratories', admin: 'Full', coordinator: 'Manage', researcher: 'View', technician: 'View' },
  { module: 'Equipment', admin: 'Full', coordinator: 'Manage', researcher: 'View', technician: 'View' },
  { module: 'Equipment Requests', admin: 'Full', coordinator: 'Review', researcher: 'Create/View Own', technician: 'View' },
  { module: 'Assignments', admin: 'Full', coordinator: 'Manage', researcher: 'View Own', technician: 'View' },
  { module: 'Maintenance', admin: 'Full', coordinator: 'Manage', researcher: 'View Own', technician: 'Manage Tasks' },
  { module: 'Projects', admin: 'Full', coordinator: 'Manage', researcher: 'View', technician: 'View' },
  { module: 'Project Team', admin: 'Full', coordinator: 'Manage', researcher: 'View', technician: 'View' },
  { module: 'Activities', admin: 'Full', coordinator: 'Manage', researcher: 'Own/Assigned', technician: 'View' },
  { module: 'Documents', admin: 'Full', coordinator: 'Manage', researcher: 'Own/Project', technician: 'View' },
  { module: 'Publications', admin: 'Full', coordinator: 'Manage', researcher: 'Create/Update', technician: 'View' },
  { module: 'Funding', admin: 'Full', coordinator: 'Manage', researcher: 'Apply', technician: 'View' },
  { module: 'Finance', admin: 'Full', coordinator: 'Manage', researcher: 'Own Expenses', technician: 'View' },
  { module: 'Ethics', admin: 'Full', coordinator: 'Review', researcher: 'Create/Submit', technician: 'View' },
  { module: 'Events', admin: 'Full', coordinator: 'Manage', researcher: 'Participate', technician: 'View' },
  { module: 'Milestones', admin: 'Full', coordinator: 'Manage', researcher: 'Assigned', technician: 'View' },
  { module: 'Reports', admin: 'Full', coordinator: 'Manage', researcher: 'Create/Submit', technician: 'View' },
  { module: 'Audit Logs', admin: 'Full', coordinator: 'Full', researcher: 'No', technician: 'No' },
];

export const SETTING_CATEGORIES = [
  { key: 'general', label: 'General' },
  { key: 'research', label: 'Research' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'finance', label: 'Finance' },
  { key: 'documents', label: 'Documents' },
];

export function useAdministrationOverview() {
  return useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminOverview>>('/administration/overview');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemSetting[]>>('/administration/settings');
      return data.data;
    },
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['systemSetting', key],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemSetting>>(`/administration/settings/${key}`);
      return data.data;
    },
    enabled: !!key,
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value, description, category, isPublic }: { key: string; value: string; description?: string; category?: string; isPublic?: boolean }) => {
      const { data } = await apiClient.patch<ApiResponse<SystemSetting>>(`/administration/settings/${key}`, {
        value,
        description,
        category,
        isPublic,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
}

export function useCreateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { key: string; value: string; description?: string; category?: string; isPublic?: boolean }) => {
      const { data } = await apiClient.post<ApiResponse<SystemSetting>>('/administration/settings', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
}

export function useDeleteSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(`/administration/settings/${key}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
}

export function useSystemInfo() {
  return useQuery({
    queryKey: ['systemInfo'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemInfo>>('/administration/system-info');
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemHealth>>('/administration/health');
      return data.data;
    },
    refetchInterval: 30_000,
  });
}
