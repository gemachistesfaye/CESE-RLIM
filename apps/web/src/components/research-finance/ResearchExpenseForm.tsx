import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ResearchExpense, BUDGET_CATEGORY_LABELS, useCreateResearchExpense, useUpdateResearchExpense } from '../../hooks/useResearchFinance';
import { useToast } from '../ui/Toast';

const schema = z.object({
  researchGrantId: z.string().min(1, 'Grant is required'),
  researchProjectId: z.string().optional(),
  budgetAllocationId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  vendor: z.string().optional(),
  referenceNumber: z.string().optional(),
  receiptDocumentId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ResearchExpenseForm({
  initialData, grants, allocations, projects: _projects, onSuccess, onCancel,
}: {
  initialData?: ResearchExpense;
  grants?: Array<{ id: string; grantNumber: string; awardedAmount: number }>;
  allocations?: Array<{ id: string; category: string; allocatedAmount: number }>;
  projects?: Array<{ id: string; projectCode: string; title: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initialData;
  const createExpense = useCreateResearchExpense();
  const updateExpense = useUpdateResearchExpense();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      researchGrantId: initialData.researchGrantId,
      researchProjectId: initialData.researchProjectId || '',
      budgetAllocationId: initialData.budgetAllocationId || '',
      category: initialData.category,
      description: initialData.description,
      amount: String(initialData.amount),
      expenseDate: initialData.expenseDate.slice(0, 10),
      vendor: initialData.vendor || '',
      referenceNumber: initialData.referenceNumber || '',
      receiptDocumentId: initialData.receiptDocumentId || '',
      notes: initialData.notes || '',
    } : {},
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && initialData) {
        await updateExpense.mutateAsync({ id: initialData.id, ...data });
        toast('success', 'Expense updated');
      } else {
        await createExpense.mutateAsync(data);
        toast('success', 'Expense created');
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong';
      toast('error', msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!initialData && grants && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grant *</label>
          <select {...register('researchGrantId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select grant</option>
            {grants.map(g => <option key={g.id} value={g.id}>{g.grantNumber}</option>)}
          </select>
          {errors.researchGrantId && <p className="text-red-500 text-xs mt-1">{errors.researchGrantId.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select {...register('category')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select category</option>
            {Object.entries(BUDGET_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
          <input type="number" step="0.01" {...register('amount')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
        <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date *</label>
          <input type="date" {...register('expenseDate')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.expenseDate && <p className="text-red-500 text-xs mt-1">{errors.expenseDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
          <input {...register('vendor')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
          <input {...register('referenceNumber')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Budget Allocation</label>
          <select {...register('budgetAllocationId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">None</option>
            {allocations?.map(a => <option key={a.id} value={a.id}>{BUDGET_CATEGORY_LABELS[a.category]} - ${a.allocatedAmount.toLocaleString()}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
