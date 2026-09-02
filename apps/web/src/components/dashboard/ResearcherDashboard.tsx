import { Link } from '@tanstack/react-router';
import { FlaskConical, Wrench, Clock, DollarSign, PlusCircle, Shield, BookOpen, ArrowRight, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardOverview } from '../../hooks/useDashboard';
import { Skeleton, SkeletonCard } from '../ui/Skeleton';

export default function ResearcherDashboard() {
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

  const activeProjects = data.projects?.activeProjects || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase mb-3">
            <FlaskConical size={13} />
            <span>Researcher Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-slate-300 max-w-xl mt-1">Track your active research projects, equipment bookings, milestones, and expense claims.</p>
          <div className="flex items-center gap-2.5 mt-5 flex-wrap">
            <Link to="/research-projects" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-colors shadow-xs">
              <PlusCircle size={14} /><span>New Project</span>
            </Link>
            <Link to="/equipment-requests" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20">
              <Wrench size={14} /><span>Request Equipment</span>
            </Link>
            <Link to="/ethics/applications" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20">
              <Shield size={14} /><span>Ethics Application</span>
            </Link>
            <Link to="/research-publications" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20">
              <BookOpen size={14} /><span>Publish Paper</span>
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><FlaskConical size={20} /></div>
          </div>
          <Link to="/research-projects" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">View all <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Equipment Requests</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.equipmentRequests?.total || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><Wrench size={20} /></div>
          </div>
          <Link to="/equipment-requests" className="text-xs text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Manage <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Milestones</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.milestones?.byStatus?.IN_PROGRESS || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100"><Clock size={20} /></div>
          </div>
          <Link to="/my-milestones" className="text-xs text-purple-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">My milestones <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.finance?.totalExpenses || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><DollarSign size={20} /></div>
          </div>
          <Link to="/research-expenses" className="text-xs text-emerald-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Claims <ArrowRight size={11} /></Link>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">My Active Research Projects</h2>
                <p className="text-xs text-slate-500">Current investigations and project lifecycles</p>
              </div>
              <Link to="/research-projects" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1">View all <ArrowRight size={12} /></Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activeProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <FlaskConical size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">No active research projects</p>
                  <p className="text-xs text-slate-400 mt-0.5">Create your first research project to get started.</p>
                </div>
              ) : (
                activeProjects.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{p.projectCode}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">{p.status}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{p.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar size={11} />{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'No date'}</span>
                        <span className="font-semibold text-indigo-600">{p.progress}% complete</span>
                      </div>
                    </div>
                    <Link to={`/research-projects/${p.id}` as any} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">Details</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Attention Required */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Attention Required</h2>
              <p className="text-xs text-slate-500">Items needing your action</p>
            </div>
            <div className="p-4 space-y-3">
              {data.attentionRequired?.overdueMilestones > 0 && (
                <Link to="/my-milestones" className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs">
                  <span className="font-medium text-red-700">Overdue Milestones</span>
                  <span className="font-bold text-red-800">{data.attentionRequired.overdueMilestones}</span>
                </Link>
              )}
              {data.attentionRequired?.pendingEquipmentRequests > 0 && (
                <Link to="/equipment-requests" className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                  <span className="font-medium text-amber-700">Pending Equipment</span>
                  <span className="font-bold text-amber-800">{data.attentionRequired.pendingEquipmentRequests}</span>
                </Link>
              )}
              {data.attentionRequired?.pendingExpenses > 0 && (
                <Link to="/research-expenses" className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs">
                  <span className="font-medium text-blue-700">Pending Expenses</span>
                  <span className="font-bold text-blue-800">{data.attentionRequired.pendingExpenses}</span>
                </Link>
              )}
              {(!data.attentionRequired?.overdueMilestones && !data.attentionRequired?.pendingEquipmentRequests && !data.attentionRequired?.pendingExpenses) && (
                <div className="text-center py-4 text-slate-400 text-xs">All caught up! No items need attention.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
