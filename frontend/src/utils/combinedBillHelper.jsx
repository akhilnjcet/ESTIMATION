import React from 'react';

/**
 * Computes section metadata for each item in the list.
 * Identifies consecutive combined items and determines row spans,
 * section starts, section followers, and combined amounts.
 */
export const computeItemSectionMeta = (items = [], combinedTotals = {}) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const metaList = [];
  const totalsObj = combinedTotals instanceof Map ? Object.fromEntries(combinedTotals) : (combinedTotals || {});

  let i = 0;
  while (i < items.length) {
    const item = items[i];
    const isCombined = Boolean(item.isCombinedMode);

    if (!isCombined) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const hasDirectTotal = item.total !== undefined && item.total !== null && item.total !== '';
      const directTotal = hasDirectTotal ? Number(item.total) : null;
      const calculatedTotal = price > 0
        ? (item.autoCalculate !== false ? qty * price : price)
        : (directTotal !== null ? directTotal : 0);

      metaList.push({
        ...item,
        originalIndex: i,
        isCombined: false,
        sectionId: null,
        isSectionStart: false,
        sectionRowCount: 1,
        isSectionFollower: false,
        combinedAmount: null,
        displayPrice: price > 0 ? price : null,
        displayTotal: directTotal !== null && price === 0 ? directTotal : calculatedTotal
      });
      i++;
    } else {
      // Start of a combined section
      const sectionId = item.combinedSectionId || `sec-${i}-${Date.now()}`;
      let rowCount = 1;
      let j = i + 1;

      while (j < items.length) {
        const nextItem = items[j];
        if (!nextItem.isCombinedMode) break;
        // If explicitly flagged as a new section start, do not group with this section
        if (nextItem.isNewSectionStart) break;
        // If it already has a different defined section ID, keep them distinct
        if (nextItem.combinedSectionId && nextItem.combinedSectionId !== sectionId) break;
        rowCount++;
        j++;
      }

      const rawAmount = totalsObj[sectionId];
      const combinedAmount = rawAmount !== undefined && rawAmount !== '' ? Number(rawAmount) : 0;

      // Add the first row (the section start with rowSpan)
      metaList.push({
        ...item,
        originalIndex: i,
        isCombined: true,
        sectionId: sectionId,
        isSectionStart: true,
        sectionRowCount: rowCount,
        isSectionFollower: false,
        combinedAmount: combinedAmount,
        displayPrice: null,
        displayTotal: null
      });

      // Add the remaining follower rows (their total cell will be spanned by the first row)
      for (let k = i + 1; k < j; k++) {
        metaList.push({
          ...items[k],
          originalIndex: k,
          isCombined: true,
          sectionId: sectionId,
          isSectionStart: false,
          sectionRowCount: 0,
          isSectionFollower: true,
          combinedAmount: combinedAmount,
          displayPrice: null,
          displayTotal: null
        });
      }

      i = j;
    }
  }

  return metaList;
};

/**
 * Calculates Grand Total, Subtotal, and Tax according to:
 * Grand Total = All combined-section amounts + All individual item totals
 */
export const calculateBillTotals = (items = [], combinedTotals = {}, showTax = false) => {
  const totalsObj = combinedTotals instanceof Map ? Object.fromEntries(combinedTotals) : (combinedTotals || {});

  // 1. Sum individual uncombined items
  let individualTotal = 0;
  let individualTax = 0;

  (items || []).forEach(item => {
    if (!item.isCombinedMode) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const hasDirectTotal = item.total !== undefined && item.total !== null && item.total !== '';
      const directTotal = hasDirectTotal ? Number(item.total) : null;
      const itemTotal = price > 0
        ? (item.autoCalculate !== false ? qty * price : (directTotal !== null ? directTotal : price))
        : (directTotal !== null ? directTotal : 0);

      individualTotal += itemTotal;

      if (showTax && item.taxPercentage) {
        individualTax += (itemTotal * Number(item.taxPercentage || 0)) / 100;
      }
    }
  });

  // 2. Sum distinct combined sections that are currently present in items
  const activeSectionIds = new Set();
  (items || []).forEach(item => {
    if (item.isCombinedMode && item.combinedSectionId) {
      activeSectionIds.add(item.combinedSectionId);
    }
  });

  let combinedSectionsSum = 0;
  activeSectionIds.forEach(secId => {
    const amt = Number(totalsObj[secId]) || 0;
    combinedSectionsSum += amt;
  });

  const subTotal = individualTotal + combinedSectionsSum;
  const taxAmount = showTax ? individualTax : 0;
  const totalAmount = subTotal + taxAmount;

  return {
    individualTotal,
    combinedSectionsSum,
    subTotal,
    taxAmount,
    totalAmount
  };
};

/**
 * Synchronizes item section IDs and attributes linearly to guarantee
 * no overlapping sections, orphaned IDs, or duplicate assignments.
 */
export const synchronizeItemSections = (items = []) => {
  const result = [...items];
  let currentSectionId = null;

  for (let i = 0; i < result.length; i++) {
    const item = { ...result[i] };

    if (item.isCombinedMode) {
      // Must start a new section if:
      // - First item
      // - Item directly above is NOT combined
      // - Explicitly marked as isNewSectionStart
      const prevIsCombined = i > 0 && Boolean(result[i - 1].isCombinedMode);

      if (!prevIsCombined || item.isNewSectionStart) {
        currentSectionId = item.combinedSectionId || `sec-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
        item.combinedSectionId = currentSectionId;
        item.isNewSectionStart = prevIsCombined; // Only mark as split start if preceded by a combined item
      } else {
        item.combinedSectionId = currentSectionId;
        item.isNewSectionStart = false;
      }

      item.price = item.price !== undefined ? item.price : 0;
      item.total = 0;
    } else {
      currentSectionId = null;
      item.combinedSectionId = null;
      item.isNewSectionStart = false;
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      item.total = item.autoCalculate !== false ? qty * price : price;
    }

    result[i] = item;
  }

  return result;
};

/**
 * Vertical Curly Brace (}) Component spanning full height of the spanned rows.
 * Uses an SVG bezier path with preserveAspectRatio="none" so it scales
 * seamlessly to any table row height while keeping sharp crisp lines.
 */
export const CurlyBraceTotal = ({ amount, rowCount = 1, textColor = 'currentColor', fontSize = '0.95rem' }) => {
  const count = Math.max(1, rowCount);
  const minHeight = Math.max(42, count * 36);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        minHeight: `${minHeight}px`,
        boxSizing: 'border-box',
        padding: '2px 4px'
      }}
    >
      {/* Vertical right-pointing curly brace } */}
      <svg
        viewBox="0 0 24 100"
        preserveAspectRatio="none"
        style={{
          width: '16px',
          height: '100%',
          minHeight: `${minHeight - 8}px`,
          maxHeight: '100%',
          display: 'block',
          flexShrink: 0
        }}
      >
        <path
          d="M 4 2 Q 13 2 13 16 L 13 42 Q 13 50 22 50 Q 13 50 13 58 L 13 84 Q 13 98 4 98"
          fill="none"
          stroke={textColor}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Centered Combined Amount beside the brace */}
      <div
        style={{
          marginLeft: '8px',
          fontWeight: '800',
          fontSize: fontSize,
          whiteSpace: 'nowrap',
          color: textColor
        }}
      >
        &#8377;{Number(amount || 0).toLocaleString()}
      </div>
    </div>
  );
};
