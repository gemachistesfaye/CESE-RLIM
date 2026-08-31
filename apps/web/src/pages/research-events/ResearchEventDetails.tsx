import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useResearchEvent, useUpdateEventStatus, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '../../hooks/useResearchEvents';
import { useRegisterForEvent, useCancelEventRegistration, useUpdateParticipationStatus, PARTICIPATION_STATUS_LABELS } from '../../hooks/useEventParticipations';
import { useAuth } from '../../contexts/AuthContext';
import ResearchEventForm from '../../components/research-events/ResearchEventForm';
import { ArrowLeft, Calendar, MapPin, Monitor, Users, Clock, Edit, Loader2 } from 'lucide-react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', PUBLISHED: 'bg-blue-100 text-blue-700',
  REGISTRATION_OPEN: 'bg-emerald-100 text-emerald-700', REGISTRATION_CLOSED: 'bg-amber-100 text-amber-700',
  ONGOING: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const participationStatusStyles: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-emerald-100 text-emerald-700',
  ATTENDED: 'bg-green-100 text-green-700', CANCELLED: 'bg-slate-100 text-slate-500',
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
  const { id } = useParams({ from: '/research-events/$id' });
  const navigate = useNavigate();
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
    <div className="max-w-4xl space-y-6">
      <button onClick={() => navigate({ to: '/research-events' })} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Events
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">{event.eventCode}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[event.status]}`}>{EVENT_STATUS_LABELS[event.status]}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{EVENT_TYPE_LABELS[event.eventType]}</span>
              {event.isVirtual && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 flex items-center gap-1"><Monitor size={10} /> Virtual</span>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
          </div>
          {canManage && (
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Edit size={14} /> Edit
            </button>
          )}
        </div>

        {event.description && <p className="text-slate-600 text-sm mb-4">{event.description}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar size={16} className="text-slate-400" /><div><div className="text-xs text-slate-400">Start</div><div>{new Date(event.startDate).toLocaleString()}</div></div></div>
          <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar size={16} className="text-slate-400" /><div><div className="text-xs text-slate-400">End</div><div>{new Date(event.endDate).toLocaleString()}</div></div></div>
          {event.registrationDeadline && <div className="flex items-center gap-2 text-sm text-slate-600"><Clock size={16} className="text-slate-400" /><div><div className="text-xs text-slate-400">Registration Deadline</div><div>{new Date(event.registrationDeadline).toLocaleString()}</div></div></div>}
          {event.maxParticipants && <div className="flex items-center gap-2 text-sm text-slate-600"><Users size={16} className="text-slate-400" /><div><div className="text-xs text-slate-400">Capacity</div><div>{event.currentParticipants}/{event.maxParticipants}</div></div></div>}
        </div>

        {(event.venue || event.location) && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4"><MapPin size={16} className="text-slate-400" /><span>{[event.venue, event.location].filter(Boolean).join(', ')}</span></div>
        )}

        {event.meetingUrl && <div className="text-sm text-slate-600 mb-4"><span className="text-slate-400">Meeting URL:</span> <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{event.meetingUrl}</a></div>}

        {event.objectives && <div className="mb-4"><h3 className="text-sm font-semibold text-slate-900 mb-1">Objectives</h3><p className="text-sm text-slate-600">{event.objectives}</p></div>}
        {event.eligibility && <div className="mb-4"><h3 className="text-sm font-semibold text-slate-900 mb-1">Eligibility</h3><p className="text-sm text-slate-600">{event.eligibility}</p></div>}
        {event.requirements && <div className="mb-4"><h3 className="text-sm font-semibold text-slate-900 mb-1">Requirements</h3><p className="text-sm text-slate-600">{event.requirements}</p></div>}

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Created by {event.createdBy.firstName} {event.createdBy.lastName}</span>
          <span>|</span>
          <span>{new Date(event.createdAt).toLocaleDateString()}</span>
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
