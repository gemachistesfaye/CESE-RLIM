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
} from 'lucide-react';
import { Link, useLocation, Outlet } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
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
      { name: 'Documents', href: '/research-documents', icon: FileText },
      { name: 'Publications', href: '/research-publications', icon: BookOpen },
      { name: 'Innovations', href: '/innovations', icon: Microscope },
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
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { name: 'Users', href: '/users', icon: Settings, roles: ['ADMIN', 'COORDINATOR'] },
      { name: 'Notifications', href: '/notifications', icon: Bell, disabled: true },
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

function Topbar() {
  const { user } = useAuth();

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
        <button className="relative p-2 text-slate-500 hover:text-slate-700">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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
