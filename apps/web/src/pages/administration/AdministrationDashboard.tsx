import { useNavigate } from '@tanstack/react-router';
import {
  Users, FlaskConical, Microscope, FolderOpen, BookOpen, FileText,
  Lightbulb, Shield, Clock, Loader2, Activity, AlertTriangle,
  Wrench, Target, Award,
} from 'lucide-react';
import { useAdministrationOverview } from '../../hooks/useAdministration';

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

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Login',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  STATUS_CHANGE: 'Status Change',
  SUBMIT: 'Submitted',
  ISSUE: 'Issued',
  RETURN: 'Returned',
};

export default function AdministrationDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useAdministrationOverview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">Loading administration dashboard...</span>
      </div>
    );
  }

  if (!data) return null;

  const platformCards = [
    { label: 'Users', value: data.users.total, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/users' },
    { label: 'Researchers', value: data.researchers, icon: FlaskConical, color: 'text-violet-600 bg-violet-50', href: '/researchers' },
    { label: 'Laboratories', value: data.laboratories, icon: Microscope, color: 'text-purple-600 bg-purple-50', href: '/laboratories' },
    { label: 'Equipment', value: data.equipment, icon: Wrench, color: 'text-orange-600 bg-orange-50', href: '/equipment' },
    { label: 'Projects', value: data.projects, icon: FolderOpen, color: 'text-emerald-600 bg-emerald-50', href: '/research-projects' },
    { label: 'Publications', value: data.publications, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50', href: '/research-publications' },
    { label: 'Documents', value: data.documents, icon: FileText, color: 'text-slate-600 bg-slate-50', href: '/research-documents' },
    { label: 'Innovations', value: data.innovations, icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50', href: '/innovations' },
  ];

  const pendingCards = [
    { label: 'Ethics Applications', value: data.pendingOperations.ethicsApplications, icon: Shield, color: 'text-rose-600 bg-rose-50', href: '/ethics/applications' },
    { label: 'Equipment Requests', value: data.pendingOperations.equipmentRequests, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', href: '/equipment-requests' },
    { label: 'Grant Applications', value: data.pendingOperations.grantApplications, icon: Award, color: 'text-teal-600 bg-teal-50', href: '/grant-applications' },
    { label: 'Active Grants', value: data.activeGrants, icon: Target, color: 'text-green-600 bg-green-50', href: '/research-grants' },
  ];

  const roleEntries = Object.entries(data.users.byRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and management</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate({ to: card.href })}
              className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Pending Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pendingCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate({ to: card.href })}
              className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">User Distribution</h2>
          </div>
          <div className="space-y-3">
            {roleEntries.map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">{role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${data.users.total > 0 ? (count / data.users.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Active Users</span>
              <span className="font-medium text-emerald-600">{data.users.active}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-500">Inactive Users</span>
              <span className="font-medium text-slate-600">{data.users.inactive}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Admin Activity</h2>
          </div>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-600 truncate">
                    <span className="font-medium">{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}</span>
                    {' '}{(ACTION_LABELS[item.action] || item.action).toLowerCase()}{' '}
                    <span className="font-medium">{item.entityType}</span>
                    {item.description && <span className="text-slate-400"> — {item.description}</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
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
