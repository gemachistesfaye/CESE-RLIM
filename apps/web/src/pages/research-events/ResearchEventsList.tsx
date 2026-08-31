import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useResearchEvents, useEventSummary, useUpdateEventStatus, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '../../hooks/useResearchEvents';
import { useResearchProjects } from '../../hooks/useResearchProjects';
import { useAuth } from '../../contexts/AuthContext';
import ResearchEventForm from '../../components/research-events/ResearchEventForm';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, Calendar, MapPin, Monitor } from 'lucide-react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', PUBLISHED: 'bg-blue-100 text-blue-700',
  REGISTRATION_OPEN: 'bg-emerald-100 text-emerald-700', REGISTRATION_CLOSED: 'bg-amber-100 text-amber-700',
  ONGOING: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const typeStyles: Record<string, string> = {
  CONFERENCE: 'bg-indigo-100 text-indigo-700', SEMINAR: 'bg-cyan-100 text-cyan-700',
  WORKSHOP: 'bg-orange-100 text-orange-700', TRAINING: 'bg-teal-100 text-teal-700',
  LECTURE: 'bg-violet-100 text-violet-700', DEFENSE: 'bg-rose-100 text-rose-700',
  SYMPOSIUM: 'bg-fuchsia-100 text-fuchsia-700', OTHER: 'bg-slate-100 text-slate-700',
};

export default function ResearchEventsList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useResearchEvents({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, eventType: typeFilter || undefined });
  const { data: summary } = useEventSummary();
  const { data: projects } = useResearchProjects({ page: 1, limit: 100 });
  const updateStatus = useUpdateEventStatus();

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Research Events</h1>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{summary.total}</div><div className="text-xs text-slate-500">Total Events</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-emerald-600">{summary.registrationOpen}</div><div className="text-xs text-slate-500">Open for Registration</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-purple-600">{summary.ongoing}</div><div className="text-xs text-slate-500">Ongoing</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-green-600">{summary.completed}</div><div className="text-xs text-slate-500">Completed</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-blue-600">{summary.totalParticipants}</div><div className="text-xs text-slate-500">Total Participants</div></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search events..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Status</option>
            {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200">
              {data.items.map(event => (
                <div key={event.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{event.eventCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeStyles[event.eventType]}`}>{EVENT_TYPE_LABELS[event.eventType]}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[event.status]}`}>{EVENT_STATUS_LABELS[event.status]}</span>
                        {event.isVirtual && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 flex items-center gap-1"><Monitor size={10} /> Virtual</span>}
                      </div>
                      <Link to="/research-events/$id" params={{ id: event.id }} className="text-sm font-semibold text-slate-900 hover:text-blue-600 block">{event.title}</Link>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.startDate).toLocaleDateString()}</span>
                        {(event.venue || event.location) && <span className="flex items-center gap-1"><MapPin size={12} /> {event.venue || event.location}</span>}
                        {event.maxParticipants && <span>{event.currentParticipants}/{event.maxParticipants} participants</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link to="/research-events/$id" params={{ id: event.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link>
                      {canManage && event.status === 'DRAFT' && (
                        <button onClick={() => updateStatus.mutate({ id: event.id, status: 'PUBLISHED' })} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Publish</button>
                      )}
                      {canManage && event.status === 'PUBLISHED' && (
                        <button onClick={() => updateStatus.mutate({ id: event.id, status: 'REGISTRATION_OPEN' })} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Open Reg.</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        ) : <div className="p-12 text-center text-slate-500">No events found</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Research Event</h2>
            <ResearchEventForm projects={projects?.items || []} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
