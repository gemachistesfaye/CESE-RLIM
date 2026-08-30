import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ResearchGrant {
  id: string;
  grantNumber: string;
  applicationId: string;
  researchProjectId: string | null;
  principalInvestigatorId: string | null;
  createdById: string;
  awardedAmount: number;
  startDate: string;
  endDate: string;
  spentAmount: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  application: { id: string; title: string; requestedAmount: number };
  researchProject: { id: string; projectCode: string; title: string } | null;
  principalInvestigator: { id: string; user: { firstName: string; lastName: string } } | null;
  createdBy: { id: string; firstName: string; lastName: string };
}

export interface PaginatedResponse<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

export interface ResearchGrantSummary {
  total: number; active: number; completed: number; suspended: number; cancelled: number;
  totalAwarded: number; totalSpent: number; totalRemaining: number;
}

export function useResearchGrants(params: {
  page: number; limit: number; search?: string; status?: string;
  researchProjectId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchGrants', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchGrant> }>('/research-grants', { params });
      return data.data;
    },
  });
}

export function useResearchGrant(id: string) {
  return useQuery({
    queryKey: ['researchGrants', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchGrant }>(`/research-grants/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useResearchGrantSummary() {
  return useQuery({
    queryKey: ['researchGrantSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchGrantSummary }>('/research-grants/summary');
      return data.data;
    },
  });
}

export function useMyResearchGrants(params: { page: number; limit: number; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  return useQuery({
    queryKey: ['myResearchGrants', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchGrant> }>('/research-grants/my', { params });
      return data.data;
    },
  });
}

export function useCreateResearchGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      grantNumber: string; applicationId: string; researchProjectId?: string;
      principalInvestigatorId?: string; awardedAmount: number; startDate: string;
      endDate: string; status?: string; notes?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ResearchGrant }>('/research-grants', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['researchGrants'] }); qc.invalidateQueries({ queryKey: ['researchGrantSummary'] }); },
  });
}

export function useUpdateResearchGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchGrant }>(`/research-grants/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchGrants'] }); qc.invalidateQueries({ queryKey: ['researchGrants', vars.id] }); },
  });
}

export function useUpdateResearchGrantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchGrant }>(`/research-grants/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchGrants'] }); qc.invalidateQueries({ queryKey: ['researchGrants', vars.id] }); qc.invalidateQueries({ queryKey: ['researchGrantSummary'] }); },
  });
}

export function useUpdateGrantSpending() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, spentAmount, notes }: { id: string; spentAmount: number; notes?: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchGrant }>(`/research-grants/${id}/spending`, { spentAmount, notes });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchGrants'] }); qc.invalidateQueries({ queryKey: ['researchGrants', vars.id] }); qc.invalidateQueries({ queryKey: ['researchGrantSummary'] }); },
  });
}

export function useResearchGrantsByProject(projectId: string) {
  return useQuery({
    queryKey: ['researchGrants', 'byProject', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchGrant> }>('/research-grants', { params: { page: 1, limit: 100, researchProjectId: projectId } });
      return data.data.items;
    },
    enabled: !!projectId,
  });
}

export function useResearchGrantsByResearcher(researcherId: string) {
  return useQuery({
    queryKey: ['researchGrants', 'byResearcher', researcherId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchGrant> }>('/research-grants/my', { params: { page: 1, limit: 100 } });
      return data.data.items;
    },
    enabled: !!researcherId,
  });
}

export const GRANT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed',
  SUSPENDED: 'Suspended', CANCELLED: 'Cancelled',
};
