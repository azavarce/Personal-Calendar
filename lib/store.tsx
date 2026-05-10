import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type { CalendarEvent, Goal } from '@/lib/mock-data';
import type { Category } from '@/lib/categories';
import { categories as defaultCategories } from '@/lib/categories';
import type { CategoryId } from '@/theme';
import { ThemeOverrideProvider } from '@/theme/theme-context';

/**
 * Persistent app state.
 *
 * Doctrine: mock data (in lib/mock-data.ts) is immutable demo content that
 * keeps the deployed app feeling alive on first launch. The store carries
 * everything the user *adds*: events from the Planner, events from Quick
 * Capture, manually-created events, manually-created goals, and any
 * customisation to the six built-in categories (rename, recolor, reglyph,
 * reorder).
 *
 * Built-in categories themselves cannot be removed in v0.x; only edited.
 * Adding a 7th custom category is a future surface change.
 *
 * Persists to AsyncStorage on every state change. On web that backs to
 * localStorage; on native that backs to the platform store. Same API.
 */

const STORAGE_KEY = 'almanac:state:v1';

export type CategoryOverride = Partial<Pick<Category, 'label' | 'glyph'>> & {
  /** Override the palette swatch for this category (hex). */
  colorOverride?: string;
};

export type StoreState = {
  events: CalendarEvent[]; // user-added only
  goals: Goal[]; // user-added only
  categoryOverrides: Partial<Record<CategoryId, CategoryOverride>>;
  categoryOrder: CategoryId[];
  hasOnboarded: boolean;
  themeOverride: 'system' | 'light' | 'dark';
};

const initialState: StoreState = {
  events: [],
  goals: [],
  categoryOverrides: {},
  categoryOrder: defaultCategories.map((c) => c.id),
  hasOnboarded: false,
  themeOverride: 'system',
};

type Action =
  | { type: 'hydrate'; payload: StoreState }
  | { type: 'add-event'; event: CalendarEvent }
  | { type: 'add-events'; events: CalendarEvent[] }
  | { type: 'edit-event'; id: string; patch: Partial<CalendarEvent> }
  | { type: 'delete-event'; id: string }
  | { type: 'add-goal'; goal: Goal }
  | { type: 'edit-goal'; id: string; patch: Partial<Goal> }
  | { type: 'delete-goal'; id: string }
  | {
      type: 'override-category';
      id: CategoryId;
      override: CategoryOverride;
    }
  | { type: 'reset-category'; id: CategoryId }
  | { type: 'reorder-categories'; order: CategoryId[] }
  | { type: 'set-onboarded'; value: boolean }
  | { type: 'set-theme-override'; value: StoreState['themeOverride'] }
  | { type: 'reset-all' };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    case 'add-event':
      return { ...state, events: [...state.events, action.event] };
    case 'add-events':
      return { ...state, events: [...state.events, ...action.events] };
    case 'edit-event':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };
    case 'delete-event':
      return { ...state, events: state.events.filter((e) => e.id !== action.id) };
    case 'add-goal':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'edit-goal':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, ...action.patch } : g,
        ),
      };
    case 'delete-goal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case 'override-category':
      return {
        ...state,
        categoryOverrides: {
          ...state.categoryOverrides,
          [action.id]: { ...state.categoryOverrides[action.id], ...action.override },
        },
      };
    case 'reset-category': {
      const next = { ...state.categoryOverrides };
      delete next[action.id];
      return { ...state, categoryOverrides: next };
    }
    case 'reorder-categories':
      return { ...state, categoryOrder: action.order };
    case 'set-onboarded':
      return { ...state, hasOnboarded: action.value };
    case 'set-theme-override':
      return { ...state, themeOverride: action.value };
    case 'reset-all':
      return { ...initialState, hasOnboarded: state.hasOnboarded };
    default:
      return state;
  }
}

type StoreContextValue = {
  state: StoreState;
  hydrated: boolean;
  // Convenience action creators
  addEvent: (e: CalendarEvent) => void;
  addEvents: (es: CalendarEvent[]) => void;
  editEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addGoal: (g: Goal) => void;
  editGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  overrideCategory: (id: CategoryId, override: CategoryOverride) => void;
  resetCategory: (id: CategoryId) => void;
  reorderCategories: (order: CategoryId[]) => void;
  setOnboarded: (v: boolean) => void;
  setThemeOverride: (v: StoreState['themeOverride']) => void;
  resetAll: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from AsyncStorage on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as Partial<StoreState>;
          dispatch({
            type: 'hydrate',
            payload: { ...initialState, ...parsed },
          });
        }
      } catch {
        // Corrupt or missing — fall through with initial state.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every state change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Best-effort. Don't crash the app over a write failure.
    });
  }, [state, hydrated]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      hydrated,
      addEvent: (e) => dispatch({ type: 'add-event', event: e }),
      addEvents: (es) => dispatch({ type: 'add-events', events: es }),
      editEvent: (id, patch) => dispatch({ type: 'edit-event', id, patch }),
      deleteEvent: (id) => dispatch({ type: 'delete-event', id }),
      addGoal: (g) => dispatch({ type: 'add-goal', goal: g }),
      editGoal: (id, patch) => dispatch({ type: 'edit-goal', id, patch }),
      deleteGoal: (id) => dispatch({ type: 'delete-goal', id }),
      overrideCategory: (id, override) =>
        dispatch({ type: 'override-category', id, override }),
      resetCategory: (id) => dispatch({ type: 'reset-category', id }),
      reorderCategories: (order) =>
        dispatch({ type: 'reorder-categories', order }),
      setOnboarded: (v) => dispatch({ type: 'set-onboarded', value: v }),
      setThemeOverride: (v) =>
        dispatch({ type: 'set-theme-override', value: v }),
      resetAll: () => dispatch({ type: 'reset-all' }),
    }),
    [state, hydrated],
  );

  return (
    <StoreContext.Provider value={value}>
      <ThemeOverrideProvider value={state.themeOverride}>
        {children}
      </ThemeOverrideProvider>
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Read-only event list — store events only. Combine with mocks at the call site. */
export function useUserEvents(): CalendarEvent[] {
  return useStore().state.events;
}

/** Read-only goals list — store goals only. */
export function useUserGoals(): Goal[] {
  return useStore().state.goals;
}

/** Resolved categories: defaults overlaid with per-category overrides, in user order. */
export function useResolvedCategories(): Category[] {
  const { state } = useStore();
  return useMemo(() => {
    const byId = new Map(defaultCategories.map((c) => [c.id, c]));
    return state.categoryOrder
      .map((id) => byId.get(id))
      .filter((c): c is Category => Boolean(c))
      .map((c) => {
        const o = state.categoryOverrides[c.id];
        if (!o) return c;
        return {
          ...c,
          label: o.label ?? c.label,
          glyph: o.glyph ?? c.glyph,
        };
      });
  }, [state.categoryOrder, state.categoryOverrides]);
}

/** Lookup a single resolved category by id (with overrides applied). */
export function useResolvedCategory(id: CategoryId): Category | undefined {
  return useResolvedCategories().find((c) => c.id === id);
}

/** Imperative wrapper so tests/scripts can clear all storage. */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}

// Action creator helpers for callers that don't want to thread the store hook.
export function useStoreActions() {
  const {
    addEvent,
    addEvents,
    editEvent,
    deleteEvent,
    addGoal,
    editGoal,
    deleteGoal,
    overrideCategory,
    resetCategory,
    reorderCategories,
    setOnboarded,
    setThemeOverride,
    resetAll,
  } = useStore();
  return useMemo(
    () => ({
      addEvent,
      addEvents,
      editEvent,
      deleteEvent,
      addGoal,
      editGoal,
      deleteGoal,
      overrideCategory,
      resetCategory,
      reorderCategories,
      setOnboarded,
      setThemeOverride,
      resetAll,
    }),
    [
      addEvent,
      addEvents,
      editEvent,
      deleteEvent,
      addGoal,
      editGoal,
      deleteGoal,
      overrideCategory,
      resetCategory,
      reorderCategories,
      setOnboarded,
      setThemeOverride,
      resetAll,
    ],
  );
}

const useResolvedCallback = <T,>(fn: () => T) => useCallback(fn, []);
void useResolvedCallback;
