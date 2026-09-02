import { Link } from '@tanstack/react-router';
import { Wrench, AlertTriangle, CheckCircle2, PlusCircle, FlaskConical, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardOverview } from '../../hooks/useDashboard';
import { Skeleton, SkeletonCard } from '../ui/Skeleton';

export default function TechnicianDashboard() {
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
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase mb-3">
            <Wrench size={13} />
            <span>Laboratory &amp; Equipment Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-slate-300 max-w-xl mt-1">Monitor laboratory machinery, resolve repair tickets, assign equipment to researchers, and verify physical checkouts.</p>
          <div className="flex items-center gap-2.5 mt-5 flex-wrap">
            <Link to="/maintenance" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs">
              <PlusCircle size={14} /><span>Log Maintenance</span>
            </Link>
            <Link to="/equipment-assignments" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20">
              <CheckCircle2 size={14} /><span>Assign Equipment</span>
            </Link>
            <Link to="/equipment" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20">
              <Layers size={14} /><span>Equipment Catalog</span>
            </Link>
            <Link to="/laboratories" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20">
              <FlaskConical size={14} /><span>Lab Facilities</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Maintenance Records</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.maintenance?.total || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><AlertTriangle size={20} /></div>
          </div>
          <Link to="/maintenance" className="text-xs text-amber-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Service queue <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.equipmentRequests?.pending || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><CheckCircle2 size={20} /></div>
          </div>
          <Link to="/equipment-requests" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Review requests <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Equipment</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.equipment?.total || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Wrench size={20} /></div>
          </div>
          <Link to="/equipment" className="text-xs text-emerald-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Full inventory <ArrowRight size={11} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Labs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.laboratories?.active || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100"><FlaskConical size={20} /></div>
          </div>
          <Link to="/laboratories" className="text-xs text-purple-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-3">Lab locations <ArrowRight size={11} /></Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Maintenance Status Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Maintenance &amp; Repair Overview</h2>
                <p className="text-xs text-slate-500">Status breakdown for all maintenance tickets</p>
              </div>
              <Link to="/maintenance" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1">View all <ArrowRight size={12} /></Link>
            </div>
            <div className="p-4">
              {data.maintenance?.total === 0 ? (
                <div className="py-6 text-center">
                  <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-slate-700">All equipment healthy!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No active maintenance issues.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(data.maintenance?.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                      <p className="text-lg font-bold text-slate-900">{count as number}</p>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{status.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Equipment Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Equipment Status Distribution</h2>
                <p className="text-xs text-slate-500">Current inventory condition</p>
              </div>
              <Link to="/equipment" className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1">Catalog <ArrowRight size={12} /></Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.equipment?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                  <p className="text-lg font-bold text-slate-900">{count as number}</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{status.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Attention */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Attention Required</h2>
              <p className="text-xs text-slate-500">Items needing technician action</p>
            </div>
            <div className="p-4 space-y-3">
              {data.attentionRequired?.overdueMaintenance > 0 && (
                <Link to="/maintenance" className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs">
                  <span className="font-medium text-red-700">Overdue Maintenance</span>
                  <span className="font-bold text-red-800">{data.attentionRequired.overdueMaintenance}</span>
                </Link>
              )}
              {data.attentionRequired?.pendingEquipmentRequests > 0 && (
                <Link to="/equipment-requests" className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                  <span className="font-medium text-amber-700">Pending Equipment Requests</span>
                  <span className="font-bold text-amber-800">{data.attentionRequired.pendingEquipmentRequests}</span>
                </Link>
              )}
              {(!data.attentionRequired?.overdueMaintenance && !data.attentionRequired?.pendingEquipmentRequests) && (
                <div className="text-center py-4 text-slate-400 text-xs">All caught up!</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
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
