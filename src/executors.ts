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

export async function serial(task: Task, db: SequelizeInstance) {
  const { tasks = [] } = task;
  await Bluebird.each(tasks, task => router(task, db));
}

export async function parallel(task: Task, db: SequelizeInstance) {
  const { tasks = [] } = task;
  await Bluebird.map(tasks, task => router(task, db));
}

export async function router(task: Task, db: SequelizeInstance) {
  const { type } = task;

  switch (type) {
    case TaskType.CREATE:
      return create(task, db);

    case TaskType.BULK_CREATE:
      return bulkCreate(task, db);

    case TaskType.TRUNCATE:
      return truncate(task, db);

    case TaskType.SERIAL_TASK:
      return serial(task, db);

    case TaskType.PARALLEL_TASK:
      return parallel(task, db);

    default:
      throw new Error('Unknown task type: ' + type);
  }
}

export async function executeTasks(tasks: Task[], db: SequelizeInstance) {
  return Bluebird.each(tasks, task => router(task, db));
}
