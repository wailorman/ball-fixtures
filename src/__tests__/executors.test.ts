import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { create, truncate, bulkCreate } from '../executors';
import { TaskType, Task } from '../types';
const db = require('../../models');

chai.use(chaiAsPromised);
const { assert } = chai;

describe(`Executors`, () => {
  const syncDb = () => db.sequelize.sync({ force: true });

  afterAll(syncDb);
  beforeEach(syncDb);

  describe(`#create`, () => {
    it(`should throw error if no such model`, async () => {
      const task: Task = {
        type: TaskType.CREATE,
        modelName: 'NonExistentModel',
        values: { id: 1, name: '2' },
      };

      assert.isRejected(create(task, db), /model/i);
    });

    it(`should create row`, async () => {
      await db.User.truncate({ cascade: true });

      const task: Task = {
        type: TaskType.CREATE,
        modelName: 'User',
        values: { name: 'Bob' },
      };

      await create(task, db);

      const users = await db.User.findAll();

      assert.lengthOf(users, 1);

      const [user] = users;

      assert.deepInclude(user, {
        name: 'Bob',
      });
    });
  });

  describe(`#truncate`, () => {
    it(`should throw error if no such model`, async () => {
      const task: Task = {
        type: TaskType.TRUNCATE,
        modelName: 'NonExistentModel',
      };

      assert.isRejected(truncate(task, db), /model/i);
    });

    it(`should truncate model`, async () => {
      await db.User.truncate({ cascade: true });
      await db.User.bulkCreate([{ name: 'Bob' }, { name: 'Alice' }]);
      const usersBefore = await db.User.findAll();
      assert.lengthOf(usersBefore, 2);

      const task: Task = {
        type: TaskType.TRUNCATE,
        modelName: 'User',
      };

      await truncate(task, db);

      const usersAfter = await db.User.findAll();

      assert.lengthOf(usersAfter, 0);
    });
  });

  describe(`#bulkCreate`, () => {
    it(`should throw error if no such model`, async () => {
      const task: Task = {
        type: TaskType.BULK_CREATE,
        modelName: 'NonExistentModel',
        values: [{ name: 'Bob' }],
      };

      assert.isRejected(bulkCreate(task, db), /model/i);
    });

    it(`should create multiple rows`, async () => {
      await db.User.truncate({ cascade: true });
      const usersBefore = await db.User.findAll();
      assert.lengthOf(usersBefore, 0, 'usersBefore');

      const task: Task = {
        type: TaskType.BULK_CREATE,
        modelName: 'User',
        values: [{ name: 'Bob' }, { name: 'Alice' }],
      };

      await bulkCreate(task, db);

      const usersAfter = await db.User.findAll();

      assert.lengthOf(usersAfter, 2, 'usersAfter');
    });
  });
});
