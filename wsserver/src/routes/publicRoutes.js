import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as studentService from '../services/studentService.js';

const router = Router();

router.post('/studente', asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body || {});
  res.status(201).json({
    message: `Studente ${student.username} aggiunto`,
    student
  });
}));

router.get('/classeVincitrice', asyncHandler(async (req, res) => {
  const ranking = await studentService.getRankingByClass();
  res.status(200).json(ranking);
}));

router.get('/classifiche', asyncHandler(async (req, res) => {
  const rankings = await studentService.getCombinedRankings();
  res.status(200).json(rankings);
}));

export default router;
