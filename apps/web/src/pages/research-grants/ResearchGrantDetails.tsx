import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useResearchGrant, useUpdateResearchGrantStatus, useUpdateGrantSpending, GRANT_STATUS_LABELS } from "../../hooks/useResearchGrants";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ArrowLeft, Loader2, DollarSign, Calendar, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700", ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700", SUSPENDED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

const validTransitions: Record<string, string[]> = {
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'SUSPENDED', 'CANCELLED'],
  ON_HOLD: ['ACTIVE', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED'],
};

export default function ResearchGrantDetails() {
  const { id } = useParams({ from: "/app/research-grants/$id" });
  const { data: grant, isLoading, error } = useResearchGrant(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const updateStatus = useUpdateResearchGrantStatus();
  const updateSpending = useUpdateGrantSpending();

  const [statusDialog, setStatusDialog] = useState<string | null>(null);
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendNotes, setSpendNotes] = useState('');

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  if (isLoading) return <div className="p-6 flex items-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>;
  if (error || !grant) return <div className="p-6"><p className="text-red-500">Unable to load grant.</p></div>;

  const remaining = grant.awardedAmount - grant.spentAmount;
  const utilization = grant.awardedAmount > 0 ? Math.round((grant.spentAmount / grant.awardedAmount) * 100) : 0;
  const nextStatuses = validTransitions[grant.status] || [];

  const handleSpending = () => {
    const amt = parseFloat(spendAmount);
    if (isNaN(amt) || amt <= 0) { toast('error', 'Invalid amount'); return; }
    if (grant.spentAmount + amt > grant.awardedAmount) { toast('error', 'Spending would exceed awarded amount'); return; }
    updateSpending.mutate({ id, spentAmount: grant.spentAmount + amt, notes: spendNotes || undefined }, {
      onSuccess: () => { toast('success', 'Spending updated'); setSpendingOpen(false); setSpendAmount(''); setSpendNotes(''); },
      onError: () => toast('error', 'Failed to update spending'),
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/research-grants" className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-900">Research Grant</h1></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><DollarSign size={28} /></div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 font-mono">{grant.grantNumber}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[grant.status]}`}>{GRANT_STATUS_LABELS[grant.status]}</span>
              <span className="text-sm text-slate-500">Created by {grant.createdBy.firstName} {grant.createdBy.lastName}</span>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {nextStatuses.length > 0 && (
                <select value="" onChange={e => { if (e.target.value) setStatusDialog(e.target.value); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="">Change Status...</option>
                  {nextStatuses.map(s => <option key={s} value={s}>{GRANT_STATUS_LABELS[s]}</option>)}
                </select>
              )}
              <button onClick={() => setSpendingOpen(true)} className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100"><DollarSign size={16} /> Update Spending</button>
            </div>
          )}
        </div>

        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Budget Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4"><div className="text-2xl font-bold text-emerald-700">{fmt(grant.awardedAmount)}</div><div className="text-xs text-emerald-600">Awarded Amount</div></div>
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-4"><div className="text-2xl font-bold text-amber-700">{fmt(grant.spentAmount)}</div><div className="text-xs text-amber-600">Spent Amount</div></div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4"><div className="text-2xl font-bold text-blue-700">{fmt(remaining)}</div><div className="text-xs text-blue-600">Remaining</div></div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-700">{utilization}%</div><div className="text-xs text-slate-500">Utilization</div></div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Grant Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><FileText className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Application</div><Link to="/grant-applications/$id" params={{ id: grant.applicationId }} className="text-sm text-blue-600 hover:underline">{grant.application?.title}</Link></div></div>
              {grant.researchProject && <div className="flex items-start gap-3"><FileText className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Project</div><Link to="/research-projects/$id" params={{ id: grant.researchProjectId! }} className="text-sm text-blue-600 hover:underline">{grant.researchProject.projectCode} - {grant.researchProject.title}</Link></div></div>}
              {grant.principalInvestigator && <div className="flex items-start gap-3"><FileText className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Principal Investigator</div><div className="text-sm text-slate-600">{grant.principalInvestigator.user.firstName} {grant.principalInvestigator.user.lastName}</div></div></div>}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><Calendar className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Start Date</div><div className="text-sm text-slate-600">{new Date(grant.startDate).toLocaleDateString()}</div></div></div>
              <div className="flex items-start gap-3"><Calendar className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">End Date</div><div className="text-sm text-slate-600">{new Date(grant.endDate).toLocaleDateString()}</div></div></div>
            </div>
            {grant.notes && (
              <div className="mt-4"><h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Notes</h3><p className="text-sm text-slate-600 whitespace-pre-line">{grant.notes}</p></div>
            )}
          </div>
        </div>
      </div>

      {statusDialog && (
        <ConfirmDialog open={true} title="Change Grant Status?" message={`Change status to ${GRANT_STATUS_LABELS[statusDialog]}?`} confirmLabel="Confirm" variant="warning" onConfirm={() => { updateStatus.mutate({ id, status: statusDialog }, { onSuccess: () => { toast('success', 'Status updated'); setStatusDialog(null); }, onError: () => toast('error', 'Failed') }); }} onCancel={() => setStatusDialog(null)} />
      )}

      {spendingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Update Spending</h2>
            <p className="text-sm text-slate-500 mb-4">Current spent: {fmt(grant.spentAmount)} / {fmt(grant.awardedAmount)}</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Additional Spending Amount</label><input type="number" step="0.01" value={spendAmount} onChange={e => setSpendAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0.00" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={spendNotes} onChange={e => setSpendNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setSpendingOpen(false); setSpendAmount(''); setSpendNotes(''); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSpending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
