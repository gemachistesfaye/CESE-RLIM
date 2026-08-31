import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface EthicsReview {
  id: string;
  decision: string;
  comment: string | null;
  reviewedAt: string;
  reviewer: { id: string; user: { firstName: string; lastName: string } };
}

export interface EthicsReviewerAssignment {
  id: string;
  assignedAt: string;
  isActive: boolean;
  completedAt: string | null;
  reviewer: { id: string; user: { firstName: string; lastName: string; email: string } };
  assignedBy: { firstName: string; lastName: string };
}

export interface EthicsApplication {
  id: string;
  applicationCode: string;
  researchProjectId: string;
  applicantId: string;
  title: string;
  researchSummary: string;
  methodology: string | null;
  participantDetails: string | null;
  riskAssessment: string | null;
  benefitStatement: string | null;
  dataProtectionPlan: string | null;
  consentProcess: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  reviewerId: string | null;
  reviewComment: string | null;
  revisionComment: string | null;
  createdAt: string;
  updatedAt: string;
  researchProject: { id: string; projectCode: string; title: string };
  applicant: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; email: string } };
  reviewer: { id: string; user: { firstName: string; lastName: string; email: string } } | null;
  reviews: EthicsReview[];
  reviewers: EthicsReviewerAssignment[];
}

export interface PaginatedResponse<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

export interface EthicsApplicationSummary {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  revisionRequired: number;
  resubmitted: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  pendingReview: number;
  approvalRate: number;
}

export function useEthicsApplications(params: {
  page: number; limit: number; search?: string; status?: string;
  researchProjectId?: string; reviewerId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['ethicsApplications', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<EthicsApplication> }>('/ethics/applications', { params });
      return data.data;
    },
  });
}

export function useEthicsApplication(id: string) {
  return useQuery({
    queryKey: ['ethicsApplications', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EthicsApplication }>(`/ethics/applications/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useEthicsApplicationSummary() {
  return useQuery({
    queryKey: ['ethicsApplicationSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EthicsApplicationSummary }>('/ethics/applications/summary');
      return data.data;
    },
  });
}

export function useMyEthicsApplications(params: { page: number; limit: number; status?: string }) {
  return useQuery({
    queryKey: ['myEthicsApplications', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<EthicsApplication> }>('/ethics/applications/my', { params });
      return data.data;
    },
  });
}

export function useCreateEthicsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { researchProjectId: string; title: string; researchSummary: string; methodology?: string; participantDetails?: string; riskAssessment?: string; benefitStatement?: string; dataProtectionPlan?: string; consentProcess?: string }) => {
      const { data } = await apiClient.post<{ success: boolean; data: EthicsApplication }>('/ethics/applications', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ethicsApplications'] }); qc.invalidateQueries({ queryKey: ['ethicsApplicationSummary'] }); qc.invalidateQueries({ queryKey: ['myEthicsApplications'] }); },
  });
}

export function useSubmitEthicsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EthicsApplication }>(`/ethics/applications/${id}/submit`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ethicsApplications'] }); qc.invalidateQueries({ queryKey: ['ethicsApplicationSummary'] }); qc.invalidateQueries({ queryKey: ['myEthicsApplications'] }); },
  });
}

export function useWithdrawEthicsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EthicsApplication }>(`/ethics/applications/${id}/withdraw`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ethicsApplications'] }); qc.invalidateQueries({ queryKey: ['ethicsApplicationSummary'] }); qc.invalidateQueries({ queryKey: ['myEthicsApplications'] }); },
  });
}

export function useReviewEthicsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, comment }: { id: string; decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION'; comment?: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EthicsApplication }>(`/ethics/applications/${id}/review`, { decision, comment });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['ethicsApplications'] }); qc.invalidateQueries({ queryKey: ['ethicsApplications', vars.id] }); qc.invalidateQueries({ queryKey: ['ethicsApplicationSummary'] }); },
  });
}

export function useAssignEthicsReviewer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewerId }: { id: string; reviewerId: string }) => {
      const { data } = await apiClient.post<{ success: boolean; data: EthicsApplication }>(`/ethics/applications/${id}/reviewer`, { reviewerId });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['ethicsApplications'] }); qc.invalidateQueries({ queryKey: ['ethicsApplications', vars.id] }); },
  });
}

export function useRemoveEthicsReviewer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewerId }: { id: string; reviewerId: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EthicsApplication }>(`/ethics/applications/${id}/reviewer/${reviewerId}`);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['ethicsApplications'] }); qc.invalidateQueries({ queryKey: ['ethicsApplications', vars.id] }); },
  });
}

export function useEthicsApplicationsByProject(projectId: string) {
  return useQuery({
    queryKey: ['ethicsApplications', 'byProject', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EthicsApplication[] }>(`/ethics/applications/project/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useEthicsApplicationsByResearcher(researcherId: string) {
  return useQuery({
    queryKey: ['ethicsApplications', 'byResearcher', researcherId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EthicsApplication[] }>(`/ethics/applications/researcher/${researcherId}`);
      return data.data;
    },
    enabled: !!researcherId,
  });
}

export const ETHICS_APPLICATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  REVISION_REQUIRED: 'Revision Required', RESUBMITTED: 'Resubmitted',
  APPROVED: 'Approved', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
};

export const ETHICS_REVIEW_DECISION_LABELS: Record<string, string> = {
  APPROVE: 'Approve', REJECT: 'Reject', REQUEST_REVISION: 'Request Revision',
};
