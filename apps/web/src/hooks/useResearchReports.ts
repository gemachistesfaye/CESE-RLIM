import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ResearchReport {
  id: string;
  reportCode: string;
  title: string;
  reportType: string;
  researchProjectId: string;
  submittedById: string;
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
  submittedAt: string | null;
  status: string;
  reportContent: string | null;
  fileUrl: string | null;
  nextPeriodPlan: string | null;
  reviewerId: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  researchProject: { id: string; projectCode: string; title: string };
  submittedBy: { id: string; user: { id: string; firstName: string; lastName: string; email: string } };
  reviewer: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface ReportSummary {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  revisionRequired: number;
  rejected: number;
  byType: Record<string, number>;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface ReportQueryParams {
  page?: number; limit?: number; search?: string; status?: string;
  reportType?: string; researchProjectId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}

export function useResearchReports(params: ReportQueryParams = {}) {
  const { page = 1, limit = 10, search, status, reportType, researchProjectId, sortBy, sortOrder } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (search) searchParams.set('search', search);
  if (status) searchParams.set('status', status);
  if (reportType) searchParams.set('reportType', reportType);
  if (researchProjectId) searchParams.set('researchProjectId', researchProjectId);
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);

  return useQuery<PaginatedResponse<ResearchReport>>({
    queryKey: ['research-reports', params],
    queryFn: async () => { const { data } = await apiClient.get(`/research-reports?${searchParams.toString()}`); return data.data; },
  });
}

export function useMyReports(params: { page?: number; limit?: number; status?: string } = {}) {
  const { page = 1, limit = 10, status } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (status) searchParams.set('status', status);

  return useQuery<PaginatedResponse<ResearchReport>>({
    queryKey: ['research-reports', 'my', params],
    queryFn: async () => { const { data } = await apiClient.get(`/research-reports/my?${searchParams.toString()}`); return data.data; },
  });
}

export function useProjectReports(projectId: string) {
  return useQuery<ResearchReport[]>({
    queryKey: ['research-reports', 'project', projectId],
    queryFn: async () => { const { data } = await apiClient.get(`/research-reports/project/${projectId}`); return data.data; },
    enabled: !!projectId,
  });
}

export function useReportSummary() {
  return useQuery<ReportSummary>({
    queryKey: ['research-reports', 'summary'],
    queryFn: async () => { const { data } = await apiClient.get('/research-reports/summary'); return data.data; },
  });
}

export function useReviewQueue(params: { page?: number; limit?: number; status?: string } = {}) {
  const { page = 1, limit = 10, status } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (status) searchParams.set('status', status);

  return useQuery<PaginatedResponse<ResearchReport>>({
    queryKey: ['research-reports', 'review-queue', params],
    queryFn: async () => { const { data } = await apiClient.get(`/research-reports/review-queue?${searchParams.toString()}`); return data.data; },
  });
}

export function useResearchReport(id: string) {
  return useQuery<ResearchReport>({
    queryKey: ['research-reports', id],
    queryFn: async () => { const { data } = await apiClient.get(`/research-reports/${id}`); return data.data; },
    enabled: !!id,
  });
}

export function useCreateResearchReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; reportType: string; researchProjectId: string;
      reportingPeriodStart?: string; reportingPeriodEnd?: string; executiveSummary?: string;
      objectives?: string; methodology?: string; achievements?: string; challenges?: string;
      findings?: string; recommendations?: string; conclusion?: string;
      progressPercentage?: number; nextPeriodPlan?: string }) => {
      const { data } = await apiClient.post('/research-reports', payload);
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-reports'] }); },
  });
}

export function useUpdateResearchReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { title?: string; reportType?: string;
      reportingPeriodStart?: string; reportingPeriodEnd?: string; executiveSummary?: string;
      objectives?: string; methodology?: string; achievements?: string; challenges?: string;
      findings?: string; recommendations?: string; conclusion?: string;
      progressPercentage?: number; nextPeriodPlan?: string } }) => {
      const { data } = await apiClient.put(`/research-reports/${id}`, payload);
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-reports'] }); },
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { data } = await apiClient.patch(`/research-reports/${id}/submit`); return data.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-reports'] }); },
  });
}

export function useSubmitReportForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewerId }: { id: string; reviewerId: string }) => {
      const { data } = await apiClient.patch(`/research-reports/${id}/submit-for-review`, { reviewerId });
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-reports'] }); },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reviewComment }: { id: string; status: string; reviewComment?: string }) => {
      const { data } = await apiClient.patch(`/research-reports/${id}/status`, { status, reviewComment });
      return data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-reports'] }); },
  });
}

export function useDeleteResearchReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/research-reports/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['research-reports'] }); },
  });
}
