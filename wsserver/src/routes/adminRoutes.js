import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAdmin } from '../middleware/basicAuth.js';
import * as studentService from '../services/studentService.js';

const router = Router();

router.use(requireAdmin);

router.get('/admin', asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'Area admin disponibile',
    actions: [
      'reset',
      'backup',
      'createStudent',
      'setScore',
      'addScore',
      'deleteStudent',
      'updateStudent'
    ]
  });
}));

router.get('/admin/studenti', asyncHandler(async (req, res) => {
  const students = await studentService.listStudents();
  res.status(200).json(students);
}));

router.post('/admin', asyncHandler(async (req, res) => {
  const { action } = req.body || {};

  if (!action) {
    return res.status(400).json({ message: 'Campo action obbligatorio' });
  }

  if (action === 'reset') {
    await studentService.resetStudents();
    return res.status(200).json({ message: 'Database resettato: tabella studenti svuotata' });
  }

  if (action === 'backup') {
    const students = await studentService.listStudents();
    const payload = {
      generatedAt: new Date().toISOString(),
      totalRecords: students.length,
      students
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lanparty-backup-${Date.now()}.json"`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  }

  if (action === 'createStudent') {
    const student = await studentService.createStudent(req.body || {});
    return res.status(201).json({ message: 'Studente creato con successo', student });
  }

  if (action === 'setScore') {
    await studentService.setStudentScore(req.body || {});
    return res.status(200).json({ message: 'Punteggio aggiornato con successo' });
  }

  if (action === 'addScore') {
    await studentService.addStudentScore(req.body || {});
    return res.status(200).json({ message: 'Incremento punteggio applicato' });
  }

  if (action === 'updateStudent') {
    await studentService.updateStudent(req.body || {});
    return res.status(200).json({ message: 'Studente aggiornato con successo' });
  }

  if (action === 'deleteStudent') {
    await studentService.deleteStudent(req.body || {});
    return res.status(200).json({ message: 'Studente eliminato con successo' });
  }

  return res.status(400).json({ message: 'Azione non supportata' });
}));

export default router;
