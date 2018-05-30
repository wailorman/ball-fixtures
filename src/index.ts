import { pad } from 'lodash';

import { Config, Fixtures } from './types';

const ballFixturesFactory = (conf: Config) => {
  const { db } = conf;

  function testCleaner(): void {
    beforeAll(async () => truncateAll());
    afterAll(async () => truncateAll());
  }

  function jest(fixtures: Fixtures): void {
    beforeEach(async () => {
      await truncate(fixtures);
      await create(fixtures);
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
    const query = str => db.sequelize.query(str, { type: db.sequelize.QueryTypes.SELECT });
    await query(resetAutoIncrementQuery);
  }

  async function truncateAll(): Promise<void> {
    const modelNames = Object.keys(db.sequelize.models);
    const models = modelNames.map(modelName => db[modelName]);

    await Promise.all(models.map(truncateModel));
  }

  async function truncate(fixtures: Fixtures): Promise<void> {
    const modelNames = Object.keys(fixtures);
    const models = modelNames.map(modelName => db[modelName]);

    await Promise.all(models.map(truncateModel));
  }

  async function truncateModel(model: any): Promise<void> {
    await resetAutoIncrement(model);
    await model.truncate();
  }

  async function create(fixtures: Fixtures): Promise<void> {
    const modelNames = Object.keys(fixtures);

    await Promise.all(modelNames.map(modelName =>
      Promise.all(fixtures[modelName].map((instanceData) => {
        const modelClass = db[modelName];

        if (instanceData.id) {
          return Promise.all([
            modelClass.create(instanceData),
            resetAutoIncrement(modelClass, instanceData.id + 10),
          ]);
        }
        return modelClass.create(instanceData);
      }))));
  }

  function mergeFixtures(array: Fixtures[]): Fixtures {
    return array.reduce((curFixturesSet, resFixtures) => {
      Object.keys(curFixturesSet).forEach((modelName) => {
        resFixtures[modelName] = [
          ...(resFixtures[modelName] || []),
          ...(curFixturesSet[modelName] || []),
        ];
      });

      return resFixtures;
    }, {});
  }

  function generateUUID(...args): string {
    // 5095072f-5308-40a5-b994-e9b05230a4dd
    //       8|  13|  18|  23|          36|

    const ONE_GROUP_LENGTH = 8;
    const TWO_GROUPS_LENGTH = 13;
    const THREE_GROUPS_LENGTH = 18;
    const FOUR_GROUPS_LENGTH = 23;
    const FIVE_GROUPS_LENGTH = 36;
    const FULL_UUID_LENGTH = 36;

    const res: string[] = [];

    const pushStrToRes = (str) => {
      `${str}`
        .replace(/[^0-9a-f]/g, '0')
        .split('')
        .forEach((char) => {
          if (res.length >= FULL_UUID_LENGTH) {
            return;
          }

          if (
            res.length === ONE_GROUP_LENGTH ||
            res.length === TWO_GROUPS_LENGTH ||
            res.length === THREE_GROUPS_LENGTH ||
            res.length === FOUR_GROUPS_LENGTH
          ) {
            res.push('-');
          }

          res.push(char);
        });

      return res.join('');
    };

    const makeNextGroup = () => {
      if (res.length < ONE_GROUP_LENGTH) {
        const len = ONE_GROUP_LENGTH - res.length;
        pushStrToRes(pad('0', len, '0'));
      } else if (res.length < TWO_GROUPS_LENGTH) {
        const len = TWO_GROUPS_LENGTH - res.length;
        pushStrToRes(pad('0', len, '0'));
      } else if (res.length < THREE_GROUPS_LENGTH) {
        const len = THREE_GROUPS_LENGTH - res.length;
        pushStrToRes(pad('0', len, '0'));
      } else if (res.length < FOUR_GROUPS_LENGTH) {
        const len = FOUR_GROUPS_LENGTH - res.length;
        pushStrToRes(pad('0', len, '0'));
      } else if (res.length < FIVE_GROUPS_LENGTH) {
        const len = FIVE_GROUPS_LENGTH - res.length;
        pushStrToRes(pad('0', len, '0'));
      }
    };

    [args[0], args[1], args[2], args[3], args[4]].forEach((arg) => {
      if (arg) {
        pushStrToRes(`${arg}f`);
      } else {
        pushStrToRes('f');
      }
      makeNextGroup();
    });

    return res.join('');
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
