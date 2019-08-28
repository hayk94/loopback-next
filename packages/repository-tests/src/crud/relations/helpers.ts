import {juggler} from '@loopback/repository';
import {CrudRepositoryCtor} from '../..';
import {
  createOrderRepo,
  createAddressRepo,
  createCustomerRepo,
  createShipmentRepo,
} from './fixtures/repositories';

export function givenBoundCrudRepositories(
  db: juggler.DataSource,
  repositoryClass: CrudRepositoryCtor,
) {
  // get the repository class and create a new instance of it
  const customerRepoClass = createCustomerRepo(repositoryClass);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerRepo: any = new customerRepoClass(
    db,
    async () => orderRepo,
    async () => addressRepo,
  );

  const orderRepoClass = createOrderRepo(repositoryClass);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderRepo: any = new orderRepoClass(
    db,
    async () => customerRepo,
    async () => shipmentRepo,
  );

  const shipmentRepoClass = createShipmentRepo(repositoryClass);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipmentRepo: any = new shipmentRepoClass(db, async () => orderRepo);

  const addressRepoClass = createAddressRepo(repositoryClass);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addressRepo: any = new addressRepoClass(db, async () => customerRepo);

  return {customerRepo, orderRepo, shipmentRepo, addressRepo};
}

export type mixedIdType = string | number;
