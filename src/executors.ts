import Bluebird from 'bluebird';

import { Task, TaskType, SequelizeInstance } from './types';

export async function create(task: Task, db: SequelizeInstance) {
  const { modelName, values } = task;
  const model = db[modelName];

  if (!model) {
    throw new Error(`Model '${modelName}' not found in sequelize.`);
  }

  await model.create(values);
}

export async function truncate(task: Task, db: SequelizeInstance) {
  const { modelName } = task;
  const model = db[modelName];

  if (!model) {
    throw new Error(`Model '${modelName}' not found in sequelize.`);
  }

  await model.truncate({ cascade: true });
}

export async function bulkCreate(task: Task, db: SequelizeInstance) {
  const { modelName, values } = task;
  const model = db[modelName];

  if (!model) {
    throw new Error(`Model '${modelName}' not found in sequelize.`);
  }

  await model.bulkCreate([].concat(values));
}
}
