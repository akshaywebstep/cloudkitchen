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
import { OrderListPage } from "./components/desktop/pages/OrderListPage";
import { CustomerListPage } from "./components/desktop/pages/CustomerListPage";
import { CategoryPage } from "./components/desktop/pages/CategoryPage";
import { AddMenuPage } from "./components/desktop/pages/AddMenuPage";
import { CustomerReviewPage } from "./components/desktop/pages/CustomerReviewPage";
import { KitchenFormPage } from "./components/desktop/pages/KitchenFormPage";
import { IngredientSetupPage } from "./components/desktop/pages/IngredientSetupPage";
import { StaffListPage } from "./components/desktop/pages/StaffListPage";
import { RoleListPage } from "./components/desktop/pages/RoleListPage";
import { ProfilePage } from "./components/desktop/pages/ProfilePage";
import { WasteManagementPage } from "./components/desktop/pages/WasteManagementPage";

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

  console.log("App.jsx: apiState", apiState);
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
      const selectedPlan = hasActiveKitchenSubscription(kitchen)
        ? apiState.selectedPlan
        : apiState.selectedPlan || { alreadyActive: true, confirmedActive: true, name: "Active Subscription" };
      updateApiState({ branches, selectedBranchId, selectedPlan, branchesMeta: branchesResponse?.meta });
      return { subscriptionUnlocked: true, branches };
    } catch (error) {
      const message = getApiErrorMessage(error, "Kitchen APIs need login/onboarding/subscription");
      const setupMessage = message.toLowerCase().includes("onboarding")
        ? "Complete onboarding first, then select a plan to enable branch APIs."
        : message.toLowerCase().includes("subscription")
          ? "Select a subscription plan to enable branch APIs."
          : message;
      updateApiState({ branches: [], selectedBranchId: "", message: setupMessage });
      setStoredSelectedBranchId("");
      return { subscriptionUnlocked: false, message: setupMessage };
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
      ? (Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "/" : (canView(verifiedKitchen, "branch") ? "/kitchen" : "/"))
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
      const target = Array.isArray(branchRefreshResult?.branches) && branchRefreshResult.branches.length ? "/" : (canView(kitchen, "branch") ? "/kitchen" : "/");
      navigate(target);
      return true;
    }
    const refreshResult = await refreshKitchenData(apiState.token, kitchen);
    if (refreshResult?.subscriptionUnlocked) {
      updateApiState({
        selectedPlan: { alreadyActive: true, confirmedActive: true, name: "Active Subscription" },
        kitchen,
        message: "Existing active subscription found.",
      });
      const target = Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "/" : (canView(kitchen, "branch") ? "/kitchen" : "/");
      navigate(target);
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
    const target = Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "/" : (canView(kitchen, "branch") ? "/kitchen" : "/");
    navigate(target);
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

  // ── Main unified app (responsive for desktop, tablet, and mobile) ─────────────
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
    const firstAuthorizedRoute = getFirstAuthorizedRoute(apiState?.kitchen);

    desktopContent = (
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
              <Route
                path="/"
                element={
                  canView(apiState?.kitchen, "dashboard") ? (
                    <DashboardPage apiState={apiState} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/orders"
                element={
                  canView(apiState?.kitchen, "order") ? (
                    <OrderListPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/customers"
                element={
                  canView(apiState?.kitchen, "customer") ? (
                    <CustomerListPage apiState={apiState} onToast={triggerToast} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/staff"
                element={
                  canView(apiState?.kitchen, "staffManagement") ? (
                    <StaffListPage apiState={apiState} onToast={triggerToast} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/roles"
                element={
                  canView(apiState?.kitchen, "roleManagement") ? (
                    <RoleListPage apiState={apiState} onToast={triggerToast} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/menu"
                element={
                  canView(apiState?.kitchen, "menu") ? (
                    <CategoryPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/add-menu"
                element={
                  (canCreate(apiState?.kitchen, "menu") || canUpdate(apiState?.kitchen, "menu")) ? (
                    <AddMenuPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />
                  ) : (
                    <Navigate to={canView(apiState?.kitchen, "menu") ? "/menu" : firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/reviews"
                element={
                  canView(apiState?.kitchen, "reviews") ? (
                    <CustomerReviewPage apiState={apiState} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/kitchen"
                element={
                  canView(apiState?.kitchen, "branch") ? (
                    <KitchenFormPage apiState={apiState} refreshKitchenData={refreshKitchenData} onToast={triggerToast} />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/ingredients"
                element={
                  canView(apiState?.kitchen, "ingredient") ? (
                    <IngredientSetupPage
                      apiState={apiState}
                      refreshKitchenData={refreshKitchenData}
                      selectedPlan={apiState.selectedPlan || getKitchenSubscription(apiState.kitchen)}
                      onToast={triggerToast}
                    />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  <ProfilePage
                    apiState={apiState}
                    refreshKitchenData={refreshKitchenData}
                    onToast={triggerToast}
                  />
                }
              />
              <Route
                path="/waste"
                element={
                  canView(apiState?.kitchen, "wasteManagement") ? (
                    <WasteManagementPage
                      apiState={apiState}
                      onToast={triggerToast}
                    />
                  ) : (
                    <Navigate to={firstAuthorizedRoute} replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to={firstAuthorizedRoute} replace />} />
            </Routes>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F6F6] text-[#191919] mainContainer w-full max-w-[100vw] overflow-x-hidden">
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
