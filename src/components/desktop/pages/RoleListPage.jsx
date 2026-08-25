import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Users,
  KeyRound,
} from "lucide-react";
import { api, getApiBaseUrl, getStoredToken, getApiErrorMessage } from "../../../api";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";

export function RoleListPage({ apiState, onToast }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // null = create, object = edit

  // Fetch Roles from backend API
  const fetchRoles = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const token = apiState?.token || getStoredToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/kitchen/staff-role/`, requestOptions);
      const text = await response.text();
      console.log(text);
      
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("Failed to parse roles JSON:", e);
      }

      if (parsed && Array.isArray(parsed.data)) {
        setRoles(parsed.data);
      } else if (Array.isArray(parsed)) {
        setRoles(parsed);
      } else if (parsed && parsed.status === true && Array.isArray(parsed.roles)) {
        setRoles(parsed.roles);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error(error);
      const msg = getApiErrorMessage(error, "Failed to load roles from server");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [apiState?.token]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameStr = (role?.name || "").toLowerCase();
      const idStr = String(role?.id || "").toLowerCase();
      return nameStr.includes(q) || idStr.includes(q);
    });
  }, [roles, searchQuery]);

  // Paginated records
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, currentPage, pageSize]);

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* Top Banner matching Reference */}
      <PageHeader
        badge="Access Control"
        activeBadge={`${roles.length} Defined Roles`}
        title="Role Management"
        subtitle="Manage kitchen staff roles, configure authority levels, and customize operational permissions."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchRoles(true)}
              disabled={refreshing || loading}
              title="Refresh Roles List"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-full bg-[#8D0606] px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create New Role</span>
            </button>
          </div>
        }
      />

     
      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search role by name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#8D0606] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8D0606]/10 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-[#8D0606] hover:bg-rose-100 transition"
          >
            Reset Search
          </button>
        )}
      </div>

      {/* Roles Listing Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="py-20">
            <Loader variant="page" text="Fetching staff roles from server..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pl-6 pr-3 py-4 w-14 text-slate-400">#</th>
                  <th className="px-5 py-4">Role Title & Identifier</th>
                  <th className="px-5 py-4">Scope & Authority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedRoles.map((role, idx) => {
                  const roleIndex = (currentPage - 1) * pageSize + idx + 1;
                  const roleName = role?.name || "Kitchen Staff Manager";
                  const roleId = role?.id || roleIndex;
                  const formattedDate = role?.createdAt
                    ? new Date(role.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Live System";

                  return (
                    <tr
                      key={roleId}
                      className="transition duration-150 hover:bg-slate-50/80"
                    >
                      {/* Index */}
                      <td className="pl-6 pr-3 py-4 font-bold text-xs text-[#8D0606]">
                        #{roleIndex}
                      </td>

                      {/* Role Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-2xs font-bold text-xs">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {roleName}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400">
                              Identifier Code: ROLE-{roleId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-[#fff5f5] px-2.5 py-1 text-xs font-bold text-[#8D0606]">
                          <Lock size={12} />
                          <span>Kitchen & Outlets Scope</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsModalOpen(true);
                            }}
                            title="Edit Role"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#8D0606] hover:bg-rose-50 hover:text-[#8D0606] shadow-2xs"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {!paginatedRoles.length && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No staff roles found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {searchQuery
                    ? "No roles match your search query. Try typing another role title."
                    : "Get started by defining your first kitchen staff role."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7a0505]"
                >
                  <Plus size={15} />
                  <span>Create New Role</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Pagination Footer */}
        {filteredRoles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRoles.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 8, 15, 25]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <RoleFormModal
          role={selectedRole}
          apiState={apiState}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRole(null);
          }}
          onSuccess={(isEdit) => {
            setIsModalOpen(false);
            setSelectedRole(null);
            fetchRoles(true);
            onToast?.({
              message: isEdit ? "Role updated successfully!" : "Staff role created successfully!",
              type: "success",
            });
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role Form Modal (Portal Mounted)
// ---------------------------------------------------------------------------
function RoleFormModal({ role, apiState, onClose, onSuccess, onToast }) {
  const isEditMode = Boolean(role?.id);

  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const [roleName, setRoleName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      if (token) {
        myHeaders.append("Authorization", `Bearer ${token}`);
      }

      const raw = JSON.stringify({
        name: roleName.trim(),
      });

      if (isEditMode) {
        const updateOptions = {
          method: "PUT",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(`${getApiBaseUrl()}/kitchen/staff-role/role/${role.id}`, updateOptions);
        const result = await response.text();
        console.log(result);

        const parsed = result ? JSON.parse(result) : null;
        if (!response.ok || parsed?.status === false) {
          throw new Error(parsed?.message || `Failed to update role (${response.status})`);
        }
      } else {
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(`${getApiBaseUrl()}/kitchen/staff-role/role`, requestOptions);
        const result = await response.text();
        console.log(result);

        const parsed = result ? JSON.parse(result) : null;
        if (!response.ok || parsed?.status === false) {
          throw new Error(parsed?.message || `Failed to create role (${response.status})`);
        }
      }

      onSuccess(isEditMode);
    } catch (err) {
      console.error(err);
      const errMsg = getApiErrorMessage(err, isEditMode ? "Failed to update role" : "Failed to create role");
      setError(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Staff Role" : "Create New Staff Role"}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {isEditMode
                  ? "Update role title and configuration details"
                  : "Add a new kitchen staff role to the system"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Role Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Kitchen Staff Manager"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value);
                if (error) setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10 transition"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Unique name describing the operational role or permission set.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Notes / Operational Scope (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Optional description of the duties and authority for this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10 transition resize-none"
            />
          </div>

          {/* Quick Suggestions */}
          {!isEditMode && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Role Suggestions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Kitchen Staff Manager",
                  "Head Chef & Prep Lead",
                  "Line Cook Associate",
                  "Inventory Manager",
                  "Order & POS Dispatcher",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setRoleName(sug);
                      if (error) setError("");
                    }}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-rose-50 hover:text-[#8D0606] transition border border-slate-200"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-50"
            >
              {submitting ? (
                <Loader variant="button" text={isEditMode ? "Saving..." : "Creating..."} />
              ) : (
                <>
                  <ShieldCheck size={15} />
                  <span>{isEditMode ? "Save Changes" : "Create Role"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
