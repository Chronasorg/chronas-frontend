/**
 * Subscription Utilities
 *
 * Mirrors the chronas-api rule in server/helpers/privileges.js: a user is a
 * supporter (PRO) when their subscription is set and is neither '' nor '-1'.
 * Legacy supporter accounts carry 'pro_v1'.
 */

/**
 * Whether a subscription value grants PRO status.
 */
export function isProSubscription(subscription: string | null | undefined): boolean {
  if (typeof subscription !== 'string') return false;
  const value = subscription.trim();
  return value !== '' && value !== '-1';
}
