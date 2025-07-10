const catchAsync = require('../utils/catchAsync');
const exampleService = require('../services/example.service');
const AppError = require('../utils/appError');

const createExample = catchAsync(async (req, res) => {
  const example = await exampleService.createExample(req.body);
  res.status(201).json({
    status: 'success',
    data: { example }
  });
});

const getExamples = catchAsync(async (req, res) => {
  const examples = await exampleService.queryExamples();
  res.status(200).json({
    status: 'success',
    results: examples.length,
    data: { examples }
  });
});

const getExample = catchAsync(async (req, res) => {
  const example = await exampleService.getExampleById(req.params.id);
  if (!example) {
    throw new AppError('Example not found', 404);
  }
  res.status(200).json({
    status: 'success',
    data: { example }
  });
});

const updateExample = catchAsync(async (req, res) => {
  const example = await exampleService.updateExampleById(req.params.id, req.body);
  if (!example) {
    throw new AppError('Example not found', 404);
  }
  res.status(200).json({
    status: 'success',
    data: { example }
  });
});

const deleteExample = catchAsync(async (req, res) => {
  const example = await exampleService.deleteExampleById(req.params.id);
  if (!example) {
    throw new AppError('Example not found', 404);
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  createExample,
  getExamples,
  getExample,
  updateExample,
  deleteExample,
};
