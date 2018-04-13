exports.truncate = async (_models = []) => {
  const models = [].concat(_models);

  await Promise.all(models.map(model => model.truncate()));
};

exports.create = async (model, values) => model.create(values);
