## Todo

- Move the booter to `@loopback/boot`, rename it to `ModelApiBooter`
- spike docs: high-level overview of the concept

Open questions:

- Where to keep model config files?

  - `/public-models/product.config.json` (JSON, must be outside src)
  - `/src/public-models/product-config.ts` (TS, can be inside src, more
    flexible)

- Load models via DI, or rather let config files to load them via require?

  ```ts
  {
    model: require('../models/product.model'),
    // ...
  }
  ```

- If we use TS files, then we can get rid of the extension point too

  ```ts
  {
    model: require('../models/product.model').Product,
    pattern: require('@loopback/rest-crud').CrudRestApiBuilder,
    basePath: '/products',
    dataSource: 'db',

    // alternatively:
    dataSource: require('../datasources/db.datasource').DbDataSource,
  }
  ```

## Tasks

- Add `app.model(Model, name)` API to RepositoryMixin.

  - Do we want to introduce `@model()` decorator for configuring dependency
    injection? (Similar to `@repository`.)
  - Do we want to rework scaffolded repositories to receive the model class via
    DI?

- Implement model booter to scan `dist/models/**/*.model.js` files and register
  them by calling `app.model`.

- Implement `sandbox.writeJsonFile` in `@loopback/testlab`.

- Add support for artifact option `rootDir` to `@loopback/boot`.

- Improve rest-crud to create a named controller class.

- Improve `@loopback/metadata` and `@loopback/context` per changes made in this
  spike

TBD: the actual implementation

### Out of scope

- Infer base path (`/products`) from model name (`Product`). I'd like to
  implement this part in the CLI scaffolding model config file.
