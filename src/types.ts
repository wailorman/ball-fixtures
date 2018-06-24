export interface Config {
  /** Sequelize instance */
  db: any;
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
}

export interface TaskBase {
  type: TaskType;
}

export interface CreateTask extends TaskBase {
  modelName: string;
  values: object;
}

export interface TruncateTask extends TaskBase {
  modelName: string;
}

export interface BulkCreateTask extends TaskBase {
  modelName: string;
  values: object[];
}

export type TasksArray = (CreateTask | TruncateTask)[];
