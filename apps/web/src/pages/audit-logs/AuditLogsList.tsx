import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search, Filter, X, Clock, Activity, Calendar, TrendingUp,
  ChevronLeft, ChevronRight, Loader2, Eye,
} from 'lucide-react';
import {
  useAuditLogs, useAuditSummary, ACTION_LABELS, ACTION_COLORS,
  ENTITY_COLORS, AuditLogQueryParams,
} from '../../hooks/useAuditLogs';

const ENTITY_TYPES = [
  'User', 'Researcher', 'Laboratory', 'Equipment', 'EquipmentRequest',
  'EquipmentAssignment', 'MaintenanceRecord', 'ResearchProject', 'ProjectActivity',
  'Innovation', 'ResearchDocument', 'ResearchPublication', 'FundingOpportunity',
  'GrantApplication', 'ResearchGrant', 'ResearchExpense', 'EthicsApplication',
  'ResearchEvent', 'ResearchMilestone', 'ResearchReport', 'BudgetAllocation',
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SummaryCards({ summary }: { summary: NonNullable<ReturnType<typeof useAuditSummary>['data']> }) {
  const cards = [
    { label: 'Total Events', value: summary.totalEvents, icon: Activity, color: 'text-blue-600 bg-blue-50' },
    { label: 'Today', value: summary.todayEvents, icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'This Week', value: summary.weekEvents, icon: Calendar, color: 'text-violet-600 bg-violet-50' },
    { label: 'This Month', value: summary.monthEvents, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const queryParams: AuditLogQueryParams = {
    page,
    limit: 20,
    search: search || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading } = useAuditLogs(queryParams);
  const { data: summary, isLoading: summaryLoading } = useAuditSummary();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSearchInput('');
    setAction('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = search || action || entityType || startDate || endDate;

  const items = data?.items || [];
  const pagination = data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">System activity and event history</p>
      </div>

      {!summaryLoading && summary && <SummaryCards summary={summary} />}

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search descriptions, entities, users..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                {[action, entityType, startDate, endDate].filter(Boolean).length + (search ? 1 : 0)}
              </span>
            )}
          </button>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const val = e.target.value.split('-');
              setSortBy(val[0] || 'createdAt');
              setSortOrder((val[1] || 'desc') as 'asc' | 'desc');
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="action-asc">Action A-Z</option>
            <option value="action-desc">Action Z-A</option>
            <option value="entityType-asc">Entity A-Z</option>
          </select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                {ENTITY_TYPES.map((et) => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {hasActiveFilters && (
              <div className="col-span-full">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  <X size={12} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-slate-500">Loading audit logs...</span>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Activity size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No audit logs found</h3>
          <p className="text-sm text-slate-500">
            {hasActiveFilters ? 'Try adjusting your filters' : 'No activity recorded yet'}
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Entity Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Entity ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate({ to: `/audit-logs/${item.id}` })}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-slate-600">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.user ? (
                        <span className="text-slate-900 font-medium">
                          {item.user.firstName} {item.user.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${ACTION_COLORS[item.action] || 'bg-slate-100 text-slate-600'}`}>
                        {ACTION_LABELS[item.action] || item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${ENTITY_COLORS[item.entityType] || 'bg-slate-100 text-slate-600'}`}>
                        {item.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400 font-mono truncate max-w-[120px] block">
                        {item.entityId || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-slate-600 text-xs truncate max-w-[200px] block">
                        {item.description || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Eye size={14} className="text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
