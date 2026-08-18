import * as mentorService from '../services/mentor.service.js';

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await mentorService.getSessions(req.user.id);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const messages = await mentorService.getMessages(req.user.id, sessionId);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const result = await mentorService.chat(req.user.id, message, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getWeaknessPlan = async (req, res, next) => {
  try {
    const result = await mentorService.getWeaknessPlan(req.user.id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};
