const express = require('express');
const exampleController = require('../controllers/example.controller');

const router = express.Router();

router
  .route('/')
  .get(exampleController.getExamples)
  .post(exampleController.createExample);

router
  .route('/:id')
  .get(exampleController.getExample)
  .put(exampleController.updateExample)
  .delete(exampleController.deleteExample);

module.exports = router;
