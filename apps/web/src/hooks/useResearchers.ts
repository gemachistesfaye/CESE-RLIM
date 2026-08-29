import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ResearcherUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Researcher {
  id: string;
  userId: string;
  employeeOrStudentId: string;
  department: string;
  academicPosition: string | null;
  researchAreas: string | null;
  expertise: string | null;
  orcid: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  user: ResearcherUser;
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

export function useResearchers(params: {
  page: number;
  limit: number;
  search?: string;
  department?: string;
  position?: string;
}) {
  return useQuery({
    queryKey: ['researchers', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Researcher> }>(
        '/researchers',
        { params },
      );
      return data.data;
    },
  });
}

export function useResearcher(id: string) {
  return useQuery({
    queryKey: ['researchers', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Researcher }>(`/researchers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateResearcher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
      employeeOrStudentId: string;
      department: string;
      academicPosition?: string;
      researchAreas?: string;
      expertise?: string;
      orcid?: string;
      bio?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: Researcher }>(
        '/researchers',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateResearcher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        employeeOrStudentId?: string;
        department?: string;
        academicPosition?: string;
        researchAreas?: string;
        expertise?: string;
        orcid?: string;
        bio?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Researcher }>(
        `/researchers/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['researchers'] });
      queryClient.invalidateQueries({ queryKey: ['researchers', variables.id] });
    },
  });
}
