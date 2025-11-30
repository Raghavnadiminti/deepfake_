'use server';
/**
 * @fileOverview Describes an image using a generative AI model.
 *
 * - describeImage - A function that handles the image description process.
 * - DescribeImageInput - The input type for the describeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

export async function describeImage(input: DescribeImageInput): Promise<string> {
  return describeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeImagePrompt',
  input: {schema: DescribeImageInputSchema},
  prompt: `Provide a concise, one-paragraph description of the following image.

Photo: {{media url=photoDataUri}}`,
});

const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    const llmResponse = await prompt(input);
    return llmResponse.text;
  }
);
