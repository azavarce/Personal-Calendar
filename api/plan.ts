import Anthropic from '@anthropic-ai/sdk';
import {
  BRAND_VOICE_RULES,
  CATEGORY_ENUM,
  errorResponse,
  formatEventsForPrompt,
  jsonResponse,
  nowISO,
} from './_shared';

export const config = { runtime: 'edge' };

/**
 * POST /api/plan
 *
 * Multi-event planner. Takes a template id ('bible' | 'friends' |
 * 'dateNights' | 'custom') with template-specific params, the user's
 * existing calendar, and returns a full plan (reasoning + ordered events).
 *
 * The serverless layer does the language work; the client still runs each
 * proposed event through findFreeSlot() so conflicts are resolved
 * deterministically. Claude proposes shape; code enforces correctness.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse('Server is missing ANTHROPIC_API_KEY', 500);
  }

  let body: {
    template?: unknown;
    params?: unknown;
    existingEvents?: unknown;
    nowISO?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const template = typeof body.template === 'string' ? body.template : '';
  if (
    template !== 'bible' &&
    template !== 'friends' &&
    template !== 'dateNights' &&
    template !== 'custom'
  ) {
    return errorResponse('Unknown template', 400);
  }
  const params = (body.params ?? {}) as Record<string, unknown>;
  const events = Array.isArray(body.existingEvents)
    ? (body.existingEvents as Array<{
        title: string;
        start: string;
        end: string;
        category: string;
        isAllDay?: boolean;
        isBlock?: boolean;
      }>)
    : [];
  const clientNow =
    typeof body.nowISO === 'string' && body.nowISO ? body.nowISO : nowISO();

  const taskBrief = describeTask(template, params);

  const system = `${BRAND_VOICE_RULES}

You are shaping a multi-event plan for the user.

Current time: ${clientNow}

Their existing events for the next two weeks:
${formatEventsForPrompt(events)}

The plan you propose must:
- Avoid overlapping any existing event. Day-blocked entries skip the whole day.
- Match the cadence the user asked for. No more events than requested.
- Use the same category for every event in the plan.
- Use full ISO 8601 strings with timezone offset for start/end.
- Stay grounded in the next 12 weeks unless the cadence requires longer.
- Title each event concretely. Plain English; no hype words.

Write the reasoning as if you were telling a friend why this shape works.
1 – 3 sentences. No em dashes.

Call propose_plan exactly once.`;

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      tools: [
        {
          name: 'propose_plan',
          description:
            'Propose a complete multi-event plan with a single sentence of reasoning and an ordered list of events.',
          input_schema: {
            type: 'object',
            properties: {
              reasoning: {
                type: 'string',
                description:
                  'Short, warm explanation — 1 to 3 sentences. No em dashes. No hype.',
              },
              goalTitle: {
                type: 'string',
                description: 'Short title for the goal as a whole.',
              },
              goalCadence: {
                type: 'string',
                description:
                  'Human-readable cadence, e.g. "every Sunday morning" or "twice a week".',
              },
              category: {
                type: 'string',
                enum: [...CATEGORY_ENUM],
                description: 'One of the seven category ids; same for every event.',
              },
              totalCount: {
                type: 'number',
                description:
                  'Total number of events the full goal implies over time (may be larger than events.length if the plan only shows the first window).',
              },
              events: {
                type: 'array',
                description: 'Ordered list of events to place on the calendar.',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    startISO: { type: 'string' },
                    endISO: { type: 'string' },
                    destinationApp: {
                      type: 'string',
                      description:
                        'Optional app name where this event opens, e.g. "YouVersion", "WhatsApp", "Phone".',
                    },
                  },
                  required: ['title', 'startISO', 'endISO'],
                },
              },
            },
            required: [
              'reasoning',
              'goalTitle',
              'goalCadence',
              'category',
              'totalCount',
              'events',
            ],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'propose_plan' },
      messages: [{ role: 'user', content: taskBrief }],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return errorResponse('Model did not return a structured plan', 502);
    }
    return jsonResponse(toolUse.input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return errorResponse(`Claude call failed: ${msg}`, 502);
  }
}

function describeTask(
  template: 'bible' | 'friends' | 'dateNights' | 'custom',
  params: Record<string, unknown>,
): string {
  switch (template) {
    case 'bible': {
      const t = typeof params.translation === 'string' ? params.translation : 'ESV';
      const p = typeof params.planType === 'string' ? params.planType : 'canonical';
      return `Read the Bible this year. Translation: ${t}. Plan type: ${p}.
- canonical: Genesis to Revelation in order, ~3 chapters most mornings.
- chronological: in the order events happened, Job and Genesis intertwined.
- mcheyne: M'Cheyne's 1842 plan, two Old Testament + two New Testament chapters daily.
- onePerDay: one chapter per day, a three-year walk.

Show the FIRST 14 days only. Set totalCount to 365 for canonical, chronological, mcheyne; 1189 for onePerDay. Use category "faith". Each event 30 minutes around 6:30am unless something blocks that slot. destinationApp should be "YouVersion".`;
    }
    case 'friends': {
      const picks = Array.isArray(params.picks) ? params.picks : [];
      const cadence = typeof params.cadence === 'string' ? params.cadence : 'biweekly';
      const peopleLine = picks
        .map((p) => {
          const obj = p as Record<string, unknown>;
          return `${obj.name} (${obj.channel})`;
        })
        .join(', ');
      return `Stay close with these people: ${peopleLine}.
Cadence per person: ${cadence} (weekly = every 7 days; biweekly = every 14; monthly = every 30).
- Each event is 15 minutes around lunch (12:30pm), one person per day, spaced so the cadence is met.
- Title: use the channel verb. iMessage → "Text X". whatsapp → "WhatsApp X". messenger → "Message X". call → "Call X".
- destinationApp: iMessage→Messages, whatsapp→WhatsApp, messenger→Messenger, call→Phone.
- Show up to 14 events in the first cycle.
- Category: "friendship". totalCount: pick count × (52 weekly / 26 biweekly / 12 monthly).`;
    }
    case 'dateNights': {
      const months = typeof params.months === 'number' ? params.months : 6;
      const vibes = Array.isArray(params.vibes) ? params.vibes : [];
      const budget = typeof params.budget === 'string' ? params.budget : 'moderate';
      const vibesLine = vibes.length > 0 ? vibes.join(', ') : 'mix it up';
      return `Plan ${months} monthly date nights for the user and their spouse.
Vibes: ${vibesLine}. Budget: ${budget} (modest = under $50; moderate = $50–150; splurge = $150+; mix = vary).
- One event per month, typically the second Saturday at 7pm, 3 hours long.
- Title is the concrete idea, not a label (e.g. "Tasting menu downtown", "Sunset hike at the ridge", "Backyard fire with red wine").
- Category: "family". totalCount: ${months}. No destinationApp.`;
    }
    case 'custom': {
      const desc = typeof params.description === 'string' ? params.description : '';
      return `The user wrote: "${desc}".
Shape this into a small initial plan — 1 to 5 events that get the goal started.
Pick the right category from the enum. Anchor the first event in the next 7 days at a time that doesn't conflict. Keep titles concrete and plain.
If the goal implies a long-running rhythm, set totalCount accordingly; otherwise totalCount equals events.length.`;
    }
  }
}
