export function toMixedFraction(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value || "");

  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const whole = Math.floor(abs);
  const fraction = abs - whole;

  if (fraction < 0.0001) return `${sign}${whole}`;

  const denominator = 16;
  const roundedNumerator = Math.round(fraction * denominator);
  if (roundedNumerator === denominator) return `${sign}${whole + 1}`;
  if (roundedNumerator === 0) return `${sign}${whole}`;

  const divisor = gcd(roundedNumerator, denominator);
  const numerator = roundedNumerator / divisor;
  const reducedDenominator = denominator / divisor;
  return whole === 0 ? `${sign}${numerator}/${reducedDenominator}` : `${sign}${whole} ${numerator}/${reducedDenominator}`;
}

export function formatDimensionText(rawText) {
  const input = String(rawText || "").trim();
  if (!input) return "";
  return input.replace(/-?\d+\.\d+/g, (match) => toMixedFraction(match));
}

export function parseMixedFraction(value) {
  const input = String(value || "").trim().replace(/[()]/g, " ");
  if (!input) return NaN;

  const direct = Number(input);
  if (Number.isFinite(direct)) return direct;

  const mixedMatch = input.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);
    if (!denominator) return NaN;
    const sign = whole < 0 ? -1 : 1;
    return whole + sign * (numerator / denominator);
  }

  const fractionMatch = input.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (!denominator) return NaN;
    return numerator / denominator;
  }

  return NaN;
}

function gcd(a, b) {
  if (!b) return a;
  return gcd(b, a % b);
}
