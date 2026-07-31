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
  return plan?.name || plan?.title || plan?.planName || plan?.subscriptionName || `Plan #${plan?.id || ""}`;
}

export function getPlanPrice(plan) {
  const amount = plan?.price ?? plan?.amount ?? plan?.monthlyPrice ?? plan?.planPrice;
  if (amount === undefined || amount === null || amount === "") return "Custom";
  const currency = plan?.currency || plan?.currencyCode || "INR";
  return `${currency} ${amount}`;
}
