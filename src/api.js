import { STANDARD_PLANS } from "./utils/helpers";

const API_ENV = "local"; // Change to "local" for local backend.

export const API_BASE_OPTIONS = {
  local: "https://dev2.screeningstar.co.in/api/v1",
  live: "https://dev2.screeningstar.co.in/api/v1",
};
const TOKEN_KEY = "cloudKitchenToken";

function normalizeUrl(url) {
  return (url || API_BASE_OPTIONS.live).replace(/\/$/, "");
}

export function getApiBaseUrl() {
  return normalizeUrl(API_BASE_OPTIONS[API_ENV] || API_BASE_OPTIONS.live);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const payload = error?.payload;
  const details = payload?.errors || payload?.error || payload?.details;
  const messages = [];

  if (payload?.message) messages.push(payload.message);

  if (details && typeof details === "object") {
    Object.entries(details).forEach(([field, value]) => {
      const text = Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
      if (text) messages.push(`${field}: ${text}`);
    });
  }

  if (!messages.length && error?.message) messages.push(error.message);

  return messages.length ? [...new Set(messages)].join("\n") : fallback;
}

async function request(path, options = {}) {
  const token = options.token ?? getStoredToken();
  const headers = new Headers(options.headers || {});
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 8000);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok || payload?.status === false) {
      const error = new Error(payload?.message || `API request failed: ${response.status}`);
      error.payload = payload;
      error.status = response.status;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`API timeout: ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get baseUrl() {
    return getApiBaseUrl();
  },
  health: () => request("/system/health", { token: "" }),
  info: () => request("/system/info", { token: "" }),
  login: (body) => request("/kitchen/auth/login", { method: "POST", body, token: "" }),
  forgotPassword: (username) => request("/kitchen/auth/forgot-password", { method: "POST", body: { username }, token: "" }),
  resetPassword: (body) => request("/kitchen/auth/reset-password", { method: "POST", body, token: "" }),
  verify: (token) => request("/kitchen/auth/verify", { token }),
  registerWithPlan: (formDataOrObj) => {
    let form;
    if (formDataOrObj instanceof FormData) {
      form = formDataOrObj;
    } else {
      form = new FormData();
      Object.entries(formDataOrObj || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, value);
        }
      });
    }
    return request("/kitchen/auth/register-with-plan", {
      method: "POST",
      body: form,
      token: "",
    });
  },
  verifyPayment: (body) => {
    return request("/kitchen/auth/verify-payment", {
      method: "POST",
      body,
      token: "",
    });
  },
  register: (body) => {
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    return request("/kitchen/auth/register", { method: "POST", body: form, token: "" });
  },
  finishOnboarding: (body = { status: true }) => request("/kitchen/auth/finish-onboarding", { method: "POST", body }),
  onboarding: (body) => {
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    return request("/kitchen/onboarding", { method: "POST", body: form });
  },
  plans: async () => {
    try {
      // Public GET without token as requested
      const res = await request("/kitchen/subscription/plans", { method: "GET", token: "" });
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const normalizedPlans = res.data.map((p) => ({
          ...p,
          id: p.id,
          name: p.name,
          title: p.title || p.name,
          description: p.title || "Cloud kitchen operations & inventory management.",
          monthlyPrice: Number(p.price || 0),
          yearlyPrice: Number(p.annualPrice || (Number(p.price || 0) * 10)),
          price: Number(p.price || 0),
          annualPrice: Number(p.annualPrice || (Number(p.price || 0) * 10)),
          currency: "INR",
          currencySymbol: "₹",
          trialDays: p.freeTrialDays || 7,
          maxBranches: p.maxBranches || 1,
          maxUsers: p.maxUsers || 5,
          stripePriceIdMonthly: `price_${(p.name || "plan").toLowerCase().replace(/\s+/g, "_")}_monthly`,
          stripePriceIdYearly: `price_${(p.name || "plan").toLowerCase().replace(/\s+/g, "_")}_yearly`,
          badge: p.name === "Growth Pro" ? "Most Popular" : p.name === "Starter" ? "Single Outlet" : "Franchise Scale",
          isPopular: p.name === "Growth Pro",
          features: Array.isArray(p.features) ? p.features : [],
        }));
        return { status: true, data: normalizedPlans };
      }
    } catch (e) {
      console.warn("Using local plans fallback:", e?.message);
    }
    return { status: true, data: STANDARD_PLANS };
  },
  selectPlan: (body) => request("/kitchen/subscription/select", { method: "POST", body }),
  upgradePlan: (body) => request("/kitchen/subscription/upgrade", { method: "POST", body }),
  downgradePlan: (body) => request("/kitchen/subscription/downgrade", { method: "POST", body }),
  subscriptionPreview: (params = {}) => request(`/kitchen/subscription/preview?${new URLSearchParams(params)}`),
  createStripeCheckoutSession: async ({ plan, billingCycle = "MONTHLY", kitchen, owner }) => {
    // Generate secure mock or live checkout session
    const stripePriceId = plan?.stripePriceIdMonthly || plan?.stripePriceIdYearly || `price_${plan?.slug || "starter"}_${billingCycle.toLowerCase()}`;
    const amount = billingCycle === "YEARLY" ? (plan?.yearlyPrice || '') : (plan?.monthlyPrice || '');
    const session = {
      sessionId: `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      stripeCustomerId: `cus_${Math.random().toString(36).substring(2, 10)}`,
      stripePriceId,
      amount,
      currency: "usd",
      planId: plan?.id || "plan_starter",
      planName: plan?.name || "Starter",
      billingCycle,
      trialDays: plan?.trialDays || 14,
      status: "open",
      expiresAt: Math.floor(Date.now() / 1000) + 3600 * 24,
    };
    return { status: true, data: session };
  },
  simulateStripeWebhook: async ({ eventType = "checkout.session.completed", session, plan, kitchen }) => {
    // Simulate real webhook event processing and status change
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + Number(plan?.trialDays || 14));
    
    const webhookResponse = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: eventType,
      processedAt: new Date().toISOString(),
      subscription: {
        id: `sub_${Math.random().toString(36).substring(2, 10)}`,
        stripeCustomerId: session?.stripeCustomerId || `cus_${Math.random().toString(36).substring(2, 10)}`,
        stripePriceId: session?.stripePriceId || plan?.stripePriceIdMonthly,
        planId: plan?.id || "plan_starter",
        planName: plan?.name || "Starter",
        status: plan?.trialDays ? "TRIALING" : "ACTIVE",
        billingCycle: session?.billingCycle || "MONTHLY",
        trialEndsAt: trialEndsAt.toISOString(),
        currentPeriodEndsAt: trialEndsAt.toISOString(),
        isActive: true,
      },
    };
    return { status: true, message: "Webhook processed successfully", data: webhookResponse };
  },
  countries: (params = {}) => {
    const defaultParams = { page: "1", limit: "50", ...params };
    return request(`/master/country?${new URLSearchParams(defaultParams)}`);
  },
  states: (params = {}) => {
    const defaultParams = { page: "1", limit: "50", ...params };
    return request(`/master/state?${new URLSearchParams(defaultParams)}`);
  },
  cities: (params = {}) => {
    const defaultParams = { page: "1", limit: "50", ...params };
    return request(`/master/city?${new URLSearchParams(defaultParams)}`);
  },
  cuisines: (params = {}) => {
    const defaultParams = { page: "1", limit: "50", name: "", category: "", status: "ACTIVE", ...params };
    return request(`/master/cuisine?${new URLSearchParams(defaultParams)}`);
  },
  ingredients: (params = {}, token) => {
    const search = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
    return request(`/master/ingredient${search}`, token !== undefined ? { token } : {});
  },
  branches: (params = {}) => request(`/kitchen/branch?${new URLSearchParams(params)}`),
  branch: (branchId) => request(`/kitchen/branch/${branchId}`),
  createBranch: (body) => request("/kitchen/branch", { method: "POST", body }),
  updateBranch: (branchId, body) => request(`/kitchen/branch/${branchId}`, { method: "PUT", body }),
  deleteBranch: (branchId) => request(`/kitchen/branch/${branchId}`, { method: "DELETE" }),
  createBranchIngredients: (branchId, body) => request(`/kitchen/branch/${branchId}/ingredient`, { method: "POST", body }),
  updateBranchIngredient: (branchId, inventoryId, body) => request(`/kitchen/branch/${branchId}/ingredient/${inventoryId}`, { method: "PUT", body }),
  deleteBranchIngredient: (branchId, inventoryId) => request(`/kitchen/branch/${branchId}/ingredient/${inventoryId}`, { method: "DELETE" }),
  branchIngredients: (branchId, params = {}) => {
    const defaultParams = { page: "1", limit: "50", ...params };
    return request(`/kitchen/branch/${branchId}/ingredient?${new URLSearchParams(defaultParams)}`);
  },
  createStock: (branchId, body) => request(`/kitchen/branch/${branchId}/ingredient/stock`, { method: "POST", body }),
  stocks: (branchId) => request(`/kitchen/branch/${branchId}/ingredient/stock`),
  menus: (branchId, params = {}) => {
    const defaultParams = { page: "1", limit: "50", ...params };
    return request(`/kitchen/branch/${branchId}/menu?${new URLSearchParams(defaultParams)}`);
  },
  createMenu: (branchId, body) => request(`/kitchen/branch/${branchId}/menu`, { method: "POST", body }),
  updateMenu: (branchId, menuId, body) => request(`/kitchen/branch/${branchId}/menu/${menuId}`, { method: "PUT", body }),
  deleteMenu: (branchId, menuId) => request(`/kitchen/branch/${branchId}/menu/${menuId}`, { method: "DELETE" }),
  menuCategories: (params = {}) => {
    const search = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
    return request(`/kitchen/menu/categories${search}`);
  },
  orders: (branchId, params = {}) => {
    const defaultParams = { page: "1", limit: "50", ...params };
    return request(`/kitchen/order/branch/${branchId}?${new URLSearchParams(defaultParams)}`);
  },
  orderDetail: (branchId, orderId) => request(`/kitchen/order/branch/${branchId}/${orderId}`),
  updateOrderStatus: (branchId, body) => request(`/kitchen/order/branch/${branchId}/bulk-status`, { method: "PATCH", body }),
  createOrder: (branchId, body) => request(`/kitchen/order/branch/${branchId}`, { method: "POST", body }),
  customers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/kitchen/customer${query ? `?${query}` : ""}`);
  },
  staff: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/kitchen/staff${query ? `?${query}` : ""}`);
  },
  staffRoles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/kitchen/staff-role${query ? `?${query}` : ""}`);
  },
  createStaffRole: (body) => request("/kitchen//role", { method: "POST", body }),
  updateStaffRole: (roleId, body) => request(`/kitchen/staff-role/role/${roleId}`, { method: "PUT", body }),
  updateRolePermissions: (roleId, body) => request(`/kitchen/staff-role/role/${roleId}/permissions`, { method: "PUT", body }),
  deleteStaffRole: (roleId) => request(`/kitchen/staff-role/${roleId}`, { method: "DELETE" }),
  staffFormOptions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/kitchen/staff/form-options${query ? `?${query}` : ""}`);
  },
  createStaff: (body) => {
    if (body instanceof FormData) {
      return request("/kitchen/staff", { method: "POST", body });
    }
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "branchIds" && Array.isArray(value)) {
          form.append(key, JSON.stringify(value.map(Number)));
        } else {
          form.append(key, value);
        }
      }
    });
    return request("/kitchen/staff", { method: "POST", body: form });
  },
  updateStaff: (staffId, body) => {
    if (body instanceof FormData) {
      return request(`/kitchen/staff/${staffId}`, { method: "PUT", body });
    }
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "branchIds" && Array.isArray(value)) {
          form.append(key, JSON.stringify(value.map(Number)));
        } else {
          form.append(key, value);
        }
      }
    });
    return request(`/kitchen/staff/${staffId}`, { method: "PUT", body: form });
  },
  deleteStaff: (staffId) => request(`/kitchen/staff/${staffId}`, { method: "DELETE" }),
  dashboardStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/kitchen/dashboard/stats${query ? `?${query}` : ""}`);
  },
  getProfile: () => request("/kitchen/auth/profile"),
  updateProfile: (body) => {
    if (body instanceof FormData) {
      return request("/kitchen/auth/profile", { method: "PUT", body });
    }
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, value);
      }
    });
    return request("/kitchen/auth/profile", { method: "PUT", body: form });
  },
  wasteLogs: (branchId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/kitchen/branch/${branchId}/waste${query ? `?${query}` : ""}`);
  },
  createWasteLog: (branchId, body) => request(`/kitchen/branch/${branchId}/waste`, { method: "POST", body }),
  updateWasteLog: (branchId, id, body) => request(`/kitchen/branch/${branchId}/waste/${id}`, { method: "PUT", body }),
  deleteWasteLog: (branchId, id) => request(`/kitchen/branch/${branchId}/waste/${id}`, { method: "DELETE" }),
};
