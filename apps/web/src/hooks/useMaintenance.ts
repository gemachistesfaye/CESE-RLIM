import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  reportedById: string;
  assignedTechnicianId: string | null;
  reportedByUserId: string | null;
  maintenanceResearcherId: string | null;
  problemDescription: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'REPORTED' | 'DIAGNOSING' | 'REPAIRING' | 'TESTING' | 'COMPLETED' | 'CANCELLED';
  diagnosis: string | null;
  actionTaken: string | null;
  reportedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  equipment: {
    id: string;
    name: string;
    assetId: string;
    serialNumber: string | null;
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
  assignedTechnician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  reportedBy: {
    id: string;
    userId: string;
    department: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

export interface MaintenanceSummary {
  total: number;
  reported: number;
  diagnosing: number;
  repairing: number;
  testing: number;
  completed: number;
  cancelled: number;
  overdue: number;
  totalCost: number;
  equipmentUnderMaintenance: number;
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

export function useMaintenanceRecords(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  equipmentId?: string;
  laboratoryId?: string;
  technicianId?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['maintenanceRecords', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<MaintenanceRecord> }>(
        '/maintenance',
        { params },
      );
      return data.data;
    },
  });
}

export function useMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['maintenanceRecords', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: MaintenanceRecord }>(`/maintenance/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useMyMaintenance(params: {
  page: number;
  limit: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['myMaintenance', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<MaintenanceRecord> }>(
        '/maintenance/my',
        { params },
      );
      return data.data;
    },
  });
}

export function useOverdueMaintenance(params: {
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: ['overdueMaintenance', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<MaintenanceRecord> }>(
        '/maintenance/overdue',
        { params },
      );
      return data.data;
    },
  });
}

export function useMaintenanceSummary() {
  return useQuery({
    queryKey: ['maintenanceSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: MaintenanceSummary }>(
        '/maintenance/summary',
      );
      return data.data;
    },
  });
}

export function useEquipmentMaintenanceHistory(equipmentId: string) {
  return useQuery({
    queryKey: ['equipmentMaintenanceHistory', equipmentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: any[] }>(
        `/maintenance/equipment/${equipmentId}`,
      );
      return data.data;
    },
    enabled: !!equipmentId,
  });
}

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      equipmentId: string;
      problemDescription: string;
      priority?: string;
      assignedTechnicianId?: string;
      reportedAt?: string;
      diagnosis?: string;
      actionTaken?: string;
      cost?: number;
      notes?: string;
      maintenanceResearcherId?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: MaintenanceRecord }>(
        '/maintenance',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSummary'] });
    },
  });
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        problemDescription?: string;
        priority?: string;
        assignedTechnicianId?: string;
        diagnosis?: string;
        actionTaken?: string;
        cost?: number;
        notes?: string;
        reportedAt?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: MaintenanceRecord }>(
        `/maintenance/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSummary'] });
    },
  });
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: MaintenanceRecord }>(
        `/maintenance/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myMaintenance'] });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        actionTaken?: string;
        cost?: number;
        notes?: string;
        conditionAfter?: string;
      };
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: MaintenanceRecord }>(
        `/maintenance/${id}/complete`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}
