// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/rest-crud
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {transformFunctionBody} from '@loopback/model-api-builder';
import {
  DefaultCrudRepository,
  Entity,
  EntityCrudRepository,
  juggler,
} from '@loopback/repository';
import * as assert from 'assert';

export function defineRepositoryClass<
  T extends Entity,
  IdType,
  Relations extends object = {}
>(
  entityClass: typeof Entity & {prototype: T},
): RepositoryClass<T, IdType, Relations> {
  function template(
    EntityCtor: typeof Entity & {prototype: T},
    BaseRepository: CrudRepoCtor<T, IdType, Relations>,
  ) {
    return class EntityNameRepository extends BaseRepository {
      constructor(dataSource: juggler.DataSource) {
        super(EntityCtor, dataSource);
      }
    };
  }

  const repoName = entityClass.name + 'Repository';
  const defineNamedRepo = transformFunctionBody(template, code =>
    code.replace(/\EntityNameRepository/, repoName),
  );

  // TODO(bajtos) make DefaultCrudRepository configurable (?)
  const repo = defineNamedRepo(entityClass, DefaultCrudRepository);
  assert.equal(repo.name, repoName);
  return repo;
}

export interface RepositoryClass<
  T extends Entity,
  IdType,
  Relations extends object
> {
  new (ds: juggler.DataSource): EntityCrudRepository<T, IdType, Relations>;
}

interface CrudRepoCtor<T extends Entity, IdType, Relations extends object> {
  new (
    entityCtor: typeof Entity & {prototype: T},
    ds: juggler.DataSource,
  ): EntityCrudRepository<T, IdType, Relations>;
}