// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter} from '@loopback/context';
import {
  DefaultCrudRepository,
  Entity,
  EntityCrudRepository,
  hasMany,
  HasManyRepositoryFactory,
  juggler,
  model,
  property,
} from '@loopback/repository';
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

export function hasManyWithoutDIRelationAcceptance(
  dataSourceOptions: DataSourceOptions,
  repositoryClass: CrudRepositoryCtor,
  features: CrudFeatures,
) {
  describe('HasMany relation without di (acceptance)', () => {
    before(deleteAllModelsInDefaultDataSource);
    // Given a Customer and Order models - see definitions at the bottom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existingCustomerId: any;
    let ds: juggler.DataSource;
    let customerRepo: CustomerRepository;
    let orderRepo: OrderRepository;

    before(
      withCrudCtx(async function setupRepository(ctx: CrudTestContext) {
        ds = ctx.dataSource;
        givenOrderRepository();
        givenCustomerRepository();
        await ctx.dataSource.automigrate([Customer.name, Order.name]);
      }),
    );

    beforeEach(async () => {
      await orderRepo.deleteAll();
      existingCustomerId = (await givenPersistedCustomerInstance()).id;
    });

    it('can create an instance of the related model', async () => {
      async function createCustomerOrders(
        customerId: number | string,
        orderData: Partial<Order>,
      ): Promise<Order> {
        return customerRepo.orders(customerId).create(orderData);
      }
      const order = await createCustomerOrders(existingCustomerId, {
        description: 'order 1',
      });
      expect(toJSON(order)).containDeep(
        toJSON({
          customerId: existingCustomerId,
          description: 'order 1',
        }),
      );

      const persisted = await orderRepo.findById(order.id);

      expect(persisted.toObject()).to.deepEqual(order.toObject());
    });

    it('can find instances of the related model (acceptance)', async () => {
      async function createCustomerOrders(
        customerId: number | string,
        orderData: Partial<Order>,
      ): Promise<Order> {
        return customerRepo.orders(customerId).create(orderData);
      }
      async function findCustomerOrders(customerId: number | string) {
        return customerRepo.orders(customerId).find();
      }

      const order = await createCustomerOrders(existingCustomerId, {
        description: 'order 1',
      });
      const notMyOrder = await createCustomerOrders(existingCustomerId + 1, {
        description: 'order 2',
      });
      const orders = await findCustomerOrders(existingCustomerId);

      expect(toJSON(orders)).to.containEql(toJSON(order));
      expect(orders).to.not.containEql(notMyOrder);

      const persisted = await orderRepo.find({
        where: {customerId: existingCustomerId},
      });
      expect(toJSON(persisted)).to.deepEqual(toJSON(orders));
    });

    //--- HELPERS ---//

    @model()
    class Order extends Entity {
      @property({
        type: features.idType,
        id: true,
        generated: true,
      })
      id: number | string;

      @property({
        type: 'string',
        required: true,
      })
      description: string;

      @property({
        type: features.idType,
        required: true,
      })
      customerId: number | string;
    }

    @model()
    class Customer extends Entity {
      @property({
        type: features.idType,
        id: true,
        generated: true,
      })
      id: number | string;

      @property({
        type: 'string',
      })
      name: string;

      @hasMany(() => Order)
      orders: Order[];
    }

    class OrderRepository extends DefaultCrudRepository<
      Order,
      typeof Order.prototype.id
    > {
      constructor(db: juggler.DataSource) {
        super(Order, db);
      }
    }

    class CustomerRepository extends DefaultCrudRepository<
      Customer,
      typeof Customer.prototype.id
    > {
      public readonly orders: HasManyRepositoryFactory<
        Order,
        typeof Customer.prototype.id
      >;

      constructor(
        protected db: juggler.DataSource,
        orderRepositoryGetter: Getter<
          EntityCrudRepository<Order, typeof Order.prototype.id>
        >,
      ) {
        super(Customer, db);
        this.orders = this._createHasManyRepositoryFactoryFor(
          'orders',
          orderRepositoryGetter,
        );
      }
    }

    function givenOrderRepository() {
      orderRepo = new OrderRepository(ds);
    }

    function givenCustomerRepository() {
      customerRepo = new CustomerRepository(ds, Getter.fromValue(orderRepo));
    }

    async function givenPersistedCustomerInstance() {
      return customerRepo.create({name: 'a customer'});
    }
  });
}