import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ResearchGrant, GRANT_STATUS_LABELS } from '../../hooks/useResearchGrants';
import { useToast } from '../ui/Toast';

const schema = z.object({
  grantNumber: z.string().min(1, 'Grant number is required'),
  applicationId: z.string().min(1, 'Application is required'),
  researchProjectId: z.string().optional(),
  principalInvestigatorId: z.string().optional(),
  awardedAmount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ResearchGrantForm({
  initialData, applications, projects, researchers, onSuccess, onCancel,
}: {
  initialData?: ResearchGrant;
  applications: Array<{ id: string; title: string; applicant: { user: { firstName: string; lastName: string } } }>;
  projects: Array<{ id: string; projectCode: string; title: string }>;
  researchers: Array<{ id: string; user: { firstName: string; lastName: string; email: string } }>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initialData;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      grantNumber: initialData.grantNumber,
      applicationId: initialData.applicationId,
      researchProjectId: initialData.researchProjectId || '',
      principalInvestigatorId: initialData.principalInvestigatorId || '',
      awardedAmount: initialData.awardedAmount,
      startDate: initialData.startDate.slice(0, 10),
      endDate: initialData.endDate.slice(0, 10),
      status: initialData.status,
      notes: initialData.notes || '',
    } : { status: 'ACTIVE' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { apiClient } = await import('../../lib/api');
      const payload = { ...data, researchProjectId: data.researchProjectId || undefined, principalInvestigatorId: data.principalInvestigatorId || undefined, notes: data.notes || undefined };
      if (isEdit && initialData) {
        await apiClient.patch(`/research-grants/${initialData.id}`, payload);
        toast('success', 'Grant updated');
      } else {
        await apiClient.post('/research-grants', payload);
        toast('success', 'Grant created');
      }
      onSuccess();
    } catch { toast('error', 'Something went wrong'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Grant Number *</label>
        <input {...register('grantNumber')} disabled={isEdit} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" />
        {errors.grantNumber && <p className="text-red-500 text-xs mt-1">{errors.grantNumber.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Approved Application *</label>
        <select {...register('applicationId')} disabled={isEdit} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100">
          <option value="">Select application</option>
          {applications.map(a => <option key={a.id} value={a.id}>{a.title} ({a.applicant.user.firstName} {a.applicant.user.lastName})</option>)}
        </select>
        {errors.applicationId && <p className="text-red-500 text-xs mt-1">{errors.applicationId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Research Project</label>
          <select {...register('researchProjectId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Principal Investigator</label>
          <select {...register('principalInvestigatorId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">None</option>
            {researchers.map(r => <option key={r.id} value={r.id}>{r.user.firstName} {r.user.lastName}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Awarded Amount *</label>
        <input type="number" step="0.01" {...register('awardedAmount')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        {errors.awardedAmount && <p className="text-red-500 text-xs mt-1">{errors.awardedAmount.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label><input type="date" {...register('startDate')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label><input type="date" {...register('endDate')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
      </div>
      {isEdit && (
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select {...register('status')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            {Object.entries(GRANT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
      )}
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
