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
import type { Category, CategoryId } from '@/lib/categories';
import { categories as defaultCategories } from '@/lib/categories';
import { useTheme } from '@/theme';
import { ThemeOverrideProvider } from '@/theme/theme-context';

/**
 * Persistent app state.
 *
 * Doctrine: mock data (in lib/mock-data.ts) is immutable demo content that
 * keeps the deployed app feeling alive on first launch. The store carries
 * everything the user *adds* (events from the Planner, events from Quick
 * Capture) and any customisation to the categories: per-built-in label
 * overrides, plus user-added custom categories.
 *
 * Persists to AsyncStorage on every state change. On web that backs to
 * localStorage; on native that backs to the platform store. Same API.
 */

const STORAGE_KEY = 'almanac:state:v1';

export type CategoryOverride = Partial<Pick<Category, 'label'>>;

export type StoreState = {
  events: CalendarEvent[]; // user-added only
  goals: Goal[]; // user-added only
  /** Per-built-in category renames. Key is the built-in id ('faith', etc.). */
  categoryOverrides: Record<CategoryId, CategoryOverride>;
  /** Custom categories the user has added beyond the six built-ins. */
  customCategories: Category[];
  /** Order of all category ids (built-in + custom). */
  categoryOrder: CategoryId[];
  hasOnboarded: boolean;
  themeOverride: 'system' | 'light' | 'dark';
};

const initialState: StoreState = {
  events: [],
  goals: [],
  categoryOverrides: {},
  customCategories: [],
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
  | { type: 'add-custom-category'; category: Category }
  | { type: 'remove-custom-category'; id: CategoryId }
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
    case 'add-custom-category': {
      // Append the new category to customCategories AND to the visible order.
      const exists = state.customCategories.some((c) => c.id === action.category.id);
      if (exists) return state;
      return {
        ...state,
        customCategories: [...state.customCategories, action.category],
        categoryOrder: [...state.categoryOrder, action.category.id],
      };
    }
    case 'remove-custom-category': {
      // Built-ins can never be removed via this path; reducer will silently
      // ignore an attempt to remove one.
      const isBuiltin = defaultCategories.some((c) => c.id === action.id);
      if (isBuiltin) return state;
      return {
        ...state,
        customCategories: state.customCategories.filter((c) => c.id !== action.id),
        categoryOrder: state.categoryOrder.filter((id) => id !== action.id),
      };
    }
    case 'set-onboarded':
      return { ...state, hasOnboarded: action.value };
    case 'set-theme-override':
      return { ...state, themeOverride: action.value };
    case 'reset-all':
      // Keep onboarded state — user has seen the welcome already.
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
  addCustomCategory: (category: Category) => void;
  removeCustomCategory: (id: CategoryId) => void;
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
          // Defensive merge — older saved states won't have customCategories
          // or category order entries for newly-added built-ins. Always
          // ensure every built-in is represented in the order.
          const builtinIds = defaultCategories.map((c) => c.id);
          const mergedOrder = [
            ...(parsed.categoryOrder ?? builtinIds).filter((id) =>
              builtinIds.includes(id) ||
              (parsed.customCategories ?? []).some((c) => c.id === id),
            ),
            ...builtinIds.filter((id) => !(parsed.categoryOrder ?? []).includes(id)),
          ];
          dispatch({
            type: 'hydrate',
            payload: {
              ...initialState,
              ...parsed,
              customCategories: parsed.customCategories ?? [],
              categoryOrder: mergedOrder,
            },
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
      addCustomCategory: (category) =>
        dispatch({ type: 'add-custom-category', category }),
      removeCustomCategory: (id) =>
        dispatch({ type: 'remove-custom-category', id }),
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

/**
 * Resolved categories (built-ins overlaid with overrides + customs) returned
 * in the user's chosen order.
 */
export function useResolvedCategories(): Category[] {
  const { state } = useStore();
  return useMemo(() => {
    const byId = new Map<string, Category>();
    for (const c of defaultCategories) byId.set(c.id, c);
    for (const c of state.customCategories) byId.set(c.id, c);

    return state.categoryOrder
      .map((id) => byId.get(id))
      .filter((c): c is Category => Boolean(c))
      .map((c) => {
        const o = state.categoryOverrides[c.id];
        if (!o?.label) return c;
        return { ...c, label: o.label };
      });
  }, [state.categoryOrder, state.categoryOverrides, state.customCategories]);
}

/** Lookup a single resolved category by id. */
export function useResolvedCategory(id: CategoryId): Category | undefined {
  return useResolvedCategories().find((c) => c.id === id);
}

/**
 * Returns the resolved category color for the active theme mode. Use this
 * everywhere instead of the old `palette.category[id]`. Falls back to a
 * neutral grey if the category isn't found (e.g. during hydration).
 */
export function useCategoryColor(id: CategoryId): string {
  const { mode } = useTheme();
  const cat = useResolvedCategory(id);
  if (!cat) return mode === 'dark' ? '#A0978A' : '#6B6359';
  return cat.color[mode];
}

/** Imperative wrapper so tests/scripts can clear all storage. */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}

const _unused = useCallback;
void _unused;
