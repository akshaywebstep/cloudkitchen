/**
 * Standard Unified Measurement Units for Cloud Kitchen
 * Used across Admin and Kitchen portals for Ingredients, Menus, Inventory, and Recipes.
 */

export const STANDARD_MEASURE_UNITS = [
  { value: "KG", label: "KG" },
  { value: "GM", label: "GM" },
  { value: "MG", label: "MG" },
  { value: "LITER", label: "LITER" },
  { value: "ML", label: "ML" },
  { value: "PIECE", label: "PIECE" },
  { value: "ITEM", label: "ITEM" },
  { value: "DOZEN", label: "DOZEN" },
  { value: "PACKET", label: "PACKET" },
  { value: "BOX", label: "BOX" },
  { value: "BOTTLE", label: "BOTTLE" },
  { value: "CAN", label: "CAN" },
  { value: "PORTION", label: "PORTION" },
  { value: "SERVING", label: "SERVING" },
  { value: "SLICE", label: "SLICE" },
  { value: "TBSP", label: "TBSP" },
  { value: "TSP", label: "TSP" },
  { value: "CUP", label: "CUP" },
  { value: "PINCH", label: "PINCH" },
];

export const findUnitOption = (value) => {
  if (!value) return STANDARD_MEASURE_UNITS[0];
  const clean = String(value).trim().toUpperCase();
  const match = STANDARD_MEASURE_UNITS.find(
    (u) => u.value === clean || u.label === clean
  );
  if (match) return match;

  // Handle common aliases
  if (clean === "KILOGRAM" || clean === "KGS" || clean === "KILOGRAMS") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "KG") || { value: "KG", label: "KG" };
  }
  if (clean === "GRAM" || clean === "GRAMS" || clean === "G") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "GM") || { value: "GM", label: "GM" };
  }
  if (clean === "MILLILITER" || clean === "MILLILITERS" || clean === "MILLI") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "ML") || { value: "ML", label: "ML" };
  }
  if (clean === "LITRE" || clean === "LITRES" || clean === "LTR" || clean === "L") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "LITER") || { value: "LITER", label: "LITER" };
  }
  if (clean === "PCS" || clean === "PC" || clean === "PIECES") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "PIECE") || { value: "PIECE", label: "PIECE" };
  }
  if (clean === "SERVINGS") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "SERVING") || { value: "SERVING", label: "SERVING" };
  }
  if (clean === "PORTIONS") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "PORTION") || { value: "PORTION", label: "PORTION" };
  }
  if (clean === "PACK" || clean === "PACKS" || clean === "PACKETS") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "PACKET") || { value: "PACKET", label: "PACKET" };
  }
  if (clean === "BOXES") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "BOX") || { value: "BOX", label: "BOX" };
  }
  if (clean === "BOTTLES") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "BOTTLE") || { value: "BOTTLE", label: "BOTTLE" };
  }
  if (clean === "CANS") {
    return STANDARD_MEASURE_UNITS.find((u) => u.value === "CAN") || { value: "CAN", label: "CAN" };
  }

  return { value: clean, label: clean };
};
