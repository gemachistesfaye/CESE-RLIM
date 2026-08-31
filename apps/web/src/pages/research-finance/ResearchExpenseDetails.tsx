import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useResearchExpense, useSubmitExpense, useReviewExpense, BUDGET_CATEGORY_LABELS, EXPENSE_STATUS_LABELS } from '../../hooks/useResearchFinance';
import { useAuth } from '../../contexts/AuthContext';
import ResearchExpenseForm from '../../components/research-finance/ResearchExpenseForm';
import { ArrowLeft, Loader2, Edit, Send, CheckCircle, XCircle } from 'lucide-react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700', RECORDED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function ResearchExpenseDetails() {
  const { id } = useParams({ from: '/research-expenses/$id' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: expense, isLoading } = useResearchExpense(id);
  const submitExpense = useSubmitExpense();
  const reviewExpense = useReviewExpense();

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const isOwner = expense?.submittedBy?.userId === user?.id;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>;
  }

  if (!expense) {
    return <div className="text-center py-12 text-slate-500">Expense not found</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <button onClick={() => navigate({ to: '/research-expenses' })} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Expenses
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">{expense.expenseCode}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[expense.status]}`}>{EXPENSE_STATUS_LABELS[expense.status]}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{BUDGET_CATEGORY_LABELS[expense.category]}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{fmt(Number(expense.amount))}</h1>
            <p className="text-slate-600 text-sm mt-1">{expense.description}</p>
          </div>
          <div className="flex gap-2">
            {expense.status === 'DRAFT' && (canManage || isOwner) && (
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Edit size={14} /> Edit
              </button>
            )}
            {expense.status === 'DRAFT' && isOwner && (
              <button onClick={() => submitExpense.mutate(id)} disabled={submitExpense.isPending} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                <Send size={14} /> Submit
              </button>
            )}
            {canManage && (expense.status === 'SUBMITTED' || expense.status === 'UNDER_REVIEW') && (
              <>
                <button onClick={() => reviewExpense.mutate({ id, status: 'APPROVED' })} disabled={reviewExpense.isPending} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => { if (rejectReason) reviewExpense.mutate({ id, status: 'REJECTED', rejectionReason: rejectReason }); }} disabled={reviewExpense.isPending || !rejectReason} className="flex items-center gap-2 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
          </div>
        </div>

        {canManage && (expense.status === 'SUBMITTED' || expense.status === 'UNDER_REVIEW') && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason (required if rejecting)</label>
            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Enter reason for rejection..." />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div><div className="text-xs text-slate-400">Category</div><div className="text-sm font-medium text-slate-900">{BUDGET_CATEGORY_LABELS[expense.category]}</div></div>
          <div><div className="text-xs text-slate-400">Expense Date</div><div className="text-sm font-medium text-slate-900">{new Date(expense.expenseDate).toLocaleDateString()}</div></div>
          <div><div className="text-xs text-slate-400">Vendor</div><div className="text-sm font-medium text-slate-900">{expense.vendor || 'N/A'}</div></div>
          <div><div className="text-xs text-slate-400">Reference #</div><div className="text-sm font-medium text-slate-900">{expense.referenceNumber || 'N/A'}</div></div>
          <div><div className="text-xs text-slate-400">Submitted By</div><div className="text-sm font-medium text-slate-900">{expense.submittedBy?.user?.firstName} {expense.submittedBy?.user?.lastName}</div></div>
          <div><div className="text-xs text-slate-400">Created</div><div className="text-sm font-medium text-slate-900">{new Date(expense.createdAt).toLocaleDateString()}</div></div>
        </div>

        {expense.approvedBy && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Approved By</div>
            <div className="text-sm font-medium text-slate-900">{expense.approvedBy.firstName} {expense.approvedBy.lastName}</div>
            {expense.approvedAt && <div className="text-xs text-slate-500 mt-1">{new Date(expense.approvedAt).toLocaleString()}</div>}
          </div>
        )}

        {expense.rejectionReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-400 mb-1">Rejection Reason</div>
            <div className="text-sm text-red-700">{expense.rejectionReason}</div>
          </div>
        )}

        {expense.notes && (
          <div className="mb-4"><h3 className="text-sm font-semibold text-slate-900 mb-1">Notes</h3><p className="text-sm text-slate-600">{expense.notes}</p></div>
        )}
      </div>

      {expense.researchGrant && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Linked Grant</h3>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500">{expense.researchGrant.grantNumber}</span>
            <span className="text-sm text-slate-600">Budget: {fmt(Number(expense.researchGrant.awardedAmount))}</span>
            <span className="text-sm text-slate-600">Spent: {fmt(Number(expense.researchGrant.spentAmount))}</span>
          </div>
        </div>
      )}

      {expense.researchProject && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Linked Project</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{expense.researchProject.projectCode}</span>
            <span className="text-sm text-slate-700">{expense.researchProject.title}</span>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Expense</h2>
            <ResearchExpenseForm initialData={expense} onSuccess={() => setShowEdit(false)} onCancel={() => setShowEdit(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
