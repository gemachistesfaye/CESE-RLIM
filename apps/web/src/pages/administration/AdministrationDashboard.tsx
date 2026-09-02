import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Users, FlaskConical, FolderOpen, Loader2, AlertTriangle,
  Settings, Activity, FileText, ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

function getDayLabel(dateStr: string): string {
  const today = new Date();
  const date = new Date(dateStr);
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-gray-500';
}

export default function AdministrationDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useAdministrationOverview();

  const totalPending = useMemo(() => {
    if (!data) return 0;
    return (
      data.pendingOperations.ethicsApplications +
      data.pendingOperations.equipmentRequests +
      data.pendingOperations.grantApplications
    );
  }, [data]);

  const activityByDay = useMemo(() => {
    if (!data?.recentActivity) return [];
    const groups: Record<string, typeof data.recentActivity> = {};
    for (const item of data.recentActivity) {
      const day = item.createdAt.split('T')[0] ?? '';
      if (!groups[day]) groups[day] = [];
      groups[day]!.push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([day, items]) => ({ day, label: getDayLabel(day), items }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-slate-500">Loading administration dashboard...</span>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: 'Users', value: data.users.total, icon: Users, href: '/users', accent: false },
    {
      label: 'Pending Actions',
      value: totalPending,
      icon: AlertTriangle,
      href: '/ethics/applications',
      accent: totalPending > 0,
    },
    { label: 'Labs', value: data.laboratories, icon: FlaskConical, href: '/laboratories', accent: false },
    { label: 'Projects', value: data.projects, icon: FolderOpen, href: '/research-projects', accent: false },
  ];

  const quickLinks = [
    { label: 'Users', href: '/users', icon: Users },
    { label: 'Settings', href: '/administration/settings', icon: Settings },
    { label: 'Audit Logs', href: '/audit-logs', icon: Activity },
    { label: 'System Info', href: '/administration/system', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => navigate({ to: card.href })}
            className={`bg-white rounded-xl border p-4 text-left transition-all ${
              card.accent
                ? 'border-red-200 hover:border-red-300 hover:shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                card.accent ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
              }`}>
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

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Activity (Last 7 Days)</h2>
          <Activity size={16} className="text-gray-400" />
        </div>
        {data.activityChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.activityChart}>
              <XAxis
                dataKey="date"
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return d.toLocaleDateString('en-US', { weekday: 'short' });
                }}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                labelFormatter={(val) => getDayLabel(String(val))}
                formatter={(value) => [`${value} actions`, 'Activity']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" fill="#d1d5db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No activity in the last 7 days</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
              <button
                onClick={() => navigate({ to: '/audit-logs' })}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {activityByDay.map(({ day, label, items }) => (
              <div key={day}>
                <div className="px-5 py-2 bg-slate-50/50">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
                </div>
                {items.map((item) => {
                  const name = item.user
                    ? `${item.user.firstName} ${item.user.lastName}`
                    : 'System';
                  const initials = item.user
                    ? getInitials(item.user.firstName, item.user.lastName)
                    : 'SY';
                  const avatarColor = getAvatarColor(name);
                  return (
                    <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${avatarColor}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">
                          <span className="font-medium">{name}</span>
                          {' '}{(ACTION_LABELS[item.action ?? ''] ?? item.action ?? '').toLowerCase()}{' '}
                          <span className="font-medium">{item.entityType}</span>
                          {item.description && <span className="text-slate-400"> — {item.description}</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Quick Links</h2>
          <div className="space-y-1">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate({ to: link.href })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <link.icon size={16} className="text-gray-400" />
                  <span>{link.label}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
