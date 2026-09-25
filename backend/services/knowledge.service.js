import prisma from '../config/prisma.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { isPineconeReady } from '../config/pinecone.js';
import { isGeminiReady } from '../config/gemini.js';
import * as vectorService from './vector.service.js';
import * as ragService from './rag.service.js';

const CHUNK_SIZE    = parseInt(process.env.RAG_CHUNK_SIZE, 10)    || 1000;
const CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP, 10) || 150;

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

// Upload pipeline:
//   1. Split content into chunks
//   2. Save KnowledgeDoc to PostgreSQL (so the record survives even if Pinecone fails)
//   3. Embed + upsert chunks into Pinecone
//
// If Pinecone ingestion fails the document is still accessible in PostgreSQL
// and can be re-indexed later. indexingStatus reflects this.
export const uploadKnowledgeDoc = async (userId, docData) => {
  const { title, content, filename, size } = docData;

  if (!title || !content) {
    const error = new Error('Title and content are required.');
    error.statusCode = 400;
    throw error;
  }

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

  let indexingStatus = 'skipped';

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
      // Don't throw — the DB record is already saved and can be re-indexed later
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

// Delete pipeline:
//   1. Verify ownership
//   2. Delete Pinecone vectors (best-effort — orphaned vectors are less harmful than blocking deletion)
//   3. Delete the PostgreSQL record
export const deleteKnowledgeDoc = async (userId, docId) => {
  const doc = await prisma.knowledgeDoc.findFirst({
    where: { id: docId, userId },
  });

  if (!doc) {
    const error = new Error('Document not found or access denied.');
    error.statusCode = 404;
    throw error;
  }

  if (isPineconeReady() && doc.nChunks > 0) {
    try {
      await vectorService.deleteDocumentVectors(docId, doc.nChunks);
    } catch (err) {
      console.error(`[Knowledge] Failed to delete Pinecone vectors for doc ${docId}:`, err.message);
      // Continue with DB deletion regardless
    }
  }

  await prisma.knowledgeDoc.delete({
    where: { id: docId },
  });

  return { success: true, message: "Document deleted successfully." };
};

export const askQuestion = async (userId, question, docIds) => {
  return await ragService.answerQuestion({ userId, question, docIds });
};
