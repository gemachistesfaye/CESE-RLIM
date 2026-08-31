import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type SearchEntityType =
  | 'ALL'
  | 'RESEARCHER'
  | 'LABORATORY'
  | 'EQUIPMENT'
  | 'PROJECT'
  | 'INNOVATION'
  | 'PUBLICATION'
  | 'DOCUMENT'
  | 'FUNDING'
  | 'GRANT'
  | 'ETHICS'
  | 'EVENT'
  | 'MILESTONE'
  | 'REPORT'
  | 'ACTIVITY';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  status: string | null;
  url: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SearchSuggestion {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  url: string;
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchResultResponse {
  items: SearchResult[];
  pagination: SearchPagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  ALL: 'All',
  RESEARCHER: 'Researchers',
  LABORATORY: 'Laboratories',
  EQUIPMENT: 'Equipment',
  PROJECT: 'Projects',
  INNOVATION: 'Innovations',
  PUBLICATION: 'Publications',
  DOCUMENT: 'Documents',
  FUNDING: 'Funding',
  GRANT: 'Grants',
  RESEARCH_GRANT: 'Research Grants',
  ETHICS: 'Ethics',
  EVENT: 'Events',
  MILESTONE: 'Milestones',
  REPORT: 'Reports',
  ACTIVITY: 'Activities',
};

export const ENTITY_TYPE_ICONS: Record<string, string> = {
  RESEARCHER: 'Users',
  LABORATORY: 'Building2',
  EQUIPMENT: 'Wrench',
  PROJECT: 'FolderOpen',
  INNOVATION: 'Lightbulb',
  PUBLICATION: 'BookOpen',
  DOCUMENT: 'FileText',
  FUNDING: 'DollarSign',
  GRANT: 'FileCheck',
  RESEARCH_GRANT: 'Award',
  ETHICS: 'Scale',
  EVENT: 'Calendar',
  MILESTONE: 'Target',
  REPORT: 'BarChart3',
  ACTIVITY: 'Activity',
};

export const ENTITY_TYPE_COLORS: Record<string, string> = {
  RESEARCHER: 'bg-blue-100 text-blue-700',
  LABORATORY: 'bg-purple-100 text-purple-700',
  EQUIPMENT: 'bg-orange-100 text-orange-700',
  PROJECT: 'bg-emerald-100 text-emerald-700',
  INNOVATION: 'bg-yellow-100 text-yellow-700',
  PUBLICATION: 'bg-indigo-100 text-indigo-700',
  DOCUMENT: 'bg-slate-100 text-slate-700',
  FUNDING: 'bg-green-100 text-green-700',
  GRANT: 'bg-teal-100 text-teal-700',
  RESEARCH_GRANT: 'bg-cyan-100 text-cyan-700',
  ETHICS: 'bg-rose-100 text-rose-700',
  EVENT: 'bg-violet-100 text-violet-700',
  MILESTONE: 'bg-amber-100 text-amber-700',
  REPORT: 'bg-sky-100 text-sky-700',
  ACTIVITY: 'bg-lime-100 text-lime-700',
};

export function useGlobalSearch(params: {
  q: string;
  page?: number;
  limit?: number;
  type?: SearchEntityType;
  sort?: 'relevance' | 'recent';
  enabled?: boolean;
}) {
  const { q, page = 1, limit = 20, type = 'ALL', sort = 'relevance', enabled = true } = params;

  return useQuery({
    queryKey: ['globalSearch', { q, page, limit, type, sort }],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SearchResultResponse>>(
        '/global-search',
        {
          params: {
            q,
            page,
            limit,
            type: type === 'ALL' ? undefined : type,
            sort,
          },
        },
      );
      return data.data;
    },
    enabled: enabled && q.trim().length >= 1,
    staleTime: 30_000,
  });
}

export function useSearchSuggestions(params: {
  q: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { q, limit = 8, enabled = true } = params;

  return useQuery({
    queryKey: ['searchSuggestions', { q, limit }],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SearchSuggestion[]>>(
        '/global-search/suggestions',
        { params: { q, limit } },
      );
      return data.data;
    },
    enabled: enabled && q.trim().length >= 2,
    staleTime: 60_000,
  });
}
