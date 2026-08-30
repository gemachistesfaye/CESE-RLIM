import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type ProjectMemberRole = 'PRINCIPAL_INVESTIGATOR' | 'CO_INVESTIGATOR' | 'RESEARCHER' | 'RESEARCH_ASSISTANT' | 'TECHNICAL_MEMBER';

export interface ProjectMember {
  id: string;
  researchProjectId: string;
  researcherId: string;
  role: ProjectMemberRole;
  isActive: boolean;
  joinedAt: string;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  researchProject: {
    id: string;
    projectCode: string;
    title: string;
    projectStatus: string;
  };
  researcher: {
    id: string;
    userId: string;
    employeeOrStudentId: string;
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

export interface ProjectTeamSummary {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  byRole: Record<ProjectMemberRole, number>;
}

export function useProjectMembers(params: {
  projectId: string;
  page: number;
  limit: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['projectMembers', 'project', params],
    queryFn: async () => {
      const { projectId, ...queryParams } = params;
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ProjectMember> }>(
        `/research-project-members/project/${projectId}`,
        { params: queryParams },
      );
      return data.data;
    },
    enabled: !!params.projectId,
  });
}

export function useResearcherProjectMemberships(params: {
  researcherId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['projectMembers', 'researcher', params],
    queryFn: async () => {
      const { researcherId, ...queryParams } = params;
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ProjectMember> }>(
        `/research-project-members/researcher/${researcherId}`,
        { params: queryParams },
      );
      return data.data;
    },
    enabled: !!params.researcherId,
  });
}

export function useProjectMember(id: string) {
  return useQuery({
    queryKey: ['projectMembers', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectMember }>(
        `/research-project-members/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useProjectTeamSummary(projectId: string) {
  return useQuery({
    queryKey: ['projectTeamSummary', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectTeamSummary }>(
        `/research-project-members/project/${projectId}/summary`,
      );
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      researchProjectId: string;
      researcherId: string;
      role?: ProjectMemberRole;
      isActive?: boolean;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ProjectMember }>(
        '/research-project-members',
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', 'project', { projectId: variables.researchProjectId }] });
      queryClient.invalidateQueries({ queryKey: ['projectTeamSummary', variables.researchProjectId] });
      queryClient.invalidateQueries({ queryKey: ['researchProjects'] });
    },
  });
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        role?: ProjectMemberRole;
        isActive?: boolean;
        leftAt?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ProjectMember }>(
        `/research-project-members/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers'] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projectTeamSummary', data.researchProjectId] });
      queryClient.invalidateQueries({ queryKey: ['researchProjects'] });
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ success: boolean; data: ProjectMember }>(
        `/research-project-members/${id}`,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers'] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projectTeamSummary', data.researchProjectId] });
      queryClient.invalidateQueries({ queryKey: ['researchProjects'] });
    },
  });
}

export const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  PRINCIPAL_INVESTIGATOR: 'Principal Investigator',
  CO_INVESTIGATOR: 'Co-Investigator',
  RESEARCHER: 'Researcher',
  RESEARCH_ASSISTANT: 'Research Assistant',
  TECHNICAL_MEMBER: 'Technical Member',
};
