import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getApiErrorMessage, getStoredToken, setStoredToken } from "../api";
import {
  getStoredSelectedBranchId,
  hasActiveKitchenSubscription,
  isKitchenOnboardingCompleted,
  resolveSelectedBranchId,
  setStoredSelectedBranchId,
} from "../utils/helpers";

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
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

  const updateApiState = (patch) => setApiState((current) => ({ ...current, ...patch }));

  const refreshKitchenData = async (token = apiState.token, kitchen = apiState.kitchen, branchIdOverride = "") => {
    if (!token) return { subscriptionUnlocked: false };
    if (kitchen?.isOnboardingCompleted === false) {
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
        } catch {
          menus = [];
        }
        try {
          const ingredientResponse = await api.branchIngredients(selectedBranchId);
          branchIngredients = Array.isArray(ingredientResponse?.data) ? ingredientResponse.data : [];
        } catch {
          branchIngredients = [];
        }
        try {
          const stockResponse = await api.stocks(selectedBranchId);
          stocks = Array.isArray(stockResponse?.data) ? stockResponse.data : [];
        } catch {
          stocks = [];
        }
      }
      const selectedPlan = hasActiveKitchenSubscription(kitchen)
        ? apiState.selectedPlan
        : apiState.selectedPlan || { alreadyActive: true, confirmedActive: true, name: "Active Subscription" };
      updateApiState({ branches, menus, branchIngredients, stocks, selectedBranchId, selectedPlan, branchesMeta: branchesResponse?.meta });
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
        const [cuisineResponse, ingredientResponse, planResponse, countryResponse] = await Promise.allSettled([api.cuisines(), api.ingredients(), api.plans(), api.countries()]);
        if (!mounted) return;
        updateApiState({
          online: true,
          loading: false,
          message: "API connected",
          cuisines: cuisineResponse.status === "fulfilled" ? (Array.isArray(cuisineResponse.value?.data) ? cuisineResponse.value.data : Array.isArray(cuisineResponse.value) ? cuisineResponse.value : []) : [],
          ingredients: ingredientResponse.status === "fulfilled" ? (Array.isArray(ingredientResponse.value?.data) ? ingredientResponse.value.data : Array.isArray(ingredientResponse.value) ? ingredientResponse.value : []) : [],
          plans: planResponse.status === "fulfilled" ? (Array.isArray(planResponse.value?.data) ? planResponse.value.data : Array.isArray(planResponse.value) ? planResponse.value : []) : [],
          countries: countryResponse.status === "fulfilled" ? (Array.isArray(countryResponse.value?.data) ? countryResponse.value.data : Array.isArray(countryResponse.value) ? countryResponse.value : []) : [],
        });

        const token = getStoredToken();
        if (token) {
          try {
            const verified = await api.verify(token);
            if (!mounted) return;
            const verifiedKitchen = verified?.kitchen || verified?.data?.kitchen || null;
            updateApiState({ token, kitchen: verifiedKitchen });
            await refreshKitchenData(token, verifiedKitchen);
          } catch {
            setStoredToken("");
            updateApiState({ token: "", kitchen: null });
          }
        }
      } catch (error) {
        if (!mounted) return;
        updateApiState({
          online: false,
          loading: false,
          message: `API offline: ${getApiErrorMessage(error, "Unable to connect API")}`,
        });
      }
    }
    boot();
    return () => {
      mounted = false;
    };
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
      return { response, nextPage: "Onboarding" };
    }

    const verifiedKitchen = await reloadKitchenProfile(kitchen || {});
    const refreshResult = await refreshKitchenData(token, verifiedKitchen);
    const existingSubscription = hasActiveKitchenSubscription(verifiedKitchen) || refreshResult?.subscriptionUnlocked;
    updateApiState({
      selectedPlan: existingSubscription ? { alreadyActive: true, confirmedActive: true, name: "Active Subscription" } : null,
      message: existingSubscription ? "Existing active subscription found." : "Select a subscription plan to continue.",
    });
    const nextPage = existingSubscription
      ? (Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "Ingredient Add" : "Add / Edit Kitchen")
      : "Subscription Plans";
    return { response, nextPage };
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
      return { exists: true, nextPage: Array.isArray(branchRefreshResult?.branches) && branchRefreshResult.branches.length ? "Ingredient Add" : "Add / Edit Kitchen" };
    }

    const refreshResult = await refreshKitchenData(apiState.token, kitchen);
    if (refreshResult?.subscriptionUnlocked) {
      updateApiState({
        selectedPlan: { alreadyActive: true, confirmedActive: true, name: "Active Subscription" },
        kitchen,
        message: "Existing active subscription found.",
      });
      return { exists: true, nextPage: Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "Ingredient Add" : "Add / Edit Kitchen" };
    }
    return { exists: false };
  };

  const handleOnboardingCompleted = async () => {
    const kitchen = await reloadKitchenProfile({ isOnboardingCompleted: true });
    updateApiState({ message: "Onboarding completed. Select a subscription plan." });
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
    return Array.isArray(refreshResult?.branches) && refreshResult.branches.length ? "Ingredient Add" : "Add / Edit Kitchen";
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
  };

  return (
    <ApiContext.Provider
      value={{
        apiState,
        updateApiState,
        refreshKitchenData,
        reloadKitchenProfile,
        handleLogin,
        checkExistingSubscription,
        handleOnboardingCompleted,
        handlePlanSelected,
        handleBranchChange,
        handleLogout,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApiState() {
  const context = useContext(ApiContext);
  if (!context) throw new Error("useApiState must be used within an ApiProvider");
  return context;
}
