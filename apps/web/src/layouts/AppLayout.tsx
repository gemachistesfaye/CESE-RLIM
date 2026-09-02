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
  ClipboardList,
  BookOpen,
  Target,
  Award,
  Shield,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  Activity,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotificationCount, useNotifications, useMarkNotificationRead } from '../hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import HeaderSearch from '../components/global-search/HeaderSearch';

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
      { name: 'Researchers', href: '/researchers', icon: Users, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Projects', href: '/research-projects', icon: FlaskConical, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Publications', href: '/research-publications', icon: BookOpen, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Innovations', href: '/innovations', icon: Microscope, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Events', href: '/research-events', icon: Calendar, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Ethics & Approvals', href: '/ethics/applications', icon: Shield, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
    ],
  },
  {
    section: 'FUNDING',
    items: [
      { name: 'Opportunities', href: '/funding-opportunities', icon: Target, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Applications', href: '/grant-applications', icon: ClipboardList, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Grants', href: '/research-grants', icon: Award, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { name: 'Dashboard', href: '/finance', icon: DollarSign, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'Expenses', href: '/research-expenses', icon: DollarSign, roles: ['ADMIN', 'COORDINATOR', 'RESEARCHER'] },
      { name: 'Budgets', href: '/budget-management', icon: DollarSign, roles: ['ADMIN', 'COORDINATOR'] },
    ],
  },
  {
    section: 'RESOURCES',
    items: [
      { name: 'Laboratories', href: '/laboratories', icon: FlaskConical },
      { name: 'Equipment', href: '/equipment', icon: Wrench },
      { name: 'Requests', href: '/equipment-requests', icon: ClipboardList },
      { name: 'Assignments', href: '/equipment-assignments', icon: CheckCircle, roles: ['ADMIN', 'COORDINATOR', 'TECHNICIAN'] },
      { name: 'Maintenance', href: '/maintenance', icon: AlertTriangle, roles: ['ADMIN', 'COORDINATOR', 'TECHNICIAN'] },
    ],
  },
  {
    section: 'ADMINISTRATION',
    items: [
      { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'Settings', href: '/administration/settings', icon: Settings, roles: ['ADMIN'] },
      { name: 'Security', href: '/administration/security', icon: Shield, roles: ['ADMIN'] },
      { name: 'Audit Logs', href: '/audit-logs', icon: Activity, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'System Info', href: '/administration/system', icon: Info, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const currentSection = navigation.find(group => 
    group.section !== 'OVERVIEW' && group.items.some(item => item.href === location.pathname)
  )?.section;

  const [openSection, setOpenSection] = useState<string | null>(currentSection || null);

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

  // When path changes, auto-open the section and close mobile drawer
  useEffect(() => {
    const newSection = navigation.find(group => 
      group.section !== 'OVERVIEW' && group.items.some(item => item.href === location.pathname)
    )?.section;
    if (newSection && newSection !== openSection) {
      setOpenSection(newSection);
    }
    onCloseMobile();
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 text-white flex flex-col min-h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold tracking-tight">CE</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">CESE-RLIM</h1>
              <p className="text-[11px] text-slate-400">Innovation Platform</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {visibleNav.map((group) => {
            if (group.section === 'OVERVIEW') {
              return (
                <div key={group.section} className="mb-3">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <item.icon size={18} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isOpen = openSection === group.section;
            return (
              <div key={group.section} className="mb-1">
                <button
                  onClick={() => setOpenSection(isOpen ? null : group.section)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
                >
                  <span>{group.section}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-0.5 pl-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-600/25 text-blue-400 font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <item.icon size={17} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
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

interface TopbarProps {
  onOpenMobile: () => void;
}

function Topbar({ onOpenMobile }: TopbarProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    setShowUserMenu(false);
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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 lg:left-64 right-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="max-w-md w-full">
          <HeaderSearch className="w-full" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-700">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-0.5">No unread notifications right now.</p>
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
                        className="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
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

              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowDropdown(false);
            }}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-xs flex-shrink-0">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user?.role}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  to={user?.role === 'RESEARCHER' ? '/researchers' : '/users'}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <UserIcon size={15} className="text-slate-400" />
                  <span>Profile & Directory</span>
                </Link>

                <Link
                  to="/notifications"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Bell size={15} className="text-slate-400" />
                  <span>Notification Center</span>
                </Link>
              </div>

              <div className="p-1.5 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} className="text-red-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
      <div className="lg:ml-64 ml-0 flex-1 flex flex-col">
        <Topbar onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 pt-20">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
