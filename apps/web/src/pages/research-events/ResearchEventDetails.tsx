import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { useResearchEvent, useUpdateEventStatus, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '../../hooks/useResearchEvents';
import { useRegisterForEvent, useCancelEventRegistration, PARTICIPATION_STATUS_LABELS } from '../../hooks/useEventParticipations';
import { useAuth } from '../../contexts/AuthContext';
import ResearchEventForm from '../../components/research-events/ResearchEventForm';
import { ArrowLeft, Calendar, MapPin, Monitor, Users, Clock, Edit, Loader2 } from 'lucide-react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', PUBLISHED: 'bg-blue-100 text-blue-700',
  REGISTRATION_OPEN: 'bg-emerald-100 text-emerald-700', REGISTRATION_CLOSED: 'bg-amber-100 text-amber-700',
  ONGOING: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const participationStatusStyles: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-emerald-100 text-emerald-700',
  ATTENDED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-slate-100 text-slate-500',
  NO_SHOW: 'bg-red-100 text-red-700',
};

const statusTransitions: Record<string, Array<{ status: string; label: string }>> = {
  DRAFT: [{ status: 'PUBLISHED', label: 'Publish' }],
  PUBLISHED: [{ status: 'REGISTRATION_OPEN', label: 'Open Registration' }],
  REGISTRATION_OPEN: [{ status: 'REGISTRATION_CLOSED', label: 'Close Registration' }],
  REGISTRATION_CLOSED: [{ status: 'ONGOING', label: 'Start Event' }],
  ONGOING: [{ status: 'COMPLETED', label: 'Complete Event' }],
};

export default function ResearchEventDetails() {
  const { id } = useParams({ from: '/app/research-events/$id' });
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  const { data: event, isLoading } = useResearchEvent(id);
  const updateStatus = useUpdateEventStatus();
  const registerForEvent = useRegisterForEvent();
  const cancelRegistration = useCancelEventRegistration();

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const isRegistered = event?.participations?.some(p => p.researcher.userId === user?.id && p.status !== 'CANCELLED');

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>;
  }

  if (!event) {
    return <div className="text-center py-12 text-slate-500">Event not found</div>;
  }

  const transitions = statusTransitions[event.status] || [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/research-events" className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-900">Research Event</h1></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Calendar size={28} /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500">{event.eventCode}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[event.status]}`}>{EVENT_STATUS_LABELS[event.status]}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{EVENT_TYPE_LABELS[event.eventType]}</span>
              {event.isVirtual && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 flex items-center gap-1"><Monitor size={10} /> Virtual</span>}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
          </div>
          {canManage && (
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Edit size={16} /> Edit
            </button>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Event Details</h3>
            {event.description && <p className="text-sm text-slate-600">{event.description}</p>}
            <div className="space-y-3">
              <div className="flex items-start gap-3"><Calendar className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Start Date</div><div className="text-sm text-slate-600">{new Date(event.startDate).toLocaleString()}</div></div></div>
              <div className="flex items-start gap-3"><Calendar className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">End Date</div><div className="text-sm text-slate-600">{new Date(event.endDate).toLocaleString()}</div></div></div>
              {event.registrationDeadline && <div className="flex items-start gap-3"><Clock className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Registration Deadline</div><div className="text-sm text-slate-600">{new Date(event.registrationDeadline).toLocaleString()}</div></div></div>}
              {event.maxParticipants && <div className="flex items-start gap-3"><Users className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Capacity</div><div className="text-sm text-slate-600">{event.currentParticipants}/{event.maxParticipants}</div></div></div>}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Additional Information</h3>
            <div className="space-y-3">
              {(event.venue || event.location) && <div className="flex items-start gap-3"><MapPin className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Location</div><div className="text-sm text-slate-600">{[event.venue, event.location].filter(Boolean).join(', ')}</div></div></div>}
              {event.meetingUrl && <div className="flex items-start gap-3"><Monitor className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Meeting URL</div><a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{event.meetingUrl}</a></div></div>}
            </div>
            {event.objectives && <div className="mt-4"><h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Objectives</h3><p className="text-sm text-slate-600">{event.objectives}</p></div>}
            {event.eligibility && <div className="mt-4"><h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Eligibility</h3><p className="text-sm text-slate-600">{event.eligibility}</p></div>}
            {event.requirements && <div className="mt-4"><h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Requirements</h3><p className="text-sm text-slate-600">{event.requirements}</p></div>}
          </div>
        </div>
      </div>

      {event.researchProject && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Linked Research Project</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{event.researchProject.projectCode}</span>
            <span className="text-sm text-slate-700">{event.researchProject.title}</span>
          </div>
        </div>
      )}

      {(canManage || isRegistered) && transitions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Status Actions</h3>
          <div className="flex flex-wrap gap-2">
            {transitions.map(t => (
              <button key={t.status} onClick={() => updateStatus.mutate({ id: event.id, status: t.status })} disabled={updateStatus.isPending}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{t.label}</button>
            ))}
            {!canManage && event.status === 'REGISTRATION_OPEN' && !isRegistered && (
              <button onClick={() => registerForEvent.mutate({ eventId: event.id })} disabled={registerForEvent.isPending}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Register</button>
            )}
            {!canManage && isRegistered && event.status !== 'CANCELLED' && (
              <button onClick={() => cancelRegistration.mutate(event.participations.find(p => p.researcher.userId === user?.id && p.status !== 'CANCELLED')?.id || '')} disabled={cancelRegistration.isPending}
                className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">Cancel Registration</button>
            )}
          </div>
        </div>
      )}

      {event.participations && event.participations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Participants ({event.participations.length})</h3>
          <div className="space-y-2">
            {event.participations.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="text-sm text-slate-900">{p.researcher.user.firstName} {p.researcher.user.lastName}</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${participationStatusStyles[p.status]}`}>{PARTICIPATION_STATUS_LABELS[p.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Event</h2>
            <ResearchEventForm initialData={event} onSuccess={() => setShowEdit(false)} onCancel={() => setShowEdit(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
