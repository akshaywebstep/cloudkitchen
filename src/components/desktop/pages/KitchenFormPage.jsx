import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Search,
  Check,
  ArrowLeft,
  Store,
  SlidersHorizontal,
  Flame,
  Calendar,
  Radio,
  ExternalLink,
  Edit3,
  Boxes,
  Users,
  Eye,
  Power,
  RefreshCw,
  Map,
  Compass,
  Zap,
} from "lucide-react";
import { StatusInput } from "../../ui/StatusInput";
import { TimePickerInput } from "../../ui/TimePickerInput";
import { Loader } from "../../ui/Loader";
import { AppSelect } from "../../ui/AppSelect";
import { Pagination } from "../../ui/Pagination";
import { api, getApiBaseUrl, getStoredToken, getApiErrorMessage } from "../../../api";
import {
  getBranchLabel,
  hasSelectedSubscription,
  isKitchenOnboardingCompleted,
  resolveSelectedBranchId,
  setStoredSelectedBranchId,
} from "../../../utils/helpers";

// ---------------------------------------------------------------------------
// Shared styling for react-select dropdowns
// ---------------------------------------------------------------------------
const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#8D0606" : "#e2e8f0",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${hasError ? "rgba(239, 68, 68, 0.15)" : "rgba(141, 6, 6, 0.12)"}`
      : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    "&:hover": { borderColor: hasError ? "#ef4444" : "#8D0606" },
    paddingLeft: 4,
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8", fontSize: 13 }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: state.isSelected ? "#8D0606" : state.isFocused ? "#fff1f1" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    padding: "9px 12px",
  }),
  multiValue: (base) => ({ ...base, backgroundColor: "#fff1f1", borderRadius: 8, padding: "2px 4px" }),
  multiValueLabel: (base) => ({ ...base, color: "#8D0606", fontWeight: 600, fontSize: 12 }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#8D0606",
    borderRadius: 6,
    "&:hover": { backgroundColor: "#8D0606", color: "white" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
});

// ---------------------------------------------------------------------------
// Reusable TextField with centered icon & clean padding
// ---------------------------------------------------------------------------
const TextField = React.forwardRef(function TextField(
  { label, required, error, textarea, icon: Icon, helper, className = "", ...props },
  ref
) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#475569]">
        {label} {required ? <span className="text-[#8D0606]">*</span> : null}
      </label>
      <div className="relative flex items-center">
        {Icon && !textarea ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={17} />
        ) : null}
        <Comp
          ref={ref}
          {...props}
          rows={textarea ? 3 : undefined}
          className={`w-full rounded-xl border bg-white text-xs font-semibold text-[#0f172a] outline-none transition duration-200 placeholder:font-normal placeholder:text-[#94a3b8] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            textarea ? "p-3.5" : Icon ? "h-11 pl-11 pr-3.5" : "h-11 px-3.5"
          } ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[#e2e8f0] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        />
      </div>
      {helper && !error ? (
        <p className="mt-1 text-[11px] text-[#64748b]">{helper}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Reusable SelectField
// ---------------------------------------------------------------------------
const SelectField = React.forwardRef(function SelectField(
  { label, required, error, helper, className = "", ...props },
  ref
) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#475569]">
        {label} {required ? <span className="text-[#8D0606]">*</span> : null}
      </label>
      <Select ref={ref} styles={selectStyles(!!error)} menuPortalTarget={document.body} {...props} />
      {helper && !error ? (
        <p className="mt-1 text-[11px] text-[#64748b]">{helper}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={13} className="shrink-0" />
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

  // Pagination and live data states
  const [branches, setBranches] = useState(apiState?.branches || []);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    filtered: 0,
    count: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const branchList = branches.length > 0 ? branches : apiState?.branches || [];
  const activeBranchId = resolveSelectedBranchId(branchList, apiState?.selectedBranchId);

  // Tabs: "list" (Directory View) or "form" (Add / Edit Form)
  const [activeTab, setActiveTab] = useState(branchList.length === 0 ? "form" : "list");
  const [selectedBranchId, setSelectedBranchId] = useState(activeBranchId || "new");
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE, ACCEPTING
  const [cuisineFilter, setCuisineFilter] = useState("ALL");
  const [quickViewBranch, setQuickViewBranch] = useState(null);
  const [togglingBranchId, setTogglingBranchId] = useState(null);

  // Fetch branches with pagination and search query from backend API
  const fetchBranches = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingBranches(true);
    try {
      const params = {
        page: String(currentPage),
        limit: String(pageSize),
      };
      if (searchFilter.trim()) {
        params.search = searchFilter.trim();
      }
      const res = await api.branches(params);
      const dataArray = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setBranches(dataArray);
      if (res?.meta) {
        setMeta(res.meta);
      } else {
        setMeta({
          page: currentPage,
          limit: pageSize,
          total: dataArray.length,
          filtered: dataArray.length,
          count: dataArray.length,
          totalPages: Math.max(1, Math.ceil(dataArray.length / pageSize)),
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err) {
      if (apiState?.branches?.length) {
        setBranches(apiState.branches);
      }
    } finally {
      setLoadingBranches(false);
    }
  }, [currentPage, pageSize, searchFilter, apiState?.branches]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const selectedBranch = useMemo(() => {
    if (selectedBranchId === "new") return null;
    return branchList.find((branch) => String(branch.id) === String(selectedBranchId)) || null;
  }, [branchList, selectedBranchId]);

  const isEditing = Boolean(selectedBranch?.id);

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
    openingTime: branch?.openingTime || "09:00",
    closingTime: branch?.closingTime || "23:00",
    prepTime: branch?.prepTime || "20",
    maxOrdersPerDay: branch?.maxOrdersPerDay || "250",
    kitchenActive: branch ? branch?.isActive !== false : true,
    acceptingOrders: branch ? branch?.isAcceptingOrders !== false : true,
    swiggyEnabled: true,
    zomatoEnabled: true,
    posCode: branch?.posCode || "",
  });

  const [form, setForm] = useState(() => createBranchForm(selectedBranch));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [locationOptions, setLocationOptions] = useState({ states: [], cities: [], loading: false });
  const [cuisinesList, setCuisinesList] = useState([]);
  const [loadingCuisines, setLoadingCuisines] = useState(false);

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  // Section Refs for smooth scrolling
  const sectionRefs = {
    basic: useRef(null),
    location: useRef(null),
    manager: useRef(null),
  };

  // Refs for validated fields
  const fieldRefs = {
    name: useRef(null),
    cuisineIds: useRef(null),
    countryId: useRef(null),
    stateId: useRef(null),
    cityId: useRef(null),
    pincode: useRef(null),
    addressLine1: useRef(null),
    contactTitle: useRef(null),
    contactFirstName: useRef(null),
    contactEmail: useRef(null),
    contactPhone: useRef(null),
  };

  const fieldOrder = [
    "name",
    "cuisineIds",
    "countryId",
    "stateId",
    "cityId",
    "pincode",
    "addressLine1",
    "contactFirstName",
    "contactEmail",
    "contactPhone",
  ];

  const handleStartCreate = () => {
    setSelectedBranchId("new");
    setForm(createBranchForm(null));
    setErrors({});
    setMessage("");
    setActiveTab("form");
  };

  const handleStartEdit = (branch) => {
    const bId = String(branch.id);
    setSelectedBranchId(bId);
    setForm(createBranchForm(branch));
    setErrors({});
    setMessage("");
    setActiveTab("form");
  };

  const handleSelectActiveBranch = async (branchId) => {
    const nextBranchId = String(branchId || "");
    if (nextBranchId) {
      setStoredSelectedBranchId(nextBranchId);
      await refreshKitchenData?.(undefined, undefined, nextBranchId);
      onToast?.({ message: "Switched active branch successfully.", type: "success" });
    }
  };

  // Live Inline Toggle for Active / Operational Status
  const handleToggleBranchStatus = async (branch, event) => {
    event.stopPropagation();
    const nextStatus = branch.isActive === false;
    setTogglingBranchId(branch.id);
    try {
      await api.updateBranch(branch.id, {
        name: branch.name,
        addressLine1: branch.addressLine1 || "",
        area: branch.area || "",
        pincode: branch.pincode || "",
        countryId: Number(branch.countryId || 101),
        stateId: Number(branch.stateId || 1),
        cityId: Number(branch.cityId || 1),
        contactFirstName: branch.contactFirstName || "",
        contactLastName: branch.contactLastName || "",
        contactEmail: branch.contactEmail || "",
        contactPhone: branch.contactPhone || "",
        isActive: nextStatus,
        isAcceptingOrders: branch.isAcceptingOrders !== false,
      });
      await refreshKitchenData?.();
      onToast?.({
        message: `${branch.name || "Branch"} is now ${nextStatus ? "Operational (ONLINE)" : "Disabled (OFFLINE)"}`,
        type: "success",
      });
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to update branch status");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setTogglingBranchId(null);
    }
  };

  // Live Inline Toggle for Accepting Orders Status
  const handleToggleAcceptingOrders = async (branch, event) => {
    event.stopPropagation();
    const nextAccepting = branch.isAcceptingOrders === false;
    setTogglingBranchId(branch.id);
    try {
      await api.updateBranch(branch.id, {
        name: branch.name,
        addressLine1: branch.addressLine1 || "",
        area: branch.area || "",
        pincode: branch.pincode || "",
        countryId: Number(branch.countryId || 101),
        stateId: Number(branch.stateId || 1),
        cityId: Number(branch.cityId || 1),
        contactFirstName: branch.contactFirstName || "",
        contactLastName: branch.contactLastName || "",
        contactEmail: branch.contactEmail || "",
        contactPhone: branch.contactPhone || "",
        isActive: branch.isActive !== false,
        isAcceptingOrders: nextAccepting,
      });
      await refreshKitchenData?.();
      onToast?.({
        message: `Orders for ${branch.name || "Branch"} are now ${nextAccepting ? "Accepted LIVE" : "Paused"}`,
        type: "success",
      });
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to update order acceptance status");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setTogglingBranchId(null);
    }
  };

  // Fetch master cuisines for selection
  useEffect(() => {
    let mounted = true;
    setLoadingCuisines(true);

    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    fetch(`${getApiBaseUrl()}/master/cuisine?page=1&limit=10&name=&category=&status=ACTIVE`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        if (!mounted) return;
        try {
          const parsed = result ? JSON.parse(result) : null;
          const list = Array.isArray(parsed?.data)
            ? parsed.data
            : Array.isArray(parsed?.cuisines)
            ? parsed.cuisines
            : Array.isArray(parsed)
            ? parsed
            : [];
          setCuisinesList(list);
        } catch (err) {
          console.error("Failed to parse cuisines JSON:", err);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (mounted) setLoadingCuisines(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cuisineOptions = useMemo(() => {
    const list = cuisinesList.length ? cuisinesList : apiState?.cuisines || [];
    return list.length
      ? list.map((cuisine) => ({
          value: String(cuisine.id),
          label: cuisine.name || cuisine.title || `Cuisine ${cuisine.id}`,
        }))
      : [{ value: "1", label: "Multi-Cuisine" }];
  }, [cuisinesList, apiState?.cuisines]);

  const countryOptions = useMemo(() => {
    return apiState?.countries?.length
      ? apiState.countries.map((country) => ({
          value: String(country.id),
          label: country.name || `Country ${country.id}`,
        }))
      : [{ value: form.countryId, label: `Country #${form.countryId}` }];
  }, [apiState?.countries, form.countryId]);

  const stateOptions = useMemo(() => {
    return locationOptions.states.length
      ? locationOptions.states.map((state) => ({
          value: String(state.id),
          label: state.name || `State ${state.id}`,
        }))
      : form.stateId
      ? [{ value: form.stateId, label: `State #${form.stateId}` }]
      : [];
  }, [locationOptions.states, form.stateId]);

  const cityOptions = useMemo(() => {
    return locationOptions.cities.length
      ? locationOptions.cities.map((city) => ({
          value: String(city.id),
          label: city.name || `City ${city.id}`,
        }))
      : form.cityId
      ? [{ value: form.cityId, label: `City #${form.cityId}` }]
      : [];
  }, [locationOptions.cities, form.cityId]);

  const findOption = (options, value) => options.find((option) => String(option.value) === String(value)) || null;

  // Load States when Country changes
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

  // Load Cities when State changes
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

  // Validation
  const validate = () => {
    const next = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const pincodeRegex = /^[0-9]{4,6}$/;

    if (!form.name.trim()) next.name = "Branch / kitchen name is required.";
    if (!form.cuisineIds?.length) next.cuisineIds = "Select at least one cuisine.";
    if (!form.addressLine1.trim()) next.addressLine1 = "Full street address is required.";

    if (!form.contactFirstName.trim()) next.contactFirstName = "Manager first name is required.";

    if (!form.contactEmail.trim()) next.contactEmail = "Contact email is required.";
    else if (!emailRegex.test(form.contactEmail.trim())) next.contactEmail = "Enter a valid email address.";

    if (!form.contactPhone.trim()) next.contactPhone = "Contact phone is required.";
    else if (!phoneRegex.test(form.contactPhone.trim())) next.contactPhone = "Enter a valid 10-digit mobile number.";

    if (!form.countryId) next.countryId = "Select a country.";
    if (!form.stateId) next.stateId = "Select a state.";
    if (!form.cityId) next.cityId = "Select a city.";

    if (!form.pincode.trim()) next.pincode = "Pincode is required.";
    else if (!pincodeRegex.test(form.pincode.trim())) next.pincode = "Enter a valid 4-6 digit pincode.";

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

  const saveBranch = async () => {
    if (!apiState?.token) {
      setMessageType("error");
      setMessage("Login required before saving branch.");
      onToast?.({ message: "Login required before saving branch.", type: "error" });
      return;
    }
    if (!validate()) {
      setMessageType("error");
      setMessage("Please fill all required highlighted fields.");
      onToast?.({ message: "Please fill all required highlighted fields.", type: "warning" });
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

      // Format cuisines list strictly: [{ id: 1 }, { name: "Fusion" }]
      const formattedCuisines = (form.cuisineIds || []).map((item) => {
        if (typeof item === "object" && item !== null) {
          if (item.id && !isNaN(Number(item.id))) return { id: Number(item.id) };
          if (item.name) return { name: String(item.name).trim() };
        }
        if (!isNaN(Number(item))) return { id: Number(item) };
        return { name: String(item).trim() };
      });

      // Strict payload with ONLY the requested branch create fields
      const payload = {
        name: form.name.trim(),
        addressLine1: form.addressLine1.trim(),
        pincode: form.pincode.trim(),
        countryId: Number(form.countryId),
        stateId: Number(form.stateId),
        cityId: Number(form.cityId),
        contactTitle: (form.contactTitle || "MR").toUpperCase(),
        contactFirstName: form.contactFirstName.trim(),
        contactEmail: form.contactEmail.trim().toLowerCase(),
        contactPhone: form.contactPhone.trim(),
        cuisines: formattedCuisines.length > 0 ? formattedCuisines : [{ id: 1 }],
      };

      let savedBranchId = selectedBranch?.id ? String(selectedBranch.id) : "";
      if (selectedBranch?.id) {
        const updateResponse = await api.updateBranch(selectedBranch.id, payload);
        savedBranchId = updateResponse?.data?.id ? String(updateResponse.data.id) : savedBranchId;
      } else {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        if (apiState?.token) {
          myHeaders.append("Authorization", `Bearer ${apiState.token}`);
        }

        const raw = JSON.stringify(payload);

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(`${getApiBaseUrl()}/kitchen/branch`, requestOptions);
        const result = await response.text();
        console.log(result);

        const parsed = result ? JSON.parse(result) : null;
        if (!response.ok || parsed?.status === false) {
          throw new Error(parsed?.message || `Failed to create branch (${response.status})`);
        }
        savedBranchId = parsed?.data?.id ? String(parsed.data.id) : "";
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
      await fetchBranches(true);
      const successText = selectedBranch?.id ? "Branch updated successfully!" : "Branch created successfully!";
      setMessageType("success");
      setMessage(successText);
      onToast?.({ message: successText, type: "success" });
      setActiveTab("list");
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to save branch");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Dynamic calculations from live API data
  const dynamicStats = useMemo(() => {
    const total = branchList.length;
    const activeCount = branchList.filter((b) => b.isActive !== false).length;
    const acceptingCount = branchList.filter((b) => b.isAcceptingOrders !== false).length;
    const uniqueCities = new Set(
      branchList.map((b) => b.city?.name || b.area || b.cityId).filter(Boolean)
    ).size;
    const totalCuisinesMapped = new Set(
      branchList.flatMap((b) => (Array.isArray(b.cuisines) ? b.cuisines.map((c) => c.cuisineId || c.id) : []))
    ).size;

    return {
      total,
      activeCount,
      acceptingCount,
      uniqueCities: uniqueCities || (total > 0 ? 1 : 0),
      totalCuisinesMapped: totalCuisinesMapped || apiState?.cuisines?.length || 0,
    };
  }, [branchList, apiState?.cuisines]);

  // Filter branches for directory view
  const filteredBranches = useMemo(() => {
    return branchList.filter((branch) => {
      const searchTerms = [
        branch.name,
        branch.area,
        branch.landmark,
        branch.addressLine1,
        branch.pincode,
        branch.contactFirstName,
        branch.contactLastName,
        branch.contactEmail,
        branch.contactPhone,
        branch.city?.name,
        ...(Array.isArray(branch.cuisines) ? branch.cuisines.map((c) => c.cuisine?.name || c.name) : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchFilter.trim() || searchTerms.includes(searchFilter.toLowerCase());

      const isActive = branch.isActive !== false;
      const isAccepting = branch.isAcceptingOrders !== false;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = isActive;
      else if (statusFilter === "INACTIVE") matchesStatus = !isActive;
      else if (statusFilter === "ACCEPTING") matchesStatus = isAccepting;

      let matchesCuisine = true;
      if (cuisineFilter !== "ALL") {
        matchesCuisine =
          Array.isArray(branch.cuisines) &&
          branch.cuisines.some((c) => String(c.cuisineId || c.cuisine?.id || c.id) === String(cuisineFilter));
      }

      return matchesSearch && matchesStatus && matchesCuisine;
    });
  }, [branchList, searchFilter, statusFilter, cuisineFilter]);

  const scrollToSection = (sectionKey) => {
    const node = sectionRefs[sectionKey]?.current;
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mx-auto space-y-6 pb-16">
      {/* ── Top Hero Banner matching Reference ─────────────────────────────── */}
      <div className="relative overflow-hidden mb-6 rounded-3xl bg-white p-7 sm:p-8 shadow-xs border border-slate-200/80">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#8D0606] border border-rose-200/60">
                Kitchen Branch Network
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                <span className="size-2 rounded-full bg-emerald-500" />
                {dynamicStats.total} Active Branch Outlets
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Kitchen Branches
              </h1>
              <p className="mt-1.5 text-sm font-medium text-slate-500 max-w-2xl">
                Create and manage branch outlets, address locations, contact managers, and linked cuisine stations.
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            {activeTab === "form" ? (
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft size={15} />
                <span>Back to Branch List</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex items-center gap-2 rounded-full bg-[#8D0606] px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition-all hover:bg-[#780404] hover:shadow-lg active:scale-98"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Create New Branch</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB 1: ALL BRANCHES DIRECTORY TABLE VIEW ─────────────────────────── */}
      {activeTab === "list" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Dynamic Search & Filter Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by branch name, area, address..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-10 w-full rounded-full border border-slate-200/90 bg-slate-50/50 pl-11 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#8D0606] focus:bg-white focus:ring-2 focus:ring-[#8D0606]/10"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filter Kitchen:
              </span>
              <AppSelect
                value={cuisineFilter}
                onChange={setCuisineFilter}
                minWidth="190px"
                options={[
                  { value: "ALL", label: `All Kitchen Hubs (${branchList.length})` },
                  ...(cuisinesList.length ? cuisinesList : apiState?.cuisines || []).map((c) => ({
                    value: String(c.id),
                    label: c.name || c.title,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Branches Table */}
          {filteredBranches.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">BRANCH OUTLET</th>
                      <th className="px-6 py-4">KITCHEN HUB</th>
                      <th className="px-6 py-4">LOCATION & ADDRESS</th>
                      <th className="px-6 py-4">CONTACT MANAGER</th>
                      <th className="px-6 py-4 text-center">CUISINES</th>
                      <th className="px-6 py-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredBranches.map((branch, idx) => {
                      const isSelectedInState = String(apiState?.selectedBranchId) === String(branch.id);
                      const cuisinesCount = Array.isArray(branch.cuisines) ? branch.cuisines.length : 0;
                      const managerName =
                        [branch.contactFirstName, branch.contactLastName].filter(Boolean).join(" ") || "MR Test Branch";
                      const locationArea = branch.area || branch.city?.name || "sector 111";
                      const fullAddress =
                        [branch.addressLine1, branch.addressLine2, branch.landmark, branch.city?.name]
                          .filter(Boolean)
                          .join(", ") || "Bus Stand, Hamirpur, Himachal Pradesh";

                      return (
                        <tr
                          key={branch.id}
                          className="transition-colors duration-150 hover:bg-rose-50/20"
                        >
                          {/* Index in bold red */}
                          <td className="px-6 py-5 font-bold text-xs text-[#8D0606]">
                            #{(currentPage - 1) * pageSize + idx + 1}
                          </td>

                          {/* Branch Outlet */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/80 shadow-2xs">
                                <Building2 size={18} />
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-900">
                                  {branch.name || `Branch Outlet #${idx + 1}`}
                                </span>
                                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                                  PINCODE: {branch.pincode || "177001"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Kitchen Hub */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Store size={15} className="text-[#8D0606] shrink-0" />
                              <span className="font-bold text-xs text-slate-800">
                                {kitchen?.kitchenName || branch.brand || "Vibrant kitchen"}
                              </span>
                            </div>
                          </td>

                          {/* Location & Address */}
                          <td className="px-6 py-5 max-w-[240px]">
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="block font-bold text-xs text-slate-800 truncate">
                                  {locationArea}
                                </span>
                                <span className="block text-[11px] font-medium text-slate-400 truncate">
                                  {fullAddress}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Manager */}
                          <td className="px-6 py-5">
                            <div>
                              <span className="block font-bold text-xs text-slate-800">
                                {managerName}
                              </span>
                              {branch.contactPhone && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-0.5">
                                  <Phone size={12} className="text-slate-400 shrink-0" />
                                  <span>{branch.contactPhone}</span>
                                </div>
                              )}
                              {branch.contactEmail && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                  <Mail size={12} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[160px]">{branch.contactEmail}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Cuisines badge */}
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/80 shadow-2xs">
                              {cuisinesCount} Linked
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setQuickViewBranch(branch)}
                                title="View Details"
                                className="grid size-8 place-items-center rounded-xl bg-slate-50 text-slate-500 border border-slate-200/60 transition hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(branch)}
                                title="Edit Branch"
                                className="grid size-8 place-items-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200/60 transition hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                              >
                                <Edit3 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Pagination Bar */}
              <div className="border-t border-slate-100 p-4">
                <Pagination
                  currentPage={meta.page || currentPage}
                  totalItems={meta.total || meta.filtered || meta.count || filteredBranches.length}
                  pageSize={meta.limit || pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="grid size-16 place-items-center rounded-3xl bg-rose-50 text-[#8D0606]">
                <Store size={32} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                {searchFilter || cuisineFilter !== "ALL"
                  ? "No matching branches found"
                  : "No kitchen branches registered yet"}
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                {searchFilter || cuisineFilter !== "ALL"
                  ? "Try adjusting your search keyword or clearing the filters above."
                  : "Register your first kitchen outlet with physical address, cuisines, operating timings, and staff manager."}
              </p>
              <div className="mt-5 flex gap-3">
                {searchFilter || cuisineFilter !== "ALL" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter("");
                      setCuisineFilter("ALL");
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Reset Filter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="flex items-center gap-2 rounded-xl bg-[#8D0606] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#7a0505]"
                  >
                    <Plus size={16} />
                    <span>Create First Branch</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ADD / EDIT BRANCH FORM WITH REAL-TIME PREVIEW ────────────── */}
      {activeTab === "form" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Navigation Bar & Mode Banner */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-[#e2e8f0] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                title="Back to All Branches"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {isEditing ? `Edit Branch: ${selectedBranch?.name || ""}` : "Register New Kitchen Branch"}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      isEditing ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isEditing ? `ID #${selectedBranch?.id}` : "New Entry"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {isEditing
                    ? "Update location, assigned cuisines, operating timings, or manager contact details."
                    : "Fill in the required fields below to launch a new kitchen outlet."}
                </p>
              </div>
            </div>

            {/* Quick Section Jump Pills */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => scrollToSection("basic")}
                className="rounded-lg px-2.5 py-1 hover:bg-white hover:text-slate-900"
              >
                1. Basic & Cuisines
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("location")}
                className="rounded-lg px-2.5 py-1 hover:bg-white hover:text-slate-900"
              >
                2. Location & Address
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("manager")}
                className="rounded-lg px-2.5 py-1 hover:bg-white hover:text-slate-900"
              >
                3. Manager & Contact
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Left Column: Grouped Step Sections */}
            <div className="space-y-6">
              {/* 1. Basic Details */}
              <div ref={sectionRefs.basic}>
                <FormSection
                  step="1"
                  title="Branch Identity & Cuisines"
                  subtitle="Specify the branch name and assign the cuisines prepared at this outlet."
                  icon={Store}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      ref={fieldRefs.name}
                      icon={Building2}
                      label="Branch / Kitchen Name"
                      required
                      placeholder="e.g. Main Branch"
                      value={form.name}
                      onChange={updateForm("name")}
                      error={errors.name}
                      helper="Name of this kitchen branch outlet"
                      className="sm:col-span-2"
                    />
                    <SelectField
                      ref={fieldRefs.cuisineIds}
                      label="Cuisines Offered"
                      required
                      isMulti
                      isLoading={loadingCuisines}
                      options={cuisineOptions}
                      value={cuisineOptions.filter((option) => form.cuisineIds?.includes(option.value))}
                      onChange={(selected) => {
                        setForm((f) => ({ ...f, cuisineIds: (selected || []).map((option) => option.value) }));
                        setErrors((current) => (current.cuisineIds ? { ...current, cuisineIds: undefined } : current));
                      }}
                      placeholder="Select one or more cuisines (e.g. North Indian, Fusion)"
                      error={errors.cuisineIds}
                      helper="Select food cuisines prepared at this branch"
                      className="sm:col-span-2"
                    />
                  </div>
                </FormSection>
              </div>

              {/* 2. Location & Address */}
              <div ref={sectionRefs.location}>
                <FormSection
                  step="2"
                  title="Location & Physical Address"
                  subtitle="Geographic location and postal address for this kitchen branch."
                  icon={MapPin}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      placeholder="Select Country"
                      error={errors.countryId}
                    />
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
                      placeholder="Select State"
                      isLoading={locationOptions.loading}
                      error={errors.stateId}
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
                      placeholder="Select City"
                      isLoading={locationOptions.loading}
                      error={errors.cityId}
                    />
                    <TextField
                      ref={fieldRefs.pincode}
                      label="Pincode"
                      required
                      placeholder="e.g. 201301"
                      value={form.pincode}
                      onChange={updateForm("pincode")}
                      error={errors.pincode}
                      className="sm:col-span-2 lg:col-span-1"
                    />
                    <TextField
                      ref={fieldRefs.addressLine1}
                      label="Street Address / Shop Details"
                      required
                      placeholder="e.g. Shop No 12, Ground Floor"
                      value={form.addressLine1}
                      onChange={updateForm("addressLine1")}
                      error={errors.addressLine1}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </div>
                </FormSection>
              </div>

              {/* 3. Branch Manager & Contact */}
              <div ref={sectionRefs.manager}>
                <FormSection
                  step="3"
                  title="Contact Person & Communication"
                  subtitle="Primary point of contact for operational communication and dispatch."
                  icon={User}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      ref={fieldRefs.contactTitle}
                      label="Contact Title"
                      options={[
                        { value: "MR", label: "MR" },
                        { value: "MS", label: "MS" },
                        { value: "MRS", label: "MRS" },
                      ]}
                      value={{ value: form.contactTitle || "MR", label: form.contactTitle || "MR" }}
                      onChange={(option) => setForm((f) => ({ ...f, contactTitle: option?.value || "MR" }))}
                    />
                    <TextField
                      ref={fieldRefs.contactFirstName}
                      icon={User}
                      label="Contact Name"
                      required
                      placeholder="e.g. Rahul"
                      value={form.contactFirstName}
                      onChange={updateForm("contactFirstName")}
                      error={errors.contactFirstName}
                    />
                    <TextField
                      ref={fieldRefs.contactEmail}
                      icon={Mail}
                      label="Contact Email"
                      required
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={form.contactEmail}
                      onChange={updateForm("contactEmail")}
                      error={errors.contactEmail}
                    />
                    <TextField
                      ref={fieldRefs.contactPhone}
                      icon={Phone}
                      label="Contact Phone"
                      required
                      placeholder="e.g. 9876543210"
                      value={form.contactPhone}
                      onChange={updateForm("contactPhone")}
                      error={errors.contactPhone}
                    />
                  </div>
                </FormSection>
              </div>
            </div>

            {/* Right Column: Real-Time Live Card Preview */}
            <div className="space-y-4">
              <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-sm border border-[#e2e8f0]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-[#8D0606]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Live Branch Preview
                    </h3>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500">
                    Live
                  </span>
                </div>

                {/* Preview Card */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl font-bold text-sm bg-rose-50 text-[#8D0606] border border-rose-100">
                      <Store size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">
                        {form.name || "Main Branch"}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {form.pincode ? `PIN: ${form.pincode}` : "Pincode"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 rounded-lg bg-white p-3 text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <User size={12} className="text-[#8D0606] shrink-0" />
                      <span className="font-bold text-slate-800 truncate">
                        {form.contactTitle || "MR"} {form.contactFirstName || "Contact Person"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-600">
                        {form.contactPhone || "9876543210"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-500 truncate">
                        {form.contactEmail || "contact@example.com"}
                      </span>
                    </div>
                    {form.addressLine1 && (
                      <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100">
                        <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-600 line-clamp-2">
                          {form.addressLine1}
                        </span>
                      </div>
                    )}
                  </div>

                  {form.cuisineIds?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {cuisineOptions
                        .filter((c) => form.cuisineIds.includes(c.value))
                        .map((c) => (
                          <span
                            key={c.value}
                            className="rounded bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-[#8D0606] border border-rose-100"
                          >
                            {c.label}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-amber-50/70 p-3 text-[11px] text-amber-800 border border-amber-200/60">
                  <p className="font-bold">✨ Quick Notice:</p>
                  <p className="mt-0.5 text-amber-700">
                    Verify all 11 fields before creating. The branch will be instantly mapped to your cloud kitchen network.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-4 z-40 flex flex-col items-end gap-3 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft size={14} />
                <span>Back to All Branches</span>
              </button>
              {message && (
                <p
                  className={`flex items-center gap-1.5 text-xs font-bold ${
                    messageType === "error"
                      ? "text-rose-600"
                      : messageType === "success"
                      ? "text-emerald-600"
                      : "text-[#8D0606]"
                  }`}
                >
                  {messageType === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{message}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={saveBranch}
                className="flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-6 text-xs font-bold text-white shadow-lg shadow-rose-900/25 transition duration-200 hover:from-[#7a0505] hover:to-[#a10707] active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <Loader variant="button" text={isEditing ? "Updating Branch..." : "Saving Branch..."} />
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditing ? "Update Branch Details" : "Save & Activate Branch"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL QUICK VIEW MODAL ────────────────────────────────────────── */}
      {quickViewBranch &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
            onClick={() => setQuickViewBranch(null)}
          >
            <div
              className="relative w-full max-w-lg my-auto overflow-hidden rounded-[28px] bg-white shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 sm:px-7 py-5">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#8D0606] text-white shadow-xs">
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">
                      {quickViewBranch.name || `Branch #${quickViewBranch.id}`}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {quickViewBranch.area || "Zone details"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickViewBranch(null)}
                  className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 space-y-5 text-xs">
                {/* Status & Order Acceptance Cards */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div
                    className={`rounded-2xl p-4 border transition ${
                      quickViewBranch.isActive !== false
                        ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
                        : "bg-rose-50/70 border-rose-200/80 text-rose-900"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      STATUS
                    </span>
                    <div className="mt-1.5 flex items-center gap-2 font-bold text-[13px]">
                      <span
                        className={`size-2 rounded-full ${
                          quickViewBranch.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        }`}
                      />
                      <span>{quickViewBranch.isActive !== false ? "Operational (Online)" : "Disabled (Offline)"}</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-4 border transition ${
                      quickViewBranch.isAcceptingOrders !== false
                        ? "bg-amber-50/70 border-amber-200/80 text-amber-900"
                        : "bg-slate-100/90 border-slate-200/80 text-slate-700"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      ORDER ACCEPTANCE
                    </span>
                    <div className="mt-1.5 flex items-center gap-1.5 font-bold text-[13px]">
                      {quickViewBranch.isAcceptingOrders !== false ? (
                        <>
                          <Zap size={14} className="text-amber-600 shrink-0" fill="currentColor" />
                          <span>Live Orders Accepted</span>
                        </>
                      ) : (
                        <span>Paused</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Information Group */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="grid size-8 place-items-center rounded-xl bg-white border border-slate-200/60 text-slate-500 shadow-2xs shrink-0 mt-0.5">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Address</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-relaxed">
                        {[quickViewBranch.addressLine1, quickViewBranch.landmark, quickViewBranch.area, quickViewBranch.pincode]
                          .filter(Boolean)
                          .join(", ") || "No address configured"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3.5 border-t border-slate-200/60">
                    <div className="grid size-8 place-items-center rounded-xl bg-white border border-slate-200/60 text-slate-500 shadow-2xs shrink-0 mt-0.5">
                      <User size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Manager</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-relaxed">
                        {[quickViewBranch.contactFirstName, quickViewBranch.contactLastName].filter(Boolean).join(" ") || "None"}
                        {quickViewBranch.contactPhone ? ` • ${quickViewBranch.contactPhone}` : ""}
                        {quickViewBranch.contactEmail ? ` • ${quickViewBranch.contactEmail}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3.5 border-t border-slate-200/60">
                    <div className="grid size-8 place-items-center rounded-xl bg-white border border-slate-200/60 text-slate-500 shadow-2xs shrink-0 mt-0.5">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Operating Window</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-relaxed">
                        {quickViewBranch.openingTime || "09:00"} to {quickViewBranch.closingTime || "23:00"}{" "}
                        <span className="text-slate-400 font-medium">(~{quickViewBranch.prepTime || 20} mins prep time)</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Cuisines */}
                {Array.isArray(quickViewBranch.cuisines) && quickViewBranch.cuisines.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Assigned Cuisines
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {quickViewBranch.cuisines.length} Types
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickViewBranch.cuisines.map((c, i) => (
                        <span
                          key={i}
                          className="rounded-xl bg-[#fff1f1] px-3 py-1.5 text-xs font-bold text-[#8D0606] border border-rose-200/60 shadow-2xs"
                        >
                          {c.cuisine?.name || c.name || `Cuisine ${c.cuisineId || c.id || i + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 sm:px-7 py-4">
                <button
                  type="button"
                  onClick={() => setQuickViewBranch(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const b = quickViewBranch;
                    setQuickViewBranch(null);
                    handleStartEdit(b);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-[#8D0606] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#780404] hover:shadow-md transition active:scale-95"
                >
                  <Edit3 size={14} />
                  <span>Edit This Branch</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clean FormSection Container with Step Badge
// ---------------------------------------------------------------------------
function FormSection({ step, title, subtitle, icon: Icon, children }) {
  return (
    <section className="relative overflow-visible rounded-2xl bg-white border border-[#e2e8f0] shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-3.5 border-b border-[#f1f5f9] bg-[#fafafa] px-6 py-4 rounded-t-2xl">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#8D0606] text-xs font-bold text-white shadow-xs">
          {step}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-[#8D0606]" />}
            <h3 className="text-sm font-extrabold tracking-tight text-[#0f172a]">{title}</h3>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-[#64748b] font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}