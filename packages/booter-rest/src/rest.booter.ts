// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/booter-rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  ArtifactOptions,
  BaseArtifactBooter,
  BootBindings,
  booter,
} from '@loopback/boot';
import {
  Application,
  config,
  ControllerClass,
  CoreBindings,
  inject,
} from '@loopback/core';
import {
  ApplicationWithRepositories,
  Class,
  DefaultCrudRepository,
  Entity,
  Model,
} from '@loopback/repository';
import {defineCrudRestController} from '@loopback/rest-crud';
import * as debugFactory from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';

const debug = debugFactory('loopback:boot:rest-booter');
const readFile = promisify(fs.readFile);

@booter('rest')
export class RestBooter extends BaseArtifactBooter {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    public app: ApplicationWithRepositories,
    @inject(BootBindings.PROJECT_ROOT) projectRoot: string,
    @config()
    public booterConfig: ArtifactOptions = {},
  ) {
    // TODO assert that `app` has RepositoryMixin members

    super(
      projectRoot,
      // Set booter options if passed in via bootConfig
      Object.assign({}, RestDefaults, booterConfig),
    );
  }

  async configure(): Promise<void> {
    await super.configure();
    // TODO: scan extensions contributing API patterns
    console.log('rootDir', this.projectRoot);
    console.log('dirs', this.dirs);
  }

  async load(): Promise<void> {
    // Important: don't call `super.load()` here, it would try to load
    // classes via `loadClassesFromFiles` - that does not make sense for JSON
    // files
    await Promise.all(this.discovered.map(f => this.setupModel(f)));
  }

  async setupModel(configFile: string): Promise<void> {
    const cfg = JSON.parse(await readFile(configFile, {encoding: 'utf-8'}));
    debug(
      'Loaded model config from %s',
      path.relative(this.projectRoot, configFile),
      config,
    );

    const modelClass = await this.app.get<typeof Model & {prototype: Model}>(
      `models.${cfg.model}`,
    );

    // TODO: use ExtensionPoint to resolve the pattern
    if (cfg.pattern !== 'CrudRest') {
      throw new Error(`Unsupported API pattern ${cfg.pattern}`);
    }
    setupCrudRest(this.app, modelClass, cfg);
  }
}

/**
 * Default ArtifactOptions for ControllerBooter.
 */
export const RestDefaults: ArtifactOptions = {
  // public-models should live outside of "dist"
  rootDir: '../',
  dirs: ['public-models'],
  extensions: ['.config.json'],
  nested: true,
};

// TODO: move this interface to rest-booter-plugin package
export type ModelConfig = {
  model: string;
  pattern: string;
  dataSource: string;
  basePath: string;
  [patternSpecificSetting: string]: unknown;
};

// TODO: move the following functions to rest-crud package
function setupCrudRest(
  app: Application & ApplicationWithRepositories,
  modelClass: typeof Model & {prototype: Model},
  cfg: ModelConfig,
) {
  if (!(modelClass.prototype instanceof Entity)) {
    throw new Error(
      `CrudRestController requires an Entity, Models are not supported. (Model name: ${modelClass.name})`,
    );
  }
  const entityClass = modelClass as typeof Entity & {prototype: Entity};

  // TODO Check if the repository class has been already defined.
  // If yes, then skip creation of the default repository
  const repositoryClass = createCrudRepository(entityClass, cfg);
  app.repository(repositoryClass);
  debug('Registered repository class', repositoryClass.name);

  const controllerClass = createCrudRestController(entityClass, cfg);
  app.controller(controllerClass);
  debug('Registered controller class', controllerClass.name);
}

function createCrudRepository(
  entityClass: typeof Entity & {prototype: Entity},
  modelConfig: ModelConfig,
): Class<DefaultCrudRepository<Entity, unknown>> {
  const factory = new Function(
    'entityClass',
    'DefaultCrudRepository',
    `
  return class ${entityClass.name}Repository extends DefaultCrudRepository {
    constructor(dataSource) {
      super(entityClass, dataSource);
    }
  };
    `,
  );

  const repositoryClass = factory(
    entityClass,
    DefaultCrudRepository, // TODO(bajtos) make this configurable
  );
  inject(`datasources.${modelConfig.dataSource}`)(
    repositoryClass,
    undefined,
    0,
  );

  return repositoryClass;
}

function createCrudRestController(
  entityClass: typeof Entity & {prototype: Entity},
  modelConfig: ModelConfig,
): ControllerClass {
  const CrudRestController = defineCrudRestController(
    entityClass,
    // important - forward the entire config object to allow controller
    // factories to accept additional (custom) config options
    modelConfig,
  );

  // TODO(bajtos) Move this function to rest-crud package,
  // improve defineCrudRestController to create a named class
  const factory = new Function(
    'entityClass',
    'CrudRestController',
    'DefaultCrudRepository',
    `
  return class ${entityClass.name}Controller extends CrudRestController {
    constructor(repository) {
      super(repository);
    }
  };
  `,
  );
  const controllerClass = factory(
    entityClass,
    CrudRestController,
    DefaultCrudRepository,
  );

  inject(`repositories.${entityClass.name}Repository`)(
    controllerClass,
    undefined,
    0,
  );

  return controllerClass;
}
