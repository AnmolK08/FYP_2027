import * as flashcardService from '../services/flashcard.service.js';

export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { count, difficulty } = req.body || {};

    if (!documentId) {
      return res.status(400).json({ success: false, error: 'Document ID parameter is required.' });
    }

    const result = await flashcardService.generateFlashcardsFromDoc({
      userId: req.user.id,
      documentId,
      count,
      difficulty,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFlashcards = async (req, res, next) => {
  try {
    const { documentId, difficulty } = req.query;

    const flashcards = await flashcardService.getFlashcards({
      userId: req.user.id,
      documentId,
      difficulty,
    });

    res.json({ success: true, count: flashcards.length, flashcards });
  } catch (error) {
    next(error);
  }
};

export const getFlashcardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const flashcard = await flashcardService.getFlashcardById({
      userId: req.user.id,
      id,
    });

    res.json({ success: true, flashcard });
  } catch (error) {
    next(error);
  }
};

export const deleteFlashcard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await flashcardService.deleteFlashcard({
      userId: req.user.id,
      id,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const reviewFlashcard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body || {};

    const result = await flashcardService.reviewFlashcard({
      userId: req.user.id,
      id,
      rating,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
