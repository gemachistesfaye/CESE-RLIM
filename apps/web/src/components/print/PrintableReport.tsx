import React from 'react';
import printableLogo from '../../assets/printable-logo.jpeg';

const NAVY = '#1B2A4A';
const BORDER = '#d0d0d0';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved',
  REVISION_REQUIRED: 'Revision Required', REJECTED: 'Rejected', RESUBMITTED: 'Resubmitted', WITHDRAWN: 'Withdrawn',
};

const TYPE_LABELS: Record<string, string> = {
  PROGRESS: 'Progress', INTERIM: 'Interim', FINAL: 'Final', TECHNICAL: 'Technical', FINANCIAL: 'Financial', ANNUAL: 'Annual',
};

interface PrintableReportProps {
  report: any;
}

export const PrintableReport = React.forwardRef(
  ({ report }: PrintableReportProps, ref: React.Ref<HTMLDivElement>) => {
    if (!report) return null;

    const authorName = report.submittedBy?.user
      ? `${report.submittedBy.user.firstName} ${report.submittedBy.user.lastName}`
      : '';

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          overflow: 'hidden',
          padding: '14mm 16mm 10mm 16mm',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '12pt',
          color: '#000',
          background: '#fff',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <img src={printableLogo} alt="ASTU" style={{ height: '70px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: 'bold', lineHeight: '1.4' }}>
            <div>Center of Excellence for</div>
            <div>Electrical Systems and Electronics (CESE)</div>
          </div>
        </div>
        <div style={{ borderBottom: `3px solid ${NAVY}`, marginBottom: '14px' }} />

        {/* TITLE */}
        <div style={{ textAlign: 'center', fontSize: '18pt', fontWeight: 'bold', marginBottom: '14px', letterSpacing: '1px' }}>
          RESEARCH REPORT
        </div>

        {/* METADATA TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', width: '18%', background: '#f7f7f7' }}>Report Title:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, width: '32%' }} colSpan={3}>{report.title}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Report Code:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{report.reportCode}</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Report Type:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{TYPE_LABELS[report.reportType]}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Status:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{STATUS_LABELS[report.status]}</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Date Generated:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Author:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{authorName}</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Submitted:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* PROJECT INFO */}
        {report.researchProject && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold' }}>
              LINKED PROJECT
            </div>
            <div style={{ padding: '10px 12px', fontSize: '12pt' }}>
              <span style={{ fontWeight: 'bold' }}>Project Code:</span> {report.researchProject.projectCode}
              <div style={{ fontStyle: 'italic', color: '#555', fontSize: '10.5pt', marginTop: '4px' }}>{report.researchProject.title}</div>
            </div>
          </div>
        )}

        {/* REPORT CONTENT */}
        {report.reportContent && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold' }}>
              REPORT CONTENT
            </div>
            <div style={{ padding: '12px', fontSize: '12pt', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {report.reportContent}
            </div>
          </div>
        )}

        {/* NEXT PERIOD PLAN */}
        {report.nextPeriodPlan && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold' }}>
              NEXT PERIOD PLAN
            </div>
            <div style={{ padding: '12px', fontSize: '12pt', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {report.nextPeriodPlan}
            </div>
          </div>
        )}

        {/* REVIEWER */}
        {report.reviewer && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold' }}>
              REVIEWER
            </div>
            <div style={{ padding: '10px 12px', fontSize: '12pt' }}>
              <span style={{ fontWeight: 'bold' }}>Name:</span> {report.reviewer.firstName} {report.reviewer.lastName}
              <div style={{ fontSize: '10.5pt', color: '#555', marginTop: '2px' }}>{report.reviewer.email}</div>
              {report.reviewComment && (
                <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '11pt' }}>
                  {report.reviewComment}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* SIGNATURES */}
        <div style={{ display: 'flex', gap: '80px', paddingLeft: '20px', paddingRight: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Prepared by (Name & Sign)</div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#555', marginTop: '4px' }}>{authorName}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Reviewed by (Name & Sign)</div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#555', marginTop: '4px', minHeight: '18px' }}>
              {report.reviewer ? `${report.reviewer.firstName} ${report.reviewer.lastName}` : ''}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `2.5px solid ${NAVY}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontStyle: 'italic', fontSize: '10.5pt', color: NAVY }}>
            CESE Research Document
          </div>
          <div style={{ fontSize: '10.5pt', color: '#555' }}>Page 1 of 1</div>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';
