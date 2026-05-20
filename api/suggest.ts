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
 * POST /api/suggest
 *
 * Quick Capture endpoint. Takes the user's plain-language ask and the
 * current calendar; returns a single proposed event with reasoning.
 *
 * Request body:
 *   { input: string; existingEvents: CalendarEvent[]; nowISO?: string }
 *
 * Response body (success):
 *   { reasoning: string; proposedTitle: string; proposedStart: string;
 *     proposedEnd: string; category: CategoryId }
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse('Server is missing ANTHROPIC_API_KEY', 500);
  }

  let body: { input?: unknown; existingEvents?: unknown; nowISO?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const input = typeof body.input === 'string' ? body.input.trim() : '';
  if (!input) return errorResponse('Missing input', 400);

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

  const system = `${BRAND_VOICE_RULES}

You are helping the user find a single time slot for what they describe.

Current time: ${clientNow}

Their existing events for the next two weeks:
${formatEventsForPrompt(events)}

Rules for choosing a slot:
- Do NOT propose anything that overlaps an existing event.
- Day-blocked events ([DAY BLOCKED]) are reserved. Skip the entire day.
- Prefer mornings for faith and reading, evenings for family and dates,
  lunch for short friendship check-ins, late afternoon for workouts.
- Use the user's own words for the title, lightly cleaned up.
- The slot must be in the future, within the next 14 days.

You will call the propose_event tool exactly once.`;

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system,
      tools: [
        {
          name: 'propose_event',
          description:
            'Propose a single calendar event for the user. The reasoning should sound like a thoughtful friend, never like a productivity app.',
          input_schema: {
            type: 'object',
            properties: {
              reasoning: {
                type: 'string',
                description:
                  'One or two short sentences explaining the choice. Calm, intimate, never hype. No em dashes.',
              },
              proposedTitle: {
                type: 'string',
                description:
                  "Short concrete title using the user's own words, lightly cleaned up.",
              },
              proposedStart: {
                type: 'string',
                description:
                  'Start time as full ISO 8601 (with timezone offset, matching the current time given above).',
              },
              proposedEnd: {
                type: 'string',
                description: 'End time as full ISO 8601.',
              },
              category: {
                type: 'string',
                enum: [...CATEGORY_ENUM],
                description: 'One of the seven category ids.',
              },
            },
            required: [
              'reasoning',
              'proposedTitle',
              'proposedStart',
              'proposedEnd',
              'category',
            ],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'propose_event' },
      messages: [{ role: 'user', content: input }],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return errorResponse('Model did not return a structured suggestion', 502);
    }

    return jsonResponse(toolUse.input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return errorResponse(`Claude call failed: ${msg}`, 502);
  }
}
