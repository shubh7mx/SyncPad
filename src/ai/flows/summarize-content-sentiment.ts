'use server';

/**
 * @fileOverview A content sentiment summarization AI agent.
 *
 * - summarizeContentSentiment - A function that handles the content summarization and sentiment analysis process.
 * - SummarizeContentSentimentInput - The input type for the summarizeContentSentiment function.
 * - SummarizeContentSentimentOutput - The return type for the summarizeContentSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeContentSentimentInputSchema = z.object({
  text: z
    .string()
    .describe('The text content to summarize and analyze sentiment.'),
});
export type SummarizeContentSentimentInput = z.infer<typeof SummarizeContentSentimentInputSchema>;

const SummarizeContentSentimentOutputSchema = z.object({
  summary: z.string().describe('A short summary of the text content.'),
  sentiment: z.string().describe('The sentiment of the text content (e.g., positive, negative, neutral).'),
  redactedText: z.string().describe('The text content with personally identifiable information (PII) removed.'),
});
export type SummarizeContentSentimentOutput = z.infer<typeof SummarizeContentSentimentOutputSchema>;

export async function summarizeContentSentiment(input: SummarizeContentSentimentInput): Promise<SummarizeContentSentimentOutput> {
  return summarizeContentSentimentFlow(input);
}

const summarizeContentSentimentPrompt = ai.definePrompt({
  name: 'summarizeContentSentimentPrompt',
  input: {schema: SummarizeContentSentimentInputSchema},
  output: {schema: SummarizeContentSentimentOutputSchema},
  prompt: `You are an AI assistant that summarizes the sentiment of given text content, removes personally identifiable information (PII), and generates a short summary.

  Text: {{{text}}}

  Instructions:
  1. Identify and remove any PII from the text.
  2. Analyze the sentiment of the redacted text.
  3. Create a concise summary of the redacted text.
  4. Return the redacted text, sentiment, and summary in JSON format.

  Output: {
    "summary": "summary of the text",
    "sentiment": "sentiment of the text",
    "redactedText": "text with PII removed"
  }`,
});

const summarizeContentSentimentFlow = ai.defineFlow(
  {
    name: 'summarizeContentSentimentFlow',
    inputSchema: SummarizeContentSentimentInputSchema,
    outputSchema: SummarizeContentSentimentOutputSchema,
  },
  async input => {
    const {output} = await summarizeContentSentimentPrompt(input);
    return output!;
  }
);
