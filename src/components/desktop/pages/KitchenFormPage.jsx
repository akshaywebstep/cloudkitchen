import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  Building2,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Save,
  X,
  UtensilsCrossed,
  Globe,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { StatusInput } from "../../ui/StatusInput";
import { TimePickerInput } from "../../ui/TimePickerInput";
import { ApiCount } from "../../ui/ApiCount";
import { Loader } from "../../ui/Loader";
import { api, getApiErrorMessage } from "../../../api";
import {
  getBranchLabel,
  hasSelectedSubscription,
  isKitchenOnboardingCompleted,
  resolveSelectedBranchId,
  setStoredSelectedBranchId,
} from "../../../utils/helpers";

// ---------------------------------------------------------------------------
// Shared styling for react-select dropdowns matching form design system
// ---------------------------------------------------------------------------
const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#8D0606" : "#e2e8f0",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${hasError ? "rgba(239, 68, 68, 0.15)" : "rgba(141, 6, 6, 0.12)"}`
      : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    "&:hover": { borderColor: hasError ? "#ef4444" : "#8D0606" },
    paddingLeft: 4,
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s ease",
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8", fontSize: 14 }),
  option: (base, state) => ({
    ...base,
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: state.isSelected ? "#8D0606" : state.isFocused ? "#fff1f1" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    padding: "10px 14px",
  }),
  multiValue: (base) => ({ ...base, backgroundColor: "#fff1f1", borderRadius: 8, padding: "2px 4px" }),
  multiValueLabel: (base) => ({ ...base, color: "#8D0606", fontWeight: 600, fontSize: 13 }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#8D0606",
    borderRadius: 6,
    "&:hover": { backgroundColor: "#8D0606", color: "white" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
});

// ---------------------------------------------------------------------------
// Reusable TextField with inline error and ref forwarding
// ---------------------------------------------------------------------------
const TextField = React.forwardRef(function TextField(
  { label, required, error, textarea, icon: Icon, className = "", ...props },
  ref
) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <div className="relative">
        {Icon && !textarea ? (
          <Icon className="absolute left-4 top-3.5 text-[#94a3b8]" size={18} />
        ) : null}
        <Comp
          ref={ref}
          {...props}
          rows={textarea ? 3 : undefined}
          className={`w-full rounded-xl border bg-white text-sm font-medium text-[#0f172a] outline-none transition duration-200 placeholder:text-[#94a3b8] ${
            textarea ? "p-3.5" : Icon ? "h-12 pl-11 pr-4" : "h-12 px-4"
          } ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[#e2e8f0] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Reusable SelectField with inline error and ref forwarding
// ---------------------------------------------------------------------------
const SelectField = React.forwardRef(function SelectField(
  { label, required, error, className = "", ...props },
  ref
) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <Select ref={ref} styles={selectStyles(!!error)} menuPortalTarget={document.body} {...props} />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

export function KitchenFormPage({ apiState, refreshKitchenData, onToast }) {
  const navigate = useNavigate();
  const defaultCountryId = apiState?.countries?.[0]?.id ? String(apiState.countries[0].id) : "101";
  const kitchen = apiState?.kitchen || {};
  const branchList = apiState?.branches || [];
  const activeBranchId = resolveSelectedBranchId(branchList, apiState?.selectedBranchId);
  const [selectedBranchId, setSelectedBranchId] = useState(activeBranchId || "new");
  const selectedBranch =
    selectedBranchId === "new" ? null : branchList.find((branch) => String(branch.id) === String(selectedBranchId)) || null;

  const createBranchForm = (branch = null) => ({
    name: branch?.name || kitchen?.kitchenName || "",
    brand: kitchen?.kitchenName || "",
    addressLine1: branch?.addressLine1 || "",
    addressLine2: branch?.addressLine2 || "",
    landmark: branch?.landmark || "",
    area: branch?.area || "",
    pincode: branch?.pincode || "",
    countryId: branch?.countryId ? String(branch.countryId) : defaultCountryId,
    stateId: branch?.stateId ? String(branch.stateId) : "",
    cityId: branch?.cityId ? String(branch.cityId) : "",
    contactFirstName: branch?.contactFirstName || kitchen?.contactFirstName || "",
    contactLastName: branch?.contactLastName || kitchen?.contactLastName || "",
    contactEmail: branch?.contactEmail || kitchen?.contactEmail || kitchen?.email || "",
    contactPhone: branch?.contactPhone || kitchen?.contactPhone || kitchen?.phone || "",
    cuisineIds:
      Array.isArray(branch?.cuisines) && branch.cuisines.length
        ? branch.cuisines.map((c) => String(c.cuisineId || c.cuisine?.id || c.id))
        : apiState?.cuisines?.[0]?.id
        ? [String(apiState.cuisines[0].id)]
        : ["1"],
    openingTime: branch?.openingTime || "",
    closingTime: branch?.closingTime || "",
    prepTime: branch?.prepTime || "",
    maxOrdersPerDay: branch?.maxOrdersPerDay || "",
    kitchenActive: branch ? branch?.isActive !== false : true,
    acceptingOrders: branch ? branch?.isAcceptingOrders !== false : true,
  });

  const [form, setForm] = useState(() => createBranchForm(branchList[0] || null));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [locationOptions, setLocationOptions] = useState({ states: [], cities: [], loading: false });

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  // Refs for every validated field, used to scroll/focus to the first error.
  const fieldRefs = {
    name: useRef(null),
    area: useRef(null),
    addressLine1: useRef(null),
    cuisineIds: useRef(null),
    contactFirstName: useRef(null),
    contactLastName: useRef(null),
    contactEmail: useRef(null),
    contactPhone: useRef(null),
    countryId: useRef(null),
    stateId: useRef(null),
    cityId: useRef(null),
    pincode: useRef(null),
    prepTime: useRef(null),
    maxOrdersPerDay: useRef(null),
    closingTime: useRef(null),
  };

  const fieldOrder = [
    "name",
    "cuisineIds",
    "area",
    "addressLine1",
    "closingTime",
    "prepTime",
    "maxOrdersPerDay",
    "contactFirstName",
    "contactLastName",
    "contactEmail",
    "contactPhone",
    "countryId",
    "cityId",
    "stateId",
    "pincode",
  ];

  const selectBranchForEdit = async (branchId) => {
    const nextBranchId = String(branchId || "");
    setSelectedBranchId(nextBranchId || "new");
    setErrors({});
    if (nextBranchId) {
      setStoredSelectedBranchId(nextBranchId);
      await refreshKitchenData?.(undefined, undefined, nextBranchId);
    }
  };

  const cuisineOptions = apiState?.cuisines?.length
    ? apiState.cuisines.map((cuisine) => ({
        value: String(cuisine.id),
        label: cuisine.name || cuisine.title || `Cuisine ${cuisine.id}`,
      }))
    : [{ value: "1", label: "Cuisine #1" }];

  const countryOptions = apiState?.countries?.length
    ? apiState.countries.map((country) => ({
        value: String(country.id),
        label: country.name || `Country ${country.id}`,
      }))
    : [{ value: form.countryId, label: `Country #${form.countryId}` }];

  const stateOptions = locationOptions.states.length
    ? locationOptions.states.map((state) => ({
        value: String(state.id),
        label: state.name || `State ${state.id}`,
      }))
    : form.stateId
    ? [{ value: form.stateId, label: `State #${form.stateId}` }]
    : [];

  const cityOptions = locationOptions.cities.length
    ? locationOptions.cities.map((city) => ({
        value: String(city.id),
        label: city.name || `City ${city.id}`,
      }))
    : form.cityId
    ? [{ value: form.cityId, label: `City #${form.cityId}` }]
    : [];

  const findOption = (options, value) => options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    if (selectedBranchId !== "new" && !selectedBranch && activeBranchId) {
      setSelectedBranchId(activeBranchId);
    }
    if (selectedBranchId === "new" || selectedBranch) {
      setForm(createBranchForm(selectedBranch));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, selectedBranch?.id, apiState?.branches, apiState?.selectedBranchId, apiState?.kitchen, activeBranchId]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      countryId:
        current.countryId && current.countryId !== "101"
          ? current.countryId
          : apiState?.countries?.[0]?.id
          ? String(apiState.countries[0].id)
          : current.countryId,
      cuisineIds: current.cuisineIds?.length
        ? current.cuisineIds
        : apiState?.cuisines?.[0]?.id
        ? [String(apiState.cuisines[0].id)]
        : current.cuisineIds,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiState?.countries, apiState?.cuisines]);

  useEffect(() => {
    let active = true;
    async function loadLocation() {
      if (!form.countryId) return;
      setLocationOptions((current) => ({ ...current, loading: true }));
      try {
        const statesResponse = await api.states({ countryId: form.countryId });
        const states = Array.isArray(statesResponse?.data) ? statesResponse.data : [];
        const selectedState = states.some((state) => String(state.id) === String(form.stateId))
          ? form.stateId
          : states[0]?.id || form.stateId;
        const citiesResponse = await api.cities({ countryId: form.countryId, stateId: selectedState });
        const cities = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];
        if (!active) return;
        setLocationOptions({ states, cities, loading: false });
        setForm((current) => ({
          ...current,
          stateId: String(selectedState || current.stateId),
          cityId: cities.some((city) => String(city.id) === String(current.cityId))
            ? current.cityId
            : String(cities[0]?.id || current.cityId),
        }));
      } catch {
        if (active) setLocationOptions((current) => ({ ...current, loading: false }));
      }
    }
    loadLocation();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.countryId]);

  useEffect(() => {
    let active = true;
    async function loadCities() {
      if (!form.countryId || !form.stateId) return;
      try {
        const citiesResponse = await api.cities({ countryId: form.countryId, stateId: form.stateId });
        const cities = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];
        if (!active) return;
        setLocationOptions((current) => ({ ...current, cities }));
        setForm((current) => ({
          ...current,
          cityId: cities.some((city) => String(city.id) === String(current.cityId))
            ? current.cityId
            : String(cities[0]?.id || current.cityId),
        }));
      } catch {
        if (active) setLocationOptions((current) => ({ ...current, cities: [] }));
      }
    }
    loadCities();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.stateId]);

  // ---------------------------------------------------------------------
  // Validation with smooth auto-scroll to first invalid input
  // ---------------------------------------------------------------------
  const validate = () => {
    const next = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const pincodeRegex = /^[0-9]{4,6}$/;

    if (!form.name.trim()) next.name = "Branch / kitchen name is required.";
    if (!form.cuisineIds?.length) next.cuisineIds = "Select at least one cuisine.";
    if (!form.area.trim()) next.area = "Area / zone is required.";
    if (!form.addressLine1.trim()) next.addressLine1 = "Full address is required.";

    if (!form.contactFirstName.trim()) next.contactFirstName = "First name is required.";
    if (!form.contactLastName.trim()) next.contactLastName = "Last name is required.";

    if (!form.contactEmail.trim()) next.contactEmail = "Email address is required.";
    else if (!emailRegex.test(form.contactEmail.trim())) next.contactEmail = "Enter a valid email address.";

    if (!form.contactPhone.trim()) next.contactPhone = "Phone number is required.";
    else if (!phoneRegex.test(form.contactPhone.trim())) next.contactPhone = "Enter a valid 10-digit phone number.";

    if (!form.countryId) next.countryId = "Select a country.";
    if (!form.stateId) next.stateId = "Select a state.";
    if (!form.cityId) next.cityId = "Select a city.";

    if (!form.pincode.trim()) next.pincode = "Pincode is required.";
    else if (!pincodeRegex.test(form.pincode.trim())) next.pincode = "Enter a valid pincode.";

    if (form.prepTime && Number(form.prepTime) <= 0) next.prepTime = "Prep time must be greater than 0.";
    if (form.maxOrdersPerDay && Number(form.maxOrdersPerDay) <= 0) next.maxOrdersPerDay = "Must be greater than 0.";

    if (form.openingTime && form.closingTime && form.closingTime <= form.openingTime) {
      next.closingTime = "Closing time must be after opening time.";
    }

    setErrors(next);

    const firstErrorKey = fieldOrder.find((key) => next[key]);
    if (firstErrorKey) {
      const node = fieldRefs[firstErrorKey]?.current;
      if (node) {
        const scrollTarget = typeof node.getBoundingClientRect === "function" ? node : node.controlRef || node;
        scrollTarget.scrollIntoView?.({ behavior: "smooth", block: "center" });
        window.setTimeout(() => node.focus?.(), 300);
      }
    }
    return Object.keys(next).length === 0;
  };

  const deleteSelectedBranch = async () => {
    if (!selectedBranch?.id) {
      setMessageType("error");
      setMessage("Select a branch to delete.");
      onToast?.({ message: "Select a branch to delete.", type: "error" });
      return;
    }
    if (!window.confirm(`Delete ${getBranchLabel(selectedBranch)}?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await api.deleteBranch(selectedBranch.id);
      const remainingBranches = branchList.filter((branch) => String(branch.id) !== String(selectedBranch.id));
      const nextBranchId = resolveSelectedBranchId(remainingBranches, "");
      setStoredSelectedBranchId(nextBranchId);
      setSelectedBranchId(nextBranchId || "new");
      await refreshKitchenData?.(undefined, undefined, nextBranchId);
      setMessageType("success");
      setMessage("Branch deleted successfully.");
      onToast?.({ message: "Branch deleted successfully.", type: "success" });
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to delete branch");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const saveBranch = async () => {
    if (!apiState?.token) {
      setMessageType("error");
      setMessage("Login required before saving branch.");
      onToast?.({ message: "Login required before saving branch.", type: "error" });
      return;
    }
    if (!validate()) {
      setMessageType("error");
      setMessage("Please fix the highlighted fields before saving.");
      onToast?.({ message: "Please fix the highlighted fields before saving.", type: "warning" });
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (!isKitchenOnboardingCompleted(apiState?.kitchen) || !hasSelectedSubscription(apiState)) {
        const msg = "Complete onboarding and select a subscription plan before saving branch.";
        setMessageType("error");
        setMessage(msg);
        onToast?.({ message: msg, type: "error" });
        setSaving(false);
        return;
      }
      const payload = {
        name: form.name,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        landmark: form.landmark,
        area: form.area,
        pincode: form.pincode,
        countryId: Number(form.countryId),
        stateId: Number(form.stateId),
        cityId: Number(form.cityId),
        contactTitle: "MR",
        contactFirstName: form.contactFirstName,
        contactLastName: form.contactLastName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        cuisines: (form.cuisineIds || []).map((id) => ({ id: Number(id) })),
      };
      let savedBranchId = selectedBranch?.id ? String(selectedBranch.id) : "";
      if (selectedBranch?.id) {
        const updateResponse = await api.updateBranch(selectedBranch.id, payload);
        savedBranchId = updateResponse?.data?.id ? String(updateResponse.data.id) : savedBranchId;
      } else {
        const createResponse = await api.createBranch(payload);
        savedBranchId = createResponse?.data?.id ? String(createResponse.data.id) : "";
      }
      const refreshResult = await refreshKitchenData?.(undefined, undefined, savedBranchId);
      if (!savedBranchId && Array.isArray(refreshResult?.branches)) {
        const createdBranch = refreshResult.branches.find(
          (branch) => String(branch.name).trim() === String(payload.name).trim()
        );
        savedBranchId = createdBranch?.id ? String(createdBranch.id) : "";
        if (savedBranchId) await refreshKitchenData?.(undefined, undefined, savedBranchId);
      }
      if (savedBranchId) {
        setStoredSelectedBranchId(savedBranchId);
        setSelectedBranchId(savedBranchId);
      }
      const successText = selectedBranch?.id ? "Branch updated successfully!" : "Branch saved successfully!";
      setMessageType("success");
      setMessage(successText);
      onToast?.({ message: successText, type: "success" });
      navigate("/ingredients");
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to save branch");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] text-white shadow-[0_6px_16px_rgba(141,6,6,0.35)]">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">
              {selectedBranch?.id ? "Edit Branch Details" : "Add New Kitchen Branch"}
            </h2>
            <p className="text-xs font-semibold text-[#64748b]">
              {apiState?.kitchen?.kitchenName || "Enterprise Kitchen Profile"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#fff1f1] px-4 py-2 text-xs font-bold text-[#8D0606]">
            <UtensilsCrossed size={16} />
            <span>{branchList.length} Active Branches</span>
          </div>
        </div>
      </div>

      {/* Branch Selector & Metrics Panel */}
      <FormPanel title="Branch Switcher & Overview" icon={Building2}>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2.5">
            <button
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                selectedBranchId === "new"
                  ? "bg-[#8D0606] text-white shadow-[0_6px_16px_rgba(141,6,6,0.3)]"
                  : "bg-[#fff1f1] text-[#8D0606] hover:bg-[#ffe4e4]"
              }`}
              onClick={() => setSelectedBranchId("new")}
              type="button"
            >
              <span className="flex items-center gap-2">
                <Plus size={16} /> Add New Branch
              </span>
              <ChevronRight size={16} />
            </button>
            <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
              {branchList.map((branch) => {
                const isSelected = String(selectedBranchId) === String(branch.id);
                return (
                  <button
                    key={branch.id}
                    className={`w-full rounded-xl p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-[#8D0606] text-white shadow-[0_4px_12px_rgba(141,6,6,0.25)]"
                        : "bg-[#f8fafc] text-[#334155] hover:bg-[#f1f5f9]"
                    }`}
                    onClick={() => selectBranchForEdit(branch.id)}
                    type="button"
                  >
                    <span className="block text-sm font-bold truncate">
                      {branch.name || `Branch ${branch.id}`}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs font-semibold ${
                        isSelected ? "text-white/80" : "text-[#64748b]"
                      }`}
                    >
                      {branch.area || branch.pincode || "No area details"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <ApiCount
              label="Total Branches"
              value={branchList.length}
              icon={Building2}
              color="red"
              badge="Configured"
            />
            <ApiCount
              label="Mode"
              value={selectedBranch?.id ? "Edit Mode" : "New Entry"}
              icon={Sparkles}
              color="emerald"
              badge={selectedBranch?.id ? `ID: ${selectedBranch.id}` : "Create"}
            />
            <ApiCount
              label="Active Cuisines"
              value={apiState?.cuisines?.length || 0}
              icon={UtensilsCrossed}
              color="amber"
              badge="Master DB"
            />
            <ApiCount
              label="Plans Loaded"
              value={apiState?.plans?.length || 0}
              icon={Layers}
              color="sky"
              badge="Subscriptions"
            />
          </div>
        </div>
      </FormPanel>

      {/* Basic Details Panel */}
      <FormPanel title="Basic Details" icon={Building2}>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            ref={fieldRefs.name}
            icon={Building2}
            label="Branch / Kitchen Name"
            required
            placeholder="e.g. Royal Spice Cloud Kitchen - Andheri"
            value={form.name}
            onChange={updateForm("name")}
            error={errors.name}
          />
          <TextField
            icon={Sparkles}
            label="Brand"
            placeholder="Brand name (defaults to main kitchen)"
            value={form.brand}
            onChange={updateForm("brand")}
          />
          <SelectField
            ref={fieldRefs.cuisineIds}
            label="Cuisines Offered"
            required
            isMulti
            options={cuisineOptions}
            value={cuisineOptions.filter((option) => form.cuisineIds?.includes(option.value))}
            onChange={(selected) => {
              setForm((f) => ({ ...f, cuisineIds: (selected || []).map((option) => option.value) }));
              setErrors((current) => (current.cuisineIds ? { ...current, cuisineIds: undefined } : current));
            }}
            placeholder="Select one or more cuisines"
            error={errors.cuisineIds}
          />
          <TextField
            ref={fieldRefs.area}
            icon={MapPin}
            label="Area / Zone"
            required
            placeholder="e.g. Andheri East, BKC"
            value={form.area}
            onChange={updateForm("area")}
            error={errors.area}
          />
          <TextField
            ref={fieldRefs.addressLine1}
            label="Full Address"
            required
            textarea
            className="md:col-span-2"
            placeholder="Enter complete building, street, and address details"
            value={form.addressLine1}
            onChange={updateForm("addressLine1")}
            error={errors.addressLine1}
          />
        </div>
      </FormPanel>

      {/* Operational Info Panel */}
      <FormPanel title="Operational Timings & Limits" icon={Clock}>
        <div className="grid gap-5 md:grid-cols-2">
          <TimePickerInput
            label="Opening Time"
            value={form.openingTime}
            onChange={(val) => {
              setForm((f) => ({ ...f, openingTime: val }));
              setErrors((current) => (current.closingTime ? { ...current, closingTime: undefined } : current));
            }}
          />
          <TimePickerInput
            ref={fieldRefs.closingTime}
            label="Closing Time"
            value={form.closingTime}
            onChange={(val) => {
              setForm((f) => ({ ...f, closingTime: val }));
              setErrors((current) => (current.closingTime ? { ...current, closingTime: undefined } : current));
            }}
            error={errors.closingTime}
          />
          <TextField
            ref={fieldRefs.prepTime}
            icon={Clock}
            label="Average Prep Time (Mins)"
            placeholder="e.g. 20"
            type="number"
            min="0"
            value={form.prepTime}
            onChange={updateForm("prepTime")}
            error={errors.prepTime}
          />
          <TextField
            ref={fieldRefs.maxOrdersPerDay}
            icon={ShieldCheck}
            label="Max Orders Per Day"
            placeholder="e.g. 200"
            type="number"
            min="0"
            value={form.maxOrdersPerDay}
            onChange={updateForm("maxOrdersPerDay")}
            error={errors.maxOrdersPerDay}
          />
        </div>
      </FormPanel>

      {/* Contact & Location Panel */}
      <FormPanel title="Manager Contact & Location" icon={User}>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            ref={fieldRefs.contactFirstName}
            icon={User}
            label="First Name"
            required
            placeholder="Contact manager first name"
            value={form.contactFirstName}
            onChange={updateForm("contactFirstName")}
            error={errors.contactFirstName}
          />
          <TextField
            ref={fieldRefs.contactLastName}
            icon={User}
            label="Last Name"
            required
            placeholder="Contact manager last name"
            value={form.contactLastName}
            onChange={updateForm("contactLastName")}
            error={errors.contactLastName}
          />
          <TextField
            ref={fieldRefs.contactEmail}
            icon={Mail}
            label="Email Address"
            required
            type="email"
            placeholder="manager@kitchen.com"
            value={form.contactEmail}
            onChange={updateForm("contactEmail")}
            error={errors.contactEmail}
          />
          <TextField
            ref={fieldRefs.contactPhone}
            icon={Phone}
            label="Phone Number"
            required
            placeholder="10-digit mobile number"
            value={form.contactPhone}
            onChange={updateForm("contactPhone")}
            error={errors.contactPhone}
          />
          <SelectField
            ref={fieldRefs.countryId}
            label="Country"
            required
            options={countryOptions}
            value={findOption(countryOptions, form.countryId)}
            onChange={(option) => {
              setForm((f) => ({ ...f, countryId: option?.value || "" }));
              setErrors((current) => (current.countryId ? { ...current, countryId: undefined } : current));
            }}
            placeholder="Select country"
            error={errors.countryId}
          />
          <SelectField
            ref={fieldRefs.cityId}
            label="City"
            required
            options={cityOptions}
            value={findOption(cityOptions, form.cityId)}
            onChange={(option) => {
              setForm((f) => ({ ...f, cityId: option?.value || "" }));
              setErrors((current) => (current.cityId ? { ...current, cityId: undefined } : current));
            }}
            placeholder="Select city"
            isLoading={locationOptions.loading}
            error={errors.cityId}
          />
          <div className="grid grid-cols-[1fr_140px] gap-4">
            <SelectField
              ref={fieldRefs.stateId}
              label="State"
              required
              options={stateOptions}
              value={findOption(stateOptions, form.stateId)}
              onChange={(option) => {
                setForm((f) => ({ ...f, stateId: option?.value || "" }));
                setErrors((current) => (current.stateId ? { ...current, stateId: undefined } : current));
              }}
              placeholder="Select state"
              isLoading={locationOptions.loading}
              error={errors.stateId}
            />
            <TextField
              ref={fieldRefs.pincode}
              label="Pincode"
              required
              placeholder="e.g. 400069"
              value={form.pincode}
              onChange={updateForm("pincode")}
              error={errors.pincode}
            />
          </div>
        </div>
        {locationOptions.loading ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-[#8D0606]">
            <Loader variant="button" text="Loading location databases..." />
          </div>
        ) : null}
      </FormPanel>

      {/* Status Panel */}
      <FormPanel title="Branch Availability Status" icon={ShieldCheck}>
        <div className="grid gap-6 md:grid-cols-2">
          <StatusInput
            checked={form.kitchenActive}
            onChange={(val) => setForm((f) => ({ ...f, kitchenActive: val }))}
            label="Kitchen Active Status"
            description="Controls whether this branch appears active across all operations"
          />
          <StatusInput
            checked={form.acceptingOrders}
            onChange={(val) => setForm((f) => ({ ...f, acceptingOrders: val }))}
            label="Accepting Orders Online"
            description="Toggles live order acceptance for online customers & aggregators"
          />
        </div>
      </FormPanel>

      {/* Third-Party Integrations */}
      <FormPanel title="Aggregator Platform Integrations" icon={Globe}>
        <div className="mb-6 flex flex-wrap gap-x-12 gap-y-3 text-sm font-semibold text-[#475569]">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="size-4 rounded accent-[#8D0606]" />
            <span>Swiggy Aggregator</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="size-4 rounded accent-[#8D0606]" />
            <span>Zomato Aggregator</span>
          </label>
        </div>
        <TextField
          label="External Kitchen POS Code"
          placeholder="e.g. POS-SK-98721"
        />
      </FormPanel>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-40 flex flex-col items-end gap-3 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="flex flex-wrap justify-end items-center gap-3 w-full sm:w-auto">
          {selectedBranch?.id ? (
            <button
              className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 transition duration-200 hover:bg-rose-100 disabled:opacity-60"
              disabled={saving}
              onClick={deleteSelectedBranch}
              type="button"
            >
              <Trash2 size={16} />
              <span>Delete Branch</span>
            </button>
          ) : null}
          <button
            className="flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 transition duration-200 hover:bg-slate-200"
            onClick={() => navigate("/")}
            type="button"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button
            className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-bold text-white shadow-[0_8px_20px_rgba(141,6,6,0.3)] transition duration-200 hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
            disabled={saving}
            onClick={saveBranch}
            type="button"
          >
            {saving ? (
              <Loader variant="button" text={selectedBranch?.id ? "Updating Branch..." : "Saving Branch..."} />
            ) : (
              <>
                <Save size={18} />
                <span>{selectedBranch?.id ? "Update Branch" : "Save Branch"}</span>
              </>
            )}
          </button>
        </div>
        {message ? (
          <p
            className={`flex items-center gap-1.5 text-xs font-bold ${
              messageType === "error" ? "text-rose-600" : messageType === "success" ? "text-emerald-600" : "text-[#8D0606]"
            }`}
          >
            {messageType === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{message}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FormPanel({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4">
        {Icon ? <Icon size={18} className="text-[#8D0606]" /> : null}
        <h3 className="text-base font-bold tracking-tight text-[#0f172a]">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}