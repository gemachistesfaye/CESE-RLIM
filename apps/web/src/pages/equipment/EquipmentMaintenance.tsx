import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Wrench, ClipboardList, CheckCircle, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEquipment } from '../../hooks/useEquipment';
import { useEquipmentRequests } from '../../hooks/useEquipmentRequests';
import { useEquipmentAssignments } from '../../hooks/useEquipmentAssignments';
import { useMaintenanceRecords } from '../../hooks/useMaintenance';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';

type Tab = 'equipment' | 'requests' | 'assignments' | 'maintenance';

export default function EquipmentMaintenance() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('equipment');

  const tabs = [
    { id: 'equipment' as Tab, label: 'Equipment', icon: Wrench },
    { id: 'requests' as Tab, label: 'Requests', icon: ClipboardList },
    { id: 'assignments' as Tab, label: 'Assignments', icon: CheckCircle },
    { id: 'maintenance' as Tab, label: 'Maintenance', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Equipment & Maintenance</h1>
        <p className="text-sm text-slate-500 mt-1">Manage equipment, requests, assignments, and maintenance.</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'equipment' && <EquipmentTab />}
      {activeTab === 'requests' && <RequestsTab />}
      {activeTab === 'assignments' && <AssignmentsTab />}
      {activeTab === 'maintenance' && <MaintenanceTab />}
    </div>
  );
}

function EquipmentTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useEquipment({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  if (isLoading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <Wrench size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No equipment found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item: any) => (
              <Link
                key={item.id}
                to={`/equipment/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item.assetId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      item.status === 'IN_USE' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category} • {item.laboratory?.name || 'No lab'}</p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>
        )}
        {total > 10 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total} className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestsTab() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useEquipmentRequests({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  if (isLoading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No requests</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((req: any) => (
              <Link
                key={req.id}
                to={`/equipment-requests/${req.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      req.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      req.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{req.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{req.equipment?.name || 'Equipment'}</p>
                  <p className="text-xs text-slate-500">By {req.requester?.firstName} {req.requester?.lastName}</p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useEquipmentAssignments({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  if (isLoading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((assign: any) => (
              <Link
                key={assign.id}
                to={`/equipment-assignments/${assign.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      assign.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {assign.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{assign.equipment?.name || 'Equipment'}</p>
                  <p className="text-xs text-slate-500">To {assign.researcher?.user?.firstName} {assign.researcher?.user?.lastName}</p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MaintenanceTab() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useMaintenanceRecords({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  if (isLoading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="REPORTED">Reported</option>
          <option value="DIAGNOSING">Diagnosing</option>
          <option value="REPAIRING">Repairing</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No maintenance records</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item: any) => (
              <Link
                key={item.id}
                to={`/maintenance/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      item.status === 'REPORTED' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{item.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{item.equipment?.name || 'Equipment'}</p>
                  <p className="text-xs text-slate-500">{item.assignedTechnician ? `Assigned to ${item.assignedTechnician.firstName}` : 'Unassigned'}</p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
