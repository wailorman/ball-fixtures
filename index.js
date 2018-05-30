const pad = require('lodash.pad');

module.exports = (conf = {}) => {
  const { db } = conf;

  const E = {};

  E.testCleaner = function () {
    beforeAll(async () => E.truncateAll());
    afterAll(async () => E.truncateAll());
  };

  E.clean = E.testCleaner;

  E.jest = function (fixtures) {
    beforeEach(async () => {
      await E.truncate(fixtures);
      await E.create(fixtures);
    });

    afterAll(async () => {
      await E.truncate(fixtures);
    });
  };

  // TODO: Promise
  // TODO: Curry for users
  // TODO: By default just run. Mocha's beforeEach/... — optionally

  E.mocha = function (fixtures) {
    beforeEach(async () => {
      await E.truncate(fixtures);
      await E.create(fixtures);
    });

    afterAll(async () => {
      await E.truncate(fixtures);
    });
  };

  E.load = async (fixtures) => {
    await E.truncate(fixtures);
    await E.create(fixtures);
  };

  E.resetAutoIncrement = async (model, num = 1) => {
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
  };

  E.truncateAll = async () => {
    const modelNames = Object.keys(db.sequelize.models);
    const models = modelNames.map(modelName => db[modelName]);

    return Promise.all(models.map(E.truncateModel));
  };

  E.truncate = async (fixtures) => {
    const modelNames = Object.keys(fixtures);
    const models = modelNames.map(modelName => db[modelName]);

    return Promise.all(models.map(E.truncateModel));
  };

  E.truncateModel = async (model) => {
    await E.resetAutoIncrement(model);
    await model.truncate();
  };

  E.create = async (fixtures) => {
    const modelNames = Object.keys(fixtures);

    return Promise.all(modelNames.map(modelName =>
      Promise.all(fixtures[modelName].map((instanceData) => {
        const Model = db[modelName];

        if (instanceData.id) {
          return Promise.all([
            Model.create(instanceData),
            E.resetAutoIncrement(Model, instanceData.id + 10),
          ]);
        }
        return Model.create(instanceData);
      }))));
  };

  E.mergeFixtures = array =>
    array.reduce((curFSet, allF) => {
      Object.keys(curFSet).forEach((modelName) => {
        // eslint-disable-next-line no-param-reassign
        allF[modelName] = [].concat(allF[modelName] || []).concat(curFSet[modelName] || []);
      });

      return allF;
    }, {});
  E.merge = E.mergeFixtures;

  E.generateUUID = function (...args) {
    // 5095072f-5308-40a5-b994-e9b05230a4dd
    //       8|  13|  18|  23|          36|

    const ONE_GROUP_LENGTH = 8;
    const TWO_GROUPS_LENGTH = 13;
    const THREE_GROUPS_LENGTH = 18;
    const FOUR_GROUPS_LENGTH = 23;
    const FIVE_GROUPS_LENGTH = 36;
    const FULL_UUID_LENGTH = 36;

    const res = [];

    const pushStrToRes = (str) => {
      `${str}`
        .replace(/[^0-9a-f]/g, '0')
        .split('')
        .forEach((char) => {
          if (res.length >= FULL_UUID_LENGTH) {
            return;
          } else if (
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
  };

  E.gu = E.generateUUID;
  E.genUUID = E.generateUUID;

  return E;
};
