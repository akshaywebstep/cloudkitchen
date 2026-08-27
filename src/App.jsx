import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Loader } from "./components/ui/Loader";
import { api, getApiErrorMessage, getStoredToken, setStoredToken } from "./api";
import {
  resolveSelectedBranchId,
  getStoredSelectedBranchId,
  setStoredSelectedBranchId,
  isKitchenOnboardingCompleted,
  hasActiveKitchenSubscription,
  hasSelectedSubscription,
  hasAtLeastOneBranch,
  getRequiredSetupStep,
  getKitchenSubscription,
} from "./utils/helpers";
import { canView, canCreate, canUpdate, getFirstAuthorizedRoute } from "./utils/permissions";

// Shared UI
import { Toast } from "./components/ui/Toast";

// 1. Landing Page Module
import { LandingPage } from "./landing/LandingPage";

// 2. Kitchen Portal Module
import { Sidebar } from "./kitchen/layout/Sidebar";
import { Topbar } from "./kitchen/layout/Topbar";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./kitchen/auth/DesktopAuthPage";
import { SetupFlowPage } from "./kitchen/setup/SetupFlowPage";
import { DashboardPage } from "./kitchen/pages/DashboardPage";
import { OrderListPage } from "./kitchen/pages/OrderListPage";
import { CustomerListPage } from "./kitchen/pages/CustomerListPage";
import { CategoryPage } from "./kitchen/pages/CategoryPage";
import { AddMenuPage } from "./kitchen/pages/AddMenuPage";
import { CustomerReviewPage } from "./kitchen/pages/CustomerReviewPage";
import { KitchenFormPage } from "./kitchen/pages/KitchenFormPage";
import { IngredientSetupPage } from "./kitchen/pages/IngredientSetupPage";
import { StaffListPage } from "./kitchen/pages/StaffListPage";
import { RoleListPage } from "./kitchen/pages/RoleListPage";
import { ProfilePage } from "./kitchen/pages/ProfilePage";
import { WasteManagementPage } from "./kitchen/pages/WasteManagementPage";

// 3. Super Admin Portal Module
import { AdminApp } from "./admin/App";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [apiState, setApiState] = useState({
    online: false,
    message: "Connecting API...",
    token: getStoredToken(),
    kitchen: null,
    branches: [],
    menus: [],
    branchIngredients: [],
    stocks: [],
    cuisines: [],
    ingredients: [],
    plans: [],
    countries: [],
    states: [],
    cities: [],
    selectedBranchId: getStoredSelectedBranchId(),
    selectedPlan: null,
    loading: true,
  });

  const triggerToast = (payload) => {
    if (typeof payload === "string") {
      setToast({ message: payload, type: "info" });
    } else {
      setToast(payload);
    }
  };

  const updateApiState = (patch) => setApiState((current) => ({ ...current, ...patch }));

  const refreshKitchenData = async (token = apiState.token, kitchen = apiState.kitchen, branchIdOverride = "") => {
    if (!token) return { subscriptionUnlocked: false };
    try {
      const branchesResponse = await api.branches();
      const branches = Array.isArray(branchesResponse?.data) ? branchesResponse.data : [];
      const selectedBranchId = resolveSelectedBranchId(branches, branchIdOverride || apiState.selectedBranchId || getStoredSelectedBranchId());
      setStoredSelectedBranchId(selectedBranchId);
      const selectedPlan = kitchen?.subscription || apiState.selectedPlan || null;
      updateApiState({ branches, selectedBranchId, selectedPlan, branchesMeta: branchesResponse?.meta });
      return { subscriptionUnlocked: true, branches };
    } catch (error) {
      const message = getApiErrorMessage(error, "Kitchen APIs need login/onboarding/subscription");
      updateApiState({ branches: [], selectedBranchId: "", message });
      setStoredSelectedBranchId("");
      return { subscriptionUnlocked: false, message };
    }
  };

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const token = getStoredToken();
        let verifiedKitchen = null;

        if (token) {
          try {
            const verified = await api.verify(token);
            if (mounted) {
              verifiedKitchen = verified?.kitchen || verified?.data?.kitchen || null;
              if (verifiedKitchen?.isSubscriptionActive === false) {
                setStoredToken("");
                localStorage.removeItem("cloudKitchenSubscriptionActive");
                localStorage.removeItem("cloudKitchenOnboardingCompleted");
                verifiedKitchen = null;
              } else if (verifiedKitchen?.isOnboardingCompleted === false) {
                localStorage.removeItem("cloudKitchenOnboardingCompleted");
              } else if (verifiedKitchen?.isOnboardingCompleted === true) {
                localStorage.setItem("cloudKitchenOnboardingCompleted", "true");
              }
            }
          } catch {
            setStoredToken("");
            verifiedKitchen = null;
          }
        }

        if (!mounted) return;

        updateApiState({
          online: true,
          token: verifiedKitchen ? token : "",
          kitchen: verifiedKitchen,
          selectedPlan: verifiedKitchen?.subscription || null,
          message: "API connected",
        });

        if (verifiedKitchen) {
          await refreshKitchenData(token, verifiedKitchen);
        }
      } catch (error) {
        if (!mounted) return;
        updateApiState({
          online: false,
          message: `API offline: ${getApiErrorMessage(error, "Unable to connect API")}`,
        });
      } finally {
        if (mounted) {
          updateApiState({ loading: false });
        }
      }
    }
    boot();
    return () => { mounted = false; };
  }, []);

  const reloadKitchenProfile = async (fallbackPatch = {}) => {
    const token = getStoredToken();
    try {
      const verified = await api.verify(token);
      const verifiedKitchen = verified?.kitchen || verified?.data?.kitchen || null;
      updateApiState({ kitchen: verifiedKitchen ? { ...verifiedKitchen, ...fallbackPatch } : null });
      return verifiedKitchen ? { ...verifiedKitchen, ...fallbackPatch } : null;
    } catch {
      return null;
    }
  };

  const handleLogin = async ({ username, password }) => {
    const response = await api.login({ email: username, username, password });

    const token = response?.data?.token || response?.token;
    if (!token) throw new Error("Login response did not include token");

    setStoredToken(token);

    // 2. Immediately call verify API with the fresh token
    let verifiedKitchen = response?.data?.kitchen || response?.data?.user || null;
    let verifiedSub = response?.data?.subscription || null;

    try {
      const verifyRes = await api.verify(token);
      if (verifyRes?.status && verifyRes?.data) {
        verifiedKitchen = verifyRes.data.kitchen || verifyRes.data.user || verifiedKitchen;
        verifiedSub = verifyRes.data.subscription || verifiedSub;
      }
    } catch (err) {
      console.warn("api.verify note:", err?.message);
    }

    // 1. Strict Subscription Check: Check if user has active subscription
    const hasActivePlan = 
      response?.data?.isSubscriptionActive === true ||
      response?.data?.kitchen?.isSubscriptionActive === true ||
      verifiedKitchen?.isSubscriptionActive === true ||
      hasActiveKitchenSubscription(verifiedKitchen) ||
      Boolean(verifiedSub);

    const isExplicitlyInactive = 
      response?.data?.isSubscriptionActive === false ||
      response?.data?.kitchen?.isSubscriptionActive === false ||
      verifiedKitchen?.isSubscriptionActive === false;

    if (!hasActivePlan || isExplicitlyInactive) {
      setStoredToken("");
      localStorage.removeItem("cloudKitchenSubscriptionActive");
      localStorage.removeItem("cloudKitchenOnboardingCompleted");
      updateApiState({ token: "", kitchen: null, selectedPlan: null });
      triggerToast({
        message: "⚠️ No active subscription found for this account. Please select a plan to activate your kitchen.",
        type: "error",
      });
      navigate("/subscription", {
        state: {
          requirePlanPurchase: true,
          email: username,
          kitchenName: verifiedKitchen?.kitchenName || response?.data?.kitchen?.kitchenName,
        },
      });
      throw new Error("No active subscription found. You must purchase a subscription plan before you can log in.");
    }

    localStorage.setItem("cloudKitchenSubscriptionActive", "true");

    const onboardingDone = verifiedKitchen?.isOnboardingCompleted === true;
    if (!onboardingDone) {
      localStorage.removeItem("cloudKitchenOnboardingCompleted");
    } else {
      localStorage.setItem("cloudKitchenOnboardingCompleted", "true");
    }

    updateApiState({
      token,
      kitchen: { ...verifiedKitchen, isOnboardingCompleted: onboardingDone },
      online: true,
      branches: [],
      selectedBranchId: "",
      selectedPlan: verifiedSub || verifiedKitchen?.subscription || null,
      message: "Logged in and verified successfully",
    });

    // Load actual live branches from backend API
    await refreshKitchenData(token, verifiedKitchen);

    if (!onboardingDone) {
      triggerToast({ message: "Subscription active! Please complete your kitchen onboarding.", type: "info" });
      navigate("/kitchen/dashboard");
      return response;
    }

    triggerToast({ message: "Welcome back to your Kitchen Dashboard!", type: "success" });
    navigate("/kitchen/dashboard");
    return response;
  };

  const handleSubscriptionCompleted = async (payload) => {
    const user = payload?.user || payload?.subscription?.user || {};
    const subscription = payload?.subscription || {};
    const kitchenName = user?.kitchenName || payload?.kitchenName || payload?.owner?.kitchenName || "Cloud Kitchen";
    const userEmail = user?.email || payload?.owner?.email || payload?.email || "";

    // 1. Mark subscription as verified and active
    localStorage.setItem("cloudKitchenSubscriptionActive", "true");
    localStorage.setItem("cloudKitchenOnboardingCompleted", "true");
    localStorage.setItem("cloudKitchenName", kitchenName);
    if (payload.plan) {
      localStorage.setItem("cloudKitchenPlan", JSON.stringify(payload.plan));
    }

    // 2. Set active plan in apiState
    updateApiState({
      selectedPlan: {
        ...(payload.plan || {}),
        ...subscription,
        confirmedActive: true,
      },
      message: "Subscription activated! Please log in to access your dashboard.",
    });

    triggerToast({
      message: "🎉 Payment verified & subscription activated! Please log in with your credentials.",
      type: "success",
    });

    // 3. Redirect to login page with prefilled email
    navigate("/kitchen/login", {
      state: {
        justSubscribed: true,
        email: userEmail,
      },
    });
  };

  const handleOnboardingCompleted = async (onboardingFormData) => {
    // 1. Mark onboarding as completed
    localStorage.setItem("cloudKitchenOnboardingCompleted", "true");
    if (onboardingFormData?.kitchenName) {
      localStorage.setItem("cloudKitchenName", onboardingFormData.kitchenName);
    }

    const activeToken = apiState.token || getStoredToken() || "";

    updateApiState({
      kitchen: {
        ...(apiState.kitchen || {}),
        kitchenName: onboardingFormData?.kitchenName || apiState.kitchen?.kitchenName,
        isOnboardingCompleted: true,
        fssaiNumber: onboardingFormData?.fssaiNumber,
        gstNumber: onboardingFormData?.gstNumber,
      },
      message: "Kitchen Onboarding completed! Welcome to your Dashboard.",
    });

    // Fetch live branches from backend API
    if (activeToken) {
      await refreshKitchenData(activeToken);
    }

    triggerToast({
      message: "🚀 Kitchen Onboarding verified! Welcome to your Operations Dashboard.",
      type: "success",
    });

    // 2. Redirect straight to Kitchen Dashboard
    navigate("/kitchen/dashboard");
  };

  const handleBranchChange = async (branchId) => {
    const selectedBranchId = resolveSelectedBranchId(apiState.branches, branchId);
    setStoredSelectedBranchId(selectedBranchId);
    updateApiState({ selectedBranchId });
    await refreshKitchenData(apiState.token, apiState.kitchen, selectedBranchId);
  };

  const handleLogout = () => {
    setStoredToken("");
    setStoredSelectedBranchId("");
    localStorage.removeItem("cloudKitchenOnboardingCompleted");
    updateApiState({ token: "", kitchen: null, branches: [], menus: [], branchIngredients: [], stocks: [], selectedBranchId: "", selectedPlan: null, message: "Logged out" });
    triggerToast({ message: "Logged out successfully", type: "info" });
    navigate("/kitchen/login", { replace: true });
  };

  const liveMenuItems = useMemo(() => {
    if (!apiState.menus.length) return [];
    return apiState.menus.map((menu) => ({
      name: menu.name || "Menu Item",
      price: menu.price ? `₹${Number(menu.price).toFixed(2)}` : "",
      image: menu.image || "",
      description: menu.description || "",
    }));
  }, [apiState.menus]);

  // ── Boot splash ─────────────────────────────────────────────────────────────
  if (apiState.loading && !location.pathname.startsWith("/admin")) {
    return <Loader variant="page" text="Initializing application..." />;
  }

  // Check if user has token + active plan + completed onboarding
  const hasToken = Boolean(apiState.token || getStoredToken());
  const hasSub = Boolean(apiState.selectedPlan?.confirmedActive || localStorage.getItem("cloudKitchenSubscriptionActive") === "true" || hasToken);
  const onboardingDone = apiState.kitchen?.isOnboardingCompleted === true;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F6] text-[#191919] w-full min-w-full overflow-x-hidden">
      <Routes basename="/demo/cloudkitchen">
        {/* ═══════════ 1. PUBLIC MARKETING LANDING (ROOT) ═══════════ */}
        <Route
          path="/"
          element={
            <LandingPage
              onSelectPlan={(plan) => navigate("/kitchen/subscription", { state: { selectedPlan: plan } })}
            />
          }
        />
        <Route
          path="/landing"
          element={
            <LandingPage
              onSelectPlan={(plan) => navigate("/kitchen/subscription", { state: { selectedPlan: plan } })}
            />
          }
        />
        <Route
          path="/pricing"
          element={
            <LandingPage
              onSelectPlan={(plan) => navigate("/kitchen/subscription", { state: { selectedPlan: plan } })}
            />
          }
        />

        {/* ═══════════ 2. KITCHEN AUTH & ONBOARDING ═══════════ */}
        <Route path="/kitchen/login" element={<LoginPage onLogin={handleLogin} onToast={triggerToast} />} />
        <Route
          path="/kitchen/subscription"
          element={
            <SetupFlowPage
              mode="subscription"
              apiState={apiState}
              onLogout={handleLogout}
              onSubscriptionCompleted={handleSubscriptionCompleted}
            />
          }
        />
        <Route path="/kitchen/register" element={<Navigate to="/kitchen/subscription" replace />} />
        <Route path="/kitchen/forgot-password" element={<ForgotPasswordPage onToast={triggerToast} />} />

        {/* ═══════════ 3. KITCHEN OPERATIONAL PORTAL (/kitchen/*) ═══════════ */}
        <Route
          path="/kitchen/*"
          element={
            hasToken && hasSub ? (
              <>
                <Sidebar
                  collapsed={sidebarCollapsed}
                  onLogout={handleLogout}
                  apiState={apiState}
                  mobileOpen={mobileSidebarOpen}
                  onCloseMobile={() => setMobileSidebarOpen(false)}
                />
                <main className={`min-w-0 flex-1 transition-all duration-300 mainContentBox overflow-x-hidden ${sidebarCollapsed ? "lg:pl-[90px]" : "lg:pl-[280px]"}`}>
                  <Topbar
                    apiState={apiState}
                    onLogout={handleLogout}
                    onToast={triggerToast}
                    onLogin={handleLogin}
                    refreshKitchenData={refreshKitchenData}
                    onBranchChange={handleBranchChange}
                    onToggleSidebar={() => {
                      if (window.innerWidth < 1024) {
                        setMobileSidebarOpen((v) => !v);
                      } else {
                        setSidebarCollapsed((v) => !v);
                      }
                    }}
                  />
                  <div className="page-shell px-4 py-5 sm:px-6 lg:px-10">
                    <Routes>
                      <Route path="/" element={<DashboardPage apiState={apiState} />} />
                      <Route path="dashboard" element={<DashboardPage apiState={apiState} />} />
                      <Route path="orders" element={<OrderListPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="customers" element={<CustomerListPage apiState={apiState} onToast={triggerToast} />} />
                      <Route path="menu" element={<CategoryPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="add-menu" element={<AddMenuPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="ingredients" element={<IngredientSetupPage apiState={apiState} refreshKitchenData={refreshKitchenData} selectedPlan={apiState.selectedPlan} onToast={triggerToast} />} />
                      <Route path="waste" element={<WasteManagementPage apiState={apiState} onToast={triggerToast} />} />
                      <Route path="staff" element={<StaffListPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="roles" element={<RoleListPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="branches" element={<KitchenFormPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="manage" element={<KitchenFormPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="reviews" element={<CustomerReviewPage apiState={apiState} />} />
                      <Route path="profile" element={<ProfilePage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
                      <Route path="*" element={<Navigate to="/kitchen/dashboard" replace />} />
                    </Routes>
                  </div>
                </main>

                {/* Onboarding Wizard Modal if not completed */}
                {!onboardingDone && (
                  <SetupFlowPage
                    mode="onboarding"
                    apiState={apiState}
                    onLogout={handleLogout}
                    onOnboardingCompleted={handleOnboardingCompleted}
                  />
                )}
              </>
            ) : (
              <Navigate to="/kitchen/login" state={{ from: location }} replace />
            )
          }
        />

        {/* Backward Compatibility Redirects */}
        <Route path="/login" element={<Navigate to="/kitchen/login" replace />} />
        <Route path="/subscription" element={<Navigate to="/kitchen/subscription" replace />} />
        <Route path="/register" element={<Navigate to="/kitchen/subscription" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/kitchen/forgot-password" replace />} />
        <Route path="/dashboard" element={<Navigate to="/kitchen/dashboard" replace />} />
        <Route path="/orders" element={<Navigate to="/kitchen/orders" replace />} />
        <Route path="/menu" element={<Navigate to="/kitchen/menu" replace />} />
        <Route path="/add-menu" element={<Navigate to="/kitchen/add-menu" replace />} />
        <Route path="/ingredients" element={<Navigate to="/kitchen/ingredients" replace />} />
        <Route path="/customers" element={<Navigate to="/kitchen/customers" replace />} />
        <Route path="/staff" element={<Navigate to="/kitchen/staff" replace />} />
        <Route path="/roles" element={<Navigate to="/kitchen/roles" replace />} />
        <Route path="/branches" element={<Navigate to="/kitchen/branches" replace />} />
        <Route path="/profile" element={<Navigate to="/kitchen/profile" replace />} />
        <Route path="/waste" element={<Navigate to="/kitchen/waste" replace />} />
        <Route path="/reviews" element={<Navigate to="/kitchen/reviews" replace />} />
        <Route path="/onboarding" element={<Navigate to="/kitchen/dashboard" replace />} />

        {/* ═══════════ 4. SUPER ADMIN PORTAL (/admin/*) ═══════════ */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {toast && (
        <Toast
          message={typeof toast === "string" ? toast : toast.message}
          type={typeof toast === "string" ? "info" : toast.type || "info"}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
