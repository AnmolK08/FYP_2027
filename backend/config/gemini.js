import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL;

// Singleton instances
let genAI = null;
let embeddingModel = null;
let generativeModel = null;

if (GEMINI_API_KEY) {
  try {
    // Google Generative AI SDK — for chat/generation
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    generativeModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // LangChain embedding model — for vector embeddings
    // gemini-embedding-2 outputs 3072 dims by default, matching Pinecone index.
    embeddingModel = new GoogleGenerativeAIEmbeddings({
      model: GEMINI_EMBEDDING_MODEL,
      apiKey: GEMINI_API_KEY,
    });

    console.log(`[Gemini] Initialized — generative: ${GEMINI_MODEL}, embedding: ${GEMINI_EMBEDDING_MODEL} (3072 dims)`);
  } catch (err) {
    console.error('[Gemini] Failed to initialize:', err.message);
  }
} else {
  console.warn('[Gemini] Missing GEMINI_API_KEY — AI features disabled');
}

// Returns the singleton LangChain embedding model.
export const getEmbeddingModel = () => {
  if (!embeddingModel) {
    const error = new Error('Gemini embedding model is not configured. Set GEMINI_API_KEY.');
    error.statusCode = 503;
    throw error;
  }
  return embeddingModel;
};

// Returns the singleton Gemini generative model.
export const getGenerativeModel = () => {
  if (!generativeModel) {
    const error = new Error('Gemini generative model is not configured. Set GEMINI_API_KEY.');
    error.statusCode = 503;
    throw error;
  }
  return generativeModel;
};

// Returns true if Gemini is properly configured and ready.
export const isGeminiReady = () => !!generativeModel && !!embeddingModel;
