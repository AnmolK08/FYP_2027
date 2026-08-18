import * as userService from '../services/user.service.js';

/**
 * Controller responsibilities:
 * - Extract data from req
 * - Call appropriate service function
 * - Return service result through res
 * - NO business logic, NO DB calls
 */

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.findAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.findUserById(id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const newUser = await userService.createUser(userData);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedUser = await userService.updateUser(id, updateData);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
