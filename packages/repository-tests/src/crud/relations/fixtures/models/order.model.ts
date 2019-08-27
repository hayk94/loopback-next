// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Customer, CustomerWithRelations} from './customer.model';
import {Shipment, ShipmentWithRelations} from './shipment.model';

// export function createOrderModel(repoClass: CrudRepositoryCtor) {
//   return
@model()
export class Order extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string | number;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'boolean',
    required: false,
    default: false,
  })
  isShipped: boolean;

  @belongsTo(() => Customer)
  customerId: string | number;

  @belongsTo(() => Shipment, {name: 'shipment'})
  shipment_id: string | number;
}

export interface OrderRelations {
  customer?: CustomerWithRelations;
  shipment?: ShipmentWithRelations;
}

export type OrderWithRelations = Order & OrderRelations;