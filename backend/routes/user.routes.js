import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public route - anyone can view a user's public profile
router.get('/u/:username', userController.getPublicProfile);

router.use(authenticate);
router.patch('/username', userController.updateLucyUsername);
router.patch('/me/username', userController.updateLucyUsername);
router.patch('/me', userController.updateMe);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
