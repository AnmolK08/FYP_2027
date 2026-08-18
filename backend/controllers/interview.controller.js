import * as interviewService from '../services/interview.service.js';

export const getInterviews = async (req, res, next) => {
  try {
    const interviews = await interviewService.getInterviews(req.user.id);
    res.json({ interviews });
  } catch (error) {
    next(error);
  }
};

export const createInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.createInterview(req.user.id, req.body);
    res.json({ interview });
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await interviewService.updateInterview(req.user.id, id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getProblems = (req, res, next) => {
  try {
    const { difficulty, tag, q } = req.query;
    const problems = interviewService.getProblems(difficulty, tag, q);
    res.json({ problems, total: problems.length });
  } catch (error) {
    next(error);
  }
};

export const getSystemDesignTopics = (req, res, next) => {
  try {
    const topics = interviewService.getSystemDesignTopics();
    res.json({ topics });
  } catch (error) {
    next(error);
  }
};

export const getTracks = (req, res, next) => {
  try {
    const tracks = interviewService.getTracks();
    res.json({ tracks });
  } catch (error) {
    next(error);
  }
};
