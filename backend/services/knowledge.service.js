import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";

export const getKnowledgeDocs = async (userId) => {
  return await prisma.knowledgeDoc.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const uploadKnowledgeDoc = async (userId, docData) => {
  const { title, content, filename, size } = docData;

  const chunks = content.match(/.{1,900}/g) || [content];

  const doc = await prisma.knowledgeDoc.create({
    data: {
      id: uuidv4(),
      userId,
      title,
      filename: filename || title,
      size: size || content.length,
      chunks,
      nChunks: chunks.length,
    },
  });

  if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME && process.env.GEMINI_API_KEY) {
    try {
      const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GEMINI_API_KEY,
      });

      const documents = chunks.map((chunk, i) => new Document({
        pageContent: chunk,
        metadata: {
          userId,
          docId: doc.id,
          title,
          chunkIndex: i
        }
      }));

      await PineconeStore.fromDocuments(documents, embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
      });
    } catch (err) {
      console.error("Pinecone ingestion error:", err);
    }
  }

  return doc;
};

export const deleteKnowledgeDoc = async (userId, docId) => {
  await prisma.knowledgeDoc.deleteMany({
    where: { id: docId, userId },
  });
  return { success: true };
};

export const askQuestion = async (userId, question, docIds) => {
  if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME && process.env.GEMINI_API_KEY) {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY,
    });

    const vectorStore = new PineconeStore(embeddings, { pineconeIndex });

    const filter = { userId };
    if (docIds?.length) {
      filter.docId = { $in: docIds };
    }

    const results = await vectorStore.similaritySearch(question, 3, filter);

    if (!results.length) {
      return { answer: 'No relevant information found in vector DB.', citations: [] };
    }

    const answer = results.map((r, i) => `[${i + 1}] ${r.pageContent.slice(0, 300)}`).join('\n\n');
    const citations = results.map((r, i) => ({
      n: i + 1,
      doc_id: r.metadata.docId,
      title: r.metadata.title,
      chunk: r.metadata.chunkIndex,
    }));

    return { answer, citations };
  }

  // Get documents fallback
  const whereClause = { userId };
  if (docIds?.length) {
    whereClause.id = { in: docIds };
  }

  const docs = await prisma.knowledgeDoc.findMany({
    where: whereClause
  });

  if (!docs.length) {
    return { answer: 'No documents uploaded yet.', citations: [] };
  }

  const terms = question.toLowerCase().match(/\w{3,}/g) || [];
  const scored = [];

  for (const doc of docs) {
    for (const chunk of doc.chunks || []) {
      const score = terms.reduce((sum, t) => {
        const matches = (chunk.toLowerCase().match(new RegExp(t, 'g')) || []).length;
        return sum + matches;
      }, 0);
      if (score > 0) {
        scored.push({ doc, chunk, score });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);

  if (!top.length) {
    return { answer: 'No relevant information found.', citations: [] };
  }

  const answer = top.map((t, i) => `[${i + 1}] ${t.chunk.slice(0, 300)}`).join('\n\n');
  const citations = top.map((t, i) => ({
    n: i + 1,
    doc_id: t.doc.id,
    title: t.doc.title,
    chunk: 1,
  }));

  return { answer, citations };
};
