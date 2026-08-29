import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useUser, useUpdateUserStatus, useUpdateUserRole } from "../../hooks/useUsers";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ArrowLeft, Edit, Shield, Mail, Phone, Calendar, Activity, UserX, UserCheck, Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import UserForm from "../../components/users/UserForm";

export default function UserDetails() {
  const { id } = useParams({ from: "/app/users/$id" });
  const { data: user, isLoading, error } = useUser(id);
  const { user: currentUser } = useAuth();
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";

  const handleStatusToggle = () => {
    if (!user) return;
    setStatusDialog(true);
  };

  const confirmStatusToggle = () => {
    if (!user) return;
    updateStatus.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onSuccess: () => {
          toast("success", `User ${!user.isActive ? "activated" : "deactivated"} successfully`);
          setStatusDialog(false);
        },
        onError: () => toast("error", "Failed to update user status"),
      }
    );
  };

  const handleRoleChange = (newRole: string) => {
    setPendingRole(newRole);
    setRoleDialog(true);
  };

  const confirmRoleChange = () => {
    if (!user || !pendingRole) return;
    updateRole.mutate(
      { id: user.id, role: pendingRole },
      {
        onSuccess: () => {
          toast("success", `Role changed to ${pendingRole} successfully`);
          setRoleDialog(false);
          setPendingRole("");
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to change role");
          setRoleDialog(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading user details...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load user details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/users" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {user.isActive ? "Active Account" : "Deactivated"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {isAdmin && (
              <button
                onClick={handleStatusToggle}
                disabled={updateStatus.isPending}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  user.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}
              >
                {updateStatus.isPending ? <Loader2 size={16} className="animate-spin" /> : user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Email Address</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Phone Number</div>
                  <div className="text-sm text-slate-500">{user.phone || "Not provided"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">System Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">System Role</div>
                  {isAdmin && user.id !== currentUser?.id ? (
                    <div className="relative mt-1">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={updateRole.isPending}
                        className="appearance-none w-full px-3 py-1.5 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="COORDINATOR">Coordinator</option>
                        <option value="RESEARCHER">Researcher</option>
                        <option value="TECHNICIAN">Technician</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">{user.role}</div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Last Login</div>
                  <div className="text-sm text-slate-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never logged in"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Account Created</div>
                  <div className="text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit User Profile</h2>
            <UserForm
              initialData={user}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={statusDialog}
        title={user.isActive ? "Deactivate User?" : "Activate User?"}
        message={user.isActive
          ? "This user will not be able to log in. You can reactivate their account later."
          : "This will restore the user's access to the platform."}
        confirmLabel={user.isActive ? "Deactivate" : "Activate"}
        variant={user.isActive ? "danger" : "warning"}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusDialog(false)}
      />

      <ConfirmDialog
        open={roleDialog}
        title="Change user role?"
        message={`Changing this role will modify ${user.firstName}'s access to CESE-RLIM. This action is logged.`}
        confirmLabel="Change Role"
        variant="warning"
        onConfirm={confirmRoleChange}
        onCancel={() => { setRoleDialog(false); setPendingRole(""); }}
      />
    </div>
  );
}
