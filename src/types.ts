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
