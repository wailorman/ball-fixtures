import { assert } from 'chai';
import db from '../../models';
import {
  getDependencyMap,
  modelDependencySort,
  AssociationTypes,
  deserializeConstraint,
  serializeConstraint,
  getForeignConstraints,
  dropForeignConstraint,
  createForeignConstraint,
  getModelForeignConstraints,
  getAllRelatedNodesFor,
  PgConstraint,
  DependencyMap,
  DependencyNode,
} from '../relations';

describe(`Dependency tree`, () => {
  const syncDb = () => db.sequelize.sync({ force: true });

  afterAll(syncDb);
  beforeEach(syncDb);

  describe(`#getDependencyMap`, () => {
    it(`should generate associations list`, async () => {
      const res = getDependencyMap({ db });

      assert.deepInclude(res, {
        UserInfo: { User: true },
      });
    });

    it(`should generate HasOne associations list`, async () => {
      const res = getDependencyMap({ db, associationType: AssociationTypes.HasOne });

      assert.deepInclude(res, {
        User: { UserInfo: true, Post: true },
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
});
