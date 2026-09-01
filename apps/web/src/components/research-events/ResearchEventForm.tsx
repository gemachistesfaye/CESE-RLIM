import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ResearchEvent, EVENT_TYPE_LABELS, useCreateResearchEvent, useUpdateResearchEvent } from '../../hooks/useResearchEvents';
import { useToast } from '../ui/Toast';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  eventType: z.string().min(1, 'Event type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional(),
  venue: z.string().optional(),
  location: z.string().optional(),
  isVirtual: z.boolean().optional(),
  meetingUrl: z.string().optional(),
  organizer: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  maxParticipants: z.number().optional(),
  researchProjectId: z.string().optional(),
  innovationId: z.string().optional(),
  publicationId: z.string().optional(),
  objectives: z.string().optional(),
  eligibility: z.string().optional(),
  requirements: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ResearchEventForm({
  initialData, projects, innovations: _innovations, publications: _publications, onSuccess, onCancel,
}: {
  initialData?: ResearchEvent;
  projects?: Array<{ id: string; projectCode: string; title: string }>;
  innovations?: Array<{ id: string; title: string }>;
  publications?: Array<{ id: string; title: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initialData;
  const createEvent = useCreateResearchEvent();
  const updateEvent = useUpdateResearchEvent();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      eventType: initialData.eventType,
      startDate: initialData.startDate.slice(0, 16),
      endDate: initialData.endDate.slice(0, 16),
      registrationDeadline: initialData.registrationDeadline?.slice(0, 16) || '',
      venue: initialData.venue || '',
      location: initialData.location || '',
      isVirtual: initialData.isVirtual,
      meetingUrl: initialData.meetingUrl || '',
      organizer: initialData.organizer || '',
      contactEmail: initialData.contactEmail || '',
      contactPhone: initialData.contactPhone || '',
      maxParticipants: initialData.maxParticipants || undefined,
      researchProjectId: initialData.researchProjectId || '',
      innovationId: initialData.innovationId || '',
      publicationId: initialData.publicationId || '',
      objectives: initialData.objectives || '',
      eligibility: initialData.eligibility || '',
      requirements: initialData.requirements || '',
    } : { eventType: '' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = { ...data, isVirtual: data.isVirtual || false };
      if (isEdit && initialData) {
        await updateEvent.mutateAsync({ id: initialData.id, ...payload });
        toast('success', 'Event updated');
      } else {
        await createEvent.mutateAsync(payload);
        toast('success', 'Event created');
      }
      onSuccess();
    } catch { toast('error', 'Something went wrong'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Event Title *</label>
        <input {...register('title')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Type *</label>
          <select {...register('eventType')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select type</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
          <input type="number" {...register('maxParticipants', { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time *</label>
          <input type="datetime-local" {...register('startDate')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time *</label>
          <input type="datetime-local" {...register('endDate')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline</label>
        <input type="datetime-local" {...register('registrationDeadline')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
          <input {...register('venue')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input {...register('location')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" {...register('isVirtual')} id="isVirtual" className="rounded border-slate-300" />
        <label htmlFor="isVirtual" className="text-sm font-medium text-slate-700">Virtual Event</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Meeting URL</label>
        <input {...register('meetingUrl')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organizer</label>
          <input {...register('organizer')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
          <input type="email" {...register('contactEmail')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
          <input {...register('contactPhone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {projects && projects.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Linked Research Project</label>
          <select {...register('researchProjectId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Objectives</label>
        <textarea {...register('objectives')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility</label>
          <textarea {...register('eligibility')} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Requirements</label>
          <textarea {...register('requirements')} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
