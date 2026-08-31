import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { EventParticipation, PaginatedResponse } from './useResearchEvents';

export function useEventParticipations(params: {
  page: number; limit: number; eventId?: string; researcherId?: string; status?: string;
}) {
  return useQuery({
    queryKey: ['eventParticipations', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<EventParticipation> }>('/event-participations', { params });
      return data.data;
    },
  });
}

export function useMyEventParticipations(params: { page: number; limit: number; status?: string }) {
  return useQuery({
    queryKey: ['myEventParticipations', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<EventParticipation> }>('/event-participations/my', { params });
      return data.data;
    },
  });
}

export function useEventParticipation(id: string) {
  return useQuery({
    queryKey: ['eventParticipations', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EventParticipation }>(`/event-participations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useRegisterForEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { eventId: string; notes?: string }) => {
      const { data } = await apiClient.post<{ success: boolean; data: EventParticipation }>('/event-participations', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eventParticipations'] }); qc.invalidateQueries({ queryKey: ['myEventParticipations'] }); qc.invalidateQueries({ queryKey: ['researchEvents'] }); qc.invalidateQueries({ queryKey: ['eventSummary'] }); },
  });
}

export function useCancelEventRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EventParticipation }>(`/event-participations/${id}/cancel`);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eventParticipations'] }); qc.invalidateQueries({ queryKey: ['myEventParticipations'] }); qc.invalidateQueries({ queryKey: ['researchEvents'] }); qc.invalidateQueries({ queryKey: ['eventSummary'] }); },
  });
}

export function useUpdateParticipationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: EventParticipation }>(`/event-participations/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eventParticipations'] }); qc.invalidateQueries({ queryKey: ['myEventParticipations'] }); qc.invalidateQueries({ queryKey: ['researchEvents'] }); },
  });
}

export const PARTICIPATION_STATUS_LABELS: Record<string, string> = {
  REGISTERED: 'Registered', CONFIRMED: 'Confirmed', ATTENDED: 'Attended',
  CANCELLED: 'Cancelled', NO_SHOW: 'No Show',
};
