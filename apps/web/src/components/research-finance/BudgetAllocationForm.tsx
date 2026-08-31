import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BUDGET_CATEGORY_LABELS, useCreateBudgetAllocation, useUpdateBudgetAllocation } from '../../hooks/useResearchFinance';
import { useToast } from '../ui/Toast';

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  allocatedAmount: z.string().min(1, 'Amount is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function BudgetAllocationForm({
  grantId, initialData, existingCategories, onSuccess, onCancel,
}: {
  grantId: string;
  initialData?: { id: string; category: string; allocatedAmount: number; description: string | null };
  existingCategories?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initialData;
  const createAllocation = useCreateBudgetAllocation();
  const updateAllocation = useUpdateBudgetAllocation();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      category: initialData.category,
      allocatedAmount: String(initialData.allocatedAmount),
      description: initialData.description || '',
    } : {},
  });

  const availableCategories = Object.entries(BUDGET_CATEGORY_LABELS).filter(
    ([k]) => !existingCategories?.includes(k) || (initialData && initialData.category === k)
  );

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && initialData) {
        await updateAllocation.mutateAsync({ id: initialData.id, ...data });
        toast('success', 'Allocation updated');
      } else {
        await createAllocation.mutateAsync({ researchGrantId: grantId, ...data });
        toast('success', 'Allocation created');
      }
      onSuccess();
    } catch { toast('error', 'Something went wrong'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
        <select {...register('category')} disabled={isEdit} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100">
          <option value="">Select category</option>
          {availableCategories.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Allocated Amount *</label>
        <input type="number" step="0.01" {...register('allocatedAmount')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.allocatedAmount && <p className="text-red-500 text-xs mt-1">{errors.allocatedAmount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea {...register('description')} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
