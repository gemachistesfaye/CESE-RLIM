import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useGrantApplication, useSubmitGrantApplication, useReviewGrantApplication, useWithdrawGrantApplication, GRANT_APPLICATION_STATUS_LABELS } from "../../hooks/useGrantApplications";
import { useFundingOpportunities } from "../../hooks/useFundingOpportunities";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { useToast } from "../../components/ui/Toast";
import { ArrowLeft, Edit, Loader2, Send, CheckCircle, XCircle, X, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import GrantApplicationForm from "../../components/grant-applications/GrantApplicationForm";
import { PrintableGrantApplicationReport } from "../../components/print/PrintableGrantApplicationReport";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700", APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700", WITHDRAWN: "bg-orange-100 text-orange-700",
};

export default function GrantApplicationDetails() {
  const { id } = useParams({ from: "/app/grant-applications/$id" });
  const { data: app, isLoading, error } = useGrantApplication(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const submitApp = useSubmitGrantApplication();
  const withdrawApp = useWithdrawGrantApplication();
  const reviewApp = useReviewGrantApplication();
  const { data: opps } = useFundingOpportunities({ page: 1, limit: 100 });
  const { data: projs } = useResearchProjects({ page: 1, limit: 100 });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const isOwner = app?.applicant?.userId === user?.id;
  const formatAmount = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Grant_Application_${app?.id?.substring(0, 8) || 'Draft'}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  if (isLoading) return <div className="p-6 flex items-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>;
  if (error || !app) return <div className="p-6"><p className="text-red-500">Unable to load application.</p></div>;

  const handleReview = () => {
    if (!reviewDialog) return;
    if (reviewDialog === 'REJECT' && !reviewComment.trim()) { toast('error', 'Rejection requires a comment'); return; }
    reviewApp.mutate({ id, decision: reviewDialog, reviewComment: reviewComment || undefined }, {
      onSuccess: () => { toast('success', `Application ${reviewDialog === 'APPROVE' ? 'approved' : 'rejected'}`); setReviewDialog(null); setReviewComment(''); },
      onError: () => toast('error', 'Review failed'),
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/grant-applications" className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-900">Grant Application</h1></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><FileText size={28} /></div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{app.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[app.status]}`}>{GRANT_APPLICATION_STATUS_LABELS[app.status]}</span>
              <span className="text-sm text-slate-500">by {app.applicant?.user?.firstName} {app.applicant?.user?.lastName}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print PDF
            </button>
            {app.status === 'DRAFT' && isOwner && (
              <>
                <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"><Edit size={16} /> Edit</button>
                <button onClick={() => submitApp.mutate(id)} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100"><Send size={16} /> Submit</button>
              </>
            )}
            {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && isOwner && (
              <button onClick={() => withdrawApp.mutate(id)} className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100"><X size={16} /> Withdraw</button>
            )}
            {app.status === 'SUBMITTED' && canManage && (
              <>
                <button onClick={() => setReviewDialog('APPROVE')} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100"><CheckCircle size={16} /> Approve</button>
                <button onClick={() => setReviewDialog('REJECT')} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100"><XCircle size={16} /> Reject</button>
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Application Details</h3>
            <div className="space-y-3">
              <div><div className="text-xs font-medium text-slate-500 uppercase">Opportunity</div><div className="text-sm text-slate-900">{app.opportunity?.title} ({app.opportunity?.organization})</div></div>
              <div><div className="text-xs font-medium text-slate-500 uppercase">Requested Amount</div><div className="text-sm font-semibold text-slate-900">{formatAmount(app.requestedAmount)}</div></div>
              {app.researchProject && <div><div className="text-xs font-medium text-slate-500 uppercase">Project</div><Link to="/research-projects/$id" params={{ id: app.researchProjectId! }} className="text-sm text-blue-600 hover:underline">{app.researchProject.projectCode} - {app.researchProject.title}</Link></div>}
              <div><div className="text-xs font-medium text-slate-500 uppercase">Submitted</div><div className="text-sm text-slate-900">{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Not submitted'}</div></div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Proposal Summary</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{app.proposalSummary}</p>
          </div>
        </div>

        {app.reviewComment && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Review</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">{app.reviewComment}</div>
              <div className="text-xs text-slate-400 mt-2">Reviewed by {app.reviewedBy?.firstName} {app.reviewedBy?.lastName} on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''}</div>
            </div>
          </div>
        )}
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Application</h2>
            <GrantApplicationForm initialData={app} opportunities={opps?.items || []} projects={projs?.items || []} onSuccess={() => setIsEditOpen(false)} onCancel={() => setIsEditOpen(false)} />
          </div>
        </div>
      )}

      {reviewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">{reviewDialog === 'APPROVE' ? 'Approve' : 'Reject'} Application?</h2>
            <p className="text-sm text-slate-500 mb-4">{reviewDialog === 'REJECT' ? 'Please provide a reason for rejection:' : 'Are you sure you want to approve this application?'}</p>
            {reviewDialog === 'REJECT' && <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Rejection reason..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4" />}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setReviewDialog(null); setReviewComment(''); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleReview} className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${reviewDialog === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>{reviewDialog === 'APPROVE' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable component - positioned off-screen for react-to-print */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        <PrintableGrantApplicationReport ref={componentRef} application={app} />
      </div>
    </div>
  );
}
