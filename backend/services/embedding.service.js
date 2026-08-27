import { getEmbeddingModel } from '../config/gemini.js';

// Generate an embedding vector for a single query string.
export const embedQuery = async (text) => {
  if (!text || typeof text !== 'string') {
    const error = new Error('Embedding input must be a non-empty string.');
    error.statusCode = 400;
    throw error;
  }

  try {
    const model = getEmbeddingModel();
    return await model.embedQuery(text);
  } catch (err) {
    // Re-throw config errors (503) as-is
    if (err.statusCode) throw err;

    const error = new Error(`Failed to generate query embedding: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }
};

// Batch embed an array of text chunks.
export const embedDocuments = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    const error = new Error('embedDocuments requires a non-empty array of strings.');
    error.statusCode = 400;
    throw error;
  }

  try {
    const model = getEmbeddingModel();
    return await model.embedDocuments(texts);
  } catch (err) {
    if (err.statusCode) throw err;

    const error = new Error(`Failed to generate document embeddings: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }
};
