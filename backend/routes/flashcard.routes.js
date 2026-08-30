import { Router } from 'express';
import * as flashcardController from '../controllers/flashcard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all flashcard routes with JWT authentication middleware
router.use(authenticate);

// Document-based generation
router.post('/generate/:documentId', flashcardController.generateFlashcards);

// Flashcards retrieval & management
router.get('/', flashcardController.getFlashcards);
router.get('/:id', flashcardController.getFlashcardById);
router.delete('/:id', flashcardController.deleteFlashcard);

// Spaced-repetition review endpoint
router.post('/:id/review', flashcardController.reviewFlashcard);

export default router;
