'use server';
/**
 * @fileOverview Automatic panel detection flow using OpenCV.
 *
 * - detectPanels - A function that handles the panel detection process.
 * - DetectPanelsInput - The input type for the detectPanels function.
 * - DetectPanelsOutput - The return type for the detectPanels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPanelsInputSchema = z.object({
  pageDataUri: z
    .string()
    .describe(
      "A page from a PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  algorithmParams: z.object({
    threshold: z.number().describe('Threshold value for adaptive thresholding.'),
    dilationKernelSize: z
      .number()
      .describe('Size of the kernel for dilation.'),
    minContourArea: z.number().describe('Minimum area for a contour to be considered a panel.'),
  }).optional(),
});
export type DetectPanelsInput = z.infer<typeof DetectPanelsInputSchema>;

const DetectPanelsOutputSchema = z.array(z.object({
  x: z.number().describe('The x-coordinate of the panel.'),
  y: z.number().describe('The y-coordinate of the panel.'),
  width: z.number().describe('The width of the panel.'),
  height: z.number().describe('The height of the panel.'),
}));
export type DetectPanelsOutput = z.infer<typeof DetectPanelsOutputSchema>;

export async function detectPanels(input: DetectPanelsInput): Promise<DetectPanelsOutput> {
  return detectPanelsFlow(input);
}

const panelDetectionAlgorithm = ai.defineTool({
  name: 'panelDetectionAlgorithm',
  description: 'Detects panels in an image using OpenCV.js',
  inputSchema: z.object({
    pageDataUri: z
      .string()
      .describe(
        "A page from a PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    threshold: z.number().describe('Threshold value for adaptive thresholding.'),
    dilationKernelSize: z
      .number()
      .describe('Size of the kernel for dilation.'),
    minContourArea: z.number().describe('Minimum area for a contour to be considered a panel.'),
  }),
  outputSchema: z.array(z.object({
    x: z.number().describe('The x-coordinate of the panel.'),
    y: z.number().describe('The y-coordinate of the panel.'),
    width: z.number().describe('The width of the panel.'),
    height: z.number().describe('The height of the panel.'),
  })),
},
async (input) => {
  // Mock implementation for now.
  // TODO: Implement OpenCV.js logic here
  console.log("Running mock panel detection algorithm.");
  console.log("Input data URI:", input.pageDataUri);
  console.log("Algorithm parameters:", input);

  // Example:
  return [
    { x: 10, y: 10, width: 200, height: 150 },
    { x: 250, y: 10, width: 200, height: 150 },
    { x: 10, y: 200, width: 440, height: 150 },
  ];
});


const detectPanelsPrompt = ai.definePrompt({
  name: 'detectPanelsPrompt',
  tools: [panelDetectionAlgorithm],
  input: {schema: DetectPanelsInputSchema},
  output: {schema: DetectPanelsOutputSchema},
  prompt: `Detect the panels in the image. Use the panelDetectionAlgorithm tool with the provided parameters.

Image: {{media url=pageDataUri}}
Parameters: {{{algorithmParams}}}`,// Ensure correct Handlebars syntax.
});

const detectPanelsFlow = ai.defineFlow(
  {
    name: 'detectPanelsFlow',
    inputSchema: DetectPanelsInputSchema,
    outputSchema: DetectPanelsOutputSchema,
  },
  async input => {
    const algorithmParams = input.algorithmParams || {
      threshold: 127,
      dilationKernelSize: 5,
      minContourArea: 5000,
    };

    const {output} = await detectPanelsPrompt({
        pageDataUri: input.pageDataUri,
        algorithmParams: algorithmParams,
    });
    return output!;
  }
);
