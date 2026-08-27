/**
 * Recipe Helper Utilities for Cloud Kitchen
 * Handles live conversion hints, sanity checks, stock calculations, and smart unit formatting.
 */

export const normalizeUnit = (unit = '') => {
  const u = String(unit).trim().toUpperCase();
  if (['G', 'GM', 'GRAM', 'GRAMS'].includes(u)) return 'GM';
  if (['KG', 'KGS', 'KILOGRAM', 'KILOGRAMS'].includes(u)) return 'KG';
  if (['ML', 'MILLILITER', 'MILLILITERS'].includes(u)) return 'ML';
  if (['L', 'LTR', 'LITER', 'LITERS', 'LITRE', 'LITRES'].includes(u)) return 'LITER';
  if (['PCS', 'PC', 'PIECE', 'PIECES', 'PORTION', 'PORTIONS', 'NOS', 'NO'].includes(u)) return 'PCS';
  return u || 'GM';
};

/**
 * Solution 1: Live Conversion Hint (Real-time Preview)
 */
export const getConversionHint = (quantity, unit = 'GM') => {
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0) return null;
  const norm = normalizeUnit(unit);

  if (norm === 'GM') {
    const kg = (num / 1000).toFixed(3).replace(/\.?0+$/, '');
    return {
      text: `✅ ${num} Grams = ${kg} KG will be deducted per dish`,
      badge: `(= ${kg} KG deducted per order)`,
      kgValue: num / 1000,
    };
  }

  if (norm === 'KG') {
    const gm = Math.round(num * 1000);
    return {
      text: `✅ ${num} KG = ${gm} Grams per dish`,
      badge: `(= ${gm} GM deducted per order)`,
      gmValue: gm,
    };
  }

  if (norm === 'ML') {
    const ltr = (num / 1000).toFixed(3).replace(/\.?0+$/, '');
    return {
      text: `✅ ${num} ML = ${ltr} Liter per dish`,
      badge: `(= ${ltr} Ltr deducted per order)`,
      ltrValue: num / 1000,
    };
  }

  if (norm === 'LITER') {
    const ml = Math.round(num * 1000);
    return {
      text: `✅ ${num} LTR = ${ml} ML per dish`,
      badge: `(= ${ml} ML deducted per order)`,
      mlValue: ml,
    };
  }

  return {
    text: `✅ ${num} ${unit} will be deducted per dish`,
    badge: `(= ${num} ${unit} per order)`,
  };
};

/**
 * Solution 2: Smart Sanity Warning
 */
export const getSanityWarning = (quantity, unit = 'GM') => {
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0) return null;
  const norm = normalizeUnit(unit);

  // If user entered >= 1 KG for 1 single serving
  if (norm === 'KG' && num >= 1) {
    const actualKgFromGm = (num / 1000).toFixed(3).replace(/\.?0+$/, '');
    return {
      type: 'warning',
      message: `⚠️ ${num} KG per serving bohot zyada hai! Kya aapka matlab ${num} Grams (${actualKgFromGm} KG) tha?`,
      fixLabel: `Click to auto-fix to ${num} GM`,
      fixPayload: { quantity: num, unit: 'GM' },
    };
  }

  // If user entered >= 1 Liter for 1 single serving
  if (norm === 'LITER' && num >= 1) {
    const actualLtrFromMl = (num / 1000).toFixed(3).replace(/\.?0+$/, '');
    return {
      type: 'warning',
      message: `⚠️ ${num} Liter per serving bohot zyada hai! Kya aapka matlab ${num} ML (${actualLtrFromMl} LTR) tha?`,
      fixLabel: `Click to auto-fix to ${num} ML`,
      fixPayload: { quantity: num, unit: 'ML' },
    };
  }

  // If user entered >= 2500 GM for 1 single dish
  if (norm === 'GM' && num >= 2500) {
    return {
      type: 'warning',
      message: `⚠️ ${num} Grams (= ${(num / 1000).toFixed(2)} KG) per serving bohot zyada lag raha hai. Kripya quantity check karein.`,
      fixLabel: null,
      fixPayload: null,
    };
  }

  return null;
};

/**
 * Solution 4: Modal Display Formatter (Smart Unit Display)
 */
export const formatRecipeQty = (quantity, unit = '') => {
  const num = parseFloat(quantity);
  if (isNaN(num)) return `${quantity} ${unit}`.trim();
  const norm = normalizeUnit(unit);

  // If KG and less than 1 (e.g. 0.1 KG) -> convert to GM
  if (norm === 'KG' && num < 1) {
    const gm = Math.round(num * 1000);
    return `${gm} GM (${num} KG)`;
  }

  // If GM and 1000 or greater -> show KG
  if (norm === 'GM' && num >= 1000) {
    const kg = (num / 1000).toFixed(2).replace(/\.?0+$/, '');
    return `${kg} KG (${num} GM)`;
  }

  // If LITER and less than 1 (e.g. 0.015 LTR) -> convert to ML
  if (norm === 'LITER' && num < 1) {
    const ml = Math.round(num * 1000);
    return `${ml} ML (${num} LTR)`;
  }

  // If ML and 1000 or greater -> show LTR
  if (norm === 'ML' && num >= 1000) {
    const ltr = (num / 1000).toFixed(2).replace(/\.?0+$/, '');
    return `${ltr} LTR (${num} ML)`;
  }

  return `${num} ${unit || ''}`.trim();
};

/**
 * Solution 3: Stock Yield / Capacity Calculator
 */
export const calculateStockCapacity = (ingredients = [], inventoryList = []) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return null;

  const yields = [];

  ingredients.forEach((ing) => {
    const qty = parseFloat(ing.quantity);
    if (!qty || isNaN(qty) || qty <= 0) return;

    // Find in inventory / ingredients list
    const matched = inventoryList.find(
      (inv) =>
        String(inv.id) === String(ing.id) ||
        inv.name?.toLowerCase() === ing.name?.toLowerCase()
    );

    const availableStock = parseFloat(
      matched?.currentStock ?? matched?.stock ?? matched?.quantity ?? matched?.alertQuantity ?? 0
    );

    if (availableStock > 0) {
      const ingUnit = normalizeUnit(ing.unit);
      const stockUnit = normalizeUnit(matched.unit || matched.inventoryItem?.unit);

      let effectiveStock = availableStock;
      let effectiveDishNeed = qty;

      // Normalize standard metric for comparison
      if (ingUnit === 'GM' && stockUnit === 'KG') effectiveStock = availableStock * 1000;
      if (ingUnit === 'KG' && stockUnit === 'GM') effectiveDishNeed = qty * 1000;
      if (ingUnit === 'ML' && stockUnit === 'LITER') effectiveStock = availableStock * 1000;
      if (ingUnit === 'LITER' && stockUnit === 'ML') effectiveDishNeed = qty * 1000;

      const dishesPossible = Math.floor(effectiveStock / effectiveDishNeed);
      yields.push({
        ingredientId: ing.id,
        name: ing.name,
        availableStock,
        stockUnit: matched.unit || 'GM',
        quantityPerDish: qty,
        unitPerDish: ing.unit,
        dishesPossible: Math.max(0, dishesPossible),
      });
    }
  });

  if (yields.length === 0) return null;

  yields.sort((a, b) => a.dishesPossible - b.dishesPossible);
  const bottleneck = yields[0];

  return {
    yields,
    bottleneck,
    maxDishes: bottleneck ? bottleneck.dishesPossible : null,
  };
};
