const Example = require('../models/example.model');

const createExample = async (exampleBody) => {
  return Example.create(exampleBody);
};

const queryExamples = async () => {
  return Example.findAll();
};

const getExampleById = async (id) => {
  return Example.findByPk(id);
};

const updateExampleById = async (id, updateBody) => {
  const example = await Example.findByPk(id);
  if (!example) {
    return null;
  }
  return example.update(updateBody);
};

const deleteExampleById = async (id) => {
  const example = await Example.findByPk(id);
  if (!example) {
    return null;
  }
  await example.destroy();
  return example;
};

module.exports = {
  createExample,
  queryExamples,
  getExampleById,
  updateExampleById,
  deleteExampleById,
};
