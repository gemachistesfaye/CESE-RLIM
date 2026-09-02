import { useState, useRef } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useResearchProject, useUpdateResearchProjectStatus } from "../../hooks/useResearchProjects";
import { useProjectTeamSummary } from "../../hooks/useResearchProjectMembers";
import { useResearchPublicationSummary } from "../../hooks/useResearchPublications";
import { useGrantApplicationsByProject } from "../../hooks/useGrantApplications";
import { useResearchGrantsByProject } from "../../hooks/useResearchGrants";
import { useEthicsApplicationsByProject, ETHICS_APPLICATION_STATUS_LABELS } from "../../hooks/useEthics";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Edit,
  Loader2,
  FlaskConical,
  Calendar,
  Wrench,
  Microscope,
  Clock,
  Users,
  ChevronRight,
  FileText,
  BookOpen,
  Award,
  Shield,
  ClipboardList,
  Target,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ResearchProjectForm from "../../components/research-projects/ResearchProjectForm";
import ProjectActivitiesList from "../project-activities/ProjectActivitiesList";
import ResearchMilestonesList from "../research-milestones/ResearchMilestonesList";
import ResearchReportsList from "../research-reports/ResearchReportsList";
import ResearchDocumentsList from "../research-documents/ResearchDocumentsList";
import ResearchPublicationForm from "../../components/research-publications/ResearchPublicationForm";
import GrantApplicationForm from "../../components/grant-applications/GrantApplicationForm";
import EthicsApplicationForm from "../../components/ethics/EthicsApplicationForm";
import { useFundingOpportunities } from "../../hooks/useFundingOpportunities";
import ProjectTeamList from "../../components/research-project-members/ProjectTeamList";
import { PrintableProjectReport } from "../../components/print/PrintableProjectReport";
import { useReactToPrint } from "react-to-print";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function ResearchProjectDetails() {
  const { id } = useParams({ from: "/app/research-projects/$id" });
  const { data: project, isLoading, error } = useResearchProject(id);
  const { data: teamSummary } = useProjectTeamSummary(id);
  const { data: pubSummary } = useResearchPublicationSummary(id);
  const { data: projectApps } = useGrantApplicationsByProject(id);
  const { data: projectGrants } = useResearchGrantsByProject(id);
  const { data: projectEthicsApps } = useEthicsApplicationsByProject(id);
  const { data: opportunitiesData } = useFundingOpportunities({ page: 1, limit: 100 });
  const { user } = useAuth();
  const updateStatus = useUpdateResearchProjectStatus();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPubModalOpen, setIsPubModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isEthicsModalOpen, setIsEthicsModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ status: string } | null>(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Project_${project?.projectCode || 'Draft'}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print { html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  const validTransitions: Record<string, string[]> = {
    ACTIVE: ["COMPLETED", "ON_HOLD", "CANCELLED"],
    ON_HOLD: ["ACTIVE", "CANCELLED"],
  };

  const nextStatuses = validTransitions[project?.projectStatus || ""] || [];

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast("success", `Project status changed to ${newStatus.replace("_", " ")}`);
          setStatusDialog(null);
        },
        onError: () => toast("error", "Failed to update status"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load project details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/research-projects" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Details</h1>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200 bg-white shadow-sm rounded-lg">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: FlaskConical },
          { id: 'TEAM', label: 'Team', icon: Users },
          { id: 'ACTIVITIES', label: 'Activities', icon: ClipboardList },
          { id: 'MILESTONES', label: 'Milestones', icon: Target },
          { id: 'REPORTS', label: 'Reports', icon: FileText },
          { id: 'DOCUMENTS', label: 'Documents', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FlaskConical size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                      {project.projectCode}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[project.projectStatus]}`}>
                      {project.projectStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print PDF
                </button>
                {canManage && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-blue-500" size={20} />
                <span className="text-sm font-medium text-slate-600">Team</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{teamSummary?.totalMembers || 0}</div>
              <div className="text-xs text-slate-500">members</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-amber-500" size={20} />
                <span className="text-sm font-medium text-slate-600">Publications</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{pubSummary?.total || 0}</div>
              <div className="text-xs text-slate-500">total</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award className="text-emerald-500" size={20} />
                <span className="text-sm font-medium text-slate-600">Grants</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{projectGrants?.length || 0}</div>
              <div className="text-xs text-slate-500">active</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-violet-500" size={20} />
                <span className="text-sm font-medium text-slate-600">Ethics</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{projectEthicsApps?.length || 0}</div>
              <div className="text-xs text-slate-500">applications</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="text-blue-500" size={20} />
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Description</h3>
              </div>
              <p className="text-sm text-slate-600">{project.description || 'No description provided.'}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-blue-500" size={20} />
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Timeline</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Start Date</span>
                  <span className="text-sm font-medium text-slate-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">End Date</span>
                  <span className="text-sm font-medium text-slate-900">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Created</span>
                  <span className="text-sm font-medium text-slate-900">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TEAM' && (
        <ProjectTeamList projectId={id} />
      )}
      {activeTab === 'ACTIVITIES' && (
        <ProjectActivitiesList projectId={id} />
      )}
      {activeTab === 'MILESTONES' && (
        <ResearchMilestonesList projectId={id} />
      )}
      {activeTab === 'REPORTS' && (
        <ResearchReportsList projectId={id} />
      )}
      {activeTab === 'DOCUMENTS' && (
        <ResearchDocumentsList projectId={id} />
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Research Project</h2>
            <ResearchProjectForm
              initialData={project}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {statusDialog && (
        <ConfirmDialog
          open={true}
          title={`${statusDialog.status === "CANCELLED" ? "Cancel" : "Update"} Project?`}
          message={`Are you sure you want to ${statusDialog.status === "CANCELLED" ? "cancel" : "change the status of"} this project to ${statusDialog.status.replace("_", " ")}?`}
          confirmLabel={statusDialog.status === "CANCELLED" ? "Cancel Project" : "Confirm"}
          variant={statusDialog.status === "CANCELLED" ? "danger" : "warning"}
          onConfirm={() => handleStatusChange(statusDialog.status)}
          onCancel={() => setStatusDialog(null)}
        />
      )}

      {isPubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Publication</h2>
            <ResearchPublicationForm
              initialProjectId={id}
              projects={[{ id: project.id, projectCode: project.projectCode, title: project.title }]}
              onSuccess={() => setIsPubModalOpen(false)}
              onCancel={() => setIsPubModalOpen(false)}
            />
          </div>
        </div>
      )}

      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Grant Application</h2>
            <GrantApplicationForm
              initialProjectId={id}
              opportunities={opportunitiesData?.items || []}
              projects={[{ id: project.id, projectCode: project.projectCode, title: project.title }]}
              onSuccess={() => setIsGrantModalOpen(false)}
              onCancel={() => setIsGrantModalOpen(false)}
            />
          </div>
        </div>
      )}

      {isEthicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Ethics Application</h2>
            <EthicsApplicationForm
              initialProjectId={id}
              projects={[{ id: project.id, projectCode: project.projectCode, title: project.title }]}
              onSuccess={() => setIsEthicsModalOpen(false)}
              onCancel={() => setIsEthicsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Hidden printable component - positioned off-screen for react-to-print */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        <PrintableProjectReport ref={componentRef} project={project} teamSummary={teamSummary} />
      </div>
    </div>
  );
}
