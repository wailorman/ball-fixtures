import { TaskType, CreateTask, TruncateTask, BulkCreateTask } from './types';

export async function create(task: CreateTask, db: any): Promise<void> {
  const { modelName, values } = task;
  const model = db[modelName];

  if (!model) {
    throw new Error(`Model '${modelName}' not found in sequelize.`);
  }

  await model.create(values);
}

export async function truncate(task: TruncateTask, db: any): Promise<void> {
  const { modelName } = task;
  const model = db[modelName];

  if (!model) {
    throw new Error(`Model '${modelName}' not found in sequelize.`);
  }

  await model.truncate({ cascade: true });
}

export async function bulkCreate(task: BulkCreateTask, db: any): Promise<void> {
  const { modelName, values } = task;
  const model = db[modelName];

  if (!model) {
    throw new Error(`Model '${modelName}' not found in sequelize.`);
  }

  await model.bulkCreate(values);
}
