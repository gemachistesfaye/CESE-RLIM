import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMyEventParticipations, PARTICIPATION_STATUS_LABELS } from '../../hooks/useEventParticipations';
import { useCancelEventRegistration } from '../../hooks/useEventParticipations';
import { EVENT_TYPE_LABELS } from '../../hooks/useResearchEvents';
import { Calendar, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

const participationStatusStyles: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-emerald-100 text-emerald-700',
  ATTENDED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-slate-100 text-slate-500',
  NO_SHOW: 'bg-red-100 text-red-700',
};

export default function MyEvents() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useMyEventParticipations({ page, limit: 20, status: statusFilter || undefined });
  const cancelRegistration = useCancelEventRegistration();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Calendar size={24} className="text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">My Events</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Status</option>
            {Object.entries(PARTICIPATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200">
              {data.items.map(participation => (
                <div key={participation.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${participationStatusStyles[participation.status]}`}>{PARTICIPATION_STATUS_LABELS[participation.status]}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{EVENT_TYPE_LABELS[participation.event?.eventType || '']}</span>
                      </div>
                      <Link to="/research-events/$id" params={{ id: participation.eventId }} className="text-sm font-semibold text-slate-900 hover:text-blue-600 block">{participation.event?.title}</Link>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        {participation.event?.startDate && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(participation.event.startDate).toLocaleDateString()}</span>}
                        {participation.event?.venue && <span>{participation.event.venue}</span>}
                        <span>Registered: {new Date(participation.registeredAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {participation.status === 'REGISTERED' && (
                      <button onClick={() => cancelRegistration.mutate(participation.id)} disabled={cancelRegistration.isPending}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"><X size={12} /> Cancel</button>
                    )}
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
        ) : <div className="p-12 text-center text-slate-500">No event registrations found</div>}
      </div>
    </div>
  );
}
