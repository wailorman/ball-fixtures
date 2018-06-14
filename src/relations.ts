import { arrayToMap } from './utils';

export type DependencyNode = string | number;
export interface DetectCircularDependencyArgs {
  rootNode: DependencyNode;
  /** Function to get child nodes by rootNode, which will be passed to arguments */
  getChildNodes: (node: DependencyNode) => DependencyNode[];
  visitedNodes?: DependencyNode[];
}

/**
 * Detects circular dependencies between many nodes. If no circular
 * dependencies deteced, it will return undefined. Otherwise - throw
 * an exception.
 * If you use this function to detect circular dependency between
 * objects, do not use whole objects as _node_! Please serialize
 * this objects somehow (use IDs, for example)
 *
 * Using this algorithm: https://www.electricmonk.nl/log/2008/08/07/dependency-resolving-algorithm/
 *
 * @example
 * ```javascript
  detectCircularDependency({
    nodeId: goodId,
    getChildNodes: async (goodId) => {
      const good = await db.Good.findById(goodId);
      const recipes = (good && good.getRecipes && await good.getRecipes()) || [];
      return recipes.map((recipe) => recipe.childGoodId);
    }
  });
 * ```
 * @throws {Error} Circular dependency detected: ... -> ... -> ...
 */
export function detectCircularDependency(args: DetectCircularDependencyArgs): void {
  const { rootNode, getChildNodes, visitedNodes = [] } = args;

  visitedNodes.push(rootNode);

  const childNodes = getChildNodes(rootNode);

  childNodes.map(childNode => {
    if (childNode in arrayToMap(visitedNodes)) {
      const chain = visitedNodes.concat(childNode).join(' -> ');
      throw new Error(`Circular dependency detected: ${chain}`);
    }

    return detectCircularDependency({
      getChildNodes,
      visitedNodes,
      rootNode: childNode,
    });
  });
}

export interface DependencyMap {
  [key: string]: { [key: string]: boolean };
}
export enum AssociationTypes {
  BelongsTo = 'BelongsTo',
  HasMany = 'HasMany',
  HasOne = 'HasOne',
}
export interface GetDependencyMapArgs {
  db: any;
  associationType?: AssociationTypes;
}
export function getDependencyMap(args: GetDependencyMapArgs): DependencyMap {
  const { db, associationType = AssociationTypes.BelongsTo } = args;
  return Object.keys(db).reduce((prev: DependencyMap, modelName: string) => {
    const model = db[modelName];
    const modelAssociations = model.associations;

    if (!modelAssociations) return prev;

    const belongsToAssociations = Object.keys(modelAssociations)
      .filter(associationName => {
        const associationType = modelAssociations[associationName].associationType;
        return associationType === associationType;
      })
      .map(associationName => {
        const association = modelAssociations[associationName];
        const targetModelName = association.target.options.name.singular;
        return targetModelName;
      });
    return {
      ...prev,
      [modelName]: arrayToMap(belongsToAssociations) || {},
    };
  }, {});
}

export interface ModelDependencySortArgs {
  dependencyMap: DependencyMap;
  modelNames: string[];
}

export function modelDependencySort(args: ModelDependencySortArgs): string[] {
  const { dependencyMap, modelNames } = args;
  return modelNames.sort((modelA, modelB) => {
    const modelADeps = dependencyMap[modelA] || {};
    const modelBDeps = dependencyMap[modelB] || {};

    if (modelA in modelBDeps) return -1;

    if (modelB in modelADeps) return 1;

    return 0;
  });
}

export interface PgConstraint {
  /** Table name. Example: Posts */
  table: string;
  /** Constraint name. Example: Posts_userId_fkey */
  name: string;
  // tslint:disable-next-line max-line-length
  /** Constraint definition. Example: FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE SET NULL */
  def: string;
}

export async function getModelForeignConstraints(model: any, db: any): Promise<PgConstraint[]> {
  const constraints: PgConstraint[] = await getForeignConstraints(db);
  const table = model.getTableName();

  return constraints.filter(c => c.table === table);
}

// https://dba.stackexchange.com/questions/36979/retrieving-all-pk-and-fk
export async function getForeignConstraints(db: any): Promise<PgConstraint[]> {
  const getConstrainsQuery = `
    SELECT conrelid::regclass AS "table",
           conname AS "name",
           pg_get_constraintdef(c.oid) AS "def"
    FROM   pg_constraint c
    JOIN   pg_namespace n ON n.oid = c.connamespace
    WHERE  contype IN ('f')
    AND    n.nspname = 'public' -- your schema here
    ORDER  BY conrelid::regclass::text, contype DESC;
  `;

  const con = await db.sequelize.query(getConstrainsQuery, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  return con.map(conRow => deserializeConstraint(conRow));
}

export function deserializeConstraint(row): PgConstraint {
  return {
    table: row.table.slice(1, -1),
    name: row.name,
    def: row.def,
  };
}

export async function dropForeignConstraint(constraint: PgConstraint, db: any) {
  const query = `ALTER TABLE "${constraint.table}" DROP CONSTRAINT "${constraint.name}";`;
  await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
}

export async function createForeignConstraint(constraint: PgConstraint, db: any) {
  await db.sequelize.query(serializeConstraint(constraint), {
    type: db.sequelize.QueryTypes.ALTER,
  });
}

// https://stackoverflow.com/questions/3005226/postgresql-constraint
export function serializeConstraint(constraint: PgConstraint): string {
  return `ALTER TABLE "${constraint.table}" ADD CONSTRAINT "${constraint.name}" ${constraint.def};`;
}

export function getAllRelatedNodesFor(
  node: DependencyNode,
  dependencyMap: DependencyMap,
  visitedNodes?: DependencyNode[],
) {
  const visitedNodesMap = {
    ...arrayToMap(visitedNodes || []),
    [node]: true,
  };
  const nodeDeps = Object.keys(dependencyMap[node]);

  return Object.keys(
    nodeDeps.reduce((prev: object, curNode: DependencyNode) => {
      return {
        ...prev,
        [curNode]: true,
        ...(!(curNode in visitedNodesMap)
          ? arrayToMap(getAllRelatedNodesFor(curNode, dependencyMap, Object.keys(visitedNodesMap)))
          : {}),
      };
    }, {}),
  ).filter(n => n !== node);
}