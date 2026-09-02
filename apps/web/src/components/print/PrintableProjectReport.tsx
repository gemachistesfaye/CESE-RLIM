import React from 'react';
import printableLogo from '../../assets/printable-logo.jpeg';

const NAVY = '#1B2A4A';
const BORDER = '#d0d0d0';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', COMPLETED: 'Completed', ON_HOLD: 'On Hold', CANCELLED: 'Cancelled',
};

interface PrintableProjectReportProps {
  project: any;
  teamSummary?: any;
}

export const PrintableProjectReport = React.forwardRef(
  ({ project, teamSummary }: PrintableProjectReportProps, ref: React.Ref<HTMLDivElement>) => {
    if (!project) return null;

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
          RESEARCH PROJECT REPORT
        </div>

        {/* METADATA TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', width: '18%', background: '#f7f7f7' }}>Project Title:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, width: '32%' }} colSpan={3}>{project.title}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Project Code:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{project.projectCode}</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Status:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{STATUS_LABELS[project.projectStatus]}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Start Date:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>End Date:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Date Generated:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>{new Date().toLocaleDateString()}</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}`, fontWeight: 'bold', background: '#f7f7f7' }}>Department:</td>
              <td style={{ padding: '7px 10px', border: `1px solid ${BORDER}` }}>Center of Excellence (CESE)</td>
            </tr>
          </tbody>
        </table>

        {/* DESCRIPTION */}
        {project.description && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold' }}>
              PROJECT DESCRIPTION
            </div>
            <div style={{ padding: '12px', fontSize: '12pt', lineHeight: '1.5' }}>
              {project.description}
            </div>
          </div>
        )}

        {/* TEAM SUMMARY */}
        {teamSummary && teamSummary.totalMembers > 0 && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: NAVY, color: '#fff', padding: '8px 12px', fontSize: '12pt', fontWeight: 'bold' }}>
              TEAM SUMMARY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold' }}>Total Members</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{teamSummary.totalMembers}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold' }}>Active</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{teamSummary.activeMembers}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold' }}>Principal Investigators</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{teamSummary.byRole?.PRINCIPAL_INVESTIGATOR || 0}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontWeight: 'bold' }}>Researchers</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{teamSummary.byRole?.RESEARCHER || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* SIGNATURES */}
        <div style={{ display: 'flex', gap: '80px', paddingLeft: '20px', paddingRight: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Project Lead (Name & Sign)</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', marginTop: '40px' }}>
            <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: '8px' }} />
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Coordinator (Name & Sign)</div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `2.5px solid ${NAVY}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontStyle: 'italic', fontSize: '10.5pt', color: NAVY }}>
            CESE Research Project Document
          </div>
          <div style={{ fontSize: '10.5pt', color: '#555' }}>Page 1 of 1</div>
        </div>
      </div>
    );
  }
);

PrintableProjectReport.displayName = 'PrintableProjectReport';
