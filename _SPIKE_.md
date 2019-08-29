## Todo

- Move the booter to `@loopback/boot`, rename it to `ModelApiBooter`

## Tasks

- Add `app.model(Model, name)` API to RepositoryMixin.
  - Do we want to introduce `@model()` decorator for configuring dependency
    injection? (Similar to `@repository`.)
  - Do we want to rework scaffolded repositories to receive the model class
    via DI?

- Implement model booter to scan `dist/models/**/*.model.js` files
  and register them by calling `app.model`.

- Implement `sandbox.writeJsonFile` in `@loopback/testlab`.

- Add support for artifact option `rootDir` to `@loopback/boot`.

- Improve rest-crud to create a named controller class.

- Improve `@loopback/metadata` and `@loopback/context` per changes made
  in this spike

TBD: the actual implementation
