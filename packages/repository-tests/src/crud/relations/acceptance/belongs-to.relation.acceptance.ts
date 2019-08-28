// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect, toJSON} from '@loopback/testlab';
import {
  deleteAllModelsInDefaultDataSource,
  withCrudCtx,
} from '../../../helpers.repository-tests';
import {
  CrudFeatures,
  CrudRepositoryCtor,
  CrudTestContext,
  DataSourceOptions,
} from '../../../types.repository-tests';
import {Customer, Order, Shipment} from '../fixtures/models';
import {givenBoundCrudRepositories} from '../helpers';

export function belongsToRelationAcceptance(
  dataSourceOptions: DataSourceOptions,
  repositoryClass: CrudRepositoryCtor,
  features: CrudFeatures,
) {
  describe('BelongsTo relation (acceptance)', () => {
    before(deleteAllModelsInDefaultDataSource);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let customerRepo: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderRepo: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shipmentRepo: any;

    before(
      withCrudCtx(async function setupRepository(ctx: CrudTestContext) {
        ({customerRepo, orderRepo, shipmentRepo} = givenBoundCrudRepositories(
          ctx.dataSource,
          repositoryClass,
        ));
        const models = [Customer, Order, Shipment];
        await ctx.dataSource.automigrate(models.map(m => m.name));
      }),
    );

    beforeEach(async () => {
      await orderRepo.deleteAll();
    });

    it('can find customer of order', async () => {
      const customer = await customerRepo.create({
        name: 'Order McForder',
      });
      const order = await orderRepo.create({
        customerId: customer.id,
        description: 'Order from Order McForder, the hoarder of Mordor',
      });

      const result = await orderRepo.customer(order.id);
      // don't need to check parentId at this point, but still need to pass it
      // in here so that MySQL won't complain
      expect(toJSON({...result, parentId: 1})).to.deepEqual(
        toJSON({...customer, parentId: 1}),
      );
    });

    it('can find shipment of order with a custom foreign key name', async () => {
      const shipment = await shipmentRepo.create({
        name: 'Tuesday morning shipment',
      });
      const order = await orderRepo.create({
        // eslint-disable-next-line @typescript-eslint/camelcase
        shipment_id: shipment.id,
        description: 'Order that is shipped Tuesday morning',
      });
      const result = await orderRepo.shipment(order.id);
      expect(result).to.deepEqual(shipment);
    });
  });
}
