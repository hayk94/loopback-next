// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/core
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {Context, instance} from '../..';

describe('@instance', () => {
  let ctx: Context;

  beforeEach(givenContextWithMyService);

  it('injects an instance using constructor with serviceClass argument', async () => {
    class MyController {
      constructor(@instance(MyService) public myService: MyService) {}
    }
    ctx.bind('controllers.MyController').toClass(MyController);

    const controller = await ctx.get<MyController>('controllers.MyController');
    expect(controller.myService).to.be.instanceOf(MyService);
  });

  it('injects an instance using property', async () => {
    class MyController {
      @instance(MyService) public myService: MyService;
    }
    ctx.bind('controllers.MyController').toClass(MyController);

    const controller = await ctx.get<MyController>('controllers.MyController');
    expect(controller.myService).to.be.instanceOf(MyService);
  });

  it('injects an instance without serviceClass argument', async () => {
    class MyController {
      constructor(@instance() public myService: MyService) {}
    }
    ctx.bind('controllers.MyController').toClass(MyController);

    const controller = await ctx.get<MyController>('controllers.MyController');
    expect(controller.myService).to.be.instanceOf(MyService);
  });

  it('injects an instance matching a sub class', async () => {
    class MyController {
      constructor(@instance(MyService) public myService: MyService) {}
    }
    ctx.unbind('services.MyService');
    ctx.bind('services.MySubService').toClass(MySubService);
    ctx.bind('controllers.MyController').toClass(MyController);

    const controller = await ctx.get<MyController>('controllers.MyController');
    expect(controller.myService).to.be.instanceOf(MySubService);
  });

  it('allows optional flag', async () => {
    class MyController {
      constructor(
        @instance(MyService, {optional: true}) public myService?: MyService,
      ) {}
    }

    ctx.unbind('services.MyService');
    ctx.bind('controllers.MyController').toClass(MyController);

    const controller = await ctx.get<MyController>('controllers.MyController');
    expect(controller.myService).to.be.undefined();
  });

  it('allows skipSubClasses flag', async () => {
    class MyController {
      constructor(
        @instance(MyService, {skipSubClasses: true})
        public myService: MyService,
      ) {}
    }
    ctx.bind('services.MySubService').toClass(MySubService);
    ctx.bind('controllers.MyController').toClass(MyController);

    const controller = await ctx.get<MyController>('controllers.MyController');
    expect(controller.myService).to.be.instanceOf(MyService);
    expect(controller.myService).to.be.not.instanceOf(MySubService);
  });

  it('throws error if no binding is found', async () => {
    class MyController {
      constructor(@instance(MyService) public myService?: MyService) {}
    }

    ctx.unbind('services.MyService');
    ctx.bind('controllers.MyController').toClass(MyController);

    await expect(
      ctx.get<MyController>('controllers.MyController'),
    ).to.be.rejectedWith(
      /No binding found for MyService. Make sure a binding is created in context .+ with toClass\(MyService\)\./,
    );
  });

  it('throws error when more than one services are bound', async () => {
    class MyController {
      constructor(@instance() public myService: MyService) {}
    }

    ctx.bind('services.MyService2').toClass(MyService);
    ctx.bind('controllers.MyController').toClass(MyController);

    await expect(
      ctx.get<MyController>('controllers.MyController'),
    ).to.be.rejectedWith(/More than one bindings found for MyService/);
  });

  it('throws error if the parameter type cannot be inferred', async () => {
    class MyController {
      constructor(@instance() public myService: unknown) {}
    }

    ctx.bind('controllers.MyController').toClass(MyController);

    await expect(
      ctx.get<MyController>('controllers.MyController'),
    ).to.be.rejectedWith(
      /Service class cannot be inferred from design type. Use @instance\(ServiceClass\)/,
    );
  });

  it('throws error if the property type cannot be inferred', async () => {
    class MyController {
      @instance() public myService: string[];
    }

    ctx.bind('controllers.MyController').toClass(MyController);

    await expect(
      ctx.get<MyController>('controllers.MyController'),
    ).to.be.rejectedWith(/Service class cannot be inferred from design type/);
  });

  class MyService {}

  class MySubService extends MyService {}

  function givenContextWithMyService() {
    ctx = new Context();
    ctx.bind('services.MyService').toClass(MyService);
  }
});
