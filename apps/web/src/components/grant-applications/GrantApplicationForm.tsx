import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type GrantApplication, useCreateGrantApplication, useUpdateGrantApplication } from '../../hooks/useGrantApplications';
import { useToast } from '../ui/Toast';

const schema = z.object({
  opportunityId: z.string().min(1, 'Opportunity is required'),
  title: z.string().min(1, 'Title is required'),
  requestedAmount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  proposalSummary: z.string().min(10, 'Proposal summary must be at least 10 characters'),
  researchProjectId: z.string().optional(),
});

type GrantApplicationFormData = z.infer<typeof schema>;

export default function GrantApplicationForm({
  initialData, initialProjectId, opportunities, projects, onSuccess, onCancel,
}: {
  initialData?: GrantApplication;
  initialProjectId?: string;
  opportunities: Array<{ id: string; title: string; organization: string }>;
  projects: Array<{ id: string; projectCode: string; title: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initialData;
  const createApp = useCreateGrantApplication();
  const updateApp = useUpdateGrantApplication();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GrantApplicationFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      opportunityId: initialData.opportunityId,
      title: initialData.title,
      requestedAmount: initialData.requestedAmount,
      proposalSummary: initialData.proposalSummary,
    } : {
      researchProjectId: initialProjectId || '',
    },
  });

  const onSubmit = async (data: GrantApplicationFormData) => {
    try {
      const payload = { ...data, researchProjectId: data.researchProjectId || undefined };
      if (isEdit && initialData) {
        await updateApp.mutateAsync({ id: initialData.id, payload });
        toast('success', 'Application updated');
      } else {
        await createApp.mutateAsync(payload);
        toast('success', 'Application created');
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong';
      toast('error', msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Funding Opportunity *</label>
        <select {...register('opportunityId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isEdit}>
          <option value="">Select opportunity</option>
          {opportunities.map(o => <option key={o.id} value={o.id}>{o.title} ({o.organization})</option>)}
        </select>
        {errors.opportunityId && <p className="text-red-500 text-xs mt-1">{errors.opportunityId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Application Title *</label>
        <input {...register('title')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Requested Amount *</label>
        <input type="number" step="0.01" {...register('requestedAmount')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.requestedAmount && <p className="text-red-500 text-xs mt-1">{errors.requestedAmount.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Research Project (optional)</label>
        <select {...register('researchProjectId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Proposal Summary *</label>
        <textarea {...register('proposalSummary')} rows={5} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.proposalSummary && <p className="text-red-500 text-xs mt-1">{errors.proposalSummary.message}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
