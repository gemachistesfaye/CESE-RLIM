import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface EquipmentRequest {
  id: string;
  requesterId: string;
  equipmentId: string;
  researchProjectId: string | null;
  purpose: string;
  startDate: string;
  expectedReturnDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'IN_USE' | 'RETURNED' | 'CLOSED' | 'CANCELLED';
  reviewComment: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: {
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
  assignment: {
    id: string;
    issuedAt: string;
    expectedReturnAt: string;
    returnedAt: string | null;
    conditionAtIssue: string | null;
    conditionAtReturn: string | null;
    notes: string | null;
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

export function useEquipmentRequests(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  equipmentId?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['equipmentRequests', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<EquipmentRequest> }>(
        '/equipment-requests',
        { params },
      );
      return data.data;
    },
  });
}

export function useEquipmentRequest(id: string) {
  return useQuery({
    queryKey: ['equipmentRequests', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EquipmentRequest }>(`/equipment-requests/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEquipmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      equipmentId: string;
      purpose: string;
      startDate: string;
      expectedReturnDate: string;
      priority?: string;
      researchProjectId?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: EquipmentRequest }>(
        '/equipment-requests',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentRequests'] });
    },
  });
}

export function useReviewEquipmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        action: 'APPROVE' | 'REJECT';
        reviewComment?: string;
        rejectionReason?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EquipmentRequest }>(
        `/equipment-requests/${id}/review`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentRequests', variables.id] });
    },
  });
}

export function useCancelEquipmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EquipmentRequest }>(
        `/equipment-requests/${id}/cancel`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentRequests'] });
    },
  });
}
