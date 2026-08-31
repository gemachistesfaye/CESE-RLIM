import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ResearchEvent {
  id: string;
  eventCode: string;
  title: string;
  description: string | null;
  eventType: 'CONFERENCE' | 'SEMINAR' | 'WORKSHOP' | 'TRAINING' | 'LECTURE' | 'DEFENSE' | 'SYMPOSIUM' | 'OTHER';
  status: 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  venue: string | null;
  location: string | null;
  isVirtual: boolean;
  meetingUrl: string | null;
  organizer: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  maxParticipants: number | null;
  currentParticipants: number;
  researchProjectId: string | null;
  innovationId: string | null;
  publicationId: string | null;
  objectives: string | null;
  eligibility: string | null;
  requirements: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  researchProject: { id: string; projectCode: string; title: string } | null;
  innovation: { id: string; title: string; developmentStage: string } | null;
  publication: { id: string; title: string; publicationType: string; status: string } | null;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  participations: EventParticipation[];
}

export interface EventParticipation {
  id: string;
  eventId: string;
  researcherId: string;
  status: 'REGISTERED' | 'CONFIRMED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW';
  registeredAt: string;
  confirmedAt: string | null;
  attendedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  event?: ResearchEvent;
  researcher: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; email: string } };
}

export interface PaginatedResponse<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

export interface EventSummary {
  total: number;
  draft: number;
  published: number;
  registrationOpen: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  totalParticipants: number;
  eventsByType: Record<string, number>;
}

export function useResearchEvents(params: {
  page: number; limit: number; search?: string; status?: string;
  eventType?: string; isVirtual?: string; startDate?: string;
  endDate?: string; upcoming?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['researchEvents', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<ResearchEvent> }>('/research-events', { params });
      return data.data;
    },
  });
}

export function useResearchEvent(id: string) {
  return useQuery({
    queryKey: ['researchEvents', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchEvent }>(`/research-events/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useEventSummary() {
  return useQuery({
    queryKey: ['eventSummary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: EventSummary }>('/research-events/summary');
      return data.data;
    },
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchEvent[] }>('/research-events/upcoming');
      return data.data;
    },
  });
}

export function useEventsByProject(projectId: string) {
  return useQuery({
    queryKey: ['researchEvents', 'byProject', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ResearchEvent[] }>(`/research-events/project/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateResearchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string; description?: string; eventType: string; startDate: string;
      endDate: string; registrationDeadline?: string; venue?: string; location?: string;
      isVirtual?: boolean; meetingUrl?: string; organizer?: string; contactEmail?: string;
      contactPhone?: string; maxParticipants?: number; researchProjectId?: string;
      innovationId?: string; publicationId?: string; objectives?: string;
      eligibility?: string; requirements?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ResearchEvent }>('/research-events', payload);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['researchEvents'] }); qc.invalidateQueries({ queryKey: ['eventSummary'] }); qc.invalidateQueries({ queryKey: ['upcomingEvents'] }); },
  });
}

export function useUpdateResearchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string; title?: string; description?: string; eventType?: string;
      startDate?: string; endDate?: string; registrationDeadline?: string;
      venue?: string; location?: string; isVirtual?: boolean; meetingUrl?: string;
      organizer?: string; contactEmail?: string; contactPhone?: string;
      maxParticipants?: number; researchProjectId?: string; innovationId?: string;
      publicationId?: string; objectives?: string; eligibility?: string; requirements?: string;
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchEvent }>(`/research-events/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchEvents'] }); qc.invalidateQueries({ queryKey: ['researchEvents', vars.id] }); qc.invalidateQueries({ queryKey: ['eventSummary'] }); },
  });
}

export function useUpdateEventStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ResearchEvent }>(`/research-events/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['researchEvents'] }); qc.invalidateQueries({ queryKey: ['researchEvents', vars.id] }); qc.invalidateQueries({ queryKey: ['eventSummary'] }); qc.invalidateQueries({ queryKey: ['upcomingEvents'] }); },
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CONFERENCE: 'Conference', SEMINAR: 'Seminar', WORKSHOP: 'Workshop',
  TRAINING: 'Training', LECTURE: 'Lecture', DEFENSE: 'Defense',
  SYMPOSIUM: 'Symposium', OTHER: 'Other',
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Published', REGISTRATION_OPEN: 'Registration Open',
  REGISTRATION_CLOSED: 'Registration Closed', ONGOING: 'Ongoing',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
