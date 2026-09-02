import React from 'react';
import printableLogo from '../../assets/printable-logo.jpeg';

/* Small inline SVG icons for print (no emoji) */
const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
    <rect x="3" y="12" width="4" height="9" /><rect x="10" y="7" width="4" height="14" /><rect x="17" y="3" width="4" height="18" />
  </svg>
);
const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IconDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

interface PrintableGrantApplicationReportProps {
  application: any;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const NAVY = '#1B2A4A';
const LIGHT_GREEN = '#f0f5f0';
const BORDER = '#d0d0d0';

export const PrintableGrantApplicationReport = React.forwardRef(
  ({ application }: PrintableGrantApplicationReportProps, ref: React.Ref<HTMLDivElement>) => {
    if (!application) return null;

    const applicantName = application.applicant?.user
      ? `${application.applicant.user.firstName} ${application.applicant.user.lastName}`
      : '';
      
    const reviewerName = application.reviewedBy
      ? `${application.reviewedBy.firstName} ${application.reviewedBy.lastName}`
      : '';

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm', /* Allow flowing to next page for large text */
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
        {/* ============ HEADER ============ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <img src={printableLogo} alt="ASTU" style={{ height: '70px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: 'bold', lineHeight: '1.4' }}>
            <div>Center of Excellence for</div>
            <div>Electrical Systems and Electronics (CESE)</div>
          </div>
        </div>
        <div style={{ borderBottom: `3px solid ${NAVY}`, marginBottom: '14px' }} />

        {/* ============ TITLE ============ */}
        <div style={{ textAlign: 'center', fontSize: '18pt', fontWeight: 'bold', marginBottom: '14px', letterSpacing: '1px' }}>
          GRANT APPLICATION REPORT
        </div>

        {/* ============ METADATA TABLE ============ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', width: '18%', background: '#f7f7f7' }}>Application ID:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, width: '32%', fontWeight: '600' }}>
                {application.id.substring(0, 8)}
              </td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', width: '18%', background: '#f7f7f7' }}>Status:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, width: '32%' }}>
                {application.status.replace('_', ' ')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Date Submitted:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>
                {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not submitted'}
              </td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Date Generated:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ============ TWO COLUMNS ============ */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {/* LEFT: Financials & Applicant */}
          <div style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <IconChart /> REQUEST & APPLICANT
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
              <tbody>
                <tr style={{ background: LIGHT_GREEN }}>
                  <td style={{ padding: '6px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold', width: '30%' }}>Applicant</td>
                  <td style={{ padding: '6px 12px', borderBottom: `1px solid ${BORDER}` }}>{applicantName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 12px', borderBottom: `1px solid ${BORDER}` }}>Email</td>
                  <td style={{ padding: '6px 12px', borderBottom: `1px solid ${BORDER}` }}>{application.applicant?.user?.email || 'N/A'}</td>
                </tr>
                <tr style={{ background: '#e4efe4' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '12pt' }}>REQUESTED AMOUNT</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13pt', color: NAVY }}>{fmt(Number(application.requestedAmount))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT: Funding Opportunity */}
          <div style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <IconLink /> FUNDING OPPORTUNITY
            </div>
            <div style={{ padding: '10px 12px', fontSize: '12pt' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Opportunity:</span>
                <div style={{ marginTop: '4px', lineHeight: '1.4' }}>{application.opportunity?.title || 'N/A'}</div>
              </div>
              <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '10px' }} />
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Organization:</span>
                <span style={{ marginLeft: '12px' }}>{application.opportunity?.organization || 'N/A'}</span>
              </div>
              <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '10px' }} />
              <div>
                <span style={{ fontWeight: 'bold' }}>Funding Type:</span>
                <span style={{ marginLeft: '12px' }}>{application.opportunity?.fundingType || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ PROPOSAL SUMMARY ============ */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <IconDoc /> PROPOSAL SUMMARY
          </div>
          <div style={{ padding: '12px 12px', fontSize: '12pt', minHeight: '120px', lineHeight: '1.5' }}>
            <strong>Title:</strong> {application.title}<br/><br/>
            {application.proposalSummary || 'No summary provided.'}
          </div>
        </div>

        {/* ===== SPACER ===== */}
        <div style={{ flex: 1 }} />

        {/* ============ REMARK / ADDITIONAL NOTES ============ */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <IconEdit /> REVIEWER REMARKS
          </div>
          <div style={{ padding: '16px 12px 10px 12px' }}>
            {application.reviewComment ? (
               <div style={{ fontSize: '12pt', lineHeight: '1.5', minHeight: '60px' }}>{application.reviewComment}</div>
            ) : (
               <>
                <div style={{ borderBottom: '1px dashed #bbb', marginBottom: '20px' }} />
                <div style={{ borderBottom: '1px dashed #bbb', marginBottom: '20px' }} />
                <div style={{ borderBottom: '1px dashed #bbb', marginBottom: '12px' }} />
               </>
            )}
          </div>
        </div>

        {/* ============ SIGNATURES ============ */}
        <div style={{ display: 'flex', gap: '80px', paddingLeft: '20px', paddingRight: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Applicant (Name & Sign)</div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#555', marginTop: '4px' }}>{applicantName}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Reviewer (Name & Sign)</div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#555', marginTop: '4px', minHeight: '18px' }}>
              {application.status === 'APPROVED' || application.status === 'REJECTED' ? reviewerName : '(Pending)'}
            </div>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div style={{ borderTop: `2.5px solid ${NAVY}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontStyle: 'italic', fontSize: '10.5pt', color: NAVY }}>
            CESE Research Finance Document
          </div>
          <div style={{ fontSize: '10.5pt', color: '#555' }}>Grant Administration</div>
        </div>
      </div>
    );
  }
);

PrintableGrantApplicationReport.displayName = 'PrintableGrantApplicationReport';
