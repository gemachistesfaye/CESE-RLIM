import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ClipboardList, CheckCircle, Wrench, AlertTriangle, ArrowRight, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEquipmentRequests } from '../../hooks/useEquipmentRequests';
import { useEquipmentAssignments } from '../../hooks/useEquipmentAssignments';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';

type Tab = 'requests' | 'assignments';

export default function EquipmentOperations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('requests');

  const tabs = [
    { id: 'requests' as Tab, label: 'Equipment Requests', icon: ClipboardList },
    { id: 'assignments' as Tab, label: 'Equipment Assignments', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Equipment Operations</h1>
        <p className="text-sm text-slate-500 mt-1">Manage equipment requests and assignments.</p>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      {activeTab === 'requests' && <RequestsTab />}
      {activeTab === 'assignments' && <AssignmentsTab />}
    </div>
  );
}

function RequestsTab() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useEquipmentRequests({
    page,
    limit: 10,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const canReview = user?.role === 'ADMIN' || user?.role === 'COORDINATOR' || user?.role === 'TECHNICIAN';

  if (isLoading) {
    return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  const requests = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No equipment requests</p>
            <p className="text-xs text-slate-400 mt-0.5">No requests found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req: any) => (
              <Link
                key={req.id}
                to={`/equipment-requests/${req.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {req.equipment?.assetId || 'N/A'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      req.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      req.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' :
                      req.status === 'SUBMITTED' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{req.equipment?.name || 'Unknown Equipment'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requested by {req.requester?.firstName} {req.requester?.lastName} • {req.priority} priority
                  </p>
                </div>
                <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, total)} of {total}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentsTab() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useEquipmentAssignments({
    page,
    limit: 10,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  if (isLoading) {
    return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  const assignments = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        {assignments.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No equipment assignments</p>
            <p className="text-xs text-slate-400 mt-0.5">No assignments found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assign: any) => (
              <Link
                key={assign.id}
                to={`/equipment-assignments/${assign.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {assign.equipment?.assetId || 'N/A'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      assign.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {assign.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{assign.equipment?.name || 'Unknown Equipment'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assigned to {assign.researcher?.user?.firstName} {assign.researcher?.user?.lastName} • {assign.purpose || 'No purpose'}
                  </p>
                </div>
                <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, total)} of {total}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
