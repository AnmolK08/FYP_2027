import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from 'database';
import { authMiddleware } from '../middleware/auth.js';
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";

const router = express.Router();

// Get knowledge docs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const docs = await prisma.knowledgeDoc.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ docs });
  } catch (error) {
    console.error('Get docs error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Upload document
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, filename, size } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Split content into chunks
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
      }
    });

    // Ingest into Pinecone if configured
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME && process.env.GEMINI_API_KEY) {
      try {
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
        
        const embeddings = new GoogleGenerativeAIEmbeddings({
          model: "text-embedding-004", // Use Gemini embedding model
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

    res.json({ doc });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Delete document
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.knowledgeDoc.deleteMany({
      where: { id, userId }
    });

    // Note: Deleting from Pinecone relies on keeping track of vector IDs or using namespace deletion.
    // We are skipping this for simplicity in this implementation unless specific vector IDs are managed.

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Ask question
router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { question, docIds } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

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
        return res.json({ answer: 'No relevant information found in vector DB.', citations: [] });
      }

      const answer = results.map((r, i) => `[${i + 1}] ${r.pageContent.slice(0, 300)}`).join('\n\n');
      const citations = results.map((r, i) => ({
        n: i + 1,
        doc_id: r.metadata.docId,
        title: r.metadata.title,
        chunk: r.metadata.chunkIndex,
      }));

      return res.json({ answer, citations });
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
      return res.json({ answer: 'No documents uploaded yet.', citations: [] });
    }

    // Simple keyword search fallback
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
      return res.json({ answer: 'No relevant information found.', citations: [] });
    }

    const answer = top.map((t, i) => `[${i + 1}] ${t.chunk.slice(0, 300)}`).join('\n\n');
    const citations = top.map((t, i) => ({
      n: i + 1,
      doc_id: t.doc.id,
      title: t.doc.title,
      chunk: 1,
    }));

    res.json({ answer, citations });
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

export default router;
