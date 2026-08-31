import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ResearchMilestone {
  id: string;
  researchProjectId: string;
  title: string;
  description: string | null;
  milestoneOrder: number;
  plannedStartDate: string | null;
  plannedDueDate: string | null;
  actualCompletionDate: string | null;
  status: string;
  progress: number;
  responsibleMemberId: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  researchProject: { id: string; projectCode: string; title: string; startDate: string | null; endDate: string | null };
  responsibleMember: { id: string; researcher: { id: string; user: { id: string; firstName: string; lastName: string; email: string } } } | null;
  createdBy: { id: string; firstName: string; lastName: string };
}

export interface MilestoneSummary {
  total: number;
  planned: number;
  inProgress: number;
  blocked: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export interface ProjectProgress {
  overallProgress: number;
  totalMilestones: number;
  completedMilestones: number;
  overdueMilestones: number;
  upcomingMilestones: number;
  totalActivities: number;
  completedActivities: number;
  scheduleStatus: string;
  daysElapsed: number;
  daysRemaining: number;
  startDate: string | null;
  endDate: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface MilestoneQueryParams {
  page?: number; limit?: number; search?: string; status?: string;
  researchProjectId?: string; overdue?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}

export function useResearchMilestones(params: MilestoneQueryParams = {}) {
  const { page = 1, limit = 10, search, status, researchProjectId, overdue, sortBy, sortOrder } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (search) searchParams.set('search', search);
  if (status) searchParams.set('status', status);
  if (researchProjectId) searchParams.set('researchProjectId', researchProjectId);
  if (overdue) searchParams.set('overdue', overdue);
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);

  return useQuery<PaginatedResponse<ResearchMilestone>>({
    queryKey: ['research-milestones', params],
    queryFn: async () => { const { data } = await apiClient.get(`/research-milestones?${searchParams.toString()}`); return data.data; },
  });
}

export function useMyMilestones(params: { page?: number; limit?: number; status?: string } = {}) {
  const { page = 1, limit = 10, status } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (status) searchParams.set('status', status);

  return useQuery<PaginatedResponse<ResearchMilestone>>({
    queryKey: ['research-milestones', 'my', params],
    queryFn: async () => { const { data } = await apiClient.get(`/research-milestones/my?${searchParams.toString()}`); return data.data; },
  });
}

export function useProjectMilestones(projectId: string) {
  return useQuery<ResearchMilestone[]>({
    queryKey: ['research-milestones', 'project', projectId],
    queryFn: async () => { const { data } = await apiClient.get(`/research-milestones/project/${projectId}`); return data.data; },
    enabled: !!projectId,
  });
}

export function useMilestoneSummary() {
  return useQuery<MilestoneSummary>({
    queryKey: ['research-milestones', 'summary'],
    queryFn: async () => { const { data } = await apiClient.get('/research-milestones/summary'); return data.data; },
  });
}

export function useMilestoneOverdue() {
  return useQuery<ResearchMilestone[]>({
    queryKey: ['research-milestones', 'overdue'],
    queryFn: async () => { const { data } = await apiClient.get('/research-milestones/overdue'); return data.data; },
  });
}

export function useMilestoneUpcoming() {
  return useQuery<ResearchMilestone[]>({
    queryKey: ['research-milestones', 'upcoming'],
    queryFn: async () => { const { data } = await apiClient.get('/research-milestones/upcoming'); return data.data; },
  });
}

export function useProjectProgress(projectId: string) {
  return useQuery<ProjectProgress>({
    queryKey: ['research-milestones', 'project', projectId, 'progress'],
    queryFn: async () => { const { data } = await apiClient.get(`/research-milestones/project/${projectId}/progress`); return data.data; },
    enabled: !!projectId,
  });
}

export function useResearchMilestone(id: string) {
  return useQuery<ResearchMilestone>({
    queryKey: ['research-milestones', id],
    queryFn: async () => { const { data } = await apiClient.get(`/research-milestones/${id}`); return data.data; },
    enabled: !!id,
  });
}

export function useCreateResearchMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { researchProjectId: string; title: string; description?: string; milestoneOrder?: number;
      plannedStartDate?: string; plannedDueDate?: string; responsibleMemberId?: string; notes?: string }) => {
      const { data } = await apiClient.post('/research-milestones', payload);
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-milestones'] }); },
  });
}

export function useUpdateResearchMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { title?: string; description?: string; milestoneOrder?: number;
      plannedStartDate?: string; plannedDueDate?: string; responsibleMemberId?: string; notes?: string } }) => {
      const { data } = await apiClient.put(`/research-milestones/${id}`, payload);
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-milestones'] }); },
  });
}

export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/research-milestones/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-milestones'] }); },
  });
}

export function useUpdateMilestoneProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { data } = await apiClient.patch(`/research-milestones/${id}/progress`, { progress });
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-milestones'] }); },
  });
}

export function useDeleteResearchMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/research-milestones/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-milestones'] }); },
  });
}
