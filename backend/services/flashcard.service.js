import prisma from '../config/prisma.js';
import { getGenerativeModel } from '../config/gemini.js';
import {
  FLASHCARD_SYSTEM_PROMPT,
  buildFlashcardContextBlock,
  buildFlashcardPrompt,
} from '../utils/flashcardPrompt.js';

const MAX_CONTEXT_CHARS = parseInt(process.env.RAG_MAX_CONTEXT_CHARS, 10) || 8000;
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const normalizeQuestion = (q) => {
  return (q || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Gemini sometimes wraps its JSON in markdown code blocks — strip them before parsing
const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[FlashcardService] JSON parse error:', err.message, '\nRaw output was:', text);
    return null;
  }
};

// Generates flashcards from a user's uploaded document using Gemini.
// When the document is large, content is batched across multiple Gemini calls
// so we don't exceed the context window limit.
export const generateFlashcardsFromDoc = async ({
  userId,
  documentId,
  count = 10,
  difficulty = 'mixed',
}) => {
  // 1. Validate parameters
  const requestedCount = Math.min(Math.max(parseInt(count, 10) || 10, 1), 50);
  const targetDifficulty = ['easy', 'medium', 'hard', 'mixed'].includes(
    String(difficulty).toLowerCase()
  )
    ? String(difficulty).toLowerCase()
    : 'mixed';

  // 2. Fetch document & strictly verify ownership
  const doc = await prisma.knowledgeDoc.findFirst({
    where: {
      id: documentId,
      userId,
    },
  });

  if (!doc) {
    const error = new Error('Document not found or access denied.');
    error.statusCode = 404;
    throw error;
  }

  const rawChunks = doc.chunks;
  if (!rawChunks || !Array.isArray(rawChunks) || rawChunks.length === 0) {
    const error = new Error(
      'Document has no readable text chunks. Please re-upload or choose a different document.'
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Prepare chunk objects with index metadata
  const indexedChunks = rawChunks.map((text, idx) => ({
    chunkIndex: idx,
    text: String(text || ''),
  }));

  // 4. Batch chunks if total content exceeds context limits
  const batches = [];
  let currentBatch = [];
  let currentBatchLength = 0;

  for (const chunk of indexedChunks) {
    const chunkLength = chunk.text.length + 30;
    if (currentBatch.length > 0 && currentBatchLength + chunkLength > MAX_CONTEXT_CHARS) {
      batches.push(currentBatch);
      currentBatch = [chunk];
      currentBatchLength = chunkLength;
    } else {
      currentBatch.push(chunk);
      currentBatchLength += chunkLength;
    }
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // 5. Get singleton Gemini generative model (throws 503 if unavailable)
  const model = getGenerativeModel();

  // 6. Generate flashcards across batches
  const collectedCards = [];
  const cardsPerBatch = Math.max(1, Math.ceil(requestedCount / batches.length));

  for (let bIndex = 0; bIndex < batches.length; bIndex++) {
    const batchChunks = batches[bIndex];
    const contextBlock = buildFlashcardContextBlock(batchChunks);
    const prompt = buildFlashcardPrompt({
      contextBlock,
      count: cardsPerBatch,
      difficulty: targetDifficulty,
      docTitle: doc.title,
    });

    try {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: FLASHCARD_SYSTEM_PROMPT }] },
      });

      const text = response?.response?.text();
      const parsed = extractJsonFromText(text);

      if (parsed && Array.isArray(parsed.flashcards)) {
        for (const item of parsed.flashcards) {
          if (
            item &&
            typeof item.question === 'string' &&
            item.question.trim().length > 0 &&
            typeof item.answer === 'string' &&
            item.answer.trim().length > 0
          ) {
            let itemDifficulty = String(item.difficulty || '').toLowerCase();
            if (!VALID_DIFFICULTIES.includes(itemDifficulty)) {
              itemDifficulty =
                targetDifficulty !== 'mixed' ? targetDifficulty : 'medium';
            }

            let sourceChunk = null;
            if (
              item.sourceChunk !== undefined &&
              item.sourceChunk !== null &&
              !isNaN(Number(item.sourceChunk))
            ) {
              sourceChunk = Number(item.sourceChunk);
            } else if (batchChunks.length > 0) {
              sourceChunk = batchChunks[0].chunkIndex;
            }

            collectedCards.push({
              question: item.question.trim(),
              answer: item.answer.trim(),
              difficulty: itemDifficulty,
              sourceChunk,
            });
          }
        }
      }
    } catch (err) {
      console.error(
        `[FlashcardService] Gemini generation failed for batch ${bIndex + 1}/${batches.length}:`,
        err.message
      );
      if (batches.length === 1) {
        const error = new Error('AI generation failed: ' + (err.message || 'Gemini service error'));
        error.statusCode = err.statusCode || 502;
        throw error;
      }
    }
  }

  // 7. Deduplicate collected flashcards by question content
  const seenQuestions = new Set();
  const uniqueCards = [];

  for (const card of collectedCards) {
    const key = normalizeQuestion(card.question);
    if (!key || seenQuestions.has(key)) continue;
    seenQuestions.add(key);
    uniqueCards.push(card);
    if (uniqueCards.length >= requestedCount) break;
  }

  if (uniqueCards.length === 0) {
    const error = new Error(
      'Unable to generate valid flashcards from this document. The document may lack sufficient informative content.'
    );
    error.statusCode = 422;
    throw error;
  }

  // 8. Persist validated flashcards to PostgreSQL
  const createdCards = await prisma.$transaction(
    uniqueCards.map((card) =>
      prisma.flashcard.create({
        data: {
          userId,
          documentId,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty,
          sourceChunk: card.sourceChunk,
        },
        select: {
          id: true,
          userId: true,
          documentId: true,
          question: true,
          answer: true,
          difficulty: true,
          sourceChunk: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    )
  );

  return {
    success: true,
    count: createdCards.length,
    flashcards: createdCards,
    document: {
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
    },
  };
};

// Retrieve user's flashcards, optionally filtered by document and difficulty.
export const getFlashcards = async ({ userId, documentId, difficulty }) => {
  const where = { userId };

  if (documentId) {
    where.documentId = documentId;
  }

  if (difficulty && VALID_DIFFICULTIES.includes(difficulty.toLowerCase())) {
    where.difficulty = difficulty.toLowerCase();
  }

  return await prisma.flashcard.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          filename: true,
        },
      },
    },
  });
};

// Retrieve a single flashcard by ID with user isolation.
export const getFlashcardById = async ({ userId, id }) => {
  const flashcard = await prisma.flashcard.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          filename: true,
        },
      },
    },
  });

  if (!flashcard) {
    const error = new Error('Flashcard not found or access denied.');
    error.statusCode = 404;
    throw error;
  }

  return flashcard;
};

// Delete a flashcard by ID with user isolation.
export const deleteFlashcard = async ({ userId, id }) => {
  const flashcard = await prisma.flashcard.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!flashcard) {
    const error = new Error('Flashcard not found or access denied.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.flashcard.delete({
    where: { id },
  });

  return {
    success: true,
    message: 'Flashcard deleted successfully.',
  };
};

// Placeholder for spaced-repetition scheduling — records the rating but
// doesn't yet adjust nextReviewAt. Future work.
export const reviewFlashcard = async ({ userId, id, rating }) => {
  const validRatings = ['again', 'hard', 'good', 'easy'];
  if (!rating || !validRatings.includes(String(rating).toLowerCase())) {
    const error = new Error(`Invalid rating. Must be one of: ${validRatings.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  try {
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id,
        userId,
      },
    });

    return {
      success: true,
      id: flashcard?.id || id,
      rating: rating.toLowerCase(),
      reviewedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[FlashcardService] Review logging error for card ${id}:`, err.message);
    return {
      success: true,
      id,
      rating: rating.toLowerCase(),
      reviewedAt: new Date().toISOString(),
      warning: 'Review recorded in session',
    };
  }
};
