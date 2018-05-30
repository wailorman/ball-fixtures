export interface Config {
  /** Sequelize instance */
  db: any;
}

export interface Fixtures {
  [key: string]: any[];
}
