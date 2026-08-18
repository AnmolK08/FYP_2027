import * as knowledgeService from '../services/knowledge.service.js';

export const getDocs = async (req, res, next) => {
  try {
    const docs = await knowledgeService.getKnowledgeDocs(req.user.id);
    res.json({ docs });
  } catch (error) {
    next(error);
  }
};

export const uploadDoc = async (req, res, next) => {
  try {
    const { title, content, filename, size } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const doc = await knowledgeService.uploadKnowledgeDoc(req.user.id, { title, content, filename, size });
    res.json({ doc });
  } catch (error) {
    next(error);
  }
};

export const deleteDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await knowledgeService.deleteKnowledgeDoc(req.user.id, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const askQuestion = async (req, res, next) => {
  try {
    const { question, docIds } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const result = await knowledgeService.askQuestion(req.user.id, question, docIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
