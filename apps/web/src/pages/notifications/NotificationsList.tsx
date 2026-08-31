import { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Wrench,
  Flag,
  Calendar,
  Shield,
  BookOpen,
  DollarSign,
  Users,
  FlaskConical,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import type { Notification } from '../../hooks/useNotifications';
import { useNavigate } from '@tanstack/react-router';

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  EquipmentRequest: (id) => `/equipment-requests/${id}`,
  EquipmentAssignment: (id) => `/equipment-assignments/${id}`,
  Equipment: (id) => `/equipment/${id}`,
  MaintenanceRecord: (id) => `/maintenance/${id}`,
  ResearchProject: (id) => `/research-projects/${id}`,
  ProjectActivity: (id) => `/project-activities/${id}`,
  Innovation: (id) => `/innovations/${id}`,
  ResearchDocument: (id) => `/research-documents/${id}`,
  ResearchPublication: (id) => `/research-publications/${id}`,
  FundingOpportunity: (id) => `/funding-opportunities/${id}`,
  GrantApplication: (id) => `/grant-applications/${id}`,
  ResearchGrant: (id) => `/research-grants/${id}`,
  EthicsApplication: (id) => `/ethics/applications/${id}`,
  ResearchEvent: (id) => `/research-events/${id}`,
  ResearchExpense: (id) => `/research-expenses/${id}`,
  BudgetAllocation: () => `/budget-management`,
  ResearchMilestone: (id) => `/research-milestones/${id}`,
  ResearchReport: (id) => `/research-reports/${id}`,
  User: (id) => `/users/${id}`,
  Researcher: (id) => `/researchers/${id}`,
  Laboratory: (id) => `/laboratories/${id}`,
};

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bgColor: string; label: string }
> = {
  INFO: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50', label: 'Info' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-50', label: 'Warning' },
  SUCCESS: { icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-50', label: 'Success' },
  ERROR: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50', label: 'Error' },
  REQUEST: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50', label: 'Request' },
  MAINTENANCE: { icon: Wrench, color: 'text-orange-500', bgColor: 'bg-orange-50', label: 'Maintenance' },
  ACTION_REQUIRED: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50', label: 'Action Required' },
  ASSIGNMENT: { icon: Users, color: 'text-violet-500', bgColor: 'bg-violet-50', label: 'Assignment' },
  STATUS_CHANGE: { icon: CheckCircle, color: 'text-blue-500', bgColor: 'bg-blue-50', label: 'Status Change' },
  DEADLINE: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50', label: 'Deadline' },
};

const ENTITY_ICONS: Record<string, typeof Bell> = {
  EquipmentRequest: Wrench,
  EquipmentAssignment: Wrench,
  Equipment: Wrench,
  MaintenanceRecord: Wrench,
  ResearchProject: FlaskConical,
  ProjectActivity: FileText,
  Innovation: FlaskConical,
  ResearchDocument: FileText,
  ResearchPublication: BookOpen,
  FundingOpportunity: DollarSign,
  GrantApplication: FileText,
  ResearchGrant: DollarSign,
  EthicsApplication: Shield,
  ResearchEvent: Calendar,
  ResearchExpense: DollarSign,
  ResearchMilestone: Flag,
  ResearchReport: FileText,
  User: Users,
  Researcher: Users,
  Laboratory: FlaskConical,
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

export default function NotificationsList() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const limit = 20;

  const { data, isLoading } = useNotifications({ page, limit, unreadOnly, type: typeFilter || undefined });
  const { data: unreadData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.entityType && notification.entityId) {
      const routeFn = ENTITY_ROUTES[notification.entityType];
      if (routeFn) {
        navigate({ to: routeFn(notification.entityId) });
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(id);
  };

  const notifications = data?.items || [];
  const pagination = data?.pagination;
  const unreadCount = unreadData?.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            !unreadOnly
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            unreadOnly
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bell size={14} />
          Unread
          {unreadCount > 0 && (
            <span className={`ml-1 px-1.5 text-xs rounded-full ${unreadOnly ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bell size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-1">No notifications</h3>
          <p className="text-sm text-slate-500">
            {unreadOnly ? 'You have no unread notifications.' : 'You have no notifications yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {notifications.map((notification) => {
              const defaultConfig = { icon: Bell, color: 'text-slate-500', bgColor: 'bg-slate-50', label: 'Info' };
              const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type] || defaultConfig;
              const TypeIcon = typeConfig.icon;
              const EntityIcon = notification.entityType ? ENTITY_ICONS[notification.entityType] : null;
              const hasNavigation = notification.entityType && notification.entityId && ENTITY_ROUTES[notification.entityType];

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    hasNavigation ? 'cursor-pointer hover:bg-slate-50' : ''
                  } ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                    <TypeIcon size={18} className={typeConfig.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      {notification.entityType && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          {EntityIcon && <EntityIcon size={12} />}
                          {notification.entityType}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead.mutate(notification.id); }}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-slate-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
