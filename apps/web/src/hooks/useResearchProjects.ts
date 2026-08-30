import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ResearchProject {
  id: string;
  projectCode: string;
  title: string;
  description: string | null;
  projectStatus: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    equipmentRequests: number;
    equipmentAssignments: number;
    innovations: number;
  };
  equipmentRequests?: any[];
  equipmentAssignments?: any[];
  innovations?: any[];
}

export interface ProjectMember {
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
  roles: string[];
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

export interface ProjectSummary {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  cancelled: number;
}

export function useResearchProjects(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchProjects', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchProject> }>(
        '/research-projects',
        { params },
      );
      return data.data;
    },
  });
}

export function useResearchProject(id: string) {
  return useQuery({
    queryKey: ['researchProjects', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchProject }>(`/research-projects/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useProjectSummary() {
  return useQuery({
    queryKey: ['researchProjectSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectSummary }>(
        '/research-projects/summary',
      );
      return data.data;
    },
  });
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: ['projectMembers', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectMember[] }>(
        `/research-projects/${id}/members`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateResearchProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectCode: string;
      title: string;
      description?: string;
      projectStatus?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ResearchProject }>(
        '/research-projects',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchProjects'] });
      queryClient.invalidateQueries({ queryKey: ['researchProjectSummary'] });
    },
  });
}

export function useUpdateResearchProject() {
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
        startDate?: string;
        endDate?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchProject }>(
        `/research-projects/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['researchProjects'] });
      queryClient.invalidateQueries({ queryKey: ['researchProjects', variables.id] });
    },
  });
}

export function useUpdateResearchProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchProject }>(
        `/research-projects/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['researchProjects'] });
      queryClient.invalidateQueries({ queryKey: ['researchProjects', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['researchProjectSummary'] });
    },
  });
}
