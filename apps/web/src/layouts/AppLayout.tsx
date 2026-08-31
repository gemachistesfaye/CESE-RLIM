import {
  LayoutDashboard,
  Users,
  FlaskConical,
  Microscope,
  Wrench,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  ClipboardList,
  BookOpen,
  Target,
  Award,
  Shield,
  Calendar,
  DollarSign,
  Flag,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotificationCount, useNotifications, useMarkNotificationRead } from '../hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  roles?: string[];
}

const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    section: 'RESEARCH',
    items: [
      { name: 'Researchers', href: '/researchers', icon: Users },
      { name: 'Projects', href: '/research-projects', icon: FlaskConical },
      { name: 'Activities', href: '/project-activities', icon: ClipboardList },
      { name: 'Milestones', href: '/research-milestones', icon: Flag },
      { name: 'Reports', href: '/research-reports', icon: FileText },
      { name: 'Documents', href: '/research-documents', icon: FileText },
      { name: 'Publications', href: '/research-publications', icon: BookOpen },
      { name: 'Innovations', href: '/innovations', icon: Microscope },
      { name: 'Events', href: '/research-events', icon: Calendar },
    ],
  },
  {
    section: 'FUNDING',
    items: [
      { name: 'Opportunities', href: '/funding-opportunities', icon: Target },
      { name: 'Applications', href: '/grant-applications', icon: FileText },
      { name: 'Grants', href: '/research-grants', icon: Award },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { name: 'Finance Dashboard', href: '/finance', icon: DollarSign, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'Expenses', href: '/research-expenses', icon: FileText },
      { name: 'Budgets', href: '/budget-management', icon: DollarSign, roles: ['ADMIN', 'COORDINATOR'] },
    ],
  },
  {
    section: 'COMPLIANCE',
    items: [
      { name: 'Ethics & Approvals', href: '/ethics/applications', icon: Shield },
    ],
  },
  {
    section: 'RESOURCES',
    items: [
      { name: 'Laboratories', href: '/laboratories', icon: FlaskConical },
      { name: 'Equipment', href: '/equipment', icon: Wrench },
      { name: 'Requests', href: '/equipment-requests', icon: FileText },
      { name: 'Assignments', href: '/equipment-assignments', icon: FileText },
      { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    ],
  },
  {
    section: 'MY WORK',
    items: [
      { name: 'My Tasks', href: '/my-maintenance', icon: Wrench },
      { name: 'My Milestones', href: '/my-milestones', icon: Flag },
      { name: 'My Events', href: '/my-events', icon: Calendar },
      { name: 'My Reports', href: '/my-reports', icon: FileText },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { name: 'Users', href: '/users', icon: Settings, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
];

function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const visibleNav = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.disabled) return false;
        if (item.roles && user) {
          return item.roles.includes(user.role);
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">CE</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">CESE-RLIM</h1>
            <p className="text-xs text-slate-400">Management Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {visibleNav.map((group) => (
          <div key={group.section}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              {group.section}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

const NOTIFICATION_TYPE_STYLES: Record<string, { icon: typeof Bell; color: string }> = {
  INFO: { icon: Info, color: 'text-blue-500' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500' },
  SUCCESS: { icon: CheckCircle, color: 'text-emerald-500' },
  ERROR: { icon: AlertTriangle, color: 'text-red-500' },
  ACTION_REQUIRED: { icon: AlertTriangle, color: 'text-red-500' },
  ASSIGNMENT: { icon: Users, color: 'text-violet-500' },
  STATUS_CHANGE: { icon: CheckCircle, color: 'text-blue-500' },
  DEADLINE: { icon: Clock, color: 'text-amber-500' },
  REQUEST: { icon: FileText, color: 'text-blue-500' },
  MAINTENANCE: { icon: Wrench, color: 'text-orange-500' },
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

function Topbar() {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: notifData } = useNotifications({ limit: 5, unreadOnly: true });
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();
  const unreadCount = unreadData?.count || 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (id: string, entityType: string | null, entityId: string | null) => {
    await markRead.mutateAsync(id);
    setShowDropdown(false);
    if (entityType && entityId) {
      const ENTITY_ROUTES: Record<string, (id: string) => string> = {
        EquipmentRequest: (id) => `/equipment-requests/${id}`,
        EquipmentAssignment: (id) => `/equipment-assignments/${id}`,
        MaintenanceRecord: (id) => `/maintenance/${id}`,
        ResearchProject: (id) => `/research-projects/${id}`,
        ProjectActivity: (id) => `/project-activities/${id}`,
        Innovation: (id) => `/innovations/${id}`,
        GrantApplication: (id) => `/grant-applications/${id}`,
        EthicsApplication: (id) => `/ethics/applications/${id}`,
        ResearchEvent: (id) => `/research-events/${id}`,
        ResearchMilestone: (id) => `/research-milestones/${id}`,
        ResearchReport: (id) => `/research-reports/${id}`,
        ResearchPublication: (id) => `/research-publications/${id}`,
        ResearchExpense: (id) => `/research-expenses/${id}`,
      };
      const routeFn = ENTITY_ROUTES[entityType];
      if (routeFn) {
        navigate({ to: routeFn(entityId) });
      }
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate({ to: '/notifications' });
  };

  const notifications = notifData?.items || [];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search researchers, equipment, labs..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-slate-500">{unreadCount} unread</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No unread notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const defaultStyle = { icon: Bell, color: 'text-slate-500' };
                    const typeStyle = NOTIFICATION_TYPE_STYLES[notif.type] || defaultStyle;
                    const TypeIcon = typeStyle.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.entityType, notif.entityId)}
                        className="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <TypeIcon size={14} className={typeStyle.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{notif.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{getRelativeTime(notif.createdAt)}</p>
                        </div>
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Topbar />
        <main className="p-6 pt-20">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
