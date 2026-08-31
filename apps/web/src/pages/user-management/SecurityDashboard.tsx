import { useNavigate } from '@tanstack/react-router';
import {
  Shield, Users, UserCheck, UserX, AlertTriangle, Clock,
  Loader2, Activity, ArrowRight, RefreshCw,
} from 'lucide-react';
import { useSecuritySummary, ROLE_COLORS, ROLE_LABELS } from '../../hooks/useUserManagement';

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

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, refetch, isFetching } = useSecuritySummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">Loading security dashboard...</span>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Users', value: data.activeUsers, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Suspended Users', value: data.suspendedUsers, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Inactive Users', value: data.inactiveUsers, icon: UserX, color: 'text-slate-600 bg-slate-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Security overview and recent account activity</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Role Distribution</h2>
          </div>
          <div className="space-y-3">
            {[
              { role: 'ADMIN', count: data.adminCount },
              { role: 'COORDINATOR', count: 0 },
              { role: 'RESEARCHER', count: 0 },
              { role: 'TECHNICIAN', count: 0 },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[item.role]}`}>
                    {ROLE_LABELS[item.role]}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate({ to: '/users' })}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage users <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Logins</h2>
          </div>
          <div className="space-y-3">
            {data.recentLogins.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent logins</p>
            ) : (
              data.recentLogins.slice(0, 6).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Status Changes</h2>
          </div>
          <div className="space-y-3">
            {data.recentStatusChanges.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent status changes</p>
            ) : (
              data.recentStatusChanges.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'}</span>
                      {' '}{item.description || 'Status changed'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : (
              data.recentActivity.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}</span>
                      {' '}{item.action.toLowerCase()}{' '}
                      <span className="font-medium">{item.entityType}</span>
                      {item.description && <span className="text-slate-400"> — {item.description}</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => navigate({ to: '/audit-logs' })}
            className="w-full mt-3 text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
          >
            View all audit logs
          </button>
        </div>
      </div>
    </div>
  );
}
