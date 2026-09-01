import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  FlaskConical,
  Wrench,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flag,
  Calendar,
  DollarSign,
  BookOpen,
  Lightbulb,
  BarChart3,
  Activity,
  Shield,
  Bell,
} from 'lucide-react';
import { useDashboardOverview } from '../hooks/useDashboard';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { Link } from '@tanstack/react-router';

const CHART_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
];

const ACTION_ICONS: Record<string, typeof Users> = {
  CREATE: CheckCircle,
  UPDATE: Activity,
  DELETE: AlertTriangle,
  APPROVE: CheckCircle,
  SUBMIT: FileText,
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
  const { data, isLoading, error } = useDashboardOverview();
  const { data: unreadData } = useUnreadNotificationCount();

  const projectChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.projects.byStatus)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [data]);

  const equipmentChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.equipment.byStatus)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [data]);

  const ethicsChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.ethics.byStatus)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [data]);

  const financeChartData = useMemo(() => {
    if (!data) return [];
    return data.finance.spendingByCategory.map((entry) => ({
      name: entry.category.replace('_', ' '),
      amount: entry.amount,
      count: entry.count,
    }));
  }, [data]);

  const attentionItems = useMemo(() => {
    if (!data) return [];
    const items: Array<{
      label: string;
      count: number;
      color: string;
      icon: typeof Users;
      link: string;
    }> = [];
    const a = data.attentionRequired;

    if (a.pendingEquipmentRequests > 0)
      items.push({
        label: 'Pending equipment requests',
        count: a.pendingEquipmentRequests,
        color: 'bg-amber-500',
        icon: Wrench,
        link: '/equipment-requests',
      });
    if (a.overdueMaintenance > 0)
      items.push({
        label: 'Overdue maintenance',
        count: a.overdueMaintenance,
        color: 'bg-red-500',
        icon: AlertTriangle,
        link: '/maintenance',
      });
    if (a.pendingEthicsReviews > 0)
      items.push({
        label: 'Ethics reviews pending',
        count: a.pendingEthicsReviews,
        color: 'bg-purple-500',
        icon: Shield,
        link: '/ethics/applications',
      });
    if (a.overdueMilestones > 0)
      items.push({
        label: 'Overdue milestones',
        count: a.overdueMilestones,
        color: 'bg-red-500',
        icon: Flag,
        link: '/research-milestones',
      });
    if (a.reportsAwaitingReview > 0)
      items.push({
        label: 'Reports awaiting review',
        count: a.reportsAwaitingReview,
        color: 'bg-blue-500',
        icon: FileText,
        link: '/research-reports',
      });
    if (a.pendingExpenses > 0)
      items.push({
        label: 'Expenses pending approval',
        count: a.pendingExpenses,
        color: 'bg-amber-500',
        icon: DollarSign,
        link: '/research-expenses',
      });
    if (a.projectsApproachingEnd > 0)
      items.push({
        label: 'Projects ending soon (30 days)',
        count: a.projectsApproachingEnd,
        color: 'bg-orange-500',
        icon: Calendar,
        link: '/research-projects',
      });

    return items;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load dashboard data.</div>
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      name: 'Researchers',
      value: data.researchers.total,
      icon: Users,
      color: 'bg-blue-500',
      link: '/researchers',
    },
    {
      name: 'Laboratories',
      value: data.laboratories.total,
      change: `${data.laboratories.active} active`,
      icon: FlaskConical,
      color: 'bg-emerald-500',
      link: '/laboratories',
    },
    {
      name: 'Equipment',
      value: data.equipment.total,
      change: `${data.equipment.byStatus['AVAILABLE'] || 0} available`,
      icon: Wrench,
      color: 'bg-violet-500',
      link: '/equipment',
    },
    {
      name: 'Projects',
      value: data.projects.total,
      change: `${data.projects.byStatus['ACTIVE'] || 0} active`,
      icon: BookOpen,
      color: 'bg-cyan-500',
      link: '/research-projects',
    },
  ];

  const moduleStats = [
    {
      name: 'Innovations',
      value: data.innovations.total,
      change: `${data.innovations.byStatus['APPROVED'] || 0} approved`,
      icon: Lightbulb,
      color: 'bg-amber-500',
      link: '/innovations',
    },
    {
      name: 'Publications',
      value: data.publications.total,
      change: `${data.publications.totalCitations} citations`,
      icon: BookOpen,
      color: 'bg-indigo-500',
      link: '/publications',
    },
    {
      name: 'Documents',
      value: data.documents.total,
      change: `${data.documents.byStatus['APPROVED'] || 0} approved`,
      icon: FileText,
      color: 'bg-teal-500',
      link: '/documents',
    },
    {
      name: 'Events',
      value: data.events.total,
      change: `${data.events.upcoming} upcoming`,
      icon: Calendar,
      color: 'bg-pink-500',
      link: '/events',
    },
  ];

  const financeStats = [
    {
      name: 'Total Awarded',
      value: formatCurrency(data.finance.totalAwarded),
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      name: 'Total Spent',
      value: formatCurrency(data.finance.totalSpent),
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      name: 'Remaining',
      value: formatCurrency(data.finance.remainingBudget),
      icon: BarChart3,
      color: 'bg-violet-500',
    },
    {
      name: 'Utilization',
      value: `${data.finance.utilization}%`,
      icon: Activity,
      color: 'bg-amber-500',
    },
  ];

  const projectProgress = data.projects.activeProjects.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of CESE research resources and activities
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                {stat.change && (
                  <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
                )}
              </div>
              <div className={`${stat.color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <stat.icon size={22} className="text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {moduleStats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                {stat.change && (
                  <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
                )}
              </div>
              <div className={`${stat.color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <stat.icon size={22} className="text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {attentionItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900">Attention Required</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className={`${item.color} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-lg font-bold text-slate-900">{item.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {unreadData && unreadData.count > 0 && (
        <Link to="/notifications" className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Notifications</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{unreadData.count}</p>
              <p className="text-xs text-slate-400 mt-1">unread notification{unreadData.count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financeStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <stat.icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Project Status</h2>
          {projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={projectChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {projectChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No projects</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Equipment Status</h2>
          {equipmentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={equipmentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {equipmentChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No equipment</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Ethics Applications</h2>
          {ethicsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={ethicsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ethicsChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No applications</p>
          )}
        </div>
      </div>

      {financeChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
              <Clock size={16} className="text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity) => {
                const IconComponent = ACTION_ICONS[activity.action] || Activity;
                const colorMap: Record<string, string> = {
                  CREATE: 'text-emerald-500',
                  UPDATE: 'text-blue-500',
                  DELETE: 'text-red-500',
                  APPROVE: 'text-emerald-500',
                  SUBMIT: 'text-amber-500',
                  LOGIN: 'text-violet-500',
                };
                const iconColor = colorMap[activity.action] || 'text-slate-400';

                return (
                  <div
                    key={activity.id}
                    className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <IconComponent size={18} className={iconColor} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        <span className="font-medium">{activity.userName}</span>
                        {' '}
                        {activity.action.toLowerCase().replace('_', ' ')}
                        {' '}
                        {ENTITY_LABELS[activity.entityType] || activity.entityType}
                        {activity.description && (
                          <span className="text-slate-400"> — {activity.description}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {getRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No recent activity
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Milestones</h2>
              <Flag size={16} className="text-slate-400" />
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Milestones</span>
              <span className="text-lg font-bold text-slate-900">{data.milestones.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Completed</span>
              <span className="text-lg font-bold text-emerald-600">
                {data.milestones.byStatus['COMPLETED'] || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">In Progress</span>
              <span className="text-lg font-bold text-blue-600">
                {data.milestones.byStatus['IN_PROGRESS'] || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Overdue</span>
              <span className="text-lg font-bold text-red-600">{data.milestones.overdue}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-500">Average Progress</span>
                <span className="text-sm font-medium text-slate-700">
                  {data.milestones.averageProgress}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${data.milestones.averageProgress}%` }}
                />
              </div>
            </div>
            <Link
              to="/research-milestones"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
            >
              View all milestones →
            </Link>
          </div>
        </div>
      </div>

      {projectProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Active Projects</h2>
          <div className="space-y-4">
            {projectProgress.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{project.title}</p>
                    <p className="text-xs text-slate-400">{project.projectCode}</p>
                  </div>
                  {project.isOverdue && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      Overdue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                  <span>{project.memberCount} members</span>
                  <span>{project.activityCount} activities</span>
                  <span>{project.innovationCount} innovations</span>
                  <span>{project.publicationCount} publications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        project.isOverdue ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-10 text-right">
                    {project.progress}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {project.completedMilestones}/{project.milestoneCount} milestones
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/research-projects"
              className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              View Projects
            </Link>
            <Link
              to="/equipment-requests"
              className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              Equipment Requests
            </Link>
            <Link
              to="/ethics/applications"
              className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              Ethics Applications
            </Link>
            <Link
              to="/research-expenses"
              className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              Research Expenses
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Ethics Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Applications</span>
              <span className="text-lg font-bold text-slate-900">{data.ethics.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Pending Review</span>
              <span className="text-lg font-bold text-amber-600">{data.ethics.pendingReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Approved</span>
              <span className="text-lg font-bold text-emerald-600">
                {data.ethics.byStatus['APPROVED'] || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Approval Rate</span>
              <span className="text-lg font-bold text-blue-600">{data.ethics.approvalRate}%</span>
            </div>
            <Link
              to="/ethics/applications"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
            >
              View all applications →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Grants & Funding</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Opportunities</span>
              <span className="text-lg font-bold text-slate-900">
                {data.funding.opportunities.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Applications</span>
              <span className="text-lg font-bold text-blue-600">
                {data.funding.applications.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Active Grants</span>
              <span className="text-lg font-bold text-emerald-600">
                {data.funding.grants.byStatus['ACTIVE'] || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Awarded</span>
              <span className="text-lg font-bold text-violet-600">
                {formatCurrency(data.funding.totalAwarded)}
              </span>
            </div>
            <Link
              to="/funding-opportunities"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
            >
              View funding →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
