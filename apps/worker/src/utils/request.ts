import { z } from 'zod';

export async function getJsonPayload(
  request: Request,
): Promise<{ payload: unknown; errorResponse: null } | { payload: null; errorResponse: Response }> {
  try {
    const payload = await request.json();
    return { payload, errorResponse: null };
  } catch {
    const errorResponse = new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
    return { payload: null, errorResponse };
  }
}

export function validatePayload<T extends z.ZodTypeAny>(
  payload: unknown,
  schema: T,
):
  | { data: z.infer<T>; errorResponse: null }
  | { data: null; errorResponse: Response } {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const errorResponse = new Response(
      JSON.stringify({ error: 'Invalid request body', issues: result.error.issues }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
    return { data: null, errorResponse };
  }
  return { data: result.data, errorResponse: null };
}
