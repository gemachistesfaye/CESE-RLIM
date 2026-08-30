import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type PublicationType =
  | 'JOURNAL_ARTICLE'
  | 'CONFERENCE_PAPER'
  | 'BOOK'
  | 'BOOK_CHAPTER'
  | 'THESIS'
  | 'TECHNICAL_REPORT'
  | 'WORKING_PAPER'
  | 'PATENT'
  | 'OTHER';

export type PublicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'PUBLISHED'
  | 'REJECTED';

export interface PublicationAuthor {
  id: string;
  publicationId: string;
  researcherId: string;
  authorOrder: number;
  isCorrespondingAuthor: boolean;
  createdAt: string;
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
}

export interface ResearchPublication {
  id: string;
  researchProjectId: string;
  title: string;
  abstract: string | null;
  publicationType: PublicationType;
  journalName: string | null;
  conferenceName: string | null;
  publisher: string | null;
  doi: string | null;
  isbn: string | null;
  publicationDate: string | null;
  url: string | null;
  status: PublicationStatus;
  citationCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  researchProject: {
    id: string;
    projectCode: string;
    title: string;
    projectStatus: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  authors: PublicationAuthor[];
}

export interface PublicationSummary {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byYear: Record<string, number>;
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

export function useResearchPublications(params: {
  page: number;
  limit: number;
  search?: string;
  projectFilter?: string;
  researcherId?: string;
  typeFilter?: string;
  statusFilter?: string;
  year?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchPublications', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchPublication> }>(
        '/research-publications',
        { params },
      );
      return data.data;
    },
  });
}

export function useResearchPublication(id: string) {
  return useQuery({
    queryKey: ['researchPublications', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchPublication }>(
        `/research-publications/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useResearchPublicationSummary(projectId?: string) {
  return useQuery({
    queryKey: ['researchPublicationSummary', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PublicationSummary }>(
        '/research-publications/summary',
        { params: projectId ? { projectId } : undefined },
      );
      return data.data;
    },
  });
}

export function useMyPublications(params: {
  page: number;
  limit: number;
  search?: string;
  typeFilter?: string;
  statusFilter?: string;
  year?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchPublications', 'my', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchPublication> }>(
        '/research-publications/my',
        { params },
      );
      return data.data;
    },
  });
}

export function useCreateResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      researchProjectId: string;
      title: string;
      abstract?: string;
      publicationType: PublicationType;
      journalName?: string;
      conferenceName?: string;
      publisher?: string;
      doi?: string;
      isbn?: string;
      publicationDate?: string;
      url?: string;
      authors?: { researcherId: string; authorOrder: number; isCorrespondingAuthor?: boolean }[];
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ResearchPublication }>(
        '/research-publications',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchPublications'] });
      queryClient.invalidateQueries({ queryKey: ['researchPublicationSummary'] });
    },
  });
}

export function useUpdateResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        title?: string;
        abstract?: string;
        publicationType?: PublicationType;
        journalName?: string;
        conferenceName?: string;
        publisher?: string;
        doi?: string;
        isbn?: string;
        publicationDate?: string;
        url?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchPublication }>(
        `/research-publications/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['researchPublications'] });
      queryClient.invalidateQueries({ queryKey: ['researchPublications', data.id] });
      queryClient.invalidateQueries({ queryKey: ['researchPublicationSummary'] });
    },
  });
}

export function useUpdatePublicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PublicationStatus }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchPublication }>(
        `/research-publications/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['researchPublications'] });
      queryClient.invalidateQueries({ queryKey: ['researchPublications', data.id] });
      queryClient.invalidateQueries({ queryKey: ['researchPublicationSummary'] });
    },
  });
}

export function useManagePublicationAuthors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        authors: {
          researcherId: string;
          authorOrder: number;
          isCorrespondingAuthor?: boolean;
        }[];
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchPublication }>(
        `/research-publications/${id}/authors`,
        payload,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['researchPublications'] });
      queryClient.invalidateQueries({ queryKey: ['researchPublications', data.id] });
      queryClient.invalidateQueries({ queryKey: ['researchPublicationSummary'] });
    },
  });
}

export const PUBLICATION_TYPE_LABELS: Record<PublicationType, string> = {
  JOURNAL_ARTICLE: 'Journal Article',
  CONFERENCE_PAPER: 'Conference Paper',
  BOOK: 'Book',
  BOOK_CHAPTER: 'Book Chapter',
  THESIS: 'Thesis',
  TECHNICAL_REPORT: 'Technical Report',
  WORKING_PAPER: 'Working Paper',
  PATENT: 'Patent',
  OTHER: 'Other',
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};
