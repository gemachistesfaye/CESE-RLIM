import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Innovation {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  developmentStage: 'IDEA' | 'PROTOTYPE' | 'TESTING' | 'VALIDATED' | 'TRANSFERRED';
  status: 'SUBMITTED' | 'UNDER_EVALUATION' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  researchProjectId: string | null;
  submittedById: string;
  createdAt: string;
  updatedAt: string;
  researchProject: {
    id: string;
    projectCode: string;
    title: string;
    projectStatus: string;
  } | null;
  submittedBy: {
    id: string;
    userId: string;
    department: string;
    academicPosition: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
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

export interface InnovationSummary {
  total: number;
  byStatus: {
    submitted: number;
    underEvaluation: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  byStage: {
    idea: number;
    prototype: number;
    testing: number;
    validated: number;
    transferred: number;
  };
}

export function useInnovations(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  developmentStage?: string;
  category?: string;
  researchProjectId?: string;
  submittedById?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['innovations', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Innovation> }>(
        '/innovations',
        { params },
      );
      return data.data;
    },
  });
}

export function useInnovation(id: string) {
  return useQuery({
    queryKey: ['innovations', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Innovation }>(`/innovations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useInnovationSummary() {
  return useQuery({
    queryKey: ['innovationSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: InnovationSummary }>(
        '/innovations/summary',
      );
      return data.data;
    },
  });
}

export function useCreateInnovation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      category?: string;
      developmentStage?: string;
      status?: string;
      researchProjectId?: string;
      submittedById: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: Innovation }>(
        '/innovations',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['innovationSummary'] });
    },
  });
}

export function useUpdateInnovation() {
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
        category?: string;
        developmentStage?: string;
        researchProjectId?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Innovation }>(
        `/innovations/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['innovations', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['innovationSummary'] });
    },
  });
}

export function useUpdateInnovationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Innovation }>(
        `/innovations/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['innovations', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['innovationSummary'] });
    },
  });
}
