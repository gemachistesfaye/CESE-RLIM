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

interface PrintableGrantReportProps {
  grant: any;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const NAVY = '#1B2A4A';
const LIGHT_GREEN = '#f0f5f0';
const BORDER = '#d0d0d0';

export const PrintableGrantReport = React.forwardRef(
  ({ grant }: PrintableGrantReportProps, ref: React.Ref<HTMLDivElement>) => {
    if (!grant) return null;

    const piName = grant.principalInvestigator?.user
      ? `${grant.principalInvestigator.user.firstName} ${grant.principalInvestigator.user.lastName}`
      : 'Not Assigned';
      
    const createdByName = grant.createdBy
      ? `${grant.createdBy.firstName} ${grant.createdBy.lastName}`
      : '';

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
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
          RESEARCH GRANT REPORT
        </div>

        {/* ============ METADATA TABLE ============ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', width: '18%', background: '#f7f7f7' }}>Grant Number:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, width: '32%', fontWeight: '600' }}>
                {grant.grantNumber}
              </td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', width: '18%', background: '#f7f7f7' }}>Status:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, width: '32%' }}>
                {grant.status.replace('_', ' ')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Start Date:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>
                {new Date(grant.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>End Date:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>
                {new Date(grant.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Date Generated:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Generated By:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>
                {createdByName}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ============ TWO COLUMNS ============ */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {/* LEFT: Financial Metrics */}
          <div style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <IconChart /> FINANCIAL METRICS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
              <tbody>
                <tr style={{ background: LIGHT_GREEN }}>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold' }}>Awarded Amount</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right', fontWeight: '600' }}>{fmt(Number(grant.awardedAmount))}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold' }}>Total Spent</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right', fontWeight: '600', color: '#c53030' }}>{fmt(Number(grant.spentAmount))}</td>
                </tr>
                <tr style={{ background: '#e4efe4' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '12.5pt' }}>REMAINING BUDGET</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13pt', color: NAVY }}>{fmt(Number(grant.awardedAmount) - Number(grant.spentAmount))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT: Linked Entities */}
          <div style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <IconLink /> LINKED PROJECT & PI
            </div>
            <div style={{ padding: '10px 12px', fontSize: '12pt' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Research Project:</span>
                <span style={{ marginLeft: '12px' }}>{grant.researchProject ? grant.researchProject.projectCode : 'Not linked'}</span>
                {grant.researchProject && (
                  <div style={{ fontStyle: 'italic', color: '#555', fontSize: '10.5pt', marginTop: '4px', lineHeight: '1.4' }}>{grant.researchProject.title}</div>
                )}
              </div>
              <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '10px' }} />
              <div>
                <span style={{ fontWeight: 'bold' }}>Principal Investigator:</span>
                <div style={{ marginTop: '4px' }}>{piName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ GRANT APPLICATION SUMMARY ============ */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <IconDoc /> APPLICATION DETAILS
          </div>
          <div style={{ padding: '12px 12px', fontSize: '12pt', minHeight: '80px', lineHeight: '1.5' }}>
            {grant.application ? (
              <>
                <strong>Title:</strong> {grant.application.title}<br/><br/>
                <strong>Requested Amount:</strong> {fmt(Number(grant.application.requestedAmount))}
              </>
            ) : (
              'No linked application details.'
            )}
          </div>
        </div>

        {/* ===== SPACER ===== */}
        <div style={{ flex: 1 }} />

        {/* ============ REMARK / ADDITIONAL NOTES ============ */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ background: '#fafafa', color: NAVY, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <IconEdit /> NOTES
          </div>
          <div style={{ padding: '16px 12px 10px 12px' }}>
            {grant.notes ? (
               <div style={{ fontSize: '12pt', lineHeight: '1.5', minHeight: '60px' }}>{grant.notes}</div>
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
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Principal Investigator (Sign)</div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#555', marginTop: '4px' }}>{piName}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Research Administrator (Sign)</div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#555', marginTop: '4px', minHeight: '18px' }}>
               {createdByName}
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

PrintableGrantReport.displayName = 'PrintableGrantReport';
