/**
 * Formate un nombre en MAD (Dirham marocain)
 */
export function fmtMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formate un nombre avec 3 décimales et séparateurs de milliers
 */
export function num3(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

/**
 * Convertit une valeur en nombre sûr avec valeur par défaut
 */
export const safeNum = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Applique toFixed de manière sûre
 */
export const nFixed = (v: any, digits = 2) => safeNum(v).toFixed(digits);