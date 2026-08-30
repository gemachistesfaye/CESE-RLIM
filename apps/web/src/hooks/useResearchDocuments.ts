import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type DocumentType =
  | 'PROPOSAL'
  | 'RESEARCH_PLAN'
  | 'PROGRESS_REPORT'
  | 'FINAL_REPORT'
  | 'TECHNICAL_REPORT'
  | 'DATASET'
  | 'PRESENTATION'
  | 'THESIS'
  | 'MANUSCRIPT'
  | 'PAPER'
  | 'OTHER';

export type DocumentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface ResearchDocument {
  id: string;
  researchProjectId: string;
  uploadedById: string;
  title: string;
  description: string | null;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  version: number;
  status: DocumentStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  researchProject: {
    id: string;
    projectCode: string;
    title: string;
    projectStatus: string;
  };
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  filePath: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  changeNotes: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DocumentSummary {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  published: number;
  archived: number;
  byType: Record<string, number>;
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

export function useResearchDocuments(params: {
  page: number;
  limit: number;
  search?: string;
  projectFilter?: string;
  typeFilter?: string;
  statusFilter?: string;
  uploadedById?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchDocuments', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchDocument> }>(
        '/research-documents',
        { params },
      );
      return data.data;
    },
  });
}

export function useResearchDocument(id: string) {
  return useQuery({
    queryKey: ['researchDocuments', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchDocument }>(
        `/research-documents/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useResearchDocumentSummary(projectId?: string) {
  return useQuery({
    queryKey: ['researchDocumentSummary', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DocumentSummary }>(
        '/research-documents/summary',
        { params: projectId ? { projectId } : undefined },
      );
      return data.data;
    },
  });
}

export function useMyDocuments(params: {
  page: number;
  limit: number;
  search?: string;
  typeFilter?: string;
  statusFilter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchDocuments', 'my', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchDocument> }>(
        '/research-documents/my',
        { params },
      );
      return data.data;
    },
  });
}

export function useCreateResearchDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      researchProjectId: string;
      title: string;
      description?: string;
      documentType: DocumentType;
      fileName: string;
      filePath: string;
      storageKey: string;
      mimeType: string;
      fileSize: number;
      status?: DocumentStatus;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ResearchDocument }>(
        '/research-documents',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['researchDocumentSummary'] });
    },
  });
}

export function useUpdateResearchDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        title?: string;
        description?: string;
        documentType?: DocumentType;
        status?: DocumentStatus;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchDocument }>(
        `/research-documents/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['researchDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['researchDocuments', data.id] });
      queryClient.invalidateQueries({ queryKey: ['researchDocumentSummary'] });
    },
  });
}

export function useUploadDocumentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        fileName: string;
        filePath: string;
        storageKey: string;
        mimeType: string;
        fileSize: number;
        changeNotes?: string;
      };
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: DocumentVersion }>(
        `/research-documents/${id}/versions`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['researchDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['researchDocuments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documentVersions', variables.id] });
    },
  });
}

export function useDocumentVersions(id: string) {
  return useQuery({
    queryKey: ['documentVersions', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DocumentVersion[] }>(
        `/research-documents/${id}/versions`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DocumentStatus }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchDocument }>(
        `/research-documents/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['researchDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['researchDocuments', data.id] });
      queryClient.invalidateQueries({ queryKey: ['researchDocumentSummary'] });
    },
  });
}

export function useArchiveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchDocument }>(
        `/research-documents/${id}/archive`,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['researchDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['researchDocuments', data.id] });
      queryClient.invalidateQueries({ queryKey: ['researchDocumentSummary'] });
    },
  });
}

export function useDownloadResearchDocument(id: string) {
  return useQuery({
    queryKey: ['researchDocuments', id, 'download'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: { downloadUrl: string } }>(
        `/research-documents/${id}/download`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PROPOSAL: 'Proposal',
  RESEARCH_PLAN: 'Research Plan',
  PROGRESS_REPORT: 'Progress Report',
  FINAL_REPORT: 'Final Report',
  TECHNICAL_REPORT: 'Technical Report',
  DATASET: 'Dataset',
  PRESENTATION: 'Presentation',
  THESIS: 'Thesis',
  MANUSCRIPT: 'Manuscript',
  PAPER: 'Paper',
  OTHER: 'Other',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};
