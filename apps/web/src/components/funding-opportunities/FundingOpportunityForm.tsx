import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateFundingOpportunity, useUpdateFundingOpportunity, FUNDING_TYPE_LABELS, type FundingOpportunity } from '../../hooks/useFundingOpportunities';
import { useToast } from '../ui/Toast';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  organization: z.string().min(1, 'Organization is required'),
  description: z.string().optional(),
  fundingType: z.string().min(1, 'Funding type is required'),
  minimumAmount: z.coerce.number().optional(),
  maximumAmount: z.coerce.number().optional(),
  applicationDeadline: z.string().optional(),
  eligibilityCriteria: z.string().optional(),
  applicationUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function FundingOpportunityForm({
  initialData, onSuccess, onCancel,
}: {
  initialData?: FundingOpportunity;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const create = useCreateFundingOpportunity();
  const update = useUpdateFundingOpportunity();
  const isEdit = !!initialData;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      title: initialData.title,
      organization: initialData.organization,
      description: initialData.description || '',
      fundingType: initialData.fundingType,
      minimumAmount: initialData.minimumAmount ?? undefined,
      maximumAmount: initialData.maximumAmount ?? undefined,
      applicationDeadline: initialData.applicationDeadline ? new Date(initialData.applicationDeadline).toISOString().slice(0, 16) : '',
      eligibilityCriteria: initialData.eligibilityCriteria || '',
      applicationUrl: initialData.applicationUrl || '',
    } : { fundingType: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && initialData) {
        await update.mutateAsync({ id: initialData.id, payload: {
          ...data, applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : undefined,
          applicationUrl: data.applicationUrl || undefined,
        }});
        toast('success', 'Opportunity updated successfully');
      } else {
        await create.mutateAsync({
          ...data, applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : undefined,
          applicationUrl: data.applicationUrl || undefined,
        });
        toast('success', 'Opportunity created successfully');
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
        <input {...register('title')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Organization *</label>
        <input {...register('organization')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.organization && <p className="text-red-500 text-xs mt-1">{errors.organization.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Funding Type *</label>
        <select {...register('fundingType')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select type</option>
          {Object.entries(FUNDING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {errors.fundingType && <p className="text-red-500 text-xs mt-1">{errors.fundingType.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Min Amount</label>
          <input type="number" step="0.01" {...register('minimumAmount')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max Amount</label>
          <input type="number" step="0.01" {...register('maximumAmount')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
        <input type="datetime-local" {...register('applicationDeadline')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility Criteria</label>
        <textarea {...register('eligibilityCriteria')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Application URL</label>
        <input {...register('applicationUrl')} placeholder="https://..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.applicationUrl && <p className="text-red-500 text-xs mt-1">{errors.applicationUrl.message}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
