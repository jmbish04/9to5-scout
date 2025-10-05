import { z } from 'zod';
import { getJsonPayload, validatePayload } from '../utils/request';

const ResumeRequestSchema = z.object({
  job_title: z.string().min(1),
  company_name: z.string().min(1),
  job_description_text: z.string().min(1),
  candidate_career_summary: z.string().min(1),
});
export type ResumeRequestBody = z.infer<typeof ResumeRequestSchema>;

export interface ResumeContent {
  summary: string;
  experience_bullets: string[];
  skills: string[];
}

export async function handleResume(request: Request, env: Env): Promise<Response> {
  const { payload, errorResponse } = await getJsonPayload(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: validationError } =
    validatePayload(payload, ResumeRequestSchema);
  if (validationError) return validationError;

  const resumeSchema = {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Professional summary tailored to the job.' },
      experience_bullets: {
        type: 'array',
        description: 'Three concise bullet points highlighting relevant achievements.',
        items: { type: 'string' },
      },
      skills: {
        type: 'array',
        description: 'Key skills relevant to the job description.',
        items: { type: 'string' },
      },
    },
    required: ['summary', 'experience_bullets', 'skills'],
  } as const;

  const messages = [
    {
      role: 'system',
      content:
        'You are an expert resume writer. Generate a resume summary, three experience bullet points, and a list of key skills tailored to the job description and candidate background. Use the provided JSON schema.',
    },
    {
      role: 'user',
      content: `Generate resume content for the following details:\n\n- Job Title: ${body.job_title}\n- Company: ${body.company_name}\n\n--- Job Description ---\n${body.job_description_text}\n\n--- Candidate Career Summary ---\n${body.candidate_career_summary}\n\nFollow the JSON schema strictly.`,
    },
  ];

  const inputs = { messages, guided_json: resumeSchema };
  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', inputs);
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

