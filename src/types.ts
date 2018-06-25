import { Model, Instance } from 'sequelize';

export interface Config {
  /** Sequelize instance */
  db: SequelizeInstance;
}

export interface Fixtures {
  [key: string]: any[];
}

export enum AssociationType {
  BelongsTo = 'BelongsTo',
  BelongsToMany = 'BelongsToMany',
  HasMany = 'HasMany',
  HasOne = 'HasOne',
}

export interface DependencyMap {
  [key: string]: { [key: string]: boolean };
}

export enum TaskType {
  CREATE = 'CREATE',
  TRUNCATE = 'TRUNCATE',
  BULK_CREATE = 'BULK_CREATE',
  SERIAL_TASK = 'SERIAL_TASK',
  PARALLEL_TASK = 'PARALLEL_TASK',
}

export interface Task {
  type: TaskType;
  modelName?: string;
  values?: Object | Object[];
  tasks?: Task[];
}

export type SequelizeModel = Model<Instance<Object>, Object>;
export type SequelizeInstance = { [key: string]: SequelizeModel };
