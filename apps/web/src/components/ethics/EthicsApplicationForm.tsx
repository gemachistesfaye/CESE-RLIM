import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type EthicsApplication } from '../../hooks/useEthics';
import { useToast } from '../ui/Toast';

const schema = z.object({
  researchProjectId: z.string().min(1, 'Research project is required'),
  title: z.string().min(1, 'Title is required'),
  researchSummary: z.string().min(10, 'Research summary must be at least 10 characters'),
  methodology: z.string().optional(),
  participantDetails: z.string().optional(),
  riskAssessment: z.string().optional(),
  benefitStatement: z.string().optional(),
  dataProtectionPlan: z.string().optional(),
  consentProcess: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EthicsApplicationForm({
  initialData, projects, onSuccess, onCancel,
}: {
  initialData?: EthicsApplication;
  projects: Array<{ id: string; projectCode: string; title: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initialData;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      researchProjectId: initialData.researchProjectId,
      title: initialData.title,
      researchSummary: initialData.researchSummary,
      methodology: initialData.methodology || '',
      participantDetails: initialData.participantDetails || '',
      riskAssessment: initialData.riskAssessment || '',
      benefitStatement: initialData.benefitStatement || '',
      dataProtectionPlan: initialData.dataProtectionPlan || '',
      consentProcess: initialData.consentProcess || '',
    } : {},
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { apiClient } = await import('../../lib/api');
      if (isEdit && initialData) {
        await apiClient.patch(`/ethics/applications/${initialData.id}`, data);
        toast('success', 'Application updated');
      } else {
        await apiClient.post('/ethics/applications', data);
        toast('success', 'Application created');
      }
      onSuccess();
    } catch { toast('error', 'Something went wrong'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Research Project *</label>
        <select {...register('researchProjectId')} disabled={isEdit} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100">
          <option value="">Select project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
        </select>
        {errors.researchProjectId && <p className="text-red-500 text-xs mt-1">{errors.researchProjectId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Application Title *</label>
        <input {...register('title')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Research Summary *</label>
        <textarea {...register('researchSummary')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.researchSummary && <p className="text-red-500 text-xs mt-1">{errors.researchSummary.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Methodology</label>
        <textarea {...register('methodology')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Participant Details</label>
        <textarea {...register('participantDetails')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Risk Assessment</label>
          <textarea {...register('riskAssessment')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Benefit Statement</label>
          <textarea {...register('benefitStatement')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Data Protection Plan</label>
        <textarea {...register('dataProtectionPlan')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Consent Process</label>
        <textarea {...register('consentProcess')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
