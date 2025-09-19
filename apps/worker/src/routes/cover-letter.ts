import { z } from 'zod';
import { getJsonPayload, validatePayload } from '../utils/request';

const CoverLetterRequestSchema = z.object({
  job_title: z.string().min(1),
  company_name: z.string().min(1),
  hiring_manager_name: z.string().min(1).optional(),
  job_description_text: z.string().min(1),
  candidate_career_summary: z.string().min(1),
});
export type CoverLetterRequestBody = z.infer<typeof CoverLetterRequestSchema>;

export interface CoverLetterContent {
  salutation: string;
  opening_paragraph: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  closing_paragraph: string;
}

export async function handleCoverLetter(request: Request, env: Env): Promise<Response> {
  const { payload, errorResponse } = await getJsonPayload(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: validationError } =
    validatePayload(payload, CoverLetterRequestSchema);
  if (validationError) return validationError;

  const coverLetterSchema = {
    type: 'object',
    properties: {
      salutation: {
        type: 'string',
        description:
          'A professional salutation, addressing the hiring manager by name if provided, otherwise using a general title like "Dear Hiring Manager,".',
      },
      opening_paragraph: {
        type: 'string',
        description:
          'A compelling opening paragraph that clearly states the position being applied for, where it was seen, and a powerful 1-2 sentence summary of the candidate\'s fitness for the role, creating immediate interest.',
      },
      body_paragraph_1: {
        type: 'string',
        description:
          'The first body paragraph. Connects the candidate\'s key experiences and skills directly to the most important requirements from the job description. Should highlight 1-2 specific, quantifiable achievements.',
      },
      body_paragraph_2: {
        type: 'string',
        description:
          'The second body paragraph. Focuses on the candidate\'s alignment with the company\'s mission, culture, or recent projects. Demonstrates genuine interest and shows how the candidate will add value to the team and company goals.',
      },
      closing_paragraph: {
        type: 'string',
        description:
          'A strong closing paragraph that reiterates interest in the role, expresses enthusiasm for the opportunity, and includes a clear call to action, such as requesting an interview to discuss their qualifications further.',
      },
    },
    required: ['salutation', 'opening_paragraph', 'body_paragraph_1', 'body_paragraph_2', 'closing_paragraph'],
  } as const;

  const messages = [
    {
      role: 'system',
      content:
        'You are an expert career coach and professional cover letter writer. Your task is to generate the content for a compelling, tailored cover letter based on the provided job description and candidate summary. You must strictly adhere to the provided JSON schema for your response, filling in each field with high-quality, relevant content.',
    },
    {
      role: 'user',
      content: `Please craft the content for a cover letter with the following details:\n\n- Job Title: ${body.job_title}\n- Company: ${body.company_name}\n- Hiring Manager: ${body.hiring_manager_name || 'Not specified'}\n\n--- Job Description ---\n${body.job_description_text}\n\n--- Candidate Career Summary ---\n${body.candidate_career_summary}\n\nGenerate the response following the required JSON schema.`,
    },
  ];

  const inputs = { messages, guided_json: coverLetterSchema };
  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', inputs);
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

