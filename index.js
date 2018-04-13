const pad = require('lodash.pad');

exports.truncate = async (_models = []) => {
  const models = [].concat(_models);

  await Promise.all(models.map(model => model.truncate()));
};

exports.create = async (model, values) => model.create(values);

exports.generateUUID = function (...args) {
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

exports.gu = exports.generateUUID;

exports.resetAutoIncrement = async (args = {}, opts, ctx = {}) => {
  const { model, num = 1 } = args;
  const { db } = ctx;

  const tableName = model.getTableName();

  const noAutoIncrementIdAttr =
    !model.primaryKeys ||
    !model.primaryKeys.id ||
    model.primaryKeys.id.type.toString() !== 'INTEGER';

  if (noAutoIncrementIdAttr) {
    return;
  }

  const query = `ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH ${num};`;
  await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
};
