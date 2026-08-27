import { useMemo } from "react";

/**
 * Normalizes different module name variations into canonical permission module names.
 * Standard permission module names from verify response:
 * - branch
 * - menu
 * - ingredient
 * - order
 * - wasteManagement
 * - dashboard
 * - roleManagement
 * - staffManagement
 * - customer
 * - profile
 * - reviews
 */
export function normalizeModuleName(module = "") {
  const mod = String(module || "").toLowerCase().trim();
  if (mod === "branch" || mod === "branches" || mod === "kitchen") return "branch";
  if (mod === "menu" || mod === "menus" || mod === "foodmenu" || mod === "addmenu" || mod === "category") return "menu";
  if (mod === "ingredient" || mod === "ingredients" || mod === "stock" || mod === "stocks") return "ingredient";
  if (mod === "order" || mod === "orders") return "order";
  if (mod === "wastemanagement" || mod === "waste" || mod === "wastemanage") return "wasteManagement";
  if (mod === "dashboard" || mod === "overview") return "dashboard";
  if (mod === "rolemanagement" || mod === "roles" || mod === "role") return "roleManagement";
  if (mod === "staffmanagement" || mod === "staff") return "staffManagement";
  if (mod === "customer" || mod === "customers") return "customer";
  if (mod === "profile") return "profile";
  if (mod === "reviews" || mod === "review" || mod === "feedback") return "reviews";
  return mod;
}

/**
 * Checks if the user is a staff member with role-based restricted permissions.
 */
export function isStaffUser(kitchen) {
  if (!kitchen) return false;
  const userType = String(kitchen.userType || kitchen.type || kitchen.roleType || "").toUpperCase();
  if (userType === "KITCHEN_STAFF" || userType === "STAFF" || userType === "EMPLOYEE") return true;
  if (kitchen.staffId || kitchen.isStaff || kitchen.staff) return true;

  // If role is set and role is not Owner / Super Admin
  const roleName = String(kitchen.role?.name || kitchen.roleName || "").toUpperCase();
  if (roleName && !roleName.includes("OWNER") && !roleName.includes("SUPER ADMIN") && !roleName.includes("SUPERADMIN") && !roleName.includes("ADMIN")) {
    return true;
  }

  // If permissions structure is explicitly present (even if empty)
  if (kitchen.permissions !== undefined && kitchen.permissions !== null) {
    return true;
  }
  if (Array.isArray(kitchen.assignedPermissions) || Array.isArray(kitchen.role?.permissions)) {
    return true;
  }
  return false;
}

/**
 * Extracts assigned permissions array from kitchen / staff profile.
 */
export function getAssignedPermissions(kitchen) {
  if (!kitchen) return [];
  if (Array.isArray(kitchen.permissions?.assignedPermissions)) {
    return kitchen.permissions.assignedPermissions;
  }
  if (Array.isArray(kitchen.permissions)) {
    return kitchen.permissions;
  }
  if (Array.isArray(kitchen.assignedPermissions)) {
    return kitchen.assignedPermissions;
  }
  if (Array.isArray(kitchen.role?.permissions)) {
    return kitchen.role.permissions;
  }
  if (Array.isArray(kitchen.role?.assignedPermissions)) {
    return kitchen.role.assignedPermissions;
  }
  if (Array.isArray(kitchen.staff?.role?.permissions)) {
    return kitchen.staff.role.permissions;
  }
  if (Array.isArray(kitchen.user?.role?.permissions)) {
    return kitchen.user.role.permissions;
  }
  return [];
}

/**
 * Core permission check function.
 * Evaluates whether `kitchen` user has permission to perform `action` on `module`.
 * 
 * @param {Object} kitchen - The kitchen user object from API verify/login
 * @param {string} module - Module identifier (e.g., 'branch', 'menu', 'ingredient', 'order', 'dashboard')
 * @param {string} action - Action name: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE'
 * @returns {boolean}
 */
export function hasPermission(kitchen, module, action = "VIEW") {
  if (!kitchen) return false;

  const normalizedModule = normalizeModuleName(module);
  const normalizedAction = String(action || "VIEW").toUpperCase().trim();

  // Dashboard and Profile are accessible to all authenticated kitchen / staff users
  if (normalizedModule === "dashboard" || normalizedModule === "profile") {
    return true;
  }

  // If user is Owner / Admin (not KITCHEN_STAFF and has no assignedPermissions constraint)
  if (!isStaffUser(kitchen)) {
    return true;
  }

  const assigned = getAssignedPermissions(kitchen);

  // If staff has empty permissions list, deny
  if (!Array.isArray(assigned) || assigned.length === 0) {
    return false;
  }

  // Reviews access fallback to customer or order VIEW
  if (normalizedModule === "reviews") {
    const hasReviewsPerm = assigned.some(
      (p) => normalizeModuleName(p.module || p.name) === "reviews" && String(p.action || p.type).toUpperCase() === normalizedAction
    );
    if (hasReviewsPerm) return true;
    return (
      hasPermission(kitchen, "customer", "VIEW") ||
      hasPermission(kitchen, "order", "VIEW")
    );
  }

  return assigned.some((perm) => {
    if (!perm) return false;
    if (perm.status && String(perm.status).toUpperCase() !== "ACTIVE") {
      return false;
    }

    const permModule = normalizeModuleName(perm.module || perm.moduleName || perm.permissionGroup);
    const permAction = String(perm.action || perm.actionType || perm.type || "").toUpperCase().trim();

    if (permModule === normalizedModule && permAction === normalizedAction) {
      return true;
    }

    // Check name / slug patterns like "CREATE_INGREDIENT", "CREATE_INGREDIENTS", "INGREDIENT_CREATE", "ingredient.create"
    const permName = String(perm.name || perm.code || perm.slug || perm.permission || "").toUpperCase().trim();
    if (permName) {
      const pMod = normalizedModule.toUpperCase();
      const pAct = normalizedAction;
      if (
        permName === `${pAct}_${pMod}` ||
        permName === `${pAct}_${pMod}S` ||
        permName === `${pMod}_${pAct}` ||
        permName === `${pMod}S_${pAct}` ||
        permName.toLowerCase() === `${normalizedModule}.${normalizedAction.toLowerCase()}`
      ) {
        return true;
      }
    }

    return false;
  });
}

export function canView(kitchen, module) {
  return hasPermission(kitchen, module, "VIEW");
}

export function canCreate(kitchen, module) {
  return hasPermission(kitchen, module, "CREATE");
}

export function canUpdate(kitchen, module) {
  return hasPermission(kitchen, module, "UPDATE");
}

export function canDelete(kitchen, module) {
  return hasPermission(kitchen, module, "DELETE");
}

/**
 * Returns the default authorized landing route for authenticated users.
 * Always directs users to root dashboard "/".
 */
export function getFirstAuthorizedRoute(kitchen) {
  return "/";
}

/**
 * Filters sidebar navigation sections and items according to the user's permissions.
 */
export function filterSidebarSections(sections = [], kitchen) {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => {
      const filteredItems = (section.items || []).filter((item) => {
        const moduleName = item.module || item.path?.replace(/^\//, "") || "dashboard";
        return canView(kitchen, moduleName);
      });

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => Array.isArray(section.items) && section.items.length > 0);
}

/**
 * React hook for consuming permissions in components.
 */
export function usePermissions(kitchenOrApiState) {
  const kitchen = kitchenOrApiState?.kitchen || kitchenOrApiState;

  return useMemo(() => {
    const isStaff = isStaffUser(kitchen);
    const roleName =
      kitchen?.role?.name ||
      kitchen?.roleName ||
      (isStaff ? "Kitchen Staff Manager" : "Kitchen Admin");

    return {
      isStaff,
      roleName,
      can: (module, action = "VIEW") => hasPermission(kitchen, module, action),
      canView: (module) => canView(kitchen, module),
      canCreate: (module) => canCreate(kitchen, module),
      canUpdate: (module) => canUpdate(kitchen, module),
      canDelete: (module) => canDelete(kitchen, module),
      firstAuthorizedRoute: getFirstAuthorizedRoute(kitchen),
      assignedPermissions: getAssignedPermissions(kitchen),
    };
  }, [kitchen]);
}
