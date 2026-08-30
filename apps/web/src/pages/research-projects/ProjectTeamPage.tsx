import { useState, useEffect } from "react";
import { useProjectMembers, useProjectTeamSummary, useRemoveProjectMember, PROJECT_MEMBER_ROLE_LABELS } from "../../hooks/useResearchProjectMembers";
import { useResearchProject } from "../../hooks/useResearchProjects";
import { Search, Loader2, Users, UserMinus, UserPlus, Edit2, ChevronLeft } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import ProjectMemberForm from "../../components/research-project-members/ProjectMemberForm";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const roleStyles: Record<string, string> = {
  PRINCIPAL_INVESTIGATOR: "bg-purple-100 text-purple-700",
  CO_INVESTIGATOR: "bg-blue-100 text-blue-700",
  RESEARCHER: "bg-emerald-100 text-emerald-700",
  RESEARCH_ASSISTANT: "bg-amber-100 text-amber-700",
  TECHNICAL_MEMBER: "bg-slate-100 text-slate-700",
};

export default function ProjectTeamPage() {
  const { projectId } = useParams({ from: "/app/research-projects/$projectId/team" });
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deletingMember, setDeletingMember] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: project } = useResearchProject(projectId);
  const { data, isLoading, error } = useProjectMembers({
    projectId,
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });
  const { data: summary } = useProjectTeamSummary(projectId);
  const removeMember = useRemoveProjectMember();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  const handleRemoveMember = () => {
    if (!deletingMember) return;
    removeMember.mutate(deletingMember.id, {
      onSuccess: () => {
        toast("success", "Member removed from project");
        setDeletingMember(null);
      },
      onError: (err: any) => {
        toast("error", err?.response?.data?.message || "Failed to remove member");
      },
    });
  };

  const canManageTeam = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/research-projects/$id"
              params={{ id: projectId }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Project Team</h1>
              <p className="text-sm text-slate-500 mt-1">
                {project ? `${project.title} (${project.projectCode})` : "Loading project..."}
              </p>
            </div>
          </div>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={18} />
            Add Member
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{summary.totalMembers}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.activeMembers}</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{summary.inactiveMembers}</div>
            <div className="text-xs text-slate-500">Inactive</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{summary.byRole.PRINCIPAL_INVESTIGATOR || 0}</div>
            <div className="text-xs text-slate-500">Principal Inv.</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.byRole.CO_INVESTIGATOR || 0}</div>
            <div className="text-xs text-slate-500">Co-Investigator</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.byRole.RESEARCHER || 0}</div>
            <div className="text-xs text-slate-500">Researchers</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {Object.entries(PROJECT_MEMBER_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Researcher</th>
                <th className="px-6 py-4 font-medium">Employee ID</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading team members...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load team members.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No team members</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || roleFilter
                        ? "No members found. Try changing your search or filters."
                        : "No members have been added to this project yet."}
                    </p>
                    {canManageTeam && !search && !roleFilter && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add the first team member
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {member.researcher.user.firstName} {member.researcher.user.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{member.researcher.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{member.researcher.employeeOrStudentId}</td>
                    <td className="px-6 py-4 text-slate-500">{member.researcher.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleStyles[member.role]}`}>
                        {PROJECT_MEMBER_ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${member.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManageTeam && member.isActive && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingMember(member)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} members
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Team Member</h2>
            <ProjectMemberForm
              projectId={projectId}
              onSuccess={() => setIsAddModalOpen(false)}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Team Member</h2>
            <ProjectMemberForm
              projectId={projectId}
              initialData={editingMember}
              onSuccess={() => setEditingMember(null)}
              onCancel={() => setEditingMember(null)}
            />
          </div>
        </div>
      )}

      {deletingMember && (
        <ConfirmDialog
          open={true}
          title="Remove Team Member"
          message={`Are you sure you want to remove ${deletingMember.researcher.user.firstName} ${deletingMember.researcher.user.lastName} from this project?`}
          confirmLabel="Remove"
          onConfirm={handleRemoveMember}
          onCancel={() => setDeletingMember(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
