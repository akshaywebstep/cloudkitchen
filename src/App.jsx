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
import { foodImages } from "./constants/mockData";

// Layout components
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { Toast } from "./components/ui/Toast";

// Desktop auth & setup
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./components/desktop/auth/DesktopAuthPage";
import { SetupFlowPage } from "./components/desktop/setup/SetupFlowPage";

// Desktop pages
import { DashboardPage } from "./components/desktop/pages/DashboardPage";
import { AnalyticsPage } from "./components/desktop/pages/AnalyticsPage";
import { OrderListPage } from "./components/desktop/pages/OrderListPage";
import { OrderPage } from "./components/desktop/pages/OrderPage";
import { CustomerListPage } from "./components/desktop/pages/CustomerListPage";
import { CategoryPage } from "./components/desktop/pages/CategoryPage";
import { AddMenuPage } from "./components/desktop/pages/AddMenuPage";
import { CustomerReviewPage } from "./components/desktop/pages/CustomerReviewPage";
import { KitchenFormPage } from "./components/desktop/pages/KitchenFormPage";
import { IngredientSetupPage } from "./components/desktop/pages/IngredientSetupPage";
import { UtilityPage } from "./components/desktop/pages/UtilityPage";

// Mobile app
import { MobileApp } from "./components/mobile/MobileApp";

// Detect mobile viewport (below Tailwind's lg = 1024px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [toast, setToast] = useState(null);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    if (kitchen && !isKitchenOnboardingCompleted(kitchen)) {
      updateApiState({
        branches: [],
        menus: [],
        branchIngredients: [],
        stocks: [],
        selectedBranchId: "",
        message: "Complete onboarding first, then select a plan to enable branch APIs.",
      });  
      setStoredSelectedBranchId("");
      return { subscriptionUnlocked: false, setupStep: "onboarding" };
    }
    try {
      const branchesResponse = await api.branches();
      const branches = Array.isArray(branchesResponse?.data) ? branchesResponse.data : [];
      const selectedBranchId = resolveSelectedBranchId(branches, branchIdOverride || apiState.selectedBranchId || getStoredSelectedBranchId());
      setStoredSelectedBranchId(selectedBranchId);
      let menus = [];
      let branchIngredients = [];
      let stocks = [];
      if (selectedBranchId) {
        try {
          const menuResponse = await api.menus(selectedBranchId);
          menus = Array.isArray(menuResponse?.data) ? menuResponse.data : [];
        } catch (_) { menus = []; }
        try {
          const ingredientResponse = await api.branchIngredients(selectedBranchId);
          branchIngredients = Array.isArray(ingredientResponse?.data) ? ingredientResponse.data : [];
        } catch (_) { branchIngredients = []; }
        try {
          const stockResponse = await api.stocks(selectedBranchId);
          stocks = Array.isArray(stockResponse?.data) ? stockResponse.data : [];
        } catch (_) { stocks = []; }
      }
      const selectedPlan = hasActiveKitchenSubscription(kitchen)
        ? apiState.selectedPlan
        : apiState.selectedPlan || { alreadyActive: true, confirmedActive: true, name: "Active Subscription" };
      updateApiState({ branches, menus, branchIngredients, stocks, selectedBranchId, selectedPlan });
      return { subscriptionUnlocked: true, branches };
    } catch (error) {
      const message = getApiErrorMessage(error, "Kitchen APIs need login/onboarding/subscription");
      const setupMessage = message.toLowerCase().includes("onboarding")
        ? "Complete onboarding first, then select a plan to enable branch APIs."
        : message.toLowerCase().includes("subscription")
          ? "Select a subscription plan to enable branch APIs."
          : message;
      updateApiState({ branches: [], menus: [], branchIngredients: [], stocks: [], selectedBranchId: "", message: setupMessage });
      setStoredSelectedBranchId("");
      return { subscriptionUnlocked: false, message: setupMessage };
    }
  };

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        await api.health();
        const [cuisineResponse, ingredientResponse, planResponse, countryResponse] = await Promise.allSettled([
          api.cuisines(),
          api.ingredients(),
          api.plans(),
          api.countries(),
        ]);
        if (!mounted) return;

        const cuisines = cuisineResponse.status === "fulfilled" && Array.isArray(cuisineResponse.value?.data) ? cuisineResponse.value.data : [];
        const ingredients = ingredientResponse.status === "fulfilled" && Array.isArray(ingredientResponse.value?.data) ? ingredientResponse.value.data : [];
        const plans = planResponse.status === "fulfilled" && Array.isArray(planResponse.value?.data) ? planResponse.value.data : [];
        const countries = countryResponse.status === "fulfilled" && Array.isArray(countryResponse.value?.data) ? countryResponse.value.data : [];

        const token = getStoredToken();
        let verifiedKitchen = null;

        if (token) {
          try {
            const verified = await api.verify(token);
            if (mounted) {
              verifiedKitchen = verified?.kitchen || verified?.data?.kitchen || null;
            }
          } catch {
            setStoredToken("");
          }
        }

        if (!mounted) return;

        updateApiState({
          online: true,
          token: verifiedKitchen ? token : "",
          kitchen: verifiedKitchen,
          cuisines,
          ingredients,
          plans,
          countries,
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
    const fallbackKitchen = { ...(apiState.kitchen || {}), ...fallbackPatch };
    try {
      const verified = await api.verify(token);
      const verifiedKitchen = verified?.kitchen || verified?.data?.kitchen || fallbackKitchen;
      updateApiState({ kitchen: { ...verifiedKitchen, ...fallbackPatch } });
      return { ...verifiedKitchen, ...fallbackPatch };
    } catch {
      updateApiState({ kitchen: fallbackKitchen });
      return fallbackKitchen;
    }
  };

  const handleLogin = async ({ username, password }) => {
    const response = await api.login({ username, password });
    const token = response?.data?.token;
    if (!token) throw new Error("Login response did not include token");
    const kitchen = response?.data?.kitchen || null;
    setStoredToken(token);
    updateApiState({ token, kitchen, online: true, message: "Logged in" });
    if (!isKitchenOnboardingCompleted(kitchen)) {
      await refreshKitchenData(token, kitchen);
      navigate("/onboarding");
      return response;
    }

    const verifiedKitchen = await reloadKitchenProfile(kitchen || {});
    const refreshResult = await refreshKitchenData(token, verifiedKitchen);
    const existingSubscription = hasActiveKitchenSubscription(verifiedKitchen) || refreshResult?.subscriptionUnlocked;
    updateApiState({
      selectedPlan: existingSubscription ? { alreadyActive: true, confirmedActive: true, name: "Active Subscription" } : null,
      message: existingSubscription ? "Existing active subscription found." : "Select a subscription plan to continue.",
    });
    const nextPath = existingSubscription
      ? (Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "/ingredients" : "/kitchen")
      : "/subscription";
    navigate(nextPath);
    return response;
  };

  const checkExistingSubscription = async () => {
    const kitchen = await reloadKitchenProfile(apiState.kitchen || {});
    if (hasActiveKitchenSubscription(kitchen)) {
      updateApiState({
        selectedPlan: { alreadyActive: true, confirmedActive: true, name: "Active Subscription" },
        kitchen,
        message: "Existing active subscription found.",
      });
      const branchRefreshResult = await refreshKitchenData(apiState.token, kitchen);
      navigate(Array.isArray(branchRefreshResult?.branches) && branchRefreshResult.branches.length ? "/ingredients" : "/kitchen");
      return true;
    }
    const refreshResult = await refreshKitchenData(apiState.token, kitchen);
    if (refreshResult?.subscriptionUnlocked) {
      updateApiState({
        selectedPlan: { alreadyActive: true, confirmedActive: true, name: "Active Subscription" },
        kitchen,
        message: "Existing active subscription found.",
      });
      navigate(Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "/ingredients" : "/kitchen");
      return true;
    }
    return false;
  };

  const handleOnboardingCompleted = async () => {
    await reloadKitchenProfile({ isOnboardingCompleted: true });
    updateApiState({ message: "Onboarding completed. Select a subscription plan." });
    navigate("/subscription");
  };

  const handlePlanSelected = async (plan) => {
    const kitchen = await reloadKitchenProfile({});
    const selectedPlan = { ...plan, confirmedActive: Boolean(plan?.confirmedActive), alreadyActive: Boolean(plan?.alreadyActive) };
    updateApiState({
      selectedPlan,
      kitchen,
      message: selectedPlan.alreadyActive ? "Existing active subscription found." : "Subscription plan selected.",
    });
    const refreshResult = await refreshKitchenData(apiState.token, kitchen);
    navigate(Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "/ingredients" : "/kitchen");
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
    updateApiState({ token: "", kitchen: null, branches: [], menus: [], branchIngredients: [], stocks: [], selectedBranchId: "", selectedPlan: null, message: "Logged out" });
    triggerToast({ message: "Logged out successfully", type: "info" });
    navigate("/login");
  };

  const liveMenuItems = useMemo(() => {
    if (!apiState.menus.length) return [];
    return apiState.menus.map((menu) => ({
      name: menu.name || "Menu Item",
      price: menu.price ? `$${Number(menu.price).toFixed(2)}` : "$5.59",
      image: menu.image || foodImages[1],
      description: menu.description || "Live menu item from backend",
    }));
  }, [apiState.menus]);

  // ── Boot splash ─────────────────────────────────────────────────────────────
  if (apiState.loading) {
    return <Loader variant="page" text="Initializing application..." />;
  }

  // ── Mobile app (single Routes tree, no parallel routing) ────────────────────
  if (isMobile) {
    return (
      <>
        <Routes>
          <Route path="/mobile/*" element={<MobileApp apiState={apiState} onLogin={handleLogin} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/mobile/splash" replace />} />
        </Routes>
        {toast && (
          <Toast
            message={typeof toast === "string" ? toast : toast.message}
            type={typeof toast === "string" ? "info" : toast.type || "info"}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // ── Desktop app (single Routes tree, no parallel routing) ───────────────────
  const requiredSetupStep = getRequiredSetupStep(apiState);


  const isAuthPath = ["/login", "/register", "/forgot-password"].includes(location.pathname);

  let desktopContent = null;
  if (isAuthPath || !apiState.token) {
    desktopContent = (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} onToast={triggerToast} />} />
        <Route path="/register" element={<RegisterPage onToast={triggerToast} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage onToast={triggerToast} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  } else if (requiredSetupStep) {
    desktopContent = (
      <Routes>
        <Route
          path="/onboarding"
          element={
            <SetupFlowPage
              mode="onboarding"
              apiState={apiState}
              onToast={triggerToast}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onOnboardingCompleted={handleOnboardingCompleted}
              onPlanSelected={handlePlanSelected}
              onCheckExistingSubscription={checkExistingSubscription}
            />
          }
        />
        <Route
          path="/subscription"
          element={
            <SetupFlowPage
              mode="subscription"
              apiState={apiState}
              onToast={triggerToast}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onOnboardingCompleted={handleOnboardingCompleted}
              onPlanSelected={handlePlanSelected}
              onCheckExistingSubscription={checkExistingSubscription}
            />
          }
        />
        <Route path="*" element={<Navigate to={requiredSetupStep === "onboarding" ? "/onboarding" : "/subscription"} replace />} />
      </Routes>
    );
  } else {
    // Main dashboard
    desktopContent = (
      <>
        <Sidebar collapsed={sidebarCollapsed} />
        <main className={`min-w-0 flex-1 transition-all duration-300 mainContentBox ${sidebarCollapsed ? "lg:pl-[90px]" : "lg:pl-[300px]"}`}>
          <Topbar
            apiState={apiState}
            onLogout={handleLogout}
            onToast={triggerToast}
            onLogin={handleLogin}
            refreshKitchenData={refreshKitchenData}
            onBranchChange={handleBranchChange}
            onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          />
          <div className="page-shell px-5 py-7 sm:px-8 lg:px-10">
            <Routes>
              <Route path="/" element={<DashboardPage apiState={apiState} />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/orders" element={<OrderListPage />} />
              <Route path="/customers" element={<CustomerListPage />} />
              <Route path="/menu" element={<CategoryPage liveMenuItems={liveMenuItems} apiState={apiState} />} />
              <Route path="/add-menu" element={<AddMenuPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
              <Route path="/reviews" element={<CustomerReviewPage />} />
              <Route path="/kitchen" element={<KitchenFormPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />} />
              <Route
                path="/ingredients"
                element={
                  <IngredientSetupPage
                    apiState={apiState}
                    refreshKitchenData={refreshKitchenData}
                    selectedPlan={apiState.selectedPlan || getKitchenSubscription(apiState.kitchen)}
                    onToast={triggerToast}
                  />
                }
              />
              <Route path="/icons" element={<UtilityPage title="Icons" subtitle="Reusable action icons and quick links for the kitchen app." />} />
              <Route path="/table" element={<UtilityPage title="Table" subtitle="Compact restaurant data table preview." />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F6F6] text-[#191919] mainContainer">
      {desktopContent}
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
