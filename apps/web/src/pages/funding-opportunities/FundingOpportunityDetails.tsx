import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useFundingOpportunity, useUpdateFundingOpportunityStatus, FUNDING_TYPE_LABELS, FUNDING_OPPORTUNITY_STATUS_LABELS } from "../../hooks/useFundingOpportunities";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ArrowLeft, Edit, Loader2, Building2, DollarSign, Calendar, ExternalLink, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import FundingOpportunityForm from "../../components/funding-opportunities/FundingOpportunityForm";

const statusStyles: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700", CLOSED: "bg-slate-100 text-slate-700",
  UPCOMING: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-700",
};

export default function FundingOpportunityDetails() {
  const { id } = useParams({ from: "/app/funding-opportunities/$id" });
  const { data: opp, isLoading, error } = useFundingOpportunity(id);
  const { user } = useAuth();
  const updateStatus = useUpdateFundingOpportunityStatus();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<string | null>(null);
  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus }, {
      onSuccess: () => { toast("success", `Status changed to ${FUNDING_OPPORTUNITY_STATUS_LABELS[newStatus]}`); setStatusDialog(null); },
      onError: () => toast("error", "Failed to update status"),
    });
  };

  if (isLoading) return <div className="p-6 flex items-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>;
  if (error || !opp) return <div className="p-6"><p className="text-red-500">Unable to load opportunity.</p></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/funding-opportunities" className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-900">Funding Opportunity</h1></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Building2 size={28} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{opp.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-600">{opp.organization}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{FUNDING_TYPE_LABELS[opp.fundingType]}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[opp.status]}`}>{FUNDING_OPPORTUNITY_STATUS_LABELS[opp.status]}</span>
              </div>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-3">
              <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"><Edit size={16} /> Edit</button>
              <select value={opp.status} onChange={e => setStatusDialog(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                {Object.entries(FUNDING_OPPORTUNITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{opp.description || "No description provided."}</p>
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Funding Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3"><DollarSign className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Amount Range</div><div className="text-sm text-slate-500">{opp.minimumAmount != null || opp.maximumAmount != null ? `${opp.minimumAmount?.toLocaleString() || '0'} - ${opp.maximumAmount?.toLocaleString() || '∞'}` : "Not specified"}</div></div></div>
              <div className="flex items-start gap-3"><Calendar className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Application Deadline</div><div className="text-sm text-slate-500">{opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleString() : "Not set"}</div></div></div>
              {opp.applicationUrl && <div className="flex items-start gap-3"><ExternalLink className="text-slate-400 mt-0.5" size={18} /><div><div className="text-sm font-medium text-slate-900">Application URL</div><a href={opp.applicationUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">{opp.applicationUrl}</a></div></div>}
            </div>
          </div>
        </div>

        {opp.eligibilityCriteria && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Shield size={16} /> Eligibility Criteria</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{opp.eligibilityCriteria}</p>
          </div>
        )}

        <div className="p-6 border-t border-slate-200 text-xs text-slate-400">
          Created {new Date(opp.createdAt).toLocaleDateString()} · Updated {new Date(opp.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Opportunity</h2>
            <FundingOpportunityForm initialData={opp} onSuccess={() => setIsEditOpen(false)} onCancel={() => setIsEditOpen(false)} />
          </div>
        </div>
      )}

      {statusDialog && (
        <ConfirmDialog open={true} title="Change Status?" message={`Change status to ${FUNDING_OPPORTUNITY_STATUS_LABELS[statusDialog]}?`} confirmLabel="Confirm" variant="warning" onConfirm={() => handleStatusChange(statusDialog)} onCancel={() => setStatusDialog(null)} />
      )}
    </div>
  );
}
