/**
 * Store exports
 *
 * Central export point for all Zustand stores.
 */

export {
  useAuthStore,
  decodeJWT,
  isTokenExpired,
  TOKEN_STORAGE_KEY,
  type AuthState,
  type AuthActions,
  type AuthStore,
  type JWTPayload,
} from './authStore';

export {
  useUIStore,
  isValidTheme,
  isValidLocale,
  UI_STORAGE_KEY,
  defaultState as uiDefaultState,
  type Theme,
  type UIState,
  type UIActions,
  type UIStore,
} from './uiStore';

export {
  useLoadingStore,
  initialState as loadingInitialState,
  type LoadingState,
  type LoadingActions,
  type LoadingStore,
} from './loadingStore';

export {
  useNavigationStore,
  initialState as initialNavigationState,
  type DrawerContent,
  type NavigationState,
  type NavigationActions,
  type NavigationStore,
} from './navigationStore';

export {
  useTimelineStore,
  clampYear,
  isValidYear,
  initialState as timelineInitialState,
  defaultAutoplayConfig,
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_YEAR,
  type AutoplayConfig,
  type EpicItem,
  type TimelineState,
  type TimelineActions,
  type TimelineStore,
} from './timelineStore';
