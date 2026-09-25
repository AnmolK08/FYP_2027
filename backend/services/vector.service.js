import { getPineconeIndex, PINECONE_NAMESPACE } from '../config/pinecone.js';
import * as embeddingService from './embedding.service.js';

export const upsertVectors = async ({ docId, userId, title, filename, chunks }) => {
  const index = getPineconeIndex();
  const ns = index.namespace(PINECONE_NAMESPACE);

  const vectors = await embeddingService.embedDocuments(chunks);

  const records = vectors.map((values, i) => ({
    id: `${docId}:${i}`,
    values,
    metadata: {
      userId,
      docId,
      title,
      filename,
      chunkIndex: i,
      // Store the text so retrieval doesn't need a separate DB lookup
      // Pinecone metadata values are capped at ~40KB; 3600 chars is well within that
      text: chunks[i].slice(0, 3600),
    },
  }));

  // Pinecone recommended upsert batch size
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await ns.upsert(batch);
  }

  return { upsertedCount: records.length };
};

// Always filter by userId so a user can never retrieve another user's vectors
export const similaritySearch = async ({ queryVector, userId, docIds, topK = 5 }) => {
  const index = getPineconeIndex();
  const ns = index.namespace(PINECONE_NAMESPACE);

  const filter = { userId: { $eq: userId } };

  if (docIds && docIds.length > 0) {
    filter.docId = { $in: docIds };
  }

  const queryResponse = await ns.query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata: true,
  });

  return (queryResponse.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
  }));
};

// Vector IDs are deterministic: `${docId}:${chunkIndex}`
// This lets us delete a document's vectors without a separate index scan
export const deleteDocumentVectors = async (docId, nChunks) => {
  const index = getPineconeIndex();
  const ns = index.namespace(PINECONE_NAMESPACE);

  const ids = Array.from({ length: nChunks }, (_, i) => `${docId}:${i}`);

  if (ids.length === 0) return { deletedCount: 0 };

  // Pinecone delete limit per call
  const BATCH_SIZE = 1000;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    await ns.deleteMany(batch);
  }

  return { deletedCount: ids.length };
};
