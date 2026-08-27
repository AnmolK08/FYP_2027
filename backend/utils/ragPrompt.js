import dotenv from 'dotenv';
dotenv.config();

const MAX_CONTEXT_CHARS = parseInt(process.env.RAG_MAX_CONTEXT_CHARS, 10) || 8000;

export const SYSTEM_PROMPT = `You are a document-based AI assistant.

Answer the user's question using ONLY the provided context.

Rules:

1. Do not invent information. Only use facts from the provided context.
2. Do not rely on outside knowledge to answer the question.
3. If the context does not contain enough information to answer the question, say:
   "I couldn't find enough information in your uploaded documents to answer that."
4. Cite the relevant document sources using citation numbers like [1], [2], etc.
   These numbers correspond to the numbered context blocks provided below.
5. Do not mention internal implementation details, chunk indices, or vector databases.
6. Give a concise but complete answer.
7. Format your answer nicely. Use paragraphs, bullet points, and new lines to make it easy to read. Do not return a single block of text.
8. If multiple sources support the answer, cite all of them.`;

// Build the numbered context block from retrieved chunks.
export const buildContextBlock = (results) => {
  const blocks = [];
  let totalChars = 0;

  for (let i = 0; i < results.length; i++) {
    const { metadata } = results[i];
    const docLabel = metadata.filename || metadata.title || 'Unknown';
    const header = `[${i + 1}] Document: ${docLabel} | Chunk: ${metadata.chunkIndex}`;
    const content = metadata.text || '';

    const block = `${header}\n${content}`;

    // Check if adding this block would exceed the limit
    if (totalChars + block.length > MAX_CONTEXT_CHARS) {
      // Add a truncated version if we have room for at least the header
      const remaining = MAX_CONTEXT_CHARS - totalChars;
      if (remaining > header.length + 100) {
        blocks.push(`${header}\n${content.slice(0, remaining - header.length - 10)}…`);
      }
      break;
    }

    blocks.push(block);
    totalChars += block.length;
  }

  return blocks.join('\n\n');
};

// Assemble the complete user prompt with context and question.
export const buildFullPrompt = (contextBlock, question) => {
  return `CONTEXT:

${contextBlock}

QUESTION:

${question}`;
};
