// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter} from '@loopback/context';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  juggler,
  repository,
  createBelongsToAccessor,
  BelongsToDefinition,
} from '@loopback/repository';
import {Customer, Order, OrderRelations, Shipment} from '../models';
import {CustomerRepository, ShipmentRepository} from '../repositories';
import { CrudRepositoryCtor } from '../../../..';

export function createOrderRepo(repoClass: CrudRepositoryCtor) {
  return class OrderRepository extends repoClass<
  Order,
  typeof Order.prototype.id,
  OrderRelations
  > {
    public readonly customer: BelongsToAccessor<
      Customer,
      typeof Order.prototype.id
    >;
    public readonly shipment: BelongsToAccessor<
      Shipment,
      typeof Order.prototype.id
    >;

    constructor(
      db: juggler.DataSource,
      customerRepositoryGetter: Getter<CustomerRepository>,
      shipmentRepositoryGetter: Getter<ShipmentRepository>,
    ) {
      super(Order, db);
      // this.customer = this.createBelongsToAccessorFor(
      //   'customer',
      //   customerRepositoryGetter,
      // );
      const customerMeta = this.entityClass.definition.relations['customer'];
    //   customerMeta = {type: RelationType.belongsTo,
    //     targetsMany: false,
    //     keyFrom: string,
    //     keyTo: string
    // } As BelongsToDefinition;]
    // call createBelongsToAccessor directly since createBelongsToAccessorFor is protected method of defaultCrud
      this.customer = createBelongsToAccessor(customerMeta as BelongsToDefinition,
      customerRepositoryGetter,
      this);

      // this.shipment = this.createBelongsToAccessorFor(
      //   'shipment',
      //   shipmentRepositoryGetter,
      // );
      // call createBelongsToAccessor directly since createBelongsToAccessorFor is protected method of defaultCrud
      const shipmentrMeta = this.entityClass.definition.relations['shipment'];
      this.shipment = createBelongsToAccessor(shipmentrMeta as BelongsToDefinition,
        shipmentRepositoryGetter,
        this);
    }
  }
}
