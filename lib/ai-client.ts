/**
 * Thin client-side wrapper around the /api/suggest and /api/plan endpoints.
 *
 * Two priorities:
 *  - Strict input/output validation with Zod so a bad model response
 *    surfaces as a clean error string instead of broken UI.
 *  - Graceful fallback to the local mock generators when the API is
 *    unreachable (offline, no key set on the deploy, dev with no .env).
 *    The UI still works; the reasoning still sounds right; the user just
 *    isn't talking to a live model.
 *
 * The fetch target is a relative URL ("/api/suggest"). On web that hits
 * the same origin (Vercel). On native, EXPO_PUBLIC_API_BASE_URL can point
 * at the deployed host so the app can run from a phone build.
 */

import { z } from 'zod';
import type { CalendarEvent, CaptureResponse } from '@/lib/mock-data';
import { mockCaptureResponse } from '@/lib/mock-data';
import { findFreeSlot } from '@/lib/conflict';
import type { Plan, PlanEvent, TemplateId } from '@/lib/planner';
import {
  generateBiblePlan,
  generateCustomPlan,
  generateDateNightsPlan,
  generateFriendsPlan,
  type BiblePlanType,
  type BibleTranslation,
  type DateNightBudget,
  type DateNightVibe,
  type FriendCadence,
  type FriendPick,
} from '@/lib/planner';

const CATEGORY_VALUES = [
  'faith',
  'family',
  'health',
  'friendship',
  'learning',
  'work',
  'personal',
] as const;
const CategoryEnum = z.enum(CATEGORY_VALUES);

const SuggestSchema = z.object({
  reasoning: z.string().min(1),
  proposedTitle: z.string().min(1),
  proposedStart: z.string().min(1),
  proposedEnd: z.string().min(1),
  category: CategoryEnum,
});

const PlanEventSchema = z.object({
  title: z.string().min(1),
  startISO: z.string().min(1),
  endISO: z.string().min(1),
  destinationApp: z.string().optional(),
});

const PlanSchema = z.object({
  reasoning: z.string().min(1),
  goalTitle: z.string().min(1),
  goalCadence: z.string().min(1),
  category: CategoryEnum,
  totalCount: z.number().int().nonnegative(),
  events: z.array(PlanEventSchema).min(1),
});

function getBase(): string {
  // EXPO_PUBLIC_* vars are inlined at build time. In web (Vercel), we can
  // leave it empty and hit a same-origin relative URL.
  const fromEnv =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL;
  return fromEnv ? fromEnv.replace(/\/$/, '') : '';
}

async function postJSON(path: string, body: unknown, timeoutMs = 30000): Promise<unknown> {
  const url = `${getBase()}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Bad response from ${path}: ${text.slice(0, 120)}`);
    }
    if (!res.ok) {
      const msg =
        parsed && typeof parsed === 'object' && parsed !== null && 'error' in parsed
          ? String((parsed as Record<string, unknown>).error)
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip fields from CalendarEvent that the server doesn't need. */
function stripEvents(events: CalendarEvent[]) {
  return events.map((e) => ({
    title: e.title,
    start: e.start,
    end: e.end,
    category: e.category,
    isAllDay: e.isAllDay,
    isBlock: e.isBlock,
  }));
}

// ---------- Quick Capture ----------

/**
 * Request a single-event suggestion from the server. Falls back to the
 * local mock generator if the network/API is unavailable.
 *
 * If `avoidSlot` is provided, the model is told to propose a meaningfully
 * different window — used by the "Try another time" retry flow.
 */
export async function requestSuggestion(
  input: string,
  existingEvents: CalendarEvent[],
  avoidSlot?: { start: string; end: string },
): Promise<CaptureResponse> {
  try {
    const raw = await postJSON('/api/suggest', {
      input,
      existingEvents: stripEvents(existingEvents),
      nowISO: new Date().toISOString(),
      avoidSlot,
    });
    const parsed = SuggestSchema.parse(raw);

    // Re-run through conflict checker; the model is asked to avoid
    // overlap but enforce locally to be sure. If we have an avoidSlot,
    // include it as a phantom event so a same-slot proposal also shifts.
    const start = new Date(parsed.proposedStart);
    const end = new Date(parsed.proposedEnd);
    const scope: CalendarEvent[] = avoidSlot
      ? [
          ...existingEvents,
          {
            id: 'avoid-prev-suggestion',
            title: '(previous suggestion)',
            start: avoidSlot.start,
            end: avoidSlot.end,
            category: parsed.category,
          },
        ]
      : existingEvents;
    const { slot, shifted, conflictWith } = findFreeSlot(
      { start, end },
      scope,
    );

    // Don't surface the phantom "previous suggestion" event in the reasoning
    // suffix — only mention real conflicts.
    const realConflict =
      conflictWith && conflictWith.id !== 'avoid-prev-suggestion'
        ? conflictWith
        : undefined;

    return {
      reasoning:
        shifted && realConflict
          ? `${parsed.reasoning} The slot I had in mind overlapped "${realConflict.title}", so I nudged this one forward to the next free window.`
          : parsed.reasoning,
      proposedTitle: parsed.proposedTitle,
      proposedStart: slot.start.toISOString(),
      proposedEnd: slot.end.toISOString(),
      category: parsed.category,
      shifted: shifted && !!realConflict,
      conflictWith: realConflict?.title,
    };
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[ai-client] /api/suggest failed, using mock:', e);
    }
    return mockCaptureResponse(input, existingEvents);
  }
}

// ---------- Planner ----------

export type PlannerParams =
  | {
      template: 'bible';
      translation: BibleTranslation;
      planType: BiblePlanType;
    }
  | {
      template: 'friends';
      picks: FriendPick[];
      cadence: FriendCadence;
    }
  | {
      template: 'dateNights';
      months: number;
      vibes: DateNightVibe[];
      budget: DateNightBudget;
    }
  | {
      template: 'custom';
      description: string;
    };

export async function requestPlan(
  params: PlannerParams,
  existingEvents: CalendarEvent[],
): Promise<Plan> {
  try {
    const serverParams = serverParamsFor(params);
    const raw = await postJSON('/api/plan', {
      template: params.template,
      params: serverParams,
      existingEvents: stripEvents(existingEvents),
      nowISO: new Date().toISOString(),
    });
    const parsed = PlanSchema.parse(raw);

    // Lay the events down through findFreeSlot so each one respects
    // existing events AND the events earlier in the same plan.
    let scope = [...existingEvents];
    const placedEvents: PlanEvent[] = parsed.events.map((e, i) => {
      const desired = {
        start: new Date(e.startISO),
        end: new Date(e.endISO),
      };
      const { slot, shifted } = findFreeSlot(desired, scope);
      const placed: PlanEvent = {
        id: `${params.template}-${i}`,
        title: e.title,
        startISO: slot.start.toISOString(),
        endISO: slot.end.toISOString(),
        category: parsed.category,
        destinationApp: e.destinationApp,
        shifted: shifted || undefined,
      };
      scope = [
        ...scope,
        {
          id: placed.id,
          title: placed.title,
          start: placed.startISO,
          end: placed.endISO,
          category: placed.category,
        },
      ];
      return placed;
    });

    const shiftedCount = placedEvents.filter((e) => e.shifted).length;
    let reasoning = parsed.reasoning;
    if (shiftedCount > 0) {
      reasoning = `${reasoning} A few of the slots I had in mind were already taken, so those nudged forward to the next free window.`;
    }

    return {
      reasoning,
      events: placedEvents,
      totalCount: parsed.totalCount || placedEvents.length,
      goalTitle: parsed.goalTitle,
      goalCadence: parsed.goalCadence,
      category: parsed.category,
      shiftedCount,
    };
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[ai-client] /api/plan failed, using mock:', e);
    }
    return mockPlan(params, existingEvents);
  }
}

function serverParamsFor(p: PlannerParams): Record<string, unknown> {
  switch (p.template) {
    case 'bible':
      return { translation: p.translation, planType: p.planType };
    case 'friends':
      return { picks: p.picks, cadence: p.cadence };
    case 'dateNights':
      return { months: p.months, vibes: p.vibes, budget: p.budget };
    case 'custom':
      return { description: p.description };
  }
}

function mockPlan(p: PlannerParams, existingEvents: CalendarEvent[]): Plan {
  switch (p.template) {
    case 'bible':
      return generateBiblePlan(p.translation, p.planType, existingEvents);
    case 'friends':
      return generateFriendsPlan(p.picks, p.cadence, existingEvents);
    case 'dateNights':
      return generateDateNightsPlan(p.months, p.vibes, p.budget, existingEvents);
    case 'custom':
      return generateCustomPlan(p.description, existingEvents);
  }
}

export const __test__ = {
  SuggestSchema,
  PlanSchema,
  asTemplateId: (s: string): TemplateId | null =>
    s === 'bible' || s === 'friends' || s === 'dateNights' || s === 'custom'
      ? (s as TemplateId)
      : null,
};
