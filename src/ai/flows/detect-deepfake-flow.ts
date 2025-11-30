'use server';
/**
 * @fileOverview Detects deepfakes in an image using Reality Defender.
 *
 * - detectDeepfake - A function that handles the deepfake detection process.
 * - DetectDeepfakeInput - The input type for the detectDeepfake function.
 * - DetectDeepfakeOutput - The output type for the detectDeepfake function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectDeepfakeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectDeepfakeInput = z.infer<typeof DetectDeepfakeInputSchema>;

const DeepfakeResultSchema = z.object({
  classification: z.string(),
  verdict: z.string(),
  confidence: z.number(),
});

const DetectDeepfakeOutputSchema = z.object({
  overall: DeepfakeResultSchema,
  details: z.array(DeepfakeResultSchema),
});
export type DetectDeepfakeOutput = z.infer<typeof DetectDeepfakeOutputSchema>;

export async function detectDeepfake(
  input: DetectDeepfakeInput
): Promise<DetectDeepfakeOutput> {
  return detectDeepfakeFlow(input);
}

const detectDeepfakeFlow = ai.defineFlow(
  {
    name: 'detectDeepfakeFlow',
    inputSchema: DetectDeepfakeInputSchema,
    outputSchema: DetectDeepfakeOutputSchema,
  },
  async ({ photoDataUri }) => {
    console.log('Starting deepfake detection');

    const response = await fetch('https://api.realitydefender.com/v1/media/detect', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.REALITY_DEFENDER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media: photoDataUri,
        async: false, // Wait for the result
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Reality Defender API Error:', response.status, errorBody);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Detection result:', result);


    const transformResult = (res: any) => ({
      classification: res.classification,
      verdict: res.verdict,
      confidence: res.confidence,
    });

    // The API response structure for details is an object, not an array.
    // We need to convert the object values to an array.
    const details = result.results ? Object.values(result.results).map(transformResult) : [];

    return {
      overall: transformResult(result.overall),
      details,
    };
  }
);
