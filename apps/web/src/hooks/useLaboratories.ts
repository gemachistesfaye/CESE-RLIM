import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Laboratory {
  id: string;
  name: string;
  code: string;
  location: string;
  description: string | null;
  capacity: number | null;
  responsiblePersonId: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  createdAt: string;
  updatedAt: string;
  _count?: { equipment: number };
}

export interface LaboratoryDetail extends Laboratory {
  equipment: {
    id: string;
    name: string;
    assetId: string;
    category: string;
    condition: string;
    status: string;
  }[];
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

export function useLaboratories(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  location?: string;
}) {
  return useQuery({
    queryKey: ['laboratories', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Laboratory> }>(
        '/laboratories',
        { params },
      );
      return data.data;
    },
  });
}

export function useLaboratory(id: string) {
  return useQuery({
    queryKey: ['laboratories', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: LaboratoryDetail }>(`/laboratories/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateLaboratory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      code: string;
      location: string;
      description?: string;
      capacity?: number;
      responsiblePersonId?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: Laboratory }>(
        '/laboratories',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratories'] });
    },
  });
}

export function useUpdateLaboratory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        location?: string;
        description?: string;
        capacity?: number;
        responsiblePersonId?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Laboratory }>(
        `/laboratories/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratories'] });
      queryClient.invalidateQueries({ queryKey: ['laboratories', variables.id] });
    },
  });
}

export function useUpdateLaboratoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Laboratory }>(
        `/laboratories/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratories'] });
      queryClient.invalidateQueries({ queryKey: ['laboratories', variables.id] });
    },
  });
}
