import { useState, useRef } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useResearchReport, useUpdateResearchReport, useSubmitReport, useSubmitReportForReview, useDeleteResearchReport } from '../../hooks/useResearchReports';
import { useResearchers } from '../../hooks/useResearchers';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ArrowLeft, Edit, Loader2, FileText, User, Send, CircleCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ResearchReportForm } from '../../components/research-reports/ResearchReportForm';
import { ReportStatusWorkflow } from '../../components/research-reports/ReportStatusWorkflow';
import { PrintableReport } from '../../components/print/PrintableReport';
import { useReactToPrint } from 'react-to-print';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved',
  REVISION_REQUIRED: 'Revision Required', REJECTED: 'Rejected', RESUBMITTED: 'Resubmitted', WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-700', REJECTED: 'bg-red-100 text-red-700',
  RESUBMITTED: 'bg-purple-100 text-purple-700', WITHDRAWN: 'bg-slate-100 text-slate-500',
};

const TYPE_LABELS: Record<string, string> = {
  PROGRESS: 'Progress', INTERIM: 'Interim', FINAL: 'Final', TECHNICAL: 'Technical', FINANCIAL: 'Financial', ANNUAL: 'Annual',
};

export default function ResearchReportDetails() {
  const { id } = useParams({ from: '/app/research-reports/$id' });
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showAssignReviewer, setShowAssignReviewer] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState('');

  const { data: report, isLoading, error, refetch } = useResearchReport(id);
  const updateReport = useUpdateResearchReport();
  const submitReport = useSubmitReport();
  const submitForReview = useSubmitReportForReview();
  const deleteReport = useDeleteResearchReport();
  const { data: researchers } = useResearchers({ page: 1, limit: 100 });

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Research_Report_${report?.reportCode || 'Draft'}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  const handleUpdate = async (formData: any) => {
    await updateReport.mutateAsync({ id, payload: formData });
    setIsEditing(false);
    refetch();
  };

  const handleSubmit = async () => {
    await submitReport.mutateAsync(id);
    setShowSubmitConfirm(false);
    refetch();
  };

  const handleSubmitForReview = async () => {
    if (!selectedReviewer) return;
    await submitForReview.mutateAsync({ id, reviewerId: selectedReviewer });
    setShowAssignReviewer(false);
    setSelectedReviewer('');
    refetch();
  };

  const handleDelete = async () => {
    await deleteReport.mutateAsync(id);
    toast('success', 'Report deleted');
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>;
  if (error) return <div className="p-6 text-center"><div className="text-red-500">Error loading report</div></div>;
  if (!report) return null;

  const isDraft = report.status === 'DRAFT' || report.status === 'REVISION_REQUIRED';
  const canEdit = canManage || (user?.role === 'RESEARCHER' && isDraft);

  const toFormData = () => ({
    title: report.title,
    reportType: report.reportType,
    reportingPeriodStart: report.reportingPeriodStart?.split('T')[0] || undefined,
    reportingPeriodEnd: report.reportingPeriodEnd?.split('T')[0] || undefined,
    reportContent: report.reportContent || undefined,
    fileUrl: report.fileUrl || undefined,
    nextPeriodPlan: report.nextPeriodPlan || undefined,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/research-reports" className="p-2 hover:bg-slate-200 rounded-full transition-colors inline-flex"><ArrowLeft size={20} /></Link>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><FileText size={28} /></div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{report.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                  {STATUS_LABELS[report.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{TYPE_LABELS[report.reportType]}</span>
                <span className="text-xs font-mono text-slate-400">{report.reportCode}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print PDF
            </button>
            {canEdit && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Edit size={16} /> Edit
              </button>
            )}
            {isDraft && canEdit && (
              <button onClick={() => setShowSubmitConfirm(true)} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                <Send size={16} /> Submit
              </button>
            )}
            {isDraft && canManage && (
              <button onClick={() => setShowAssignReviewer(true)} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <CircleCheck size={16} /> Assign Reviewer
              </button>
            )}
            {canManage && (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Delete</button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="p-6">
            <ResearchReportForm onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} initialData={toFormData()} isLoading={updateReport.isPending} />
          </div>
        ) : (
          <>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Project</h3>
                <Link to="/research-projects/$id" params={{ id: report.researchProjectId }} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                  <FileText size={18} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{report.researchProject.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{report.researchProject.projectCode}</div>
                  </div>
                </Link>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Report Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Author</div>
                    <div className="text-sm font-medium text-slate-900">{report.submittedBy.user.firstName} {report.submittedBy.user.lastName}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Submitted</div>
                    <div className="text-sm font-medium text-slate-900">{report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status</h3>
              <ReportStatusWorkflow reportId={id} currentStatus={report.status} onStatusChange={refetch} />
            </div>

            {report.reportContent && (
              <div className="p-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Report Content</h3>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">{report.reportContent}</div>
              </div>
            )}

            {report.nextPeriodPlan && (
              <div className="p-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Next Period Plan</h3>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">{report.nextPeriodPlan}</div>
              </div>
            )}

            {report.reviewer && (
              <div className="p-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Reviewer</h3>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <User size={18} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{report.reviewer.firstName} {report.reviewer.lastName}</div>
                    <div className="text-xs text-slate-500">{report.reviewer.email}</div>
                  </div>
                </div>
                {report.reviewComment && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">{report.reviewComment}</div>
                )}
              </div>
            )}

            <div className="p-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Created {new Date(report.createdAt).toLocaleDateString()} | Updated {new Date(report.updatedAt).toLocaleDateString()}
            </div>
          </>
        )}
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Submit Report</h3>
            <p className="text-slate-600 mb-4">Are you sure you want to submit this report? Once submitted, it will be sent for review.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSubmitConfirm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSubmit} disabled={submitReport.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitReport.isPending ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignReviewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Assign Reviewer</h3>
            <p className="text-slate-600 mb-4">Select a coordinator or admin to review this report.</p>
            <select value={selectedReviewer} onChange={(e) => setSelectedReviewer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select reviewer...</option>
              {researchers?.items?.map((r: any) => <option key={r.userId} value={r.userId}>{r.user.firstName} {r.user.lastName}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAssignReviewer(false); setSelectedReviewer(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSubmitForReview} disabled={!selectedReviewer || submitForReview.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitForReview.isPending ? 'Assigning...' : 'Assign & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Report" message="Are you sure you want to delete this report? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}

      {/* Hidden printable component - positioned off-screen for react-to-print */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        <PrintableReport ref={componentRef} report={report} />
      </div>
    </div>
  );
}
