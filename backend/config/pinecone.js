import { Pinecone } from '@pinecone-database/pinecone';

// Environment variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

// Namespace used for all vector operations.
// Defaults to "default". Override via PINECONE_NAMESPACE env var.
// Common convention: set to "development" / "production" per environment.
export const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || 'default';

// Singleton client  
let pineconeClient = null;
let pineconeIndex = null;

if (PINECONE_API_KEY && PINECONE_INDEX_NAME) {
  try {
    pineconeClient = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
    console.log(`[Pinecone] Initialized — index: ${PINECONE_INDEX_NAME}, namespace: ${PINECONE_NAMESPACE}`);
  } catch (err) {
    console.error('[Pinecone] Failed to initialize:', err.message);
  }
} else {
  console.warn('[Pinecone] Missing PINECONE_API_KEY or PINECONE_INDEX_NAME — vector features disabled');
}

// Returns the Pinecone index instance.
// Throws if Pinecone is not configured.
export const getPineconeIndex = () => {
  if (!pineconeIndex) {
    const error = new Error('Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME.');
    error.statusCode = 503;
    throw error;
  }
  return pineconeIndex;
};

// Returns true if Pinecone is properly configured and ready.
export const isPineconeReady = () => !!pineconeIndex;
