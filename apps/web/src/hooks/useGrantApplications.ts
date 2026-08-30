import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface GrantApplication {
  id: string;
  opportunityId: string;
  researchProjectId: string | null;
  applicantId: string;
  title: string;
  requestedAmount: number;
  proposalSummary: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewComment: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
  opportunity: { id: string; title: string; organization: string; fundingType: string };
  researchProject: { id: string; projectCode: string; title: string } | null;
  applicant: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; email: string } };
  reviewedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface PaginatedResponse<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

export interface GrantApplicationSummary {
  total: number; draft: number; submitted: number; underReview: number;
  approved: number; rejected: number; withdrawn: number;
}

export function useGrantApplications(params: {
  page: number; limit: number; search?: string; status?: string;
  opportunityId?: string; researchProjectId?: string; applicantId?: string;
  sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['grantApplications', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<GrantApplication> }>('/grant-applications', { params });
      return data.data;
    },
  });
}

export function useGrantApplication(id: string) {
  return useQuery({
    queryKey: ['grantApplications', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: GrantApplication }>(`/grant-applications/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useGrantApplicationSummary() {
  return useQuery({
    queryKey: ['grantApplicationSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: GrantApplicationSummary }>('/grant-applications/summary');
      return data.data;
    },
  });
}

export function useMyGrantApplications(params: { page: number; limit: number; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  return useQuery({
    queryKey: ['myGrantApplications', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<GrantApplication> }>('/grant-applications/my', { params });
      return data.data;
    },
  });
}

export function useCreateGrantApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { opportunityId: string; title: string; requestedAmount: number; proposalSummary: string; researchProjectId?: string }) => {
      const { data } = await apiClient.post<{ success: boolean; data: GrantApplication }>('/grant-applications', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grantApplications'] }); qc.invalidateQueries({ queryKey: ['grantApplicationSummary'] }); qc.invalidateQueries({ queryKey: ['myGrantApplications'] }); },
  });
}

export function useUpdateGrantApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: GrantApplication }>(`/grant-applications/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['grantApplications'] }); qc.invalidateQueries({ queryKey: ['grantApplications', vars.id] }); },
  });
}

export function useSubmitGrantApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: GrantApplication }>(`/grant-applications/${id}/submit`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grantApplications'] }); qc.invalidateQueries({ queryKey: ['grantApplicationSummary'] }); qc.invalidateQueries({ queryKey: ['myGrantApplications'] }); },
  });
}

export function useReviewGrantApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, reviewComment }: { id: string; decision: 'APPROVE' | 'REJECT'; reviewComment?: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: GrantApplication }>(`/grant-applications/${id}/review`, { decision, reviewComment });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['grantApplications'] }); qc.invalidateQueries({ queryKey: ['grantApplications', vars.id] }); qc.invalidateQueries({ queryKey: ['grantApplicationSummary'] }); },
  });
}

export function useWithdrawGrantApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: GrantApplication }>(`/grant-applications/${id}/withdraw`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grantApplications'] }); qc.invalidateQueries({ queryKey: ['grantApplicationSummary'] }); qc.invalidateQueries({ queryKey: ['myGrantApplications'] }); },
  });
}

export function useGrantApplicationsByProject(projectId: string) {
  return useQuery({
    queryKey: ['grantApplications', 'byProject', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<GrantApplication> }>('/grant-applications', { params: { page: 1, limit: 100, researchProjectId: projectId } });
      return data.data.items;
    },
    enabled: !!projectId,
  });
}

export const GRANT_APPLICATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
};
