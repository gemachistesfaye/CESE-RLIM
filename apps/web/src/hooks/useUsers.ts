import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export function useUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<User> }>(
        '/users',
        { params },
      );
      return data.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      role: string;
      password: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: User }>('/users', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { firstName?: string; lastName?: string; phone?: string } }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: User }>(`/users/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: User }>(`/users/${id}/role`, { role });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: User }>(`/users/${id}/status`, { isActive });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}
