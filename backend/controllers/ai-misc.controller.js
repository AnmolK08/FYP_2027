import * as aiMiscService from '../services/ai-misc.service.js';

export const predictContest = (req, res, next) => {
  try {
    const { current_rating, predicted_rank, participants } = req.body;
    const result = aiMiscService.predictContestDelta(current_rating, predicted_rank, participants);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getFlashcards = (req, res, next) => {
  try {
    const cards = aiMiscService.getFlashcards();
    res.json({ cards });
  } catch (error) {
    next(error);
  }
};
