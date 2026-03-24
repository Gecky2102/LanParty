const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const studentService = require('../services/studentService');

const router = express.Router();

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

module.exports = router;
