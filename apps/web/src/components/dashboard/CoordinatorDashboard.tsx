import { Link } from '@tanstack/react-router';
import { FlaskConical, Users, Shield, ArrowRight, BookOpen, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardOverview } from '../../hooks/useDashboard';
import { Skeleton, SkeletonCard } from '../ui/Skeleton';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardOverview();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase mb-3">
            <Target size={13} />
            <span>Research Coordination</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-slate-300 max-w-xl mt-1">Oversee research projects, manage teams, coordinate ethics reviews, and track funding opportunities.</p>
          <div className="flex items-center gap-2.5 mt-5 flex-wrap">
            <Link to="/research-projects" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-xs">
              <FlaskConical size={14} /><span>Projects</span>
            </Link>
            <Link to="/researchers" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20">
              <Users size={14} /><span>Researchers</span>
            </Link>
            <Link to="/ethics/applications" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20">
              <Shield size={14} /><span>Ethics Reviews</span>
            </Link>
            <Link to="/funding-opportunities" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20">
              <Target size={14} /><span>Funding</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Projects</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.projects?.byStatus?.ACTIVE || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><FlaskConical size={20} /></div>
          </div>
          <Link to="/research-projects" className="text-xs text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">View all <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Researchers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.users?.byRole?.RESEARCHER || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Users size={20} /></div>
          </div>
          <Link to="/researchers" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Team <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ethics Pending</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.attentionRequired?.pendingEthicsReviews || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><Shield size={20} /></div>
          </div>
          <Link to="/ethics/applications" className="text-xs text-amber-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Review <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Publications</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.publications?.total || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><BookOpen size={20} /></div>
          </div>
          <Link to="/research-publications" className="text-xs text-emerald-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Papers <ArrowRight size={11} /></Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Project Status</h2>
                <p className="text-xs text-slate-500">Overview of all research projects</p>
              </div>
              <Link to="/research-projects" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1">View all <ArrowRight size={12} /></Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.projects?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                  <p className="text-lg font-bold text-slate-900">{count as number}</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{status.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Milestones</h2>
                <p className="text-xs text-slate-500">Research milestone tracking</p>
              </div>
              <Link to="/research-milestones" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1">All <ArrowRight size={12} /></Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.milestones?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                  <p className="text-lg font-bold text-slate-900">{count as number}</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{status.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Attention Required</h2>
              <p className="text-xs text-slate-500">Items needing coordination</p>
            </div>
            <div className="p-4 space-y-3">
              {data.attentionRequired?.pendingEthicsReviews > 0 && (
                <Link to="/ethics/applications" className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs">
                  <span className="font-medium text-red-700">Pending Ethics Reviews</span>
                  <span className="font-bold text-red-800">{data.attentionRequired.pendingEthicsReviews}</span>
                </Link>
              )}
              {data.attentionRequired?.overdueMilestones > 0 && (
                <Link to="/research-milestones" className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                  <span className="font-medium text-amber-700">Overdue Milestones</span>
                  <span className="font-bold text-amber-800">{data.attentionRequired.overdueMilestones}</span>
                </Link>
              )}
              {(!data.attentionRequired?.pendingEthicsReviews && !data.attentionRequired?.overdueMilestones) && (
                <div className="text-center py-4 text-slate-400 text-xs">All caught up!</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {(data.recentActivity || []).slice(0, 6).map((a) => (
                <div key={a.id} className="p-3 text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">{a.action}</span>
                    <span className="font-semibold text-slate-900">{a.entityType}</span>
                  </div>
                  <p className="text-slate-500 truncate">{a.description || 'System event'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.userName} &bull; {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
