import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface FundingOpportunity {
  id: string;
  title: string;
  organization: string;
  description: string | null;
  fundingType: 'INTERNAL' | 'NATIONAL' | 'INTERNATIONAL' | 'INDUSTRY' | 'NGO' | 'UNIVERSITY' | 'OTHER';
  minimumAmount: number | null;
  maximumAmount: number | null;
  applicationDeadline: string | null;
  eligibilityCriteria: string | null;
  applicationUrl: string | null;
  status: 'OPEN' | 'CLOSED' | 'UPCOMING' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface FundingOpportunitySummary {
  total: number;
  open: number;
  upcoming: number;
  closed: number;
  cancelled: number;
}

export function useFundingOpportunities(params: {
  page: number; limit: number; search?: string; status?: string;
  fundingType?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['fundingOpportunities', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<FundingOpportunity> }>('/funding-opportunities', { params });
      return data.data;
    },
  });
}

export function useFundingOpportunity(id: string) {
  return useQuery({
    queryKey: ['fundingOpportunities', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: FundingOpportunity }>(`/funding-opportunities/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useFundingOpportunitySummary() {
  return useQuery({
    queryKey: ['fundingOpportunitySummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: FundingOpportunitySummary }>('/funding-opportunities/summary');
      return data.data;
    },
  });
}

export function useCreateFundingOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string; organization: string; description?: string; fundingType: string;
      minimumAmount?: number; maximumAmount?: number; applicationDeadline?: string;
      eligibilityCriteria?: string; applicationUrl?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: FundingOpportunity }>('/funding-opportunities', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fundingOpportunities'] }); qc.invalidateQueries({ queryKey: ['fundingOpportunitySummary'] }); },
  });
}

export function useUpdateFundingOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: FundingOpportunity }>(`/funding-opportunities/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['fundingOpportunities'] }); qc.invalidateQueries({ queryKey: ['fundingOpportunities', vars.id] }); },
  });
}

export function useUpdateFundingOpportunityStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: FundingOpportunity }>(`/funding-opportunities/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['fundingOpportunities'] }); qc.invalidateQueries({ queryKey: ['fundingOpportunities', vars.id] }); qc.invalidateQueries({ queryKey: ['fundingOpportunitySummary'] }); },
  });
}

export const FUNDING_TYPE_LABELS: Record<string, string> = {
  INTERNAL: 'Internal', NATIONAL: 'National', INTERNATIONAL: 'International',
  INDUSTRY: 'Industry', NGO: 'NGO', UNIVERSITY: 'University', OTHER: 'Other',
};

export const FUNDING_OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open', CLOSED: 'Closed', UPCOMING: 'Upcoming', CANCELLED: 'Cancelled',
};
