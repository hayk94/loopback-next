// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/core
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {MetadataInspector} from '@loopback/metadata';
import {BindingFilter} from './binding-filter';
import {ContextView} from './context-view';
import {inject, InjectionMetadata} from './inject';
import {Constructor, transformValueOrPromise} from './value-promise';

/**
 * Metadata for `@instance` injection
 */
export interface InstanceInjectionMetadata extends InjectionMetadata {
  /**
   * Do not check sub classes to match class bindings
   */
  skipSubClasses?: boolean;
}

/**
 * `@instance` injects an instance of the matching class from a binding created
 * using `toClass()`.
 * @param serviceClass - Constructor for the instance. If not provided, the value
 * is inferred from the design:type of the parameter or property
 *
 * @example
 * ```ts
 *
 * const ctx = new Context();
 * ctx.bind('my-service').toClass(MyService);
 * ctx.bind('logger').toClass(Logger);
 *
 * export class MyController {
 *   constructor(@instance(MyService) private myService: MyService) {}
 *
 *   @instance()
 *   private logger: Logger;
 * }
 *
 * ctx.bind('my-controller').toClass(MyController);
 * await myController = ctx.get<MyController>('my-controller');
 * ```
 */
export function instance(
  serviceClass?: Constructor<unknown>,
  metadata?: InstanceInjectionMetadata,
) {
  return inject(
    '',
    {decorator: '@instance', ...metadata},
    (ctx, injection, session) => {
      let serviceType: Function | undefined = serviceClass;
      if (!serviceType) {
        if (typeof injection.methodDescriptorOrParameterIndex === 'number') {
          serviceType = MetadataInspector.getDesignTypeForMethod(
            injection.target,
            injection.member!,
          ).parameterTypes[injection.methodDescriptorOrParameterIndex];
        } else {
          serviceType = MetadataInspector.getDesignTypeForProperty(
            injection.target,
            injection.member!,
          );
        }
      }
      if (serviceType === Object || serviceType === Array) {
        throw new Error(
          'Service class cannot be inferred from design type. Use @instance(ServiceClass).',
        );
      }
      const view = new ContextView(
        ctx,
        filterByServiceClass(serviceType, metadata),
      );
      const result = view.resolve(session);
      return transformValueOrPromise(result, values => {
        if (values.length === 1) return values[0];
        if (values.length >= 1) {
          throw new Error(
            `More than one bindings found for ${serviceType!.name}`,
          );
        } else {
          if (metadata && metadata.optional) {
            return undefined;
          }
          throw new Error(
            `No binding found for ${
              serviceType!.name
            }. Make sure a binding is created in context ${
              ctx.name
            } with toClass(${serviceType!.name}).`,
          );
        }
      });
    },
  );
}

/**
 * Create a binding filter by instance class
 * @param serviceClass - Service class matching the one used by `binding.toClass()`
 * @param options - Options to control if subclasses should be skipped for matching
 */
export function filterByServiceClass(
  serviceClass: Function,
  options?: {skipSubClasses?: boolean},
): BindingFilter {
  return binding =>
    options && options.skipSubClasses
      ? binding.valueConstructor === serviceClass
      : isSubclass(binding.valueConstructor, serviceClass);
}

/**
 * Test if sub inherits from base
 * @param ctor - Possible subclass
 * @param baseClass - Base class
 */
function isSubclass(
  ctor: Constructor<unknown> | undefined,
  baseClass: Function | undefined,
) {
  if (typeof baseClass !== 'function' || typeof ctor !== 'function')
    return false;
  if (ctor === baseClass) return true;
  let cls = ctor;
  while (cls && cls !== Object) {
    const proto = Object.getPrototypeOf(cls);
    if (proto === baseClass) return true;
    cls = proto;
  }
  return false;
}
