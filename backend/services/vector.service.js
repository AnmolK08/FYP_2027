import { getPineconeIndex, PINECONE_NAMESPACE } from '../config/pinecone.js';
import * as embeddingService from './embedding.service.js';

// storing the chunks in pinecone
export const upsertVectors = async ({ docId, userId, title, filename, chunks }) => {
  const index = getPineconeIndex();
  const ns = index.namespace(PINECONE_NAMESPACE);

  // Batch-embed all chunks
  const vectors = await embeddingService.embedDocuments(chunks);

  // Build Pinecone records with deterministic IDs and metadata
  const records = vectors.map((values, i) => ({
    id: `${docId}:${i}`,
    values,
    metadata: {
      userId,
      docId,
      title,
      filename,
      chunkIndex: i,
      // Store the text content so we can return it during retrieval
      // without a separate DB lookup
      text: chunks[i].slice(0, 3600), // Pinecone metadata value limit ~40KB, keep safe
    },
  }));

  // Upsert in batches of 100 (Pinecone recommended batch size)
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await ns.upsert(batch);
  }

  return { upsertedCount: records.length };
};

// Query Pinecone for similar vectors with user-isolation filtering.
export const similaritySearch = async ({ queryVector, userId, docIds, topK = 5 }) => {
  const index = getPineconeIndex();
  const ns = index.namespace(PINECONE_NAMESPACE);

  // Build metadata filter — always enforce user isolation
  const filter = { userId: { $eq: userId } };

  // If specific docIds are requested, add them to the filter
  if (docIds && docIds.length > 0) {
    filter.docId = { $in: docIds };
  }

  const queryResponse = await ns.query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata: true,
  });

  // Return matches with scores and metadata
  return (queryResponse.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
  }));
};

// Delete all vectors for a document using deterministic IDs.
// Vector IDs follow the pattern: `${docId}:${chunkIndex}`
// So for a document with nChunks=5, IDs are: docId:0, docId:1, ..., docId:4
export const deleteDocumentVectors = async (docId, nChunks) => {
  const index = getPineconeIndex();
  const ns = index.namespace(PINECONE_NAMESPACE);

  // Generate all deterministic vector IDs for this document
  const ids = Array.from({ length: nChunks }, (_, i) => `${docId}:${i}`);

  if (ids.length === 0) return { deletedCount: 0 };

  // Delete in batches of 1000 (Pinecone delete limit)
  const BATCH_SIZE = 1000;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    await ns.deleteMany(batch);
  }

  return { deletedCount: ids.length };
};
