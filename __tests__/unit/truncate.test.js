const { assert } = require('chai');

const db = require('../../models');
const ballFixturesFactory = require('../../index');

const ballFixtures = ballFixturesFactory({ db });

describe(`#truncate`, () => {
  beforeEach(async () => {
    await db.User.truncate();
    await db.Post.truncate();

    await db.User.bulkCreate([
      {
        id: 1,
        name: 'Alice',
      },
      {
        id: 2,
        name: 'Jane',
      },
      {
        id: 3,
        name: 'Bob',
      },
    ]);

    await db.Post.bulkCreate([
      {
        title: "Alice's post",
        userId: 1,
      },
      {
        title: "Jane's post",
        userId: 2,
      },
      {
        title: "Bob's post",
        userId: 3,
      },
    ]);

    const [allUsers, allPosts] = await Promise.all([db.User.findAll(), db.Post.findAll()]);

    assert.lengthOf(allUsers, 3);
    assert.lengthOf(allPosts, 3);
  });

  describe(`#truncate`, () => {
    it(`should remove all rows in one table`, async () => {
      await ballFixtures.truncate({ User: [] });

      const [allUsers, allPosts] = await Promise.all([db.User.findAll(), db.Post.findAll()]);

      assert.lengthOf(allUsers, 0);
      assert.lengthOf(allPosts, 3);
    });
  });

  describe(`#truncateAll`, () => {
    it(`should clean up all tables`, async () => {
      await ballFixtures.truncateAll();

      const [allUsers, allPosts] = await Promise.all([db.User.findAll(), db.Post.findAll()]);

      assert.lengthOf(allUsers, 0);
      assert.lengthOf(allPosts, 0);
    });
  });
});
