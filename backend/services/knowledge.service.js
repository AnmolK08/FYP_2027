import prisma from '../config/prisma.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { isPineconeReady } from '../config/pinecone.js';
import { isGeminiReady } from '../config/gemini.js';
import * as vectorService from './vector.service.js';
import * as ragService from './rag.service.js';

const CHUNK_SIZE = parseInt(process.env.RAG_CHUNK_SIZE, 10) || 1000;
const CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP, 10) || 150;

// Get all knowledge documents for a user.
export const getKnowledgeDocs = async (userId) => {
  return await prisma.knowledgeDoc.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      filename: true,
      size: true,
      nChunks: true,
      createdAt: true,
    },
  });
};

// Upload and index a knowledge document. 
// Pipeline:
//    1. Validate input
//    2. Split content into semantic chunks
//    3. Create KnowledgeDoc record in PostgreSQL
//    4. Embed chunks and upsert vectors into Pinecone
//    5. Return document with indexing status
// If Pinecone ingestion fails, the document is still saved in PostgreSQL
// but marked with indexingStatus: 'failed'. This allows future re-indexing.
export const uploadKnowledgeDoc = async (userId, docData) => {
  const { title, content, filename, size } = docData;

  // Validate 
  if (!title || !content) {
    const error = new Error('Title and content are required.');
    error.statusCode = 400;
    throw error;
  }

  // Split into semantic chunks 
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const chunks = await splitter.splitText(content);

  if (chunks.length === 0) {
    const error = new Error('Document content produced no chunks. Content may be empty or too short.');
    error.statusCode = 400;
    throw error;
  }

  // Create PostgreSQL record 
  const doc = await prisma.knowledgeDoc.create({
    data: {
      userId,
      title,
      filename: filename || title,
      size: size || content.length,
      chunks,
      nChunks: chunks.length,
    },
  });

  // Embed and upsert into Pinecone
  let indexingStatus = 'skipped'; // Default if Pinecone/Gemini not configured

  if (isPineconeReady() && isGeminiReady()) {
    try {
      await vectorService.upsertVectors({
        docId: doc.id,
        userId,
        title,
        filename: filename || title,
        chunks,
      });
      indexingStatus = 'completed';
    } catch (err) {
      console.error(`[Knowledge] Pinecone ingestion failed for doc ${doc.id}:`, err.message);
      indexingStatus = 'failed';
      // Document is saved in PostgreSQL — can be re-indexed later.
      // We don't throw here to avoid losing the DB record.
    }
  }

  return {
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    size: doc.size,
    nChunks: doc.nChunks,
    createdAt: doc.createdAt,
    indexingStatus,
  };
};

// Delete a knowledge document and its associated vectors.
// Pipeline:
//   1. Fetch document (verify existence and ownership)
//   2. Delete vectors from Pinecone
//   3. Delete PostgreSQL record
export const deleteKnowledgeDoc = async (userId, docId) => {
  // Verify ownership and get document data 
  const doc = await prisma.knowledgeDoc.findFirst({
    where: { id: docId, userId },
  });

  if (!doc) {
    const error = new Error('Document not found or access denied.');
    error.statusCode = 404;
    throw error;
  }

  // Delete vectors from Pinecone
  if (isPineconeReady() && doc.nChunks > 0) {
    try {
      await vectorService.deleteDocumentVectors(docId, doc.nChunks);
    } catch (err) {
      console.error(`[Knowledge] Failed to delete Pinecone vectors for doc ${docId}:`, err.message);
      // Continue with DB deletion — orphaned vectors are less harmful
      // than preventing document deletion entirely.
    }
  }

  // Delete PostgreSQL record
  await prisma.knowledgeDoc.delete({
    where: { id: docId },
  });

  return { success: true, message: "Document deleted successfully." };
};

// Ask a question against the user's knowledge base.
export const askQuestion = async (userId, question, docIds) => {
  return await ragService.answerQuestion({ userId, question, docIds });
};
