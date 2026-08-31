import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjectMembers } from '../../hooks/useResearchProjects';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  milestoneOrder: z.number().int().min(0).default(0),
  plannedStartDate: z.string().optional(),
  plannedDueDate: z.string().optional(),
  responsibleMemberId: z.string().optional(),
  notes: z.string().optional(),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

interface ResearchMilestoneFormProps {
  projectId: string;
  onSubmit: (data: MilestoneFormData) => void;
  onCancel: () => void;
  initialData?: Partial<MilestoneFormData>;
  isLoading?: boolean;
}

export function ResearchMilestoneForm({ projectId, onSubmit, onCancel, initialData, isLoading }: ResearchMilestoneFormProps) {
  const { data: members = [] } = useProjectMembers(projectId);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: { milestoneOrder: 0, ...initialData },
  });

  useEffect(() => {
    if (initialData) Object.entries(initialData).forEach(([k, v]) => { if (v !== undefined) setValue(k as any, v); });
  }, [initialData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
        <input {...register('title')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
          <input type="number" {...register('milestoneOrder', { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Planned Start</label>
          <input type="date" {...register('plannedStartDate')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Planned Due</label>
          <input type="date" {...register('plannedDueDate')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Member</label>
        <select {...register('responsibleMemberId')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">None</option>
          {members.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.researcher?.user?.firstName} {m.researcher?.user?.lastName} ({m.role})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">{isLoading ? 'Saving...' : 'Save Milestone'}</button>
      </div>
    </form>
  );
}
