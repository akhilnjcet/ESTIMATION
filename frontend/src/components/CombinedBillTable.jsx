import React from 'react';
import { computeItemSectionMeta, CurlyBraceTotal } from '../utils/combinedBillHelper';

/**
 * Reusable Bill Table renderer for all document themes (Classic, Modern, Executive).
 * Correctly renders:
 * - Empty Total cells for combined items via rowSpan
 * - Vertical curly brace (}) spanning the full height of selected consecutive rows
 * - Centered combined amount beside the brace
 * - Standard Quantity * Price totals for uncombined items
 * - No subtotal rows, no group labels
 */
export const CombinedBillTableBody = ({
  items = [],
  combinedTotals = {},
  theme = 'classic',
  tableBorderColor = '#e2e8f0',
  textColor = '#0f172a',
  zebraBg = true,
  enableUnitPrice = true
}) => {
  const sectionMeta = computeItemSectionMeta(items, combinedTotals);

  return (
    <tbody>
      {sectionMeta.map((meta, idx) => {
        const rowBg = zebraBg 
          ? (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC')
          : '#FFFFFF';

        const unitLabel = meta.unit === 'Kg' ? 'Kg' : (meta.unit || 'Pcs');

        return (
          <tr 
            key={idx} 
            style={{ 
              borderBottom: `1px solid ${tableBorderColor}`,
              background: rowBg
            }}
          >
            {/* Sl. No. / Index */}
            <td 
              style={{ 
                padding: '0.65rem 0.6rem', 
                fontSize: '0.8rem', 
                color: '#64748B',
                textAlign: 'left',
                verticalAlign: 'middle'
              }}
            >
              {String(idx + 1).padStart(2, '0')}
            </td>

            {/* Item Description */}
            <td 
              style={{ 
                padding: '0.65rem 0.6rem', 
                fontSize: '0.85rem',
                verticalAlign: 'middle',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: '700', color: textColor }}>
                {meta.productName || 'Item'}
              </div>
              {meta.description && (
                <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '1px' }}>
                  {meta.description}
                </div>
              )}
            </td>

            {/* Qty */}
            <td 
              style={{ 
                padding: '0.65rem 0.6rem', 
                textAlign: 'center', 
                fontSize: '0.85rem',
                color: textColor,
                verticalAlign: 'middle'
              }}
            >
              {meta.quantity} {unitLabel}
            </td>

            {/* Rate / Unit Price (₹) - Only if enableUnitPrice !== false */}
            {enableUnitPrice !== false && (
              <td 
                style={{ 
                  padding: '0.65rem 0.6rem', 
                  textAlign: 'right', 
                  fontSize: '0.85rem',
                  color: textColor,
                  verticalAlign: 'middle'
                }}
              >
                {meta.isCombined 
                  ? '—' 
                  : (meta.displayPrice !== null && meta.displayPrice !== undefined && Number(meta.displayPrice) > 0
                      ? `\u20B9${Number(meta.displayPrice).toLocaleString()}`
                      : '—')
                }
              </td>
            )}

            {/* Total (₹) */}
            {meta.isCombined ? (
              meta.isSectionStart ? (
                <td
                  rowSpan={meta.sectionRowCount}
                  style={{
                    padding: '0.35rem 0.6rem',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    background: '#FFFFFF',
                    borderLeft: `1px solid ${tableBorderColor}`,
                    borderBottom: `1px solid ${tableBorderColor}`
                  }}
                >
                  <CurlyBraceTotal
                    amount={meta.combinedAmount}
                    rowCount={meta.sectionRowCount}
                    textColor={textColor}
                    fontSize="0.95rem"
                  />
                </td>
              ) : null /* follower rows leave Total cell spanned and empty */
            ) : (
              <td 
                style={{ 
                  padding: '0.65rem 0.6rem', 
                  textAlign: 'right', 
                  fontWeight: '700', 
                  fontSize: '0.85rem',
                  color: textColor,
                  verticalAlign: 'middle',
                  borderLeft: `1px solid ${tableBorderColor}`
                }}
              >
                {`\u20B9${Number(meta.displayTotal || 0).toLocaleString()}`}
              </td>
            )}
          </tr>
        );
      })}
    </tbody>
  );
};

export default CombinedBillTableBody;
