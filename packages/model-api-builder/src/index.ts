// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/model-api-builder
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BindingTemplate, extensionFor} from '@loopback/core';
import {ApplicationWithRepositories, Model} from '@loopback/repository';

export const MODEL_API_BUILDER_PLUGINS = 'model-api-builders';

export interface ModelApiBuilder {
  readonly pattern: string; // e.g. CrudRest
  setup(
    application: ApplicationWithRepositories,
    modelClass: typeof Model & {prototype: Model},
    config: ModelApiConfig,
  ): Promise<void>;
}

export type ModelApiConfig = {
  // E.g. 'Product'
  model: string;
  // E.g. 'RestCrud'
  pattern: string;
  // E.g. 'db'
  dataSource: string;
  // E.g. '/products'
  basePath: string;

  [patternSpecificSetting: string]: unknown;
};

/**
 * A binding template for greeter extensions
 */
export const asModelApiBuilder: BindingTemplate = binding => {
  extensionFor(MODEL_API_BUILDER_PLUGINS)(binding);
  binding.tag({namespace: 'model-api-builders'});
};
