import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  FlaskConical,
  Wrench,
  FolderOpen,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flag,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useDashboardOverview } from '../hooks/useDashboard';
import { Link } from '@tanstack/react-router';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

const ACTION_ICONS: Record<string, typeof Users> = {
  CREATE: CheckCircle,
  UPDATE: Activity,
  DELETE: AlertTriangle,
  APPROVE: CheckCircle,
  SUBMIT: FolderOpen,
  LOGIN: Users,
};

function getRelativeTime(dateStr: string): string {
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

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

const ENTITY_LABELS: Record<string, string> = {
  User: 'User',
  Researcher: 'Researcher',
  Laboratory: 'Laboratory',
  Equipment: 'Equipment',
  EquipmentRequest: 'Equipment Request',
  EquipmentAssignment: 'Equipment Assignment',
  MaintenanceRecord: 'Maintenance',
  ResearchProject: 'Project',
  ProjectMember: 'Project Member',
  ProjectActivity: 'Activity',
  Innovation: 'Innovation',
  ResearchDocument: 'Document',
  ResearchPublication: 'Publication',
  FundingOpportunity: 'Funding Opportunity',
  GrantApplication: 'Grant Application',
  ResearchGrant: 'Grant',
  EthicsApplication: 'Ethics Application',
  ResearchEvent: 'Event',
  EventParticipation: 'Participation',
  BudgetAllocation: 'Budget Allocation',
  ResearchExpense: 'Expense',
  ResearchMilestone: 'Milestone',
  ResearchReport: 'Report',
};

export default function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useDashboardOverview();

  const financeChartData = useMemo(() => {
    if (!data) return [];
    return data.finance.spendingByCategory.map((entry) => ({
      name: entry.category.replace('_', ' '),
      amount: entry.amount,
    }));
  }, [data]);

  const attentionItems = useMemo(() => {
    if (!data) return [];
    const items: Array<{
      label: string;
      count: number;
      icon: typeof Users;
      link: string;
      color: string;
    }> = [];
    const a = data.attentionRequired;

    if (a.pendingEquipmentRequests > 0)
      items.push({
        label: 'Pending equipment requests',
        count: a.pendingEquipmentRequests,
        icon: Wrench,
        link: '/equipment-requests',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      });
    if (a.overdueMaintenance > 0)
      items.push({
        label: 'Overdue maintenance',
        count: a.overdueMaintenance,
        icon: AlertTriangle,
        link: '/maintenance',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      });
    if (a.pendingEthicsReviews > 0)
      items.push({
        label: 'Ethics reviews pending',
        count: a.pendingEthicsReviews,
        icon: Flag,
        link: '/ethics/applications',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
      });
    if (a.overdueMilestones > 0)
      items.push({
        label: 'Overdue milestones',
        count: a.overdueMilestones,
        icon: AlertTriangle,
        link: '/research-milestones',
        color: 'text-red-600 bg-red-50 border-red-200',
      });
    if (a.pendingExpenses > 0)
      items.push({
        label: 'Expenses pending approval',
        count: a.pendingExpenses,
        icon: DollarSign,
        link: '/research-expenses',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      });

    return items;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Skeleton className="h-5 w-28 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Failed to Load Dashboard</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Unable to fetch dashboard statistics. Please check your network connection or try again.
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          <span>{isFetching ? 'Retrying...' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      name: 'Researchers',
      value: data.researchers.total,
      icon: Users,
      link: '/researchers',
      sub: `${data.users.active} active members`,
      iconStyle: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      name: 'Laboratories',
      value: data.laboratories.total,
      icon: FlaskConical,
      link: '/laboratories',
      sub: `${data.laboratories.active} active facilities`,
      iconStyle: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    },
    {
      name: 'Equipment',
      value: data.equipment.total,
      icon: Wrench,
      link: '/equipment',
      sub: `${data.equipment.byStatus['AVAILABLE'] || 0} available for use`,
      iconStyle: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      name: 'Projects',
      value: data.projects.total,
      icon: FolderOpen,
      link: '/research-projects',
      sub: `${data.projects.byStatus['ACTIVE'] || 0} currently active`,
      iconStyle: 'bg-purple-50 text-purple-600 border border-purple-100',
    },
  ];

  const financeStats = [
    { name: 'Awarded', value: formatCurrency(data.finance.totalAwarded), icon: DollarSign, iconStyle: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    { name: 'Spent', value: formatCurrency(data.finance.totalSpent), icon: TrendingUp, iconStyle: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { name: 'Remaining', value: formatCurrency(data.finance.remainingBudget), icon: BarChart3, iconStyle: 'bg-amber-50 text-amber-600 border border-amber-100' },
    { name: 'Utilization', value: `${data.finance.utilization}%`, icon: Activity, iconStyle: 'bg-violet-50 text-violet-600 border border-violet-100' },
  ];

  const projectProgress = data.projects.activeProjects.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of CESE research resources and activities</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          title="Refresh dashboard"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin text-blue-600' : 'text-slate-400'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                {stat.sub && <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${stat.iconStyle}`}>
                <stat.icon size={22} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Attention Required Banner */}
      {attentionItems.length > 0 && (
        <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3.5">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <h2 className="text-sm font-bold text-amber-900 tracking-tight">Attention Required</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className="flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-200/60 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-600">{item.label}</p>
                  <p className="text-lg font-bold text-slate-900">{item.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Finance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financeStats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconStyle}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Spending Bar Chart */}
      {financeChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Spending by Category</h2>
            <span className="text-xs text-slate-400">Total expenditure overview</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={financeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Amount']}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
            <Clock size={16} className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity) => {
                const IconComponent = ACTION_ICONS[activity.action] || Activity;
                return (
                  <div key={activity.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <IconComponent size={15} className="text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        <span className="font-semibold text-slate-900">{activity.userName}</span>
                        {' '}{activity.action.toLowerCase().replace('_', ' ')}{' '}
                        <span className="text-blue-600 font-medium">{ENTITY_LABELS[activity.entityType] || activity.entityType}</span>
                        {activity.description && <span className="text-slate-400"> — {activity.description}</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{getRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No recent activity</div>
            )}
          </div>
        </div>

        {/* Milestones Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Milestones Overview</h2>
            <Flag size={16} className="text-slate-400" />
          </div>
          <div className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Milestones</span>
              <span className="text-base font-bold text-slate-900">{data.milestones.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Completed</span>
              <span className="text-base font-bold text-emerald-600">{data.milestones.byStatus['COMPLETED'] || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">In Progress</span>
              <span className="text-base font-bold text-blue-600">{data.milestones.byStatus['IN_PROGRESS'] || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Overdue</span>
              <span className="text-base font-bold text-red-600">{data.milestones.overdue}</span>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500">Average Completion</span>
                <span className="text-xs font-bold text-slate-800">{data.milestones.averageProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${data.milestones.averageProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects Progress */}
      {projectProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Active Projects Progress</h2>
            <Link to="/research-projects" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projectProgress.map((project) => (
              <div key={project.id} className="p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{project.projectCode}</p>
                  </div>
                  {project.isOverdue ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Overdue</span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">On Track</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2 mt-1">
                  <span>{project.memberCount} team members</span>
                  <span>•</span>
                  <span>{project.milestoneCount} milestones</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${project.isOverdue ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-9 text-right">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
