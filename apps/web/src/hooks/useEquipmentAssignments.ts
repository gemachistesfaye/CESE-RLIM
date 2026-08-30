import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  researcherId: string;
  researchProjectId: string | null;
  requestId: string | null;
  issuedById: string;
  issuedAt: string;
  expectedReturnAt: string;
  returnedAt: string | null;
  receivedById: string | null;
  conditionAtIssue: string | null;
  conditionAtReturn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  equipment: {
    id: string;
    name: string;
    assetId: string;
    category: string;
    manufacturer: string | null;
    model: string | null;
    status: string;
    condition: string;
    laboratory: {
      id: string;
      name: string;
      code: string;
      location: string;
    };
  };
  researcher: {
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
  request: {
    id: string;
    purpose: string;
    startDate: string;
    expectedReturnDate: string;
    priority: string;
    status: string;
  } | null;
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

export function useEquipmentAssignments(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  equipmentId?: string;
  researcherId?: string;
  laboratoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['equipmentAssignments', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<EquipmentAssignment> }>(
        '/equipment-assignments',
        { params },
      );
      return data.data;
    },
  });
}

export function useEquipmentAssignment(id: string) {
  return useQuery({
    queryKey: ['equipmentAssignments', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EquipmentAssignment }>(`/equipment-assignments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEquipmentAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      requestId: string;
      issuedAt: string;
      expectedReturnAt: string;
      conditionAtIssue?: string;
      notes?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: EquipmentAssignment }>(
        '/equipment-assignments',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentRequests'] });
    },
  });
}

export function useReturnEquipmentAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        returnedAt: string;
        conditionAtReturn?: string;
        notes?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EquipmentAssignment }>(
        `/equipment-assignments/${id}/return`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAssignments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['equipmentRequests'] });
    },
  });
}
