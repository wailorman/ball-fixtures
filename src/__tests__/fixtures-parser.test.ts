import chai from 'chai';
import { map, findIndex, findLastIndex } from 'lodash';
import { parseFixtures } from '../fixtures-parser';
import { Fixtures, TaskType } from '../types';

const db = require('../../models');
const { assert } = chai;

describe(`Fixtures parser`, () => {
  describe(`> truncate`, () => {
    it(`should generate truncate tasks`, async () => {
      const fixtures: Fixtures = {
        Orphan: [
          {
            name: '123',
          },
        ],
        User: [
          {
            name: 'Bob',
          },
        ],
      };

      const tasks = parseFixtures({ fixtures, db });

      const truncateTasks = tasks.filter(({ type }) => type === TaskType.TRUNCATE);

      assert.lengthOf(truncateTasks, 2);

      const modelNames = map(truncateTasks, 'modelName');

      assert.deepEqual(modelNames.slice().sort(), ['Orphan', 'User'].sort());
    });

    it(`should generate truncate tasks first`, async () => {
      const fixtures: Fixtures = {
        Orphan: [
          {
            name: '123',
          },
        ],
        User: [
          {
            name: 'Bob',
          },
        ],
      };

      const tasks = parseFixtures({ fixtures, db });

      const truncateTasks = tasks.filter(({ type }) => type === TaskType.TRUNCATE);

      const firstTruncateTaskIndex = findIndex(tasks, ({ type }) => type === TaskType.TRUNCATE);
      const lastTruncateTaskIndex = findLastIndex(tasks, ({ type }) => type === TaskType.TRUNCATE);

      assert.equal(firstTruncateTaskIndex, 0, 'firstTruncateTaskIndex');
      assert.equal(lastTruncateTaskIndex, truncateTasks.length - 1, 'lastTruncateTaskIndex');
    });
  });

  describe(`> create`, () => {
    it(`should generate simple create tasks`, async () => {
      const fixtures: Fixtures = {
        Orphan: [
          {
            name: '123',
          },
          {
            name: '456',
          },
        ],
      };

      const tasks = parseFixtures({ fixtures, db });

      const parallelTasks = tasks.filter(({ type }) => type === TaskType.PARALLEL_TASK);
      assert.lengthOf(parallelTasks, 1, 'parallelTasks');

      const serialTasks = (parallelTasks[0].tasks || []).filter(
        ({ type }) => type === TaskType.SERIAL_TASK,
      );
      assert.lengthOf(serialTasks, 1, 'serialTasks');

      const bulkCreateTasks = (serialTasks[0].tasks || []).filter(
        ({ type }) => type === TaskType.BULK_CREATE,
      );
      assert.lengthOf(bulkCreateTasks, 1, 'bulkCreate');

      const [singleBulkCreateTask] = bulkCreateTasks;

      assert.equal(singleBulkCreateTask.modelName, 'Orphan');
      assert.isArray(singleBulkCreateTask.values);
      assert.deepEqual(
        ([] as any[])
          .concat(singleBulkCreateTask.values)
          .slice()
          .sort(),
        fixtures.Orphan.slice().sort(),
      );
    });

    it(`should split create tasks to dependency groups`, async () => {
      const fixtures: Fixtures = {
        // Orphan group
        Orphan: [],

        // SelfLinked group
        SelfLinked: [],

        // User group
        Post: [],
        TagPost: [],
        Tag: [],
        User: [],
        UserInfo: [],
      };

      const tasks = parseFixtures({ fixtures, db });

      const parallelTasks = tasks.filter(({ type }) => type === TaskType.PARALLEL_TASK);
      assert.lengthOf(parallelTasks, 1, 'parallelTasks');

      const serialTasks = (parallelTasks[0].tasks || []).filter(
        ({ type }) => type === TaskType.SERIAL_TASK,
      );
      assert.lengthOf(serialTasks, 3, 'serialTasks');

      // -----------------

      const orphanSerialTask = serialTasks.find(
        ({ tasks }) => !!(tasks || []).find(({ modelName }) => modelName === 'Orphan'),
      );

      assert.isDefined(orphanSerialTask, `Orphan's serial task`);

      // -----------------

      const selfLinkedSerialTask = serialTasks.find(
        ({ tasks }) => !!(tasks || []).find(({ modelName }) => modelName === 'SelfLinked'),
      );

      assert.isDefined(selfLinkedSerialTask, `SelfLinked's serial task`);

      // -----------------

      const userSerialTask = serialTasks.find(
        ({ tasks }) => !!(tasks || []).find(({ modelName }) => modelName === 'User'),
      );

      assert.isDefined(userSerialTask, `User's serial task`);
    });

    it(`should keep fixtures order for common entity`, async () => {
      const fixtures: Fixtures = {
        User: [
          { name: 'Bob' },
          { name: 'Alice' },
          { name: 'Jack' },
          { name: 'Jimmy' },
          { name: 'Yuliya' },
        ],
      };

      const tasks = parseFixtures({ fixtures, db });

      const parallelTasks = tasks.filter(({ type }) => type === TaskType.PARALLEL_TASK);
      assert.lengthOf(parallelTasks, 1, 'parallelTasks');

      const serialTasks = (parallelTasks[0].tasks || []).filter(
        ({ type }) => type === TaskType.SERIAL_TASK,
      );
      assert.lengthOf(serialTasks, 1, 'serialTasks');

      const [bulkCreateTask = null] = serialTasks[0].tasks || [];

      assert.deepEqual(bulkCreateTask && bulkCreateTask.values, [
        { name: 'Bob' },
        { name: 'Alice' },
        { name: 'Jack' },
        { name: 'Jimmy' },
        { name: 'Yuliya' },
      ]);
    });

    it(`should sort fixtures for self-linked entity`, async () => {
      const fixtures: Fixtures = {
        SelfLinked: [
          { id: 1 },
          { id: 2, selfLinkedId: 3 },
          { id: 3 },
          { id: 4, selfLinkedId: 5 },
          { id: 5 },
        ],
      };

      const tasks = parseFixtures({ fixtures, db });

      const parallelTasks = tasks.filter(({ type }) => type === TaskType.PARALLEL_TASK);
      assert.lengthOf(parallelTasks, 1, 'parallelTasks');

      const serialTasks = (parallelTasks[0].tasks || []).filter(
        ({ type }) => type === TaskType.SERIAL_TASK,
      );
      assert.lengthOf(serialTasks, 1, 'serialTasks');

      const [bulkCreateTask = null] = serialTasks[0].tasks || [];

      assert.deepEqual(bulkCreateTask && bulkCreateTask.values, [
        { id: 1 },
        { id: 3 },
        { id: 5 },
        { id: 4, selfLinkedId: 5 },
        { id: 2, selfLinkedId: 3 },
      ]);
    });
  });
});
