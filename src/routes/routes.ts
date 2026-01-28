/**
 * Route constants for the application.
 * These mirror the existing frontend routes for migration compatibility.
 */
export const ROUTES = {
  HOME: '/',
  CONFIGURATION: '/configuration',
  DISCOVER: '/discover',
  LOGIN: '/login',
  ARTICLE: '/article',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
