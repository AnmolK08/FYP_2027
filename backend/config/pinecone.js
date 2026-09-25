import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY   = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

// All vector operations use a single namespace. Set PINECONE_NAMESPACE per environment
// to keep dev and prod data isolated in the same index.
export const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || 'default';

let pineconeClient = null;
let pineconeIndex  = null;

if (PINECONE_API_KEY && PINECONE_INDEX_NAME) {
  try {
    pineconeClient = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex  = pineconeClient.Index(PINECONE_INDEX_NAME);
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
