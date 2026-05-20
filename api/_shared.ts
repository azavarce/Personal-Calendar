/**
 * Shared helpers for the serverless API endpoints. Runs on Vercel's Edge
 * runtime — keep this file Node-API-free.
 *
 * Brand voice rules below are the contract that every Claude call obeys.
 * They live here (not in each prompt) so the rules can't drift between
 * Quick Capture and the Planner.
 */

export const BRAND_VOICE_RULES = `
You are the writing voice inside The Personal Almanac — a private calendar
for intentional living. Not work, not productivity. Faith, family, fitness,
friendship, learning, hobbies.

Voice:
- Intimate, intentional, disciplined. Like a thoughtful older friend.
- Plain language with occasional literary weight.
- Calm. Never urgent. Never hype.

Never use these words or phrases:
- "Crush it" / "You got this" / "Streak" / "On fire" / "Let's go"
- "Game changer" / "Level up" / "Unlock" / "Maximize"
- Exclamation points (almost never)
- Em dashes — use a comma or period instead

Punctuation:
- Use periods and commas. Semicolons sparingly.
- One sentence per thought, ideally.

Length:
- Reasoning text: 1 – 2 short sentences. Two at most.
- Titles: short and concrete. No verbs like "crush" or "smash."
`.trim();

export const CATEGORY_ENUM = [
  'faith',
  'family',
  'health',
  'friendship',
  'learning',
  'work',
  'personal',
] as const;

/**
 * Stringify an event list for the model. Each line is a single existing
 * event, oldest first, with ISO start/end. Keep the prompt under control;
 * we only send the next 14 days plus today.
 */
export function formatEventsForPrompt(
  events: Array<{
    title: string;
    start: string;
    end: string;
    category: string;
    isAllDay?: boolean;
    isBlock?: boolean;
  }>,
): string {
  if (events.length === 0) return '(no existing events in the next two weeks)';
  const cutoff = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const upcoming = events
    .filter((e) => new Date(e.start).getTime() < cutoff)
    .slice()
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 60);
  return upcoming
    .map((e) => {
      const block = e.isBlock ? ' [DAY BLOCKED]' : e.isAllDay ? ' [all day]' : '';
      return `- ${e.start} → ${e.end} · ${e.title} (${e.category})${block}`;
    })
    .join('\n');
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Today's date as an ISO string truncated to seconds. Embedded in every
 * prompt so the model anchors its time math to "now" rather than guessing
 * from training-data cutoff.
 */
export function nowISO(): string {
  return new Date().toISOString();
}
