import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useEthicsApplication, useSubmitEthicsApplication, useWithdrawEthicsApplication, useReviewEthicsApplication, useAssignEthicsReviewer, useRemoveEthicsReviewer, ETHICS_APPLICATION_STATUS_LABELS } from "../../hooks/useEthics";
import { useResearchers } from "../../hooks/useResearchers";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ArrowLeft, Edit, Loader2, Send, X, CheckCircle, XCircle, RefreshCw, Shield, UserPlus, Clock, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import EthicsApplicationForm from "../../components/ethics/EthicsApplicationForm";
import { PrintableEthicsReport } from "../../components/print/PrintableEthicsReport";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700", REVISION_REQUIRED: "bg-orange-100 text-orange-700",
  RESUBMITTED: "bg-purple-100 text-purple-700", APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700", WITHDRAWN: "bg-slate-100 text-slate-500",
};


export default function EthicsApplicationDetails() {
  const { id } = useParams({ from: "/app/ethics/applications/$id" });
  const { data: app, isLoading, error } = useEthicsApplication(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const submitApp = useSubmitEthicsApplication();
  const withdrawApp = useWithdrawEthicsApplication();
  const reviewApp = useReviewEthicsApplication();
  const assignReviewer = useAssignEthicsReviewer();
  const removeReviewer = useRemoveEthicsReviewer();
  const { data: researchers } = useResearchers({ page: 1, limit: 100 });
  const { data: projects } = useResearchProjects({ page: 1, limit: 100 });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<'APPROVE' | 'REJECT' | 'REQUEST_REVISION' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const isOwner = app?.applicant?.userId === user?.id;

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ethics_Application_${app?.applicationCode || 'Draft'}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  if (isLoading) return <div className="p-6 flex items-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>;
  if (error || !app) return <div className="p-6"><p className="text-red-500">Unable to load application.</p></div>;

  const handleReview = () => {
    if (!reviewDialog) return;
    if ((reviewDialog === 'REJECT' || reviewDialog === 'REQUEST_REVISION') && !reviewComment.trim()) {
      toast('error', `${reviewDialog === 'REJECT' ? 'Rejection' : 'Revision request'} requires a comment`);
      return;
    }
    reviewApp.mutate({ id, decision: reviewDialog, comment: reviewComment || undefined }, {
      onSuccess: () => { toast('success', `Application ${reviewDialog === 'APPROVE' ? 'approved' : reviewDialog === 'REJECT' ? 'rejected' : 'revision requested'}`); setReviewDialog(null); setReviewComment(''); },
      onError: () => toast('error', 'Review failed'),
    });
  };

  const handleAssign = () => {
    if (!selectedReviewer) { toast('error', 'Select a reviewer'); return; }
    assignReviewer.mutate({ id, reviewerId: selectedReviewer }, {
      onSuccess: () => { toast('success', 'Reviewer assigned'); setAssignDialog(false); setSelectedReviewer(''); },
      onError: () => toast('error', 'Failed to assign reviewer'),
    });
  };

  const handleRemoveReviewer = (reviewerId: string) => {
    removeReviewer.mutate({ id, reviewerId }, {
      onSuccess: () => toast('success', 'Reviewer removed'),
      onError: () => toast('error', 'Failed to remove reviewer'),
    });
  };

  const timeline = [
    { label: 'Created', date: app.createdAt, done: true },
    { label: 'Submitted', date: app.submittedAt, done: !!app.submittedAt },
    { label: 'Under Review', date: app.status === 'UNDER_REVIEW' ? app.updatedAt : null, done: ['UNDER_REVIEW', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED'].includes(app.status) },
    { label: 'Revision Required', date: app.status === 'REVISION_REQUIRED' ? app.reviewedAt : null, done: app.status === 'REVISION_REQUIRED' },
    { label: 'Resubmitted', date: app.status === 'RESUBMITTED' ? app.updatedAt : null, done: app.status === 'RESUBMITTED' },
    { label: app.status === 'APPROVED' ? 'Approved' : app.status === 'REJECTED' ? 'Rejected' : 'Decision', date: app.approvedAt || app.rejectedAt, done: app.status === 'APPROVED' || app.status === 'REJECTED' },
  ];

  const validApplicants = researchers?.items || [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/ethics/applications" className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600" /></Link>
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ethics Application</h1>
            <p className="text-sm text-slate-500 font-mono">{app.applicationCode}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{app.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[app.status]}`}>{ETHICS_APPLICATION_STATUS_LABELS[app.status]}</span>
              <span className="text-sm text-slate-500">by {app.applicant?.user?.firstName} {app.applicant?.user?.lastName}</span>
              <Link to="/research-projects/$id" params={{ id: app.researchProjectId }} className="text-sm text-blue-600 hover:underline">{app.researchProject?.projectCode}</Link>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print PDF
            </button>
            {app.status === 'DRAFT' && isOwner && (
              <>
                <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"><Edit size={14} /> Edit</button>
                <button onClick={() => submitApp.mutate(id)} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100"><Send size={14} /> Submit</button>
              </>
            )}
            {app.status === 'REVISION_REQUIRED' && isOwner && (
              <>
                <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"><Edit size={14} /> Edit & Resubmit</button>
                <button onClick={() => submitApp.mutate(id)} className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-100"><RefreshCw size={14} /> Resubmit</button>
              </>
            )}
            {(app.status === 'SUBMITTED' || app.status === 'REVISION_REQUIRED') && isOwner && (
              <button onClick={() => setWithdrawConfirm(true)} className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-100"><X size={14} /> Withdraw</button>
            )}
            {canManage && ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(app.status) && (
              <>
                <button onClick={() => setAssignDialog(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"><UserPlus size={14} /> Assign Reviewer</button>
                <button onClick={() => setReviewDialog('APPROVE')} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100"><CheckCircle size={14} /> Approve</button>
                <button onClick={() => setReviewDialog('REQUEST_REVISION')} className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-100"><RefreshCw size={14} /> Revision</button>
                <button onClick={() => setReviewDialog('REJECT')} className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100"><XCircle size={14} /> Reject</button>
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Research Information</h3>
            <div className="space-y-3">
              <div><div className="text-xs font-medium text-slate-500 uppercase">Research Summary</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.researchSummary}</p></div>
              {app.methodology && <div><div className="text-xs font-medium text-slate-500 uppercase">Methodology</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.methodology}</p></div>}
              {app.participantDetails && <div><div className="text-xs font-medium text-slate-500 uppercase">Participant Details</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.participantDetails}</p></div>}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Risk & Benefits</h3>
            <div className="space-y-3">
              {app.riskAssessment && <div><div className="text-xs font-medium text-slate-500 uppercase">Risk Assessment</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.riskAssessment}</p></div>}
              {app.benefitStatement && <div><div className="text-xs font-medium text-slate-500 uppercase">Benefit Statement</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.benefitStatement}</p></div>}
              {app.dataProtectionPlan && <div><div className="text-xs font-medium text-slate-500 uppercase">Data Protection</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.dataProtectionPlan}</p></div>}
              {app.consentProcess && <div><div className="text-xs font-medium text-slate-500 uppercase">Consent Process</div><p className="text-sm text-slate-600 whitespace-pre-line mt-1">{app.consentProcess}</p></div>}
            </div>
          </div>
        </div>

        {(app.reviewComment || app.revisionComment) && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Review Feedback</h3>
            {app.reviewComment && <div className="bg-slate-50 rounded-lg p-4 mb-2"><p className="text-sm text-slate-600">{app.reviewComment}</p></div>}
            {app.revisionComment && <div className="bg-amber-50 rounded-lg p-4 border border-amber-200"><p className="text-sm text-amber-800 font-medium mb-1">Revision Requirements:</p><p className="text-sm text-amber-700">{app.revisionComment}</p></div>}
          </div>
        )}

        {app.reviewers.length > 0 && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Reviewers</h3>
            <div className="space-y-2">
              {app.reviewers.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">{r.reviewer.user.firstName[0]}{r.reviewer.user.lastName[0]}</div>
                    <div><div className="text-sm font-medium text-slate-900">{r.reviewer.user.firstName} {r.reviewer.user.lastName}</div><div className="text-xs text-slate-500">Assigned by {r.assignedBy.firstName} {r.assignedBy.lastName}</div></div>
                  </div>
                  {canManage && (
                    <button onClick={() => handleRemoveReviewer(r.reviewer.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Timeline</h3>
          <div className="space-y-3">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {item.done ? <Check size={14} /> : <Clock size={14} />}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${item.done ? 'font-medium text-slate-900' : 'text-slate-400'}`}>{item.label}</span>
                  {item.date && <span className="text-xs text-slate-500 ml-2">{new Date(item.date).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Application</h2>
            <EthicsApplicationForm initialData={app} projects={projects?.items || []} onSuccess={() => setIsEditOpen(false)} onCancel={() => setIsEditOpen(false)} />
          </div>
        </div>
      )}

      {reviewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">{reviewDialog === 'APPROVE' ? 'Approve' : reviewDialog === 'REJECT' ? 'Reject' : 'Request Revision'}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {reviewDialog === 'APPROVE' ? 'Are you sure you want to approve this application?' :
               reviewDialog === 'REJECT' ? 'Provide a reason for rejection:' : 'Provide revision feedback:'}
            </p>
            {(reviewDialog === 'REJECT' || reviewDialog === 'REQUEST_REVISION') && (
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} placeholder="Comments..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4" />
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setReviewDialog(null); setReviewComment(''); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleReview} className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${reviewDialog === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : reviewDialog === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                {reviewDialog === 'APPROVE' ? 'Approve' : reviewDialog === 'REJECT' ? 'Reject' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Assign Reviewer</h2>
            <select value={selectedReviewer} onChange={e => setSelectedReviewer(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4">
              <option value="">Select reviewer</option>
              {validApplicants.filter(r => r.id !== app.applicantId).map(r => (
                <option key={r.id} value={r.id}>{r.user.firstName} {r.user.lastName}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setAssignDialog(false); setSelectedReviewer(''); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Assign</button>
            </div>
          </div>
        </div>
      )}

      {withdrawConfirm && (
        <ConfirmDialog open={withdrawConfirm} title="Withdraw Application" message="Are you sure you want to withdraw this application? This action cannot be undone." confirmLabel="Withdraw" onConfirm={() => withdrawApp.mutate(id, { onSuccess: () => setWithdrawConfirm(false) })} onCancel={() => setWithdrawConfirm(false)} />
      )}

      {/* Hidden printable component - positioned off-screen for react-to-print */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        <PrintableEthicsReport ref={componentRef} application={app} />
      </div>
    </div>
  );
}
