import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'REQUEST' | 'MAINTENANCE' | 'ACTION_REQUIRED' | 'ASSIGNMENT' | 'STATUS_CHANGE' | 'DEADLINE';
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  updatedAt: string;
}

export interface PaginatedNotifications {
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCount {
  count: number;
}

export function useNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
      if (params?.type) searchParams.set('type', params.type);

      const queryString = searchParams.toString();
      const url = `/notifications${queryString ? `?${queryString}` : ''}`;

      const { data } = await apiClient.get<{ success: boolean; data: PaginatedNotifications }>(url);
      return data.data;
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: UnreadCount }>(
        '/notifications/unread-count',
      );
      return data.data;
    },
    refetchInterval: 30000,
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Notification }>(
        `/notifications/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Notification }>(
        `/notifications/${id}/read`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch<{ success: boolean; data: { message: string } }>(
        '/notifications/read-all',
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ success: boolean; data: Notification }>(
        `/notifications/${id}`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
