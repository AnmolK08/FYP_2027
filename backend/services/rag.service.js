import prisma from '../config/prisma.js';
import { getGenerativeModel } from '../config/gemini.js';
import * as embeddingService from './embedding.service.js';
import * as vectorService from './vector.service.js';
import {
  SYSTEM_PROMPT,
  buildContextBlock,
  buildFullPrompt,
} from '../utils/ragPrompt.js';

const RAG_TOP_K    = parseInt(process.env.RAG_TOP_K, 10) || 5;
const RAG_MIN_SCORE = parseFloat(process.env.RAG_MIN_SCORE) || 0.65;

// Full pipeline: question → embedding → Pinecone search → context assembly → Gemini → answer
export const answerQuestion = async ({ userId, question, docIds }) => {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    const error = new Error('Question must be a non empty string.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedQuestion = question.trim();

  // Verify docId ownership before passing them to Pinecone — prevents cross-user data leakage
  let verifiedDocIds = null;
  if (docIds && Array.isArray(docIds) && docIds.length > 0) {
    const ownedDocs = await prisma.knowledgeDoc.findMany({
      where: {
        id: { in: docIds },
        userId,
      },
      select: { id: true },
    });

    const ownedIds = new Set(ownedDocs.map((d) => d.id));
    const unauthorized = docIds.filter((id) => !ownedIds.has(id));

    if (unauthorized.length > 0) {
      const error = new Error(`Unauthorized access to document(s): ${unauthorized.join(', ')}`);
      error.statusCode = 403;
      throw error;
    }

    verifiedDocIds = docIds;
  }

  const results = await retrieveContext({
    userId,
    question: trimmedQuestion,
    docIds: verifiedDocIds,
    topK: RAG_TOP_K,
  });

  // Drop chunks below the similarity threshold to reduce noise in the model's context
  const relevantResults = results.filter((r) => r.score >= RAG_MIN_SCORE);

  if (relevantResults.length === 0) {
    return {
      answer: "I couldn't find enough relevant information in your uploaded documents to answer that question.",
      metadata: {
        chunksRetrieved: results.length,
        chunksUsed: 0,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      },
    };
  }

  const contextBlock = buildContext(relevantResults);
  const answer = await generateAnswer(contextBlock, trimmedQuestion);

  return {
    answer,
    metadata: {
      chunksRetrieved: results.length,
      chunksUsed: relevantResults.length,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    },
  };
};

export const retrieveContext = async ({ userId, question, docIds, topK }) => {
  const queryVector = await embeddingService.embedQuery(question);

  return await vectorService.similaritySearch({
    queryVector,
    userId,
    docIds,
    topK,
  });
};

export const buildContext = (results) => {
  return buildContextBlock(results);
};

// Generate a natural-language answer using Gemini.
export const generateAnswer = async (contextBlock, question) => {
  try {
    const model = getGenerativeModel();
    const prompt = buildFullPrompt(contextBlock, question);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    });

    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      return "I couldn't generate a meaningful answer from the available context. Please try rephrasing your question.";
    }

    return text.trim();
  } catch (err) {
    console.error('[RAG] Gemini generation failed:', err.message);

    const error = new Error('Failed to generate answer. The AI service is temporarily unavailable.');
    error.statusCode = 502;
    throw error;
  }
};

// Deduplicate citations by docId + chunkIndex so the same chunk
// doesn't appear twice even if it matched multiple query terms
export const createCitations = (results) => {
  const seen = new Set();
  const citations = [];

  for (const result of results) {
    const { metadata, score } = result;
    const key = `${metadata.docId}:${metadata.chunkIndex}`;

    if (seen.has(key)) continue;
    seen.add(key);

    citations.push({
      n: citations.length + 1,
      doc_id: metadata.docId,
      title: metadata.title,
      filename: metadata.filename,
      chunk: metadata.chunkIndex,
      score: Math.round(score * 1000) / 1000,
    });
  }

  return citations;
};
