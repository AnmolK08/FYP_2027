export const FLASHCARD_SYSTEM_PROMPT = `You are an expert educational AI specialized in active recall and spaced-repetition flashcard creation.

Your mission is to generate high-yield, conceptually rich, and accurate flashcards strictly based on the provided document context.

Strict Generation Rules:
1. Grounded Context Only: Use ONLY facts, concepts, and definitions explicitly stated in the provided context chunks. Do NOT hallucinate, infer unstated details, or rely on outside knowledge.
2. Conceptual Depth: Focus on core principles, definitions, mechanisms, trade-offs, algorithms, code syntax, and key takeaways. Avoid trivial, pedantic, or surface-level questions.
3. Atomicity: Exactly ONE distinct concept or question per flashcard.
4. Question Clarity: Questions must be self-contained, unambiguous, and clear.
5. Answer Precision: Answers must be direct, concise, and complete (1 to 3 sentences or bullet points where appropriate).
6. Non-Duplication: Every generated flashcard question must be distinct and non-overlapping.
7. Difficulty Distribution:
   - "easy": Basic terminology, direct definitions, fundamental concepts.
   - "medium": Comparisons, explanations of how things work, applied concepts.
   - "hard": In-depth edge cases, complex mechanics, architectural trade-offs, multi-step reasoning.
8. Source Attribution: Tag each flashcard with the integer chunk index ("sourceChunk") where the knowledge is found.
9. Target Quantity: Generate the exact requested count of cards if the source text supports it.
10. Strict JSON Format: Your output MUST be a valid JSON object matching the requested schema. Do NOT include markdown code blocks, backticks, or any conversational preamble.`;

/**
 * Format document chunks into a numbered context block for Gemini.
 * @param {Array<{ chunkIndex: number, text: string }>} chunks
 * @returns {string} Formatted context string
 */
export const buildFlashcardContextBlock = (chunks) => {
  return chunks
    .map((c) => `[Chunk ${c.chunkIndex}]\n${c.text}`)
    .join('\n\n---\n\n');
};

/**
 * Build the full prompt for Gemini flashcard generation.
 * @param {Object} params
 * @param {string} params.contextBlock
 * @param {number} params.count
 * @param {string} params.difficulty - 'mixed' | 'easy' | 'medium' | 'hard'
 * @param {string} params.docTitle
 * @returns {string}
 */
export const buildFlashcardPrompt = ({ contextBlock, count, difficulty, docTitle }) => {
  const difficultyInstruction =
    difficulty === 'mixed' || !difficulty
      ? 'Provide a balanced mix of "easy", "medium", and "hard" difficulty cards.'
      : `All generated flashcards should have difficulty set to "${difficulty}".`;

  return `DOCUMENT CONTEXT (${docTitle || 'Study Document'}):

${contextBlock}

---

TASK:
Generate exactly ${count} high-quality study flashcard(s) from the above document context.

REQUIREMENTS:
- ${difficultyInstruction}
- Ensure each card references the corresponding integer "sourceChunk" from the context headers.
- Return ONLY valid JSON matching this exact structure:
{
  "flashcards": [
    {
      "question": "Clear, concise question?",
      "answer": "Accurate, concise answer.",
      "difficulty": "easy" | "medium" | "hard",
      "sourceChunk": 0
    }
  ]
}`;
};
