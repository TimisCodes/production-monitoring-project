/**
 * Format a number as Nigerian Naira.
 */
export const formatPrice = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};
