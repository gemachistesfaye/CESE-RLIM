import { useState } from "react";
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
        {['OVERVIEW', 'TEAM', 'ACTIVITIES', 'MILESTONES', 'REPORTS', 'DOCUMENTS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
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
            {canManage && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {canManage && nextStatuses.length > 0 && (
              <>
                {nextStatuses.includes("ACTIVE") && (
                  <button
                    onClick={() => setStatusDialog({ status: "ACTIVE" })}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Resume
                  </button>
                )}
                {nextStatuses.includes("COMPLETED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "COMPLETED" })}
                    className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {nextStatuses.includes("ON_HOLD") && (
                  <button
                    onClick={() => setStatusDialog({ status: "ON_HOLD" })}
                    className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    Put On Hold
                  </button>
                )}
                {nextStatuses.includes("CANCELLED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "CANCELLED" })}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Cancel Project
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Overview</h3>
            <div className="space-y-4">
              {project.description && (
                <div className="flex items-start gap-3">
                  <FlaskConical className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Description</div>
                    <div className="text-sm text-slate-500 mt-1">{project.description}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Start Date</div>
                  <div className="text-sm text-slate-500">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">End Date</div>
                  <div className="text-sm text-slate-500">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Not set"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Research Team</h3>
            <Link
              to="/research-projects/$projectId/team"
              params={{ projectId: id }}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage Team
              <ChevronRight size={16} />
            </Link>
          </div>
          {teamSummary && teamSummary.totalMembers > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-slate-900">{teamSummary.totalMembers}</div>
                <div className="text-xs text-slate-500">Total Members</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-emerald-600">{teamSummary.activeMembers}</div>
                <div className="text-xs text-slate-500">Active</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-purple-600">{teamSummary.byRole.PRINCIPAL_INVESTIGATOR || 0}</div>
                <div className="text-xs text-slate-500">Principal Inv.</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-blue-600">{teamSummary.byRole.RESEARCHER || 0}</div>
                <div className="text-xs text-slate-500">Researchers</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No team members yet</p>
              <Link
                to="/research-projects/$projectId/team"
                params={{ projectId: id }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                + Add team members
              </Link>
            </div>
          )}
        </div>


        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Publications</h3>
            <Link
              to="/research-publications"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Publications
              <ChevronRight size={16} />
            </Link>
          </div>
          {pubSummary && pubSummary.total > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-slate-900">{pubSummary.total}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-amber-600">{(pubSummary.byStatus?.UNDER_REVIEW || 0) + (pubSummary.byStatus?.SUBMITTED || 0)}</div>
                <div className="text-xs text-slate-500">Under Review</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-emerald-600">{pubSummary.byStatus?.PUBLISHED || 0}</div>
                <div className="text-xs text-slate-500">Published</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="text-2xl font-bold text-purple-600">{pubSummary.byStatus?.ACCEPTED || 0}</div>
                <div className="text-xs text-slate-500">Accepted</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No publications yet</p>
              <button
                onClick={() => setIsPubModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                + Create first publication
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Funding & Grants</h3>
            <Link
              to="/grant-applications"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Applications
              <ChevronRight size={16} />
            </Link>
          </div>
          {((projectApps && projectApps.length > 0) || (projectGrants && projectGrants.length > 0)) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="text-blue-500" size={20} />
                  <div className="text-sm font-medium text-slate-900">Applications</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{projectApps?.length || 0}</div>
                <div className="text-xs text-slate-500">Grant applications</div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="text-emerald-500" size={20} />
                  <div className="text-sm font-medium text-slate-900">Active Grants</div>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{projectGrants?.filter((g: { status: string }) => g.status === 'ACTIVE').length || 0}</div>
                <div className="text-xs text-slate-500">Research grants</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
              <Award size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No funding yet</p>
              <button
                onClick={() => setIsGrantModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                + Create grant application
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Ethics Applications</h3>
            <Link
              to="/ethics/applications"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Applications
              <ChevronRight size={16} />
            </Link>
          </div>
          {projectEthicsApps && projectEthicsApps.length > 0 ? (
            <div className="space-y-2">
              {projectEthicsApps.map((ethApp) => (
                <Link
                  key={ethApp.id}
                  to="/ethics/applications/$id"
                  params={{ id: ethApp.id }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{ethApp.title}</div>
                      <div className="text-xs text-slate-500">{ethApp.applicationCode}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      ethApp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      ethApp.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      ethApp.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ETHICS_APPLICATION_STATUS_LABELS[ethApp.status]}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
              <Shield size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No ethics applications yet</p>
              <button
                onClick={() => setIsEthicsModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                + Create ethics application
              </button>
            </div>
          )}
        </div>


        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Linked Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Wrench className="text-blue-500" size={20} />
              <div>
                <div className="text-sm font-medium text-slate-900">Equipment Requests</div>
                <div className="text-xs text-slate-500">{project.equipmentRequests?.length || 0} requests</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Wrench className="text-emerald-500" size={20} />
              <div>
                <div className="text-sm font-medium text-slate-900">Equipment Assignments</div>
                <div className="text-xs text-slate-500">{project.equipmentAssignments?.length || 0} assignments</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Microscope className="text-purple-500" size={20} />
              <div>
                <div className="text-sm font-medium text-slate-900">Innovations</div>
                <div className="text-xs text-slate-500">{project.innovations?.length || 0} innovations</div>
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
    </div>
  );
}
