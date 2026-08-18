import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const getSessions = async (userId) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const grouped = {};
  for (const msg of messages) {
    if (!grouped[msg.sessionId]) {
      grouped[msg.sessionId] = {
        session_id: msg.sessionId,
        preview: msg.content.slice(0, 80),
        ts: msg.createdAt,
      };
    }
  }

  return Object.values(grouped).slice(0, 30);
};

export const getMessages = async (userId, sessionId) => {
  return await prisma.chatMessage.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: 'asc' },
  });
};

export const chat = async (userId, message, sessionId) => {
  const sid = sessionId || uuidv4();

  await prisma.chatMessage.create({
    data: {
      id: uuidv4(),
      userId,
      sessionId: sid,
      role: 'user',
      content: message,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { leetcodeStats: true },
  });

  const stats = user?.leetcodeStats;
  let response = '';

  if (genAI) {
    let ragContext = "";
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME && process.env.GEMINI_API_KEY) {
      try {
        const { Pinecone } = await import("@pinecone-database/pinecone");
        const { PineconeStore } = await import("@langchain/pinecone");
        const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");

        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
        const embeddings = new GoogleGenerativeAIEmbeddings({
          model: "text-embedding-004",
          apiKey: process.env.GEMINI_API_KEY,
        });

        const vectorStore = new PineconeStore(embeddings, { pineconeIndex });
        const results = await vectorStore.similaritySearch(message, 3, { userId });
        if (results.length > 0) {
          ragContext = results.map((r) => `Document Title: ${r.metadata.title}\nContent: ${r.pageContent}`).join('\n\n');
        }
      } catch (err) {
        console.error("Pinecone retrieval error:", err);
      }
    }

    if (!ragContext) {
      const docs = await prisma.knowledgeDoc.findMany({ where: { userId } });
      if (docs.length > 0) {
        const terms = message.toLowerCase().match(/\w{3,}/g) || [];
        const scored = [];
        for (const doc of docs) {
          for (const chunk of doc.chunks || []) {
            const score = terms.reduce((sum, t) => sum + (chunk.toLowerCase().match(new RegExp(t, 'g')) || []).length, 0);
            if (score > 0) scored.push({ doc, chunk, score });
          }
        }
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 3);
        if (top.length > 0) {
          ragContext = top.map((t) => `Document Title: ${t.doc.title}\nContent: ${t.chunk}`).join('\n\n');
        }
      }
    }

    let statsContext = 'No LeetCode stats available yet.';
    if (stats) {
      statsContext = `Total Solved: ${stats.totalSolved} (Easy: ${stats.easy}, Medium: ${stats.medium}, Hard: ${stats.hard})\nContest Rating: ${Math.round(stats.contestRating)}`;
      if (stats.tags && Array.isArray(stats.tags)) {
        const weakTags = stats.tags.sort((a, b) => a.solved - b.solved).slice(0, 5);
        statsContext += `\nWeakest Topics: ${weakTags.map(t => `${t.tag} (${t.solved} solved)`).join(', ')}`;
      }
    }

    const systemInstruction = `You are an AI mentor for coding and LeetCode preparation.
Your goal is to provide helpful, encouraging, and accurate advice.
Use the following context to personalize your response. Do not explicitly mention that you are reading from stats or context unless asked.

User LeetCode Stats:
${statsContext}

${ragContext ? `Knowledge Base Context:\nThe user has uploaded the following relevant documents. Use this information to answer the user's questions if applicable:\n${ragContext}` : ''}`;

    const genModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction });

    const history = await prisma.chatMessage.findMany({
      where: { userId, sessionId: sid },
      orderBy: { createdAt: 'asc' },
    });

    const previousHistory = history.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chatSession = genModel.startChat({ history: previousHistory });
    const result = await chatSession.sendMessage(message);
    response = result.response.text();
  } else {
    // Fallback logic
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('weakness') || lowerMessage.includes('improve')) {
      const weakTags = (stats?.tags || []).sort((a, b) => a.solved - b.solved).slice(0, 5);
      response = `Based on your LeetCode stats, focus on: ${weakTags.map(t => `${t.tag}(${t.solved})`).join(', ')}. Practice these topics daily.`;
    } else if (lowerMessage.includes('plan')) {
      response = `Weekly plan: Mon-Wed focus on weak topics, Thu-Fri contest practice, Sat mock contest, Sun review.`;
    } else if (lowerMessage.includes('stats') || lowerMessage.includes('progress')) {
      response = `You have solved ${stats?.totalSolved || 0} problems: Easy ${stats?.easy || 0}, Medium ${stats?.medium || 0}, Hard ${stats?.hard || 0}. Contest rating: ${Math.round(stats?.contestRating || 0)}.`;
    } else {
      response = `I'm your AI mentor! Ask me about your weak topics, study plans, or problem-solving strategies. Stats: ${stats?.totalSolved || 0} problems solved.`;
    }
  }

  await prisma.chatMessage.create({
    data: {
      id: uuidv4(),
      userId,
      sessionId: sid,
      role: 'assistant',
      content: response,
    },
  });

  return { response, session_id: sid };
};

export const getWeaknessPlan = async (userId) => {
  const stats = await prisma.leetcodeStats.findUnique({ where: { userId } });

  if (!stats || !stats.tags || !Array.isArray(stats.tags) || stats.tags.length === 0) {
    const error = new Error('Sync LeetCode first');
    error.statusCode = 400;
    throw error;
  }

  const weakTags = stats.tags.sort((a, b) => a.solved - b.solved).slice(0, 6);
  let plan = '';

  if (genAI) {
    const genModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Based on the following user's weak LeetCode topics, generate a personalized weekly study plan.
Weak Topics:
${weakTags.map(t => `- ${t.tag}: ${t.solved} problems solved`).join('\n')}

Format the output in Markdown with a Day-by-Day schedule (Monday to Sunday) and some tips. Keep it concise but encouraging and actionable.`;
    const result = await genModel.generateContent(prompt);
    plan = result.response.text();
  } else {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    plan = `## Weekly Focus Plan\n\n### Weak Areas\n${weakTags.map(t => `- **${t.tag}**: ${t.solved} problems solved`).join('\n')}\n\n### Day-by-Day\n${days.map((day, i) => `**${day}**: Practice ${weakTags[i % weakTags.length].tag} problems (2-3 problems)`).join('\n\n')}\n\n### Tips\n- Start with easier problems in each topic\n- Use a timer (20-30 min per medium problem)\n- Review solutions after each session`;
  }

  return { plan, weak_tags: weakTags };
};
