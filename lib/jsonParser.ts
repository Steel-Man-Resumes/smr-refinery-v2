/**
 * Robust JSON parser for AI responses
 * Handles malformed JSON from Claude, GPT, and other LLMs
 */

export function extractAndParseJSON(text: string): any {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  let jsonText = text.trim();

  // Step 1: Extract JSON from markdown code fences
  // Matches: ```json\n{...}\n``` or ```{...}```
  const markdownMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch) {
    jsonText = markdownMatch[1];
  }

  // Step 2: Extract JSON object if embedded in other text
  // Find the outermost {...} or [...]
  const jsonObjectMatch = jsonText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonObjectMatch) {
    jsonText = jsonObjectMatch[1];
  }

  // Step 3: Clean smart quotes (curly quotes) to straight quotes
  jsonText = jsonText
    .replace(/[\u201C\u201D]/g, '"') // " and "
    .replace(/[\u2018\u2019]/g, "'") // ' and '
    .replace(/[\u2032\u2035]/g, "'") // ′ and ‵
    .replace(/[\u2033\u2036]/g, '"'); // ″ and ‶

  // Step 4: Remove trailing commas before } or ]
  // Handles cases like: {"key": "value",} or ["item1", "item2",]
  jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

  // Step 5: Fix common formatting issues
  // Remove comments (// and /* */)
  jsonText = jsonText.replace(/\/\/.*$/gm, ''); // Single-line comments
  jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments

  // Step 6: Normalize line breaks and excessive whitespace
  jsonText = jsonText
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

  // Step 7: Attempt to parse
  try {
    return JSON.parse(jsonText);
  } catch (error: any) {
    // If parsing still fails, try one more aggressive cleanup
    try {
      // Remove all non-essential whitespace
      const minified = jsonText
        .replace(/\n/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      return JSON.parse(minified);
    } catch (secondError: any) {
      // Provide helpful error message
      const preview = jsonText.substring(0, 200);
      throw new Error(
        `Failed to parse JSON. Original error: ${error.message}. ` +
        `Text preview: ${preview}...`
      );
    }
  }
}

/**
 * Safe JSON parser with fallback
 * Returns defaultValue if parsing fails
 */
export function safeParseJSON<T = any>(
  text: string,
  defaultValue: T
): T {
  try {
    return extractAndParseJSON(text) as T;
  } catch (error) {
    console.error('JSON parsing failed, using default value:', error);
    return defaultValue;
  }
}

/**
 * Extract and parse JSON array specifically
 */
export function extractAndParseJSONArray(text: string): any[] {
  const result = extractAndParseJSON(text);
  if (!Array.isArray(result)) {
    throw new Error('Expected JSON array, got: ' + typeof result);
  }
  return result;
}

/**
 * Extract and parse JSON object specifically
 */
export function extractAndParseJSONObject(text: string): Record<string, any> {
  const result = extractAndParseJSON(text);
  if (typeof result !== 'object' || Array.isArray(result) || result === null) {
    throw new Error('Expected JSON object, got: ' + typeof result);
  }
  return result;
}
