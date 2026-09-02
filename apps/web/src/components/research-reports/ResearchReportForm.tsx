import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  reportType: z.string().min(1, 'Report type is required'),
  reportingPeriodStart: z.string().optional(),
  reportingPeriodEnd: z.string().optional(),
  reportContent: z.string().optional(),
  fileUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  nextPeriodPlan: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ResearchReportFormProps {
  onSubmit: (data: ReportFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ReportFormData>;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export function ResearchReportForm({ onSubmit, onCancel, initialData, isLoading, isReadOnly }: ResearchReportFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (initialData) Object.entries(initialData).forEach(([k, v]) => { if (v !== undefined) setValue(k as any, v); });
  }, [initialData, setValue]);



  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input {...register('title')} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Type *</label>
          <select {...register('reportType')} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Select type...</option>
            <option value="PROGRESS">Progress Report</option>
            <option value="INTERIM">Interim Report</option>
            <option value="FINAL">Final Report</option>
            <option value="TECHNICAL">Technical Report</option>
            <option value="FINANCIAL">Financial Report</option>
            <option value="ANNUAL">Annual Report</option>
          </select>
          {errors.reportType && <p className="text-red-500 text-xs mt-1">{errors.reportType.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Period Start <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input type="date" {...register('reportingPeriodStart')} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Period End <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input type="date" {...register('reportingPeriodEnd')} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Report Content <span className="text-slate-400 font-normal">(Optional)</span></label>
        <textarea {...register('reportContent')} rows={8} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Attachment File URL <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input type="text" placeholder="https://..." {...register('fileUrl')} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
          {errors.fileUrl && <p className="text-red-500 text-xs mt-1">{errors.fileUrl.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Next Period Plan <span className="text-slate-400 font-normal">(Optional)</span></label>
          <textarea {...register('nextPeriodPlan')} rows={2} disabled={isReadOnly} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Saving...' : 'Save Report'}</button>
        </div>
      )}
    </form>
  );
}
