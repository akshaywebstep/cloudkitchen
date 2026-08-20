import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Eye,
  EyeOff,
  User,
  Sparkles,
  ChevronRight,
  Filter,
  Edit2,
  Edit,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../../api";
import { resolveSelectedBranchId } from "../../../utils/helpers";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { AppSelect } from "../../ui/AppSelect";

export function StaffListPage({ apiState, onToast }) {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formBranches, setFormBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalStaff, setFormModalStaff] = useState(null); // null for create, staff object for edit
  const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);

  const fetchStaffData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [staffRes, optionsRes] = await Promise.allSettled([
        api.staff(),
        api.staffFormOptions(),
      ]);

      if (staffRes.status === "fulfilled") {
        const staffData = Array.isArray(staffRes.value?.data)
          ? staffRes.value.data
          : Array.isArray(staffRes.value)
          ? staffRes.value
          : [];
        setStaffList(staffData);
      }

      const roleMap = new Map();

      if (optionsRes.status === "fulfilled" && optionsRes.value?.data) {
        const optionsData = optionsRes.value.data;
        if (Array.isArray(optionsData.branches)) {
          setFormBranches(optionsData.branches);
        }
        if (Array.isArray(optionsData.roles)) {
          optionsData.roles.forEach((r) => {
            if (r?.id && r?.name) {
              roleMap.set(String(r.id), r.name);
            }
          });
        }
      }

      // If roles not found in form-options, extract any from staff list
      if (roleMap.size === 0 && staffRes.status === "fulfilled" && Array.isArray(staffRes.value?.data)) {
        staffRes.value.data.forEach((s) => {
          if (s?.role?.id && s?.role?.name) {
            roleMap.set(String(s.role.id), s.role.name);
          }
        });
      }

      const parsedRoles = Array.from(roleMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));
      setRoles(parsedRoles.length > 0 ? parsedRoles : [{ id: "2", name: "Kitchen Staff Manager" }]);
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to load staff records");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [apiState?.token]);

  // Merge available branches (formOptions.branches > apiState.branches)
  const availableBranches = useMemo(() => {
    if (formBranches && formBranches.length > 0) return formBranches;
    return apiState?.branches || [];
  }, [formBranches, apiState?.branches]);

  const activeBranchId = resolveSelectedBranchId(availableBranches, apiState?.selectedBranchId);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      // Role filter
      if (selectedRoleFilter !== "ALL") {
        const staffRoleId = String(staff?.role?.id || staff?.roleId || "");
        if (staffRoleId !== selectedRoleFilter) return false;
      }

      // Status filter
      if (selectedStatusFilter !== "ALL") {
        const staffStatus = (staff?.status || "ACTIVE").toUpperCase();
        if (staffStatus !== selectedStatusFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${staff?.title || ""} ${staff?.firstName || ""} ${staff?.lastName || ""}`.toLowerCase();
        const email = (staff?.email || "").toLowerCase();
        const phone = (staff?.phone || "").toLowerCase();
        const roleName = (staff?.role?.name || "").toLowerCase();
        const branches = (staff?.branchAccess || [])
          .map((ba) => ba?.branch?.name || "")
          .join(" ")
          .toLowerCase();

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          roleName.includes(q) ||
          branches.includes(q)
        );
      }

      return true;
    });
  }, [staffList, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Paginated records
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const activeStaffCount = staffList.filter(
    (s) => (s?.status || "ACTIVE").toUpperCase() === "ACTIVE"
  ).length;

  const totalBranchesCount = useMemo(() => {
    const branchSet = new Set();
    staffList.forEach((s) => {
      (s.branchAccess || []).forEach((b) => {
        if (b.branchId) branchSet.add(b.branchId);
      });
    });
    return branchSet.size || availableBranches.length;
  }, [staffList, availableBranches]);

  return (
    <div className="mx-auto  space-y-6 pb-12">
      {/* Top Banner matching Reference */}
      <PageHeader
        badge="Staff Access Network"
        activeBadge={`${activeStaffCount} Active Staff Members`}
        title="Staff Management"
        subtitle="Manage kitchen team members, assign branch locations, and configure access roles."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchStaffData(true)}
              disabled={refreshing || loading}
              title="Refresh Staff List"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormModalStaff(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-full bg-[#8D0606] px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              <span>Create New Staff</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0] lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, phone, role, or branch..."
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

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <AppSelect
            value={selectedRoleFilter}
            onChange={(val) => {
              setSelectedRoleFilter(val);
              setCurrentPage(1);
            }}
            minWidth="145px"
            options={[
              { value: "ALL", label: "All Roles" },
              ...roles.map((r) => ({ value: String(r.id), label: r.name })),
            ]}
          />

          {/* Status Filter */}
          <AppSelect
            value={selectedStatusFilter}
            onChange={(val) => {
              setSelectedStatusFilter(val);
              setCurrentPage(1);
            }}
            minWidth="130px"
            options={[
              { value: "ALL", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />

          {(searchQuery || selectedRoleFilter !== "ALL" || selectedStatusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedRoleFilter("ALL");
                setSelectedStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-[#8D0606] hover:bg-rose-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Staff Listing Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
        {loading ? (
          <div className="py-20">
            <Loader variant="page" text="Loading staff records from server..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pl-6 pr-2 py-4 w-12 text-slate-400">#</th>
                  <th className="px-4 py-4">Staff Member</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Role & Access</th>
                  <th className="px-6 py-4">Assigned Branch(es)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedStaff.map((staff, idx) => {
                  const staffIndex = (currentPage - 1) * pageSize + idx + 1;
                  const titleStr = staff.title ? `${staff.title}. ` : "";
                  const fullName = `${titleStr}${staff.firstName || ""} ${staff.lastName || ""}`.trim() || "Staff Member";
                  const roleName = staff.role?.name || "Kitchen Staff Manager";
                  const branches = staff.branchAccess || [];
                  const initials = `${(staff.firstName?.[0] || "").toUpperCase()}${(staff.lastName?.[0] || "").toUpperCase()}` || "ST";
                  const isActive = (staff.status || "ACTIVE").toUpperCase() === "ACTIVE";
                  const formattedDate = staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={staff.id || idx}
                      className="transition duration-150 hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => setSelectedStaffDetail(staff)}
                    >
                      {/* Index */}
                      <td className="pl-6 pr-2 py-4 font-bold text-xs text-[#8D0606]">
                        #{staffIndex}
                      </td>

                      {/* Avatar & Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3.5">
                          {staff.profilePicture ? (
                            <img
                              src={staff.profilePicture}
                              alt={fullName}
                              className="size-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="grid size-10 place-items-center rounded-full bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-xs font-bold text-white shadow-2xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate hover:text-[#8D0606] transition">
                              {fullName}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400">
                              {roleName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={staff.email}>
                              {staff.email || "—"}
                            </span>
                          </div>
                          {staff.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{staff.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-[#fff5f5] px-2.5 py-1 text-xs font-bold text-[#8D0606]">
                         
                          <span className="truncate text-xs">{roleName}</span>
                        </span>
                      </td>

                      {/* Branches */}
                      <td className="px-6 py-4">
                        {branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                            {branches.map((b) => (
                              <span
                                key={b.id || b.branchId}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200"
                              >
                                <Building2 size={11} className="text-slate-500" />
                                <span className="truncate max-w-[120px]">
                                  {b.branch?.name || `Branch #${b.branchId}`}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 italic">
                            All Branches
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormModalStaff(staff);
                              setIsFormModalOpen(true);
                            }}
                            title="Edit Staff Member"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#8D0606] hover:bg-rose-50 hover:text-[#8D0606]"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStaffDetail(staff);
                            }}
                            title="View Details"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                          >
                            <span>Details</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {!paginatedStaff.length && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
                  <Users size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No staff members found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {searchQuery || selectedRoleFilter !== "ALL" || selectedStatusFilter !== "ALL"
                    ? "Try adjusting your search query or filters to find what you're looking for."
                    : "Get started by creating your first kitchen staff member."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormModalStaff(null);
                    setIsFormModalOpen(true);
                  }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7a0505]"
                >
                  <UserPlus size={15} />
                  <span>Create New Staff</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Pagination Footer */}
        {filteredStaff.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredStaff.length}
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

      {/* Create / Edit Staff Modal (Rendered via React Portal onto document.body) */}
      {isFormModalOpen && (
        <StaffFormModal
          staff={formModalStaff}
          roles={roles}
          branches={availableBranches}
          activeBranchId={activeBranchId}
          onClose={() => {
            setIsFormModalOpen(false);
            setFormModalStaff(null);
          }}
          onSuccess={(isUpdate) => {
            setIsFormModalOpen(false);
            setFormModalStaff(null);
            fetchStaffData(true);
            onToast?.({
              message: isUpdate
                ? "Staff member updated successfully!"
                : "Staff member created successfully!",
              type: "success",
            });
          }}
          onToast={onToast}
        />
      )}

      {/* Staff Detail Modal (Rendered via React Portal onto document.body) */}
      {selectedStaffDetail && (
        <StaffDetailModal
          staff={selectedStaffDetail}
          onEdit={(staff) => {
            setSelectedStaffDetail(null);
            setFormModalStaff(staff);
            setIsFormModalOpen(true);
          }}
          onClose={() => setSelectedStaffDetail(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit Staff Modal Component (Portal-mounted)
// ---------------------------------------------------------------------------
function StaffFormModal({ staff, roles, branches, activeBranchId, onClose, onSuccess, onToast }) {
  const isEditMode = Boolean(staff?.id);

  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const [form, setForm] = useState({
    title: staff?.title || "Mr",
    firstName: staff?.firstName || "",
    lastName: staff?.lastName || "",
    email: staff?.email || "",
    phone: staff?.phone || "",
    password: "",
    roleId: staff?.roleId ? String(staff.roleId) : staff?.role?.id ? String(staff.role.id) : roles[0]?.id ? String(roles[0].id) : "2",
    status: staff?.status || "ACTIVE",
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(staff?.profilePicture || "");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const updateField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!form.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^\d{7,15}$/.test(form.phone.replace(/[\s+-]/g, ""))) {
      errs.phone = "Please enter a valid phone number";
    }
    if (!isEditMode) {
      if (!form.password.trim()) {
        errs.password = "Password is required for new staff";
      } else if (form.password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
    } else if (form.password && form.password.length < 6) {
      errs.password = "Password must be at least 6 characters if updating";
    }
    if (!form.roleId) {
      errs.roleId = "Please select a role";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      onToast?.({ message: "Please resolve the errors highlighted below.", type: "warning" });
      return;
    }

    setSaving(true);
    try {
      const formdata = new FormData();
      if (profilePictureFile) {
        formdata.append("profilePicture", profilePictureFile, profilePictureFile.name);
      }
      formdata.append("title", form.title);
      formdata.append("firstName", form.firstName.trim());
      formdata.append("lastName", form.lastName.trim());
      formdata.append("email", form.email.trim().toLowerCase());
      formdata.append("phone", form.phone.trim());
      if (form.password.trim()) {
        formdata.append("password", form.password);
      }
      formdata.append("roleId", String(form.roleId));
      
      // Always assign target branch from header active branch
      const targetBranchNum = Number(activeBranchId || branches[0]?.id || 1);
      formdata.append("branchIds", JSON.stringify([targetBranchNum]));
      formdata.append("status", form.status || "ACTIVE");

      if (isEditMode) {
        await api.updateStaff(staff.id, formdata);
      } else {
        await api.createStaff(formdata);
      }
      onSuccess(isEditMode);
    } catch (error) {
      const errMsg = getApiErrorMessage(error, `Failed to ${isEditMode ? "update" : "create"} staff member`);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-xs">
              {isEditMode ? <Edit size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? `Edit Staff: ${staff.firstName} ${staff.lastName}` : "Create New Staff Member"}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {isEditMode
                  ? "Update staff contact details, role permissions, and branch access"
                  : "Enter staff credentials, assign role permissions & branches"}
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0" autoComplete="off">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
              <div className="relative group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    className="size-20 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="grid size-20 place-items-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-2xs">
                    <User size={32} />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Profile Photo (Optional)
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  JPG, PNG or WEBP format. Max 5MB.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#8D0606] hover:text-[#8D0606] transition shadow-2xs"
                  >
                    <Upload size={13} />
                    <span>{previewUrl ? "Change Photo" : "Choose Photo"}</span>
                  </button>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl("");
                        setProfilePictureFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Title & Name Grid */}
            <div className="grid gap-4 sm:grid-cols-12">
              {/* Title Selector */}
              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Title <span className="text-rose-600">*</span>
                </label>
                <AppSelect
                  variant="form"
                  value={form.title}
                  onChange={(val) => updateField("title", val)}
                  options={[
                    { value: "Mr", label: "Mr." },
                    { value: "Mrs", label: "Mrs." },
                    { value: "Ms", label: "Ms." },
                    { value: "Dr", label: "Dr." },
                    { value: "Chef", label: "Chef" },
                  ]}
                />
              </div>

              {/* First Name */}
              <div className="sm:col-span-4">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  First Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="staff_first_name"
                  autoComplete="off"
                  placeholder="e.g. Akshay"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className={`h-11 w-full rounded-xl border px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition ${
                    errors.firstName
                      ? "border-rose-500 bg-rose-50/30 focus:ring-rose-500/20"
                      : "border-slate-200 bg-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.firstName}</span>
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="sm:col-span-5">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Last Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="staff_last_name"
                  autoComplete="off"
                  placeholder="e.g. Kumar"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className={`h-11 w-full rounded-xl border px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition ${
                    errors.lastName
                      ? "border-rose-500 bg-rose-50/30 focus:ring-rose-500/20"
                      : "border-slate-200 bg-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="staff_user_email"
                    autoComplete="off"
                    placeholder="e.g. staff.member@kitchen.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`h-11 w-full rounded-xl border pl-10 pr-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition ${
                      errors.email
                        ? "border-rose-500 bg-rose-50/30 focus:ring-rose-500/20"
                        : "border-slate-200 bg-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Phone Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="tel"
                    name="staff_user_phone"
                    autoComplete="off"
                    placeholder="e.g. 7876060888"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={`h-11 w-full rounded-xl border pl-10 pr-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition ${
                      errors.phone
                        ? "border-rose-500 bg-rose-50/30 focus:ring-rose-500/20"
                        : "border-slate-200 bg-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Password & Role Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Staff Password {isEditMode ? <span className="text-slate-400 text-[10px] font-normal">(Leave blank to keep current)</span> : <span className="text-rose-600">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="staff_new_password"
                    autoComplete="new-password"
                    placeholder={isEditMode ? "Enter new password (optional)" : "Enter login password (min 6 chars)"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={`h-11 w-full rounded-xl border pl-3.5 pr-10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition ${
                      errors.password
                        ? "border-rose-500 bg-rose-50/30 focus:ring-rose-500/20"
                        : "border-slate-200 bg-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Staff Role <span className="text-rose-600">*</span>
                </label>
                <AppSelect
                  variant="form"
                  error={!!errors.roleId}
                  value={form.roleId}
                  onChange={(val) => updateField("roleId", val)}
                  options={roles.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                  }))}
                />
                {errors.roleId && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.roleId}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Status (If editing) */}
            {isEditMode && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Staff Account Status <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {["ACTIVE", "INACTIVE"].map((st) => {
                    const isSelected = form.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateField("status", st)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                          isSelected
                            ? st === "ACTIVE"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs"
                              : "border-rose-500 bg-rose-50 text-rose-700 shadow-2xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`size-2 rounded-full ${
                            st === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span>{st === "ACTIVE" ? "Active Staff" : "Inactive Staff"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Kitchen Branch Indicator */}
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 shadow-2xs">
              <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shrink-0">
                <Building2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Assigned Kitchen Branch</span>
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-[#8D0606] border border-rose-100">
                    Header Synced
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                  {branches.find((b) => String(b.id) === String(activeBranchId))?.name || `Branch Outlet #${activeBranchId || "1"}`}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(141,6,6,0.3)] hover:from-[#7a0505] hover:to-[#990707] transition disabled:opacity-60"
            >
              {saving ? (
                <Loader variant="button" text={isEditMode ? "Updating Staff..." : "Creating Staff..."} />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isEditMode ? "Save Changes" : "Create Staff"}</span>
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

// ---------------------------------------------------------------------------
// Staff Detail Drawer / Modal (Portal-mounted)
// ---------------------------------------------------------------------------
function StaffDetailModal({ staff, onEdit, onClose }) {
  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const titleStr = staff.title ? `${staff.title}. ` : "";
  const fullName = `${titleStr}${staff.firstName || ""} ${staff.lastName || ""}`.trim() || "Staff Member";
  const roleName = staff.role?.name || "Kitchen Staff Manager";
  const branches = staff.branchAccess || [];
  const initials = `${(staff.firstName?.[0] || "").toUpperCase()}${(staff.lastName?.[0] || "").toUpperCase()}` || "ST";
  const isActive = (staff.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="shrink-0 relative bg-gradient-to-br from-[#7A0505] to-[#9E0808] p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            {staff.profilePicture ? (
              <img
                src={staff.profilePicture}
                alt={fullName}
                className="size-16 rounded-2xl object-cover border-2 border-white/40 shadow-md"
              />
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl bg-white/20 text-xl font-bold text-white border border-white/30 backdrop-blur-md shadow-md">
                {initials}
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                {isActive ? "Active Staff" : "Inactive"}
              </span>
              <h3 className="text-xl font-bold tracking-tight mt-1">{fullName}</h3>
              <p className="text-xs text-white/80 font-medium">{roleName}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Email Address
              </span>
              <p className="text-xs font-bold text-slate-800 truncate" title={staff.email}>
                {staff.email || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Phone Number
              </span>
              <p className="text-xs font-bold text-slate-800">
                {staff.phone || "—"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Assigned Kitchen Branches ({branches.length})
            </span>
            {branches.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {branches.map((b) => (
                  <span
                    key={b.id || b.branchId}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    <Building2 size={13} className="text-[#8D0606]" />
                    <span>{b.branch?.name || `Branch #${b.branchId}`}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">All Branches Access</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Role: <strong className="text-slate-700">{staff.role?.name || "Kitchen Staff"}</strong></span>
            <span>
              Joined:{" "}
              {staff.createdAt
                ? new Date(staff.createdAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-200/80 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(staff)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#8D0606] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#7a0505] transition"
          >
            <Edit2 size={14} />
            <span>Edit Staff</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
