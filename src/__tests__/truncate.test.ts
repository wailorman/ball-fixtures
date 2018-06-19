import { assert } from 'chai';

import db from '../../models';
import ballFixturesFactory from '../index';

const ballFixtures = ballFixturesFactory({ db });

describe(`#truncate`, () => {
  const syncDb = () => db.sequelize.sync({ force: true });

  afterAll(syncDb);

  beforeEach(async () => {
    await syncDb();
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
    await db.Orphan.bulkCreate([
      {
        name: "Alice's post",
      },
      {
        name: "Jane's post",
      },
      {
        name: "Bob's post",
      },
    ]);

    const [allUsers, allPosts, allOrphans] = await Promise.all([
      db.User.findAll(),
      db.Post.findAll(),
      db.Orphan.findAll(),
    ]);

    assert.lengthOf(allUsers, 3);
    assert.lengthOf(allPosts, 3);
    assert.lengthOf(allOrphans, 3);
  });

  describe(`#truncate`, () => {
    it(`should remove all rows in one table`, async () => {
      await ballFixtures.truncate({ User: [] });

      const [allUsers, allPosts, allOrphans] = await Promise.all([
        db.User.findAll(),
        db.Post.findAll(),
        db.Orphan.findAll(),
      ]);

      assert.lengthOf(allUsers, 0);
      assert.lengthOf(allPosts, 0);
      assert.lengthOf(allOrphans, 3);
    });
  });

  describe(`#truncateAll`, () => {
    it(`should clean up all tables`, async () => {
      await ballFixtures.truncateAll();

      const [allUsers, allPosts, allOrphans] = await Promise.all([
        db.User.findAll(),
        db.Post.findAll(),
        db.Orphan.findAll(),
      ]);

      assert.lengthOf(allUsers, 0);
      assert.lengthOf(allPosts, 0);
      assert.lengthOf(allOrphans, 0);
    });
  });
});
