const VARIANT_KEYWORDS = [
  'Direct Plan', 'Regular Plan',
  'Growth', 'Growth Option', 'Growth Plan',
  'IDCW', 'IDCW Option', 'IDCW Plan', 'IDCW Reinvestment', 'IDCW Payout',
  'Dividend', 'Dividend Option', 'Dividend Plan',
  'Dividend Reinvestment', 'Dividend Payout',
  'Payout', 'Payout Option', 'Payout Plan',
  'Reinvestment', 'Reinvestment Option', 'Reinvestment Plan',
  'Income Distribution', 'Income Distribution cum Capital Withdrawal',
  'Bonus', 'Bonus Option', 'Bonus Plan',
  'Monthly', 'Monthly Option', 'Monthly Plan',
  'Quarterly', 'Quarterly Option', 'Quarterly Plan',
  'Half Yearly', 'Half Yearly Option',
  'Annual', 'Annual Option',
  'Cumulative', 'Cumulative Option',
  'Retail', 'Retail Plan',
  'Institutional', 'Institutional Plan',
];

function normalizeName(name) {
  const parts = name.split(' - ');
  const filtered = parts.filter(part => {
    const trimmed = part.trim();
    if (!trimmed) return false;
    return !VARIANT_KEYWORDS.some(keyword =>
      trimmed.toLowerCase() === keyword.toLowerCase() ||
      trimmed.toLowerCase().startsWith(keyword.toLowerCase())
    );
  });
  const result = filtered.join(' - ').trim();
  return result || name;
}

function extractVariantLabel(name, baseName) {
  let remaining = name.slice(baseName.length).trim();
  remaining = remaining.replace(/^-\s*/, '').trim();

  if (!remaining) return 'Regular Plan';

  const planKeywords = { dp: 'Direct Plan', rp: 'Regular Plan' };
  const typeKeywords = { g: 'Growth', i: 'IDCW', d: 'Dividend', b: 'Bonus' };

  const parts = remaining.split(' - ').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return remaining;

  const planIdx = parts.findIndex(p => {
    const lower = p.toLowerCase();
    return lower === 'direct plan' || lower === 'regular plan' ||
           lower === 'direct' || lower === 'regular';
  });

  const hasPlan = planIdx >= 0;
  const planPart = hasPlan ? parts[planIdx] : '';

  const typeParts = parts.filter((p, i) => i !== planIdx);

  const result = [];
  if (planPart) {
    if (planPart.toLowerCase() === 'direct' || planPart.toLowerCase() === 'direct plan') {
      result.push('Direct');
    } else if (planPart.toLowerCase() === 'regular' || planPart.toLowerCase() === 'regular plan') {
      result.push('Regular');
    }
  } else {
    result.push('Regular');
  }

  result.push(typeParts.join(' - ') || 'Growth');

  return result.join(' - ');
}

export function groupFunds(funds) {
  if (!funds || !funds.length) return [];

  const groups = {};

  funds.forEach(fund => {
    if (!fund || !fund.schemeName) return;
    const baseName = normalizeName(fund.schemeName);
    if (!groups[baseName]) {
      groups[baseName] = {
        baseName,
        variants: [],
        count: 0,
      };
    }
    groups[baseName].variants.push(fund);
    groups[baseName].count += 1;
  });

  return Object.values(groups).sort((a, b) => a.baseName.localeCompare(b.baseName));
}

export function getDisplayVariants(variants, baseName) {
  return variants.map(fund => ({
    ...fund,
    variantLabel: extractVariantLabel(fund.schemeName, baseName),
  }));
}
