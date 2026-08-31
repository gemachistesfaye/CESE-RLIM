import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useResearcher } from "../../hooks/useResearchers";
import { useResearcherProjectMemberships, PROJECT_MEMBER_ROLE_LABELS } from "../../hooks/useResearchProjectMembers";
import { useResearchPublications, PUBLICATION_TYPE_LABELS } from "../../hooks/useResearchPublications";
import { useGrantApplications, GRANT_APPLICATION_STATUS_LABELS } from "../../hooks/useGrantApplications";
import { useResearchGrantsByResearcher, GRANT_STATUS_LABELS, type ResearchGrant } from "../../hooks/useResearchGrants";
import { useEthicsApplicationsByResearcher, ETHICS_APPLICATION_STATUS_LABELS } from "../../hooks/useEthics";
import { ArrowLeft, Edit, Mail, Phone, BookOpen, GraduationCap, Building2, UserCircle, Briefcase, FileText, Loader2, FlaskConical, ChevronRight, Award, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ResearcherForm from "../../components/researchers/ResearcherForm";

export default function ResearcherProfile() {
  const { id } = useParams({ from: "/app/researchers/$id" });
  const { data: researcher, isLoading, error } = useResearcher(id);
  const { data: memberships } = useResearcherProjectMemberships({
    researcherId: id,
    page: 1,
    limit: 10,
  });
  const { data: publications } = useResearchPublications({
    page: 1,
    limit: 10,
    researcherId: id,
  });
  const { data: applications } = useGrantApplications({
    page: 1,
    limit: 10,
    applicantId: id,
  });
  const { data: grants } = useResearchGrantsByResearcher(id);
  const { data: ethicsApps } = useEthicsApplicationsByResearcher(id);
  const { user: currentUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading profile...
      </div>
    );
  }
  if (error || !researcher) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load researcher profile.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "COORDINATOR" || currentUser?.id === researcher.userId;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/researchers" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Researcher Profile</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-5">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-4xl font-bold">
                  {researcher.user.firstName[0]}{researcher.user.lastName[0]}
                </div>
              </div>
              <div className="pb-1">
                <h2 className="text-2xl font-bold text-slate-900">{researcher.user.firstName} {researcher.user.lastName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-600 font-medium">{researcher.employeeOrStudentId}</span>
                  <span className="text-slate-300">•</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    researcher.user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    {researcher.user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            
            {canEdit && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Edit size={16} />
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserCircle size={16} className="text-slate-400" />
                  Contact Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="text-slate-400 mt-0.5" size={16} />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Email</div>
                      <div className="text-sm text-slate-900">{researcher.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-slate-400 mt-0.5" size={16} />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Phone</div>
                      <div className="text-sm text-slate-900">{researcher.user.phone || "Not provided"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase size={16} className="text-slate-400" />
                  Academic Profile
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="text-slate-400 mt-0.5" size={16} />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Department</div>
                      <div className="text-sm text-slate-900 font-medium">{researcher.department}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GraduationCap className="text-slate-400 mt-0.5" size={16} />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Position</div>
                      <div className="text-sm text-slate-900">{researcher.academicPosition || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Biography
                </h3>
                {researcher.bio ? (
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {researcher.bio}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No biography provided.</p>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500" />
                  Research Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Research Areas</h4>
                    {researcher.researchAreas ? (
                      <div className="flex flex-wrap gap-2">
                        {researcher.researchAreas.split(",").map((area, i) => (
                          <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm border border-indigo-100">
                            {area.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Not specified</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Specific Expertise</h4>
                    <p className="text-sm text-slate-700">{researcher.expertise || "Not specified"}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">ORCID ID</h4>
                    {researcher.orcid ? (
                      <a href={`https://orcid.org/${researcher.orcid}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                        {researcher.orcid}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">Not specified</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FlaskConical size={16} className="text-purple-500" />
                  Project Memberships
                </h3>
                {memberships && memberships.items.length > 0 ? (
                  <div className="space-y-3">
                    {memberships.items.map((membership) => (
                      <Link
                        key={membership.id}
                        to="/research-projects/$id"
                        params={{ id: membership.researchProjectId }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FlaskConical size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{membership.researchProject.title}</div>
                            <div className="text-xs text-slate-500">{membership.researchProject.projectCode}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            membership.role === 'PRINCIPAL_INVESTIGATOR' ? 'bg-purple-100 text-purple-700' :
                            membership.role === 'CO_INVESTIGATOR' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {PROJECT_MEMBER_ROLE_LABELS[membership.role]}
                          </span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Not a member of any projects yet.</p>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500" />
                  Publications
                </h3>
                {publications && publications.items.length > 0 ? (
                  <div className="space-y-3">
                    {publications.items.map((pub) => (
                      <Link
                        key={pub.id}
                        to="/research-publications/$id"
                        params={{ id: pub.id }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BookOpen size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{pub.title}</div>
                            <div className="text-xs text-slate-500">{PUBLICATION_TYPE_LABELS[pub.publicationType]}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            pub.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                            pub.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {pub.status.replace("_", " ")}
                          </span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No publications yet.</p>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Grant Applications
                </h3>
                {applications && applications.items.length > 0 ? (
                  <div className="space-y-3">
                    {applications.items.map((app) => (
                      <Link
                        key={app.id}
                        to="/grant-applications/$id"
                        params={{ id: app.id }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{app.title}</div>
                            <div className="text-xs text-slate-500">{app.opportunity?.organization}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            app.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {GRANT_APPLICATION_STATUS_LABELS[app.status]}
                          </span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No grant applications yet.</p>
                )}
              </div>

              {grants && grants.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award size={16} className="text-emerald-500" />
                    Active Grants
                  </h3>
                  <div className="space-y-3">
                    {grants.map((grant: ResearchGrant) => (
                      <Link
                        key={grant.id}
                        to="/research-grants/$id"
                        params={{ id: grant.id }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Award size={16} className="text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 font-mono">{grant.grantNumber}</div>
                            <div className="text-xs text-slate-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(grant.awardedAmount)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            grant.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                            grant.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {GRANT_STATUS_LABELS[grant.status]}
                          </span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {ethicsApps && ethicsApps.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-blue-500" />
                    Ethics Applications
                  </h3>
                  <div className="space-y-3">
                    {ethicsApps.map((ethApp) => (
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Researcher Profile</h2>
            <ResearcherForm 
              initialData={researcher}
              onSuccess={() => setIsEditModalOpen(false)} 
              onCancel={() => setIsEditModalOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
