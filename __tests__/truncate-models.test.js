const { truncateModels } = require('../index');
const { assert } = require('chai');
const db = require('../models');

describe(`#truncateModels`, () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.User.truncate();
  });

  it(`should truncate model & reset AI (non-array)`, async () => {
    await db.User.create({ name: 'Bob' });
    await db.User.create({ name: 'Alice' });

    await truncateModels({ models: db.User }, {}, { db });

    const newUser = await db.User.create({ name: 'Alice' });
    const allUsers = await db.User.findAll();

    assert.equal(newUser.id, 1);
    assert.lengthOf(allUsers, 1);
  });

  it(`should truncate model & reset AI (array)`, async () => {
    await db.User.create({ name: 'Bob' });
    await db.User.create({ name: 'Alice' });

    await truncateModels({ models: [db.User] }, {}, { db });

    const newUser = await db.User.create({ name: 'Alice' });
    const allUsers = await db.User.findAll();

    assert.equal(newUser.id, 1);
    assert.lengthOf(allUsers, 1);
  });
});
