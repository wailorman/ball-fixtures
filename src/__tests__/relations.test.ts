import { assert } from 'chai';
import db from '../../models';
import {
  getDependencyMap,
  modelDependencySort,
  deserializeConstraint,
  serializeConstraint,
  getForeignConstraints,
  dropForeignConstraint,
  createForeignConstraint,
  getModelForeignConstraints,
  getAllRelatedNodesFor,
  PgConstraint,
  DependencyNode,
  splitToDependencyGroups,
  sortFixtures,
} from '../relations';
import { AssociationType as AT, DependencyMap } from '../types';

describe(`Dependency tree`, () => {
  const syncDb = () => db.sequelize.sync({ force: true });

  afterAll(syncDb);
  beforeEach(syncDb);

  describe(`#getDependencyMap`, () => {
    it(`BelongsTo`, async () => {
      const res = getDependencyMap({ db, associationType: AT.BelongsTo });

      assert.deepInclude(res, {
        UserInfo: { User: true },
      });
    });

    it(`BelongsTo (BelongsToMany)`, async () => {
      const res = getDependencyMap({ db });

      assert.deepInclude(res, {
        TagPost: { Post: true, Tag: true },
      });
    });

    it(`HasOne`, async () => {
      const res = getDependencyMap({ db, associationType: AT.HasOne });

      assert.deepInclude(res, {
        User: { UserInfo: true },
      });
    });

    it(`HasMany`, async () => {
      const res = getDependencyMap({ db, associationType: AT.HasMany });

      assert.deepInclude(res, {
        User: { Post: true },
      });
    });

    it(`HasMany (BelongsToMany)`, async () => {
      const res = getDependencyMap({ db, associationType: AT.HasMany });

      assert.deepInclude(res, {
        Post: { TagPost: true },
        Tag: { TagPost: true },
      });
    });

    it(`self-linked enitites`, async () => {
      const res = getDependencyMap({ db, associationType: AT.BelongsTo });

      assert.deepInclude(res, {
        SelfLinked: { SelfLinked: true },
      });
    });

    it(`use multiple association types`, async () => {
      const res = getDependencyMap({ db, associationType: [AT.HasOne, AT.HasMany] });

      assert.deepInclude(res, {
        User: { Post: true, UserInfo: true },
      });
    });

    it(`BelongsTo by default`, async () => {
      const res1 = getDependencyMap({ db });
      const res2 = getDependencyMap({ db, associationType: AT.BelongsTo });

      assert.deepEqual(res1, res2);
    });

    it(`BelongsToMany`, async () => {
      const res = getDependencyMap({ db, associationType: AT.BelongsToMany });

      assert.deepInclude(res, {
        Post: { Tag: true },
        Tag: { Post: true },
      });
    });
  });

  describe(`#modelDependencySort`, () => {
    it(`should sort models for BelongsTo`, async () => {
      const dependencyMap: DependencyMap = {
        UserInfo: { User: true },
        Post: { User: true },
      };

      const modelNames1 = ['UserInfo', 'User'];
      const res1 = modelDependencySort({ dependencyMap, modelNames: modelNames1 });
      assert.deepEqual(res1, ['User', 'UserInfo']);

      const modelNames2 = ['User', 'Post'];
      const res2 = modelDependencySort({ dependencyMap, modelNames: modelNames2 });
      assert.deepEqual(res2, ['User', 'Post']);
    });
  });

  describe(`#deserializeConstraint`, () => {
    it(`should deserialize pg constraint`, async () => {
      const pgRow = {
        table: `"Posts"`,
        name: 'Posts_userId_fkey',
        def: `FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE`,
      };

      const res: PgConstraint = deserializeConstraint(pgRow);

      assert.deepInclude(res, {
        table: `Posts`,
        name: 'Posts_userId_fkey',
        def: `FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE`,
      });
    });
  });

  describe(`#serializeConstraint`, () => {
    it(`should serialize to pg constraint`, async () => {
      const constraint: PgConstraint = {
        table: `Posts`,
        name: 'Posts_userId_fkey',
        def: `FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE`,
      };

      const res: string = serializeConstraint(constraint);

      assert.equal(
        res.replace(/\s+/gi, ''),
        `
          ALTER TABLE "Posts"
          ADD CONSTRAINT "Posts_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE;
        `.replace(/\s+/gi, ''),
      );
    });
  });

  describe(`#getForeignConstraints`, () => {
    it(`should return foreign constraints`, async () => {
      const res: PgConstraint[] = await getForeignConstraints(db);

      assert.deepInclude(res.find(({ name }) => name === 'Posts_userId_fkey'), {
        table: 'Posts',
        name: 'Posts_userId_fkey',
        def: 'FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE',
      });
    });
  });

  describe(`#dropForeignConstraint`, () => {
    it(`should drop constraint`, async () => {
      const constraint: PgConstraint = {
        table: 'Posts',
        name: 'Posts_userId_fkey',
        def: 'FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE',
      };

      await dropForeignConstraint(constraint, db);

      const newConstraints = await getForeignConstraints(db);

      assert.isUndefined(newConstraints.find(({ name }) => name === 'Posts_userId_fkey'));
    });
  });

  describe(`#createForeignConstraint`, () => {
    it(`should create deleted constraint`, async () => {
      const constraint: PgConstraint = {
        table: 'Posts',
        name: 'Posts_userId_fkey',
        def: 'FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE',
      };

      await dropForeignConstraint(constraint, db);

      assert.isUndefined(
        (await getForeignConstraints(db)).find(({ name }) => name === 'Posts_userId_fkey'),
      );

      await createForeignConstraint(constraint, db);

      assert.isDefined(
        (await getForeignConstraints(db)).find(({ name }) => name === 'Posts_userId_fkey'),
      );
    });
  });

  describe(`#getModelForeignConstraints`, () => {
    it(`should return Post model FK constraints`, async () => {
      const res = await getModelForeignConstraints(db.Post, db);

      assert.isDefined(res.find(({ name }) => name === 'Posts_userId_fkey'));
    });
  });

  describe(`#getAllRelatedNodesFor`, () => {
    it(`should return all related nodes (+ circular deps)`, async () => {
      const depMap: DependencyMap = {
        User: { Post: true, Comment: true },
        Post: { Comment: true },
        Comment: { User: true },

        Blog: { Site: true },
        Document: { Sign: true },
      };

      const res: DependencyNode[] = getAllRelatedNodesFor('User', depMap);

      assert.deepEqual(res.sort(), ['Post', 'Comment'].sort());
    });
  });

  describe(`#splitToDependencyGroups`, () => {
    it(`should split all models to tied groups`, async () => {
      const dependencyMap = getDependencyMap({
        db,
        associationType: [AT.BelongsTo, AT.HasMany, AT.HasOne],
      });

      const res = splitToDependencyGroups({
        dependencyMap,
        modelNames: ['Orphan', 'SelfLinked', 'Post', 'TagPost', 'Tag', 'User', 'UserInfo'],
      });

      assert.deepEqual(
        res.slice().sort().map((el) => el.slice().sort()),
        [
          ['Orphan'].sort(),
          ['SelfLinked'].sort(),
          ['Post', 'TagPost', 'Tag', 'User', 'UserInfo'].sort(),
        ].sort(),
      );
    });

    it(`should split couple of models to tied groups`, async () => {
      const dependencyMap = getDependencyMap({
        db,
        associationType: [AT.BelongsTo, AT.HasMany, AT.HasOne],
      });

      const res = splitToDependencyGroups({
        dependencyMap,
        modelNames: ['Orphan', 'SelfLinked', 'Post', 'UserInfo'],
      });

      // prettier-ignore
      assert.deepEqual(
        res.sort().map((el) => el.sort()),
        [
          ['Orphan'].sort(),
          ['SelfLinked'].sort(),
          ['Post', 'UserInfo'].sort(),
        ].sort(),
      );
    });
  });

  describe(`#sortFixtures`, () => {
    it(`should keep non-self-linked entity`, async () => {
      const dependencyMap = getDependencyMap({ db });
      const modelName = 'User';
      const values = [{ name: '123' }, { name: '345' }];

      const res = sortFixtures({ dependencyMap, db, modelName, values });

      assert.deepEqual(res, values);
    });

    it(`should sort self-linked entity`, async () => {
      const dependencyMap = getDependencyMap({ db });
      const modelName = 'SelfLinked';
      const values = [
        {
          id: 1,
          name: '1',
          selfLinkedId: 2,
        },
        {
          id: 2,
          name: '2',
        },
        {
          id: 3,
          name: '3',
          selfLinkedId: 5,
        },
      ];

      const res = sortFixtures({ dependencyMap, db, modelName, values });

      assert.deepEqual(res, [
        {
          id: 2,
          name: '2',
        },
        {
          id: 3,
          name: '3',
          selfLinkedId: 5,
        },
        {
          id: 1,
          name: '1',
          selfLinkedId: 2,
        },
      ]);
    });
  });
});
