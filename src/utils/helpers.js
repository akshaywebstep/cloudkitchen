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

export function getPlanTitle(plan) {
  return plan?.title || plan?.name || plan?.planName || plan?.subscriptionName || `Plan #${plan?.id || ""}`;
}

export function getPlanPrice(plan, cycle = "MONTHLY") {
  const isYearly = String(cycle || "").toUpperCase() === "YEARLY" || String(plan?.billingCycle || "").toUpperCase() === "YEARLY";
  const amount = isYearly
    ? (plan?.annualPrice ?? plan?.yearlyPrice ?? (plan?.price ? plan.price * 10 : null))
    : (plan?.price ?? plan?.amount ?? plan?.monthlyPrice ?? plan?.planPrice);
  if (amount === undefined || amount === null || amount === "") return "Custom";
  const currency = plan?.currency || plan?.currencyCode || "INR";
  const period = isYearly ? "/ yr" : "/ mo";
  return `${currency} ${Number(amount).toLocaleString("en-IN")} ${period}`;
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

