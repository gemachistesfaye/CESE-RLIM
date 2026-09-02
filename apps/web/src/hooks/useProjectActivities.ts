import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type ActivityStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectActivity {
  id: string;
  researchProjectId: string;
  assignedMemberId: string | null;
  title: string;
  description: string | null;
  priority: ActivityPriority;
  status: ActivityStatus;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  progress: number;
  estimatedHours: number | null;
  tags: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  researchProject: {
    id: string;
    projectCode: string;
    title: string;
    projectStatus: string;
  };
  assignedMember: {
    id: string;
    role: string;
    isActive: boolean;
    researcher: {
      id: string;
      userId: string;
      employeeOrStudentId: string;
      department: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivitySummary {
  total: number;
  todo: number;
  inProgress: number;
  blocked: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  highPriority: number;
  urgentPriority: number;
}

export interface ProjectActivityStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  completionPercentage: number;
}

export function useProjectActivities(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  priority?: string;
  researchProjectId?: string;
  assignedMemberId?: string;
  overdue?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['projectActivities', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ProjectActivity> }>(
        '/project-activities',
        { params },
      );
      return data.data;
    },
  });
}

export function useMyProjectActivities(params: {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  overdue?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['projectActivities', 'my', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ProjectActivity> }>(
        '/project-activities/my',
        { params },
      );
      return data.data;
    },
  });
}

export function useOverdueActivities() {
  return useQuery({
    queryKey: ['projectActivities', 'overdue'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectActivity[] }>(
        '/project-activities/overdue',
      );
      return data.data;
    },
  });
}

export function useActivitySummary(researchProjectId?: string) {
  return useQuery({
    queryKey: ['activitySummary', researchProjectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ActivitySummary }>(
        '/project-activities/summary',
        { params: researchProjectId ? { researchProjectId } : undefined },
      );
      return data.data;
    },
  });
}

export function useProjectActivityStats(projectId: string) {
  return useQuery({
    queryKey: ['projectActivityStats', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectActivityStats }>(
        `/project-activities/project/${projectId}/stats`,
      );
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useProjectActivity(id: string) {
  return useQuery({
    queryKey: ['projectActivities', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectActivity }>(
        `/project-activities/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProjectActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      researchProjectId: string;
      assignedMemberId?: string;
      title: string;
      description?: string;
      priority?: string;
      status?: string;
      startDate?: string;
      dueDate?: string;
      progress?: number;
      notes?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ProjectActivity }>(
        '/project-activities',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectActivities'] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivityStats'] });
    },
  });
}

export function useUpdateProjectActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        assignedMemberId?: string;
        title?: string;
        description?: string;
        priority?: string;
        startDate?: string;
        dueDate?: string;
        notes?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ProjectActivity }>(
        `/project-activities/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectActivities'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivities', data.id] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivityStats'] });
    },
  });
}

export function useUpdateProjectActivityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ProjectActivity }>(
        `/project-activities/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectActivities'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivities', data.id] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivityStats'] });
    },
  });
}

export function useUpdateProjectActivityProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ProjectActivity }>(
        `/project-activities/${id}/progress`,
        { progress },
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectActivities'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivities', data.id] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivityStats'] });
    },
  });
}

export function useCancelProjectActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ success: boolean; data: ProjectActivity }>(
        `/project-activities/${id}`,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectActivities'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivities', data.id] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['projectActivityStats'] });
    },
  });
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ACTIVITY_PRIORITY_LABELS: Record<ActivityPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};
