import { Fixtures, TaskType, Task, SequelizeInstance, AssociationType as AT } from './types';
import {
  splitToDependencyGroups,
  modelDependencySort,
  getDependencyMap,
  sortFixtures,
} from './relations';

export function parseFixtures(args: { fixtures: Fixtures; db: SequelizeInstance }): Task[] {
  const { fixtures, db } = args;

  const truncateTasks = truncateFixtures({ fixtures, db });

  const createTasks = createFixtures({ fixtures, db });

  const createTaskGroup = { type: TaskType.PARALLEL_TASK, tasks: createTasks };

  return [...truncateTasks, createTaskGroup];
}

export function truncateFixtures(args: { fixtures: Fixtures; db: SequelizeInstance }): Task[] {
  const { fixtures } = args;

  return Object.keys(fixtures).map(modelName => ({
    modelName,
    type: TaskType.TRUNCATE,
  }));
}

export function createFixtures(args: { fixtures: Fixtures; db: SequelizeInstance }): Task[] {
  const { fixtures, db } = args;

  const dependencyMapTied = getDependencyMap({
    db,
    associationType: [AT.BelongsTo, AT.HasMany, AT.HasOne],
  });

  const dependencyMapBelongsTo = getDependencyMap({
    db,
    associationType: [AT.BelongsTo],
  });

  const dependencyGroups = splitToDependencyGroups({
    dependencyMap: dependencyMapTied,
    modelNames: Object.keys(fixtures),
  });

  return dependencyGroups.map((dependencyGroup: string[]) => {
    const sortedModels = modelDependencySort({
      dependencyMap: dependencyMapBelongsTo,
      modelNames: dependencyGroup,
    });

    return {
      type: TaskType.SERIAL_TASK,
      tasks: sortedModels.map(modelName => {
        const sortedFixtures = sortFixtures({
          modelName,
          db,
          values: fixtures[modelName],
          dependencyMap: dependencyMapBelongsTo,
        });

        return {
          modelName,
          type: TaskType.BULK_CREATE,
          values: sortedFixtures,
        };
      }),
    };
  });
}
