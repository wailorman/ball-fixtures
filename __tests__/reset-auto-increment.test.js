const { resetAutoIncrement } = require('../index');
const { assert } = require('chai');
const db = require('../models');

describe(`#resetAutoIncrement`, () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.User.truncate();
  });

  it(`should set AI to 1`, async () => {
    await resetAutoIncrement({ model: db.User, num: 1 }, {}, { db });
    await db.User.create();

    const users = await db.User.findAll();

    assert.lengthOf(users, 1);

    const [user] = users;

    assert.equal(user.id, 1);
  });

  it(`should set AI to 10`, async () => {
    await resetAutoIncrement({ model: db.User, num: 10 }, {}, { db });
    await db.User.create();

    const users = await db.User.findAll();

    assert.lengthOf(users, 1);

    const [user] = users;

    assert.equal(user.id, 10);
  });
});
