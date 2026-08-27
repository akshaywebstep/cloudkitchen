export const SELECTED_BRANCH_KEY = "cloudKitchenSelectedBranchId";

export function createProfileFile(name = "profile.txt") {
  return new File([new Blob(["profile"], { type: "text/plain" })], name, { type: "text/plain" });
}

export function getStoredSelectedBranchId() {
  return localStorage.getItem(SELECTED_BRANCH_KEY) || "";
}

export function setStoredSelectedBranchId(branchId) {
  if (branchId) localStorage.setItem(SELECTED_BRANCH_KEY, String(branchId));
  else localStorage.removeItem(SELECTED_BRANCH_KEY);
}

export function getBranchLabel(branch) {
  return branch?.name || branch?.branchName || `Branch ${branch?.id || ""}`;
}

export function getBranchCuisineId(branch) {
  const mapping = Array.isArray(branch?.cuisines) ? branch.cuisines[0] : null;
  return String(mapping?.cuisineId || mapping?.cuisine?.id || branch?.cuisineId || "");
}

export function resolveSelectedBranchId(branches = [], selectedBranchId = "") {
  if (!branches.length) return "";
  const current = branches.find((branch) => String(branch.id) === String(selectedBranchId));
  return String((current || branches[0]).id);
}

export function truthyFlag(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true" ||
    String(value).toUpperCase() === "YES"
  );
}

export function isKitchenOnboardingCompleted(kitchen) {
  if (!kitchen) return false;
  if (kitchen.isOnboardingCompleted === false || kitchen.onboardingCompleted === false) return false;
  return truthyFlag(
    kitchen.isOnboardingCompleted ??
    kitchen.onboardingCompleted ??
    kitchen.onboarding?.isCompleted ??
    kitchen.onboarding?.completed
  );
}

export function getKitchenSubscription(kitchen) {
  if (!kitchen) return null;
  return (
    kitchen.activeSubscription ||
    kitchen.currentSubscription ||
    kitchen.subscription ||
    kitchen.subscriptionPlan ||
    kitchen.plan ||
    kitchen.selectedSubscription ||
    null
  );
}

export function getKitchenSubscriptionRecords(kitchen) {
  if (!kitchen) return [];
  return [
    kitchen.activeSubscription,
    kitchen.currentSubscription,
    kitchen.subscription,
    kitchen.subscriptionPlan,
    kitchen.kitchenSubscription,
    kitchen.selectedSubscription,
    ...(Array.isArray(kitchen.subscriptions) ? kitchen.subscriptions : []),
    ...(Array.isArray(kitchen.activeSubscriptions) ? kitchen.activeSubscriptions : []),
    ...(Array.isArray(kitchen.kitchenSubscriptions) ? kitchen.kitchenSubscriptions : []),
  ].filter(Boolean);
}

export function isActiveSubscriptionRecord(subscription) {
  if (!subscription) return false;
  const status = String(subscription.status || subscription.subscriptionStatus || subscription.state || "").toUpperCase();
  return status === "ACTIVE" || truthyFlag(subscription.isActive ?? subscription.active ?? subscription.isCurrent ?? subscription.current);
}

export function hasActiveKitchenSubscription(kitchen) {
  return getKitchenSubscriptionRecords(kitchen).some(isActiveSubscriptionRecord);
}

export function hasSelectedSubscription(apiState) {
  const kitchen = apiState?.kitchen || {};
  const selectedPlan = apiState?.selectedPlan;
  return Boolean(
    selectedPlan?.confirmedActive ||
    selectedPlan?.alreadyActive ||
    selectedPlan?.id ||
    selectedPlan?.name ||
    hasActiveKitchenSubscription(kitchen)
  );
}

export function hasAtLeastOneBranch(apiState) {
  const branches = apiState?.branches;
  return Array.isArray(branches) && branches.length > 0;
}

export function getRequiredSetupStep(apiState) {
  if (!apiState?.token) return "";
  if (!isKitchenOnboardingCompleted(apiState?.kitchen)) return "onboarding";
  if (!hasSelectedSubscription(apiState)) return "subscription";
  return "";
}

export const STANDARD_PLANS = [
  {
    id: 1,
    numericId: 1,
    slug: "starter",
    name: "Starter",
    title: "Starter Plan",
    tagline: "Essential tools for single-location cloud kitchens and food startups.",
    description: "Best for Single Outlet Cloud Kitchens.",
    monthlyPrice: 999,
    yearlyPrice: 9999,
    price: 999,
    annualPrice: 9999,
    currency: "INR",
    currencySymbol: "₹",
    billingCycle: "MONTHLY",
    trialDays: 7,
    maxBranches: 1,
    maxUsers: 5,
    stripePriceIdMonthly: "price_starter_monthly",
    stripePriceIdYearly: "price_starter_yearly",
    badge: "Single Outlet",
    features: [
      { feature: "Basic Dashboard", type: "INCLUDE" },
      { feature: "Order Management", type: "INCLUDE" },
      { feature: "Email Support", type: "INCLUDE" },
      { feature: "Advanced Analytics", type: "INCLUDE" },
      { feature: "Priority Support", type: "INCLUDE" },
    ],
  },
  {
    id: 2,
    numericId: 2,
    slug: "growth-pro",
    name: "Growth Pro",
    title: "Growth Pro Plan",
    tagline: "Multi-brand & scaling ghost kitchens needing high efficiency.",
    description: "Best for Multi-Branch Outlets & Growing Brands.",
    monthlyPrice: 2499,
    yearlyPrice: 24999,
    price: 2499,
    annualPrice: 24999,
    currency: "INR",
    currencySymbol: "₹",
    billingCycle: "MONTHLY",
    trialDays: 7,
    maxBranches: 3,
    maxUsers: 15,
    stripePriceIdMonthly: "price_growth_monthly",
    stripePriceIdYearly: "price_growth_yearly",
    badge: "Most Popular",
    isPopular: true,
    features: [
      { feature: "Up to 3 Branches Supported", type: "INCLUDE" },
      { feature: "15 Staff / Chef / Cashier Logins", type: "INCLUDE" },
      { feature: "Centralized Inventory & Stock Transfer", type: "INCLUDE" },
      { feature: "Role-Based Staff Permissions", type: "INCLUDE" },
      { feature: "Detailed P&L & Consumption Reports", type: "INCLUDE" },
    ],
  },
  {
    id: 3,
    numericId: 3,
    slug: "enterprise",
    name: "Enterprise Chain",
    title: "Enterprise Chain Plan",
    tagline: "Full-scale franchise operations with unlimited branches and integrations.",
    description: "Unlimited Scale for Large Franchise Chains.",
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    price: 4999,
    annualPrice: 49999,
    currency: "INR",
    currencySymbol: "₹",
    billingCycle: "MONTHLY",
    trialDays: 7,
    maxBranches: 10,
    maxUsers: 48,
    stripePriceIdMonthly: "price_enterprise_monthly",
    stripePriceIdYearly: "price_enterprise_yearly",
    badge: "Franchise Scale",
    features: [
      { feature: "Up to 10 Branches Across Cities", type: "INCLUDE" },
      { feature: "50 Team Accounts with Custom Roles", type: "INCLUDE" },
      { feature: "Automated Supplier Purchase Orders", type: "INCLUDE" },
      { feature: "Multi-Brand Cloud Kitchen Setup", type: "INCLUDE" },
    ],
  },
];

export function getPlanStripePriceId(plan, cycle = "MONTHLY") {
  const isYearly = String(cycle || "").toUpperCase() === "YEARLY";
  if (isYearly) {
    return plan?.stripePriceIdYearly || `price_${plan?.slug || plan?.id || "plan"}_yearly`;
  }
  return plan?.stripePriceIdMonthly || `price_${plan?.slug || plan?.id || "plan"}_monthly`;
}

export function findStandardPlan(planIdentifier) {
  if (!planIdentifier) return STANDARD_PLANS[1] || STANDARD_PLANS[0];
  if (typeof planIdentifier === "object" && planIdentifier?.name && (planIdentifier?.monthlyPrice || planIdentifier?.price)) {
    return planIdentifier;
  }
  const key = String(planIdentifier?.id ?? planIdentifier?.slug ?? planIdentifier?.name ?? planIdentifier).toLowerCase().trim();
  return (
    STANDARD_PLANS.find(
      (p) =>
        String(p.id || "").toLowerCase() === key ||
        String(p.slug || "").toLowerCase() === key ||
        String(p.name || "").toLowerCase() === key ||
        String(p.numericId || "").toLowerCase() === key ||
        String(p.stripePriceIdMonthly || "").toLowerCase() === key ||
        String(p.stripePriceIdYearly || "").toLowerCase() === key
    ) || STANDARD_PLANS[1] || STANDARD_PLANS[0]
  );
}

export function getSubscriptionStatus(subscriptionOrKitchen) {
  const sub = getKitchenSubscription(subscriptionOrKitchen) || subscriptionOrKitchen;
  if (!sub) return "NONE";
  const raw = String(sub.status || sub.subscriptionStatus || sub.state || "").toUpperCase();
  if (["ACTIVE", "TRIALING", "PENDING_PAYMENT", "PAST_DUE", "CANCELLED", "EXPIRED"].includes(raw)) {
    return raw;
  }
  if (sub.confirmedActive || sub.alreadyActive || sub.isActive) return "ACTIVE";
  return raw || "ACTIVE";
}

export function isSubscriptionActiveOrTrial(kitchen) {
  const status = getSubscriptionStatus(kitchen);
  return status === "ACTIVE" || status === "TRIALING";
}

export function getPlanTitle(plan) {
  return plan?.title || plan?.name || plan?.planName || plan?.subscriptionName || `Plan #${plan?.id || ""}`;
}

export function formatTrialExpiryDate(days = 14) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 14));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getPlanPrice(plan, cycle = "MONTHLY") {
  const isYearly = String(cycle || "").toUpperCase() === "YEARLY" || String(plan?.billingCycle || "").toUpperCase() === "YEARLY";
  const amount = isYearly
    ? (plan?.yearlyPrice ?? plan?.annualPrice ?? (plan?.price ? plan.price * 10 : 290))
    : (plan?.monthlyPrice ?? plan?.price ?? plan?.amount ?? 29);
  const symbol = plan?.currencySymbol || "$";
  const period = isYearly ? "/ yr" : "/ mo";
  return `${symbol}${Number(amount).toLocaleString("en-US")} ${period}`;
}

/**
 * Smart formatting for recipe quantities
 * Example:
 * formatRecipeQty(0.1, 'KG') => "100 GM (0.1 KG)"
 * formatRecipeQty(0.08, 'KG') => "80 GM (0.08 KG)"
 * formatRecipeQty(0.015, 'LITER') => "15 ML (0.015 LTR)"
 * formatRecipeQty(2, 'PIECE') => "2 PIECE"
 */
export function formatRecipeQty(quantity, unit = "KG") {
  const num = Number(quantity);
  if (isNaN(num) || num <= 0) return `${quantity || 0} ${unit || ""}`.trim();
  const u = String(unit || "").toUpperCase();

  // If KG and < 1 (e.g. 0.1 KG) -> convert to GM
  if ((u === "KG" || u === "KILOGRAM") && num < 1) {
    const gm = Math.round(num * 1000 * 1000) / 1000;
    return `${gm} GM (${num} KG)`;
  }

  // If LITER/LTR and < 1 (e.g. 0.015 LTR) -> convert to ML
  if ((u === "LITER" || u === "LTR" || u === "LITRE") && num < 1) {
    const ml = Math.round(num * 1000 * 1000) / 1000;
    return `${ml} ML (${num} LTR)`;
  }

  return `${num} ${unit || ""}`.trim();
}

/**
 * Returns live conversion preview hint text and conversion badge
 */
export function getRecipeConversionHint(quantity, unit = "KG") {
  const num = Number(quantity);
  if (isNaN(num) || num <= 0) return null;
  const u = String(unit || "").toUpperCase();

  if (u === "GM" || u === "GRAM" || u === "GRAMS") {
    const kg = num / 1000;
    const kgFormatted = Number(kg.toFixed(4));
    return {
      text: `${num} GM = ${kgFormatted} KG will be deducted per dish`,
      badge: `${kgFormatted} KG / dish`,
      type: "deduction",
    };
  }

  if (u === "KG" || u === "KILOGRAM") {
    if (num < 1) {
      const gm = Math.round(num * 1000 * 1000) / 1000;
      return {
        text: `${num} KG = ${gm} Grams per dish`,
        badge: `${gm} GM / dish`,
        type: "conversion",
      };
    } else {
      const gm = num * 1000;
      return {
        text: `${num} KG = ${gm.toLocaleString("en-IN")} Grams per dish`,
        badge: `${gm.toLocaleString("en-IN")} GM / dish`,
        type: "conversion",
      };
    }
  }

  if (u === "ML" || u === "MILLILITER") {
    const ltr = num / 1000;
    const ltrFormatted = Number(ltr.toFixed(4));
    return {
      text: `${num} ML = ${ltrFormatted} Liter will be deducted per dish`,
      badge: `${ltrFormatted} LTR / dish`,
      type: "deduction",
    };
  }

  if (u === "LITER" || u === "LTR" || u === "LITRE") {
    if (num < 1) {
      const ml = Math.round(num * 1000 * 1000) / 1000;
      return {
        text: `${num} LTR = ${ml} ML per dish`,
        badge: `${ml} ML / dish`,
        type: "conversion",
      };
    } else {
      const ml = num * 1000;
      return {
        text: `${num} LTR = ${ml.toLocaleString("en-IN")} ML per dish`,
        badge: `${ml.toLocaleString("en-IN")} ML / dish`,
        type: "conversion",
      };
    }
  }

  return {
    text: `${num} ${unit} will be deducted per dish`,
    badge: `${num} ${unit} / dish`,
    type: "standard",
  };
}

/**
 * Returns sanity check warning if quantity entered is unusually large for a single serving
 */
export function getRecipeSanityWarning(quantity, unit = "KG") {
  const num = Number(quantity);
  if (isNaN(num) || num <= 0) return null;
  const u = String(unit || "").toUpperCase();

  if ((u === "KG" || u === "KILOGRAM") && num >= 2) {
    const fixedKg = Number((num / 1000).toFixed(4));
    return {
      warning: `${num} KG per serving is unusually large for a single dish!`,
      suggestion: `Did you mean ${num} Grams (${fixedKg} KG)?`,
      fixTarget: { quantity: String(num), unit: "GM" },
      fixLabel: `Auto-fix to ${num} GM (${fixedKg} KG)`,
    };
  }

  if ((u === "LITER" || u === "LTR" || u === "LITRE") && num >= 2) {
    const fixedLtr = Number((num / 1000).toFixed(4));
    return {
      warning: `${num} Liter per serving is unusually large for a single dish!`,
      suggestion: `Did you mean ${num} ML (${fixedLtr} LTR)?`,
      fixTarget: { quantity: String(num), unit: "ML" },
      fixLabel: `Auto-fix to ${num} ML (${fixedLtr} LTR)`,
    };
  }

  return null;
}

/**
 * Calculate stock capacity / dish yield from current branch inventory
 */
export function calculateStockYield(recipeIngredients = [], ingredientLookupMap = new Map()) {
  const calculations = [];

  for (const row of recipeIngredients) {
    if (!row.ingredientId) continue;
    const item = ingredientLookupMap.get(String(row.ingredientId));
    if (!item) continue;

    const availableStock = typeof item.stock === "number" ? item.stock : Number(item.stock || 0);
    const stockUnit = String(item.unit || "KG").toUpperCase();
    const reqQty = Number(row.quantity);
    const reqUnit = String(row.unit || stockUnit).toUpperCase();

    if (isNaN(reqQty) || reqQty <= 0) continue;

    // Normalize both to base units for division (e.g. Grams, ML, or standard Count)
    let stockInBase = availableStock;
    let reqInBase = reqQty;

    // Weight conversions
    if (stockUnit === "KG" && (reqUnit === "GM" || reqUnit === "GRAM" || reqUnit === "GRAMS")) {
      stockInBase = availableStock * 1000; // Grams
      reqInBase = reqQty;
    } else if ((stockUnit === "GM" || stockUnit === "GRAM") && reqUnit === "KG") {
      stockInBase = availableStock;
      reqInBase = reqQty * 1000;
    }
    // Volume conversions
    else if ((stockUnit === "LITER" || stockUnit === "LTR" || stockUnit === "LITRE") && (reqUnit === "ML" || reqUnit === "MILLILITER")) {
      stockInBase = availableStock * 1000; // ML
      reqInBase = reqQty;
    } else if ((stockUnit === "ML" || stockUnit === "MILLILITER") && (reqUnit === "LITER" || reqUnit === "LTR" || reqUnit === "LITRE")) {
      stockInBase = availableStock;
      reqInBase = reqQty * 1000;
    }

    const possibleDishes = reqInBase > 0 ? Math.floor(stockInBase / reqInBase) : 0;

    calculations.push({
      ingredientId: row.ingredientId,
      name: item.name || `Ingredient #${row.ingredientId}`,
      availableStock,
      stockUnit: item.unit || "KG",
      reqQty,
      reqUnit: row.unit || item.unit || "KG",
      possibleDishes: Math.max(0, possibleDishes),
    });
  }

  if (calculations.length === 0) return null;

  // Find lowest stock bottleneck
  const sorted = [...calculations].sort((a, b) => a.possibleDishes - b.possibleDishes);
  const bottleneck = sorted[0];

  return {
    items: calculations,
    bottleneck,
    maxServings: bottleneck.possibleDishes,
  };
}

/**
 * Loads Razorpay script dynamically if not already loaded on window
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

