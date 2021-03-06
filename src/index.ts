import bluebird from 'bluebird';
import { Config, Fixtures } from './types';
import { mergeFixtures, generateUUID } from './utils';
import { parseFixtures } from './fixtures-parser';
import { executeTasks } from './executors';

const ballFixturesFactory = (conf: Config) => {
  const { db } = conf;

  function testCleaner(): void {
    beforeAll(async () => truncateAll());
    afterAll(async () => truncateAll());
  }

  function jest(fixtures: Fixtures): void {
    const tasks = parseFixtures({ fixtures, db });

    beforeEach(async () => {
      // await truncate(fixtures);
      // await create(fixtures);
      await executeTasks(tasks, db);
    });

    afterAll(async () => {
      await truncate(fixtures);
    });
  }

  // TODO: Promise
  // TODO: Curry for users
  // TODO: By default just run. Mocha's beforeEach/... — optionally

  function mocha(fixtures: Fixtures): void {
    beforeEach(async () => {
      await truncate(fixtures);
      await create(fixtures);
    });

    afterAll(async () => {
      await truncate(fixtures);
    });
  }

  async function load(fixtures: Fixtures): Promise<void> {
    await truncate(fixtures);
    await create(fixtures);
  }

  async function resetAutoIncrement(model: any, num = 1): Promise<void> {
    const tableName = model.getTableName();

    const noAutoIncrementIdAttr =
      !model.primaryKeys ||
      !model.primaryKeys.id ||
      model.primaryKeys.id.type.toString() !== 'INTEGER';

    if (noAutoIncrementIdAttr) {
      return;
    }

    const resetAutoIncrementQuery = `ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH ${num};`;
    const query = (str: string) =>
      (db as any).sequelize.query(str, { type: (db as any).sequelize.QueryTypes.SELECT });
    await query(resetAutoIncrementQuery);
  }

  async function truncateAll(): Promise<void> {
    const modelNames = Object.keys((db as any).sequelize.models);
    const models = modelNames.map(modelName => db[modelName]);

    await Promise.all(models.map(truncateModel));
  }

  async function truncate(fixtures: Fixtures): Promise<void> {
    const modelNames = Object.keys(fixtures);
    const models = modelNames.map(modelName => db[modelName]);

    await bluebird.each(models, truncateModel);
  }

  async function truncateModel(model: any | any[]): Promise<void> {
    await (db as any).sequelize.query(`TRUNCATE TABLE "${model.getTableName()}" CASCADE;`, {
      type: (db as any).sequelize.QueryTypes.SELECT,
    });

    await model.truncate({ cascade: true });

    await resetAutoIncrement(model, 10000);
  }

  async function create(fixtures: Fixtures): Promise<void> {
    const modelNames = Object.keys(fixtures);

    await Promise.all(
      modelNames.map(modelName =>
        Promise.all(
          fixtures[modelName].map(async instanceData => {
            const modelClass = db[modelName];

            if (instanceData.id) {
              return Promise.all([
                modelClass.create(instanceData),
                resetAutoIncrement(modelClass, instanceData.id + 10),
              ]);
            }
            return modelClass.create(instanceData);
          }),
        ),
      ),
    );
  }

  return {
    testCleaner,
    jest,
    mocha,
    load,
    resetAutoIncrement,
    truncateAll,
    truncate,
    truncateModel,
    create,
    mergeFixtures,
    generateUUID,

    clean: testCleaner,
    gu: generateUUID,
    genUUID: generateUUID,
    merge: mergeFixtures,
  };
};

export default ballFixturesFactory;
module.exports = ballFixturesFactory;
