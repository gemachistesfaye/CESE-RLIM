import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Equipment {
  id: string;
  name: string;
  assetId: string;
  serialNumber: string | null;
  category: string;
  manufacturer: string | null;
  model: string | null;
  description: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  laboratoryId: string;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  status: 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'LOST' | 'RETIRED';
  warrantyExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  laboratory: {
    id: string;
    name: string;
    code: string;
    location: string;
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

export function useEquipment(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  condition?: string;
  category?: string;
  laboratoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Equipment> }>(
        '/equipment',
        { params },
      );
      return data.data;
    },
  });
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Equipment }>(`/equipment/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      assetId: string;
      serialNumber?: string;
      category: string;
      manufacturer?: string;
      model?: string;
      description?: string;
      purchaseDate?: string;
      purchasePrice?: number;
      laboratoryId: string;
      condition?: string;
      status?: string;
      warrantyExpiry?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: Equipment }>(
        '/equipment',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        serialNumber?: string;
        category?: string;
        manufacturer?: string;
        model?: string;
        description?: string;
        purchaseDate?: string;
        purchasePrice?: number;
        laboratoryId?: string;
        condition?: string;
        warrantyExpiry?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Equipment }>(
        `/equipment/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
    },
  });
}

export function useUpdateEquipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Equipment }>(
        `/equipment/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
    },
  });
}
