import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { ApiCount } from "../../components/ui/ApiCount";
import { api, getApiErrorMessage } from "../../api";
import { resolveSelectedBranchId } from "../../utils/helpers";

export function KitchenApiActions({ apiState, refreshKitchenData, compact = false }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const firstBranchId = resolveSelectedBranchId(apiState.branches, apiState.selectedBranchId);
  const firstIngredientId =
    apiState.branchIngredients[0]?.ingredientId ||
    apiState.branchIngredients[0]?.ingredient?.id ||
    apiState.ingredients[0]?.id ||
    1;
  const firstCuisineId = apiState.cuisines[0]?.id || 1;
  const firstPlanId = apiState.plans[0]?.id || 1;

  const run = async (label, action) => {
    if (!apiState.token) {
      setMessage("Login first to use kitchen APIs.");
      return;
    }
    setBusy(label);
    setMessage("");
    try {
      await action();
      await refreshKitchenData?.(undefined, null);
      setMessage(`${label} completed.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, `${label} failed`));
    } finally {
      setBusy("");
    }
  };

  const fakeFile = (name) => new File([new Blob(["demo"], { type: "text/plain" })], name, { type: "text/plain" });

  const actions = [
    {
      label: "Complete Onboarding",
      disabled: !apiState.token,
      onClick: () =>
        run("Complete Onboarding", () =>
          api.onboarding({
            fssaiNumber: "12345678901234",
            fssaiFile: fakeFile("fssai.txt"),
            gstNumber: "",
            gstFile: fakeFile("gst.txt"),
          })
        ),
    },
    {
      label: "Select Plan",
      disabled: !apiState.token,
      onClick: () =>
        run("Select Plan", () =>
          api.selectPlan({
            subscriptionId: Number(firstPlanId),
            billingCycle: "MONTHLY",
            duration: 1,
          })
        ),
    },
    {
      label: "Create Branch",
      disabled: !apiState.token,
      onClick: () =>
        run("Create Branch", () =>
          api.createBranch({
            name: `Main Branch ${Date.now().toString().slice(-4)}`,
            addressLine1: "Shop No 12, Ground Floor",
            pincode: "201301",
            countryId: 101,
            stateId: 4007,
            cityId: 57675,
            contactTitle: "MR",
            contactFirstName: "Rahul",
            contactEmail: "rahul@example.com",
            contactPhone: "9876543210",
            cuisines: [{ id: Number(firstCuisineId) }],
          })
        ),
    },
    {
      label: "Add Ingredients",
      disabled: !firstBranchId,
      onClick: () =>
        run("Add Ingredients", () =>
          api.createBranchIngredients(firstBranchId, {
            ingredients: apiState.ingredients.length
              ? apiState.ingredients.slice(0, 2).map((ingredient) => ({ id: Number(ingredient.id), unit: ingredient.unit || "KG" }))
              : [{ name: `Demo Tomato ${Date.now().toString().slice(-4)}`, category: "Vegetable", image: "https://cdn.example.com/ingredients/tomato.png", unit: "KG" }],
          })
        ),
    },
    {
      label: "Add Stock",
      disabled: !firstBranchId || !firstIngredientId,
      onClick: () =>
        run("Add Stock", () =>
          api.createStock(firstBranchId, {
            stocks: [{ id: Number(firstIngredientId), stock: 50, expireAt: "2026-12-31T00:00:00.000Z" }],
          })
        ),
    },
    {
      label: "Create Menu",
      disabled: !firstBranchId || !firstIngredientId,
      onClick: () =>
        run("Create Menu", () =>
          api.createMenu(firstBranchId, {
            name: `Paneer Butter Masala ${Date.now().toString().slice(-4)}`,
            description: "Creamy paneer curry with rich tomato gravy",
            price: 299,
            category: { name: "Veg." },
            subCategory: { name: "Paneer Specials" },
            ingredients: [{ id: Number(firstIngredientId), quantity: 0.5 }],
          })
        ),
    },
  ];

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Live API Setup</h2>
          <p className="mt-1 text-sm text-[#777]">Run backend flows in order: onboarding, plan, branch, ingredients, stock, menu.</p>
        </div>
        <button className="rounded-full bg-[#fff1f1] px-5 py-2 font-semibold text-[#8D0606]" onClick={() => navigate("/kitchen/menu")} type="button">
          Open Menu
        </button>
      </div>
      <div className={`mb-5 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-5"}`}>
        <ApiCount label="Cuisines" value={apiState.cuisines.length} />
        <ApiCount label="Master Ingredients" value={apiState.ingredients.length} />
        <ApiCount label="Plans" value={apiState.plans.length} />
        <ApiCount label="Branches" value={apiState.branches.length} />
        <ApiCount label="Branch Ingredients" value={apiState.branchIngredients.length} />
        <ApiCount label="Menu Items" value={apiState.menus.length} />
      </div>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="rounded-lg bg-[#8D0606] px-4 py-3 text-sm font-semibold text-white disabled:bg-[#d7d7d7] disabled:text-[#777]"
            disabled={action.disabled || busy === action.label}
            onClick={action.onClick}
            type="button"
          >
            {busy === action.label ? "Working..." : action.label}
          </button>
        ))}
      </div>
      {message ? <p className="mt-4 whitespace-pre-line text-sm font-semibold text-[#8D0606]">{message}</p> : null}
    </Card>
  );
}
