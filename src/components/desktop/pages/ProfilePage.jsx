import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Building2,
  Mail,
  Phone,
  Camera,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChefHat,
  Trash2,
} from "lucide-react";
import { getApiBaseUrl, getStoredToken, getApiErrorMessage } from "../../../api";
import { Loader } from "../../ui/Loader";
import { PageHeader } from "../../ui/PageHeader";
import { AppSelect } from "../../ui/AppSelect";

export function ProfilePage({ apiState, refreshKitchenData, onToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    kitchenName: "",
    email: "",
    phone: "",
    contactTitle: "MR",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      if (token) myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      const response = await fetch(`${getApiBaseUrl()}/kitchen/auth/profile`, requestOptions);
      const resultText = await response.text();
      console.log("Profile GET response:", resultText);

      let parsed = null;
      try {
        parsed = resultText ? JSON.parse(resultText) : null;
      } catch (e) {
        console.error("Failed to parse profile JSON:", e);
      }

      const p = parsed?.data || parsed?.kitchen || parsed?.profile || parsed || {};

      setForm({
        kitchenName: p.kitchenName || p.name || "",
        email: p.email || "",
        phone: p.phone || "",
        contactTitle: p.contactTitle || "MR",
        contactFirstName: p.contactFirstName || "",
        contactLastName: p.contactLastName || "",
        contactEmail: p.contactEmail || "",
        contactPhone: p.contactPhone || "",
      });

      if (p.profilePicture || p.logo || p.avatar) {
        setPreviewUrl(p.profilePicture || p.logo || p.avatar);
      }
    } catch (error) {
      console.error(error);
      const msg = getApiErrorMessage(error, "Failed to load kitchen profile");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [apiState?.token]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePictureFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.kitchenName?.trim()) {
      onToast?.({ message: "Please enter your kitchen name.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      if (token) myHeaders.append("Authorization", `Bearer ${token}`);

      const formdata = new FormData();
      if (profilePictureFile) {
        formdata.append("profilePicture", profilePictureFile);
      }
      formdata.append("kitchenName", form.kitchenName || "");
      formdata.append("phone", form.phone || "");
      formdata.append("email", form.email || "");
      formdata.append("contactTitle", form.contactTitle || "MR");
      formdata.append("contactFirstName", form.contactFirstName || "");
      formdata.append("contactLastName", form.contactLastName || "");
      formdata.append("contactEmail", form.contactEmail || "");
      formdata.append("contactPhone", form.contactPhone || "");

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      const response = await fetch(`${getApiBaseUrl()}/kitchen/auth/profile`, requestOptions);
      const resultText = await response.text();
      console.log("Profile PUT response:", resultText);

      let parsed = null;
      try {
        parsed = resultText ? JSON.parse(resultText) : null;
      } catch (_) {}

      if (!response.ok || (parsed && parsed.status === false)) {
        throw new Error(parsed?.message || `Failed to update profile (${response.status})`);
      }

      onToast?.({ message: "Kitchen profile updated successfully!", type: "success" });
      refreshKitchenData?.();
      fetchProfile();
    } catch (error) {
      console.error("Profile update error:", error);
      const msg = getApiErrorMessage(error, "Failed to update profile");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const initialLetter = (form.kitchenName || "K").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-16">
      {/* Top Banner */}
      <PageHeader
        badge="Account & Settings"
        activeBadge="Kitchen Identity"
        title="Kitchen Profile"
        subtitle="Manage your cloud kitchen brand identity, contact information, and primary owner details."
        actions={
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading || saving}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#8D0606]" : ""} />
            <span>Reload</span>
          </button>
        }
      />

      {loading ? (
        <div className="py-24">
          <Loader variant="page" text="Loading kitchen profile..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Profile Picture Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-[#8D0606]" />
              <span>Brand Logo & Photo</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={form.kitchenName || "Kitchen Avatar"}
                    className="size-24 rounded-3xl object-cover border-2 border-rose-100 shadow-md transition group-hover:opacity-90"
                    onError={() => setPreviewUrl("")}
                  />
                ) : (
                  <div className="grid size-24 place-items-center rounded-3xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-3xl font-black text-white shadow-md border-2 border-rose-100">
                    {initialLetter}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-xl bg-white border border-slate-200 text-slate-700 shadow-md hover:bg-slate-100 hover:text-[#8D0606] transition active:scale-90"
                  title="Upload New Logo"
                >
                  <Camera size={15} />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition shadow-2xs"
                  >
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <p className="text-[11.5px] text-slate-400 font-medium">
                  Recommended: Square PNG, JPG or WEBP image at least 500x500px (Max 5MB).
                </p>
              </div>
            </div>
          </div>

          {/* Kitchen Identity Details */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 size={18} className="text-[#8D0606]" />
              <h3 className="text-sm font-bold text-slate-900">Kitchen Brand Details</h3>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Kitchen Name */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Kitchen / Brand Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <ChefHat className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Kitchen"
                    value={form.kitchenName}
                    onChange={(e) => setForm((f) => ({ ...f, kitchenName: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  />
                </div>
              </div>

              {/* Kitchen Official Email */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Kitchen Official Email <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rohitwebstep@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  />
                </div>
              </div>

              {/* Kitchen Official Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Kitchen Official Phone <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 787606023444"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Contact Person Details */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User size={18} className="text-[#8D0606]" />
              <h3 className="text-sm font-bold text-slate-900">Primary Contact Person</h3>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {/* Contact Title */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Title
                </label>
                <AppSelect
                  value={form.contactTitle}
                  onChange={(val) => setForm((f) => ({ ...f, contactTitle: val }))}
                  options={[
                    { value: "MR", label: "Mr." },
                    { value: "MRS", label: "Mrs." },
                    { value: "MS", label: "Ms." },
                    { value: "DR", label: "Dr." },
                  ]}
                />
              </div>

              {/* First Name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  First Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Akshay"
                  value={form.contactFirstName}
                  onChange={(e) => setForm((f) => ({ ...f, contactFirstName: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Last Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kumar"
                  value={form.contactLastName}
                  onChange={(e) => setForm((f) => ({ ...f, contactLastName: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                />
              </div>

              {/* Contact Email */}
              <div className="sm:col-span-1.5">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Contact Email <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rohit.contact@gmail.com"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Contact Phone Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 7404113228"
                    value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={fetchProfile}
              disabled={saving || loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-7 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:from-[#780404] hover:to-[#a10707] active:scale-98 disabled:opacity-60"
            >
              {saving ? (
                <Loader variant="button" text="Saving Profile..." />
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
