// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/rest-explorer
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@loopback/core';
import {get, RestApplication, RestServerConfig} from '@loopback/rest';
import {
  Client,
  createRestAppClient,
  givenHttpServerConfig,
} from '@loopback/testlab';
import {initTracer} from 'jaeger-client';
import {Span} from 'opentracing';
import {TracingComponent} from '../..';
import {TracingBindings} from '../../keys';
import {LOOPBACK_TRACE_ID} from '../../types';

describe('Tracing (acceptance)', () => {
  let app: RestApplication;
  let request: Client;

  afterEach(async () => {
    if (app) await app.stop();
    (app as unknown) = undefined;
  });

  context('with default config', () => {
    beforeEach(async () => {
      app = givenRestApplication();
      app.controller(MyController);
      app.component(TracingComponent);
      await app.start();
      request = createRestAppClient(app);
    });

    it('extracts existing traceId', async () => {
      const tracer = initTracer({serviceName: 'client'}, {
        contextKey: LOOPBACK_TRACE_ID,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      const span = tracer.startSpan('ping');
      const spanStr = span.context().toString();
      await request
        .get('/ping')
        .set(LOOPBACK_TRACE_ID, spanStr)
        .expect(200, `Hello, world: ${spanStr.split(':')[0]}`);
    });

    it('starts a new traceId', async () => {
      await request
        .get('/ping')
        .expect(200)
        .expect(200, /Hello, world\: [\da-f]+/);
    });
  });

  function givenRestApplication(config?: RestServerConfig) {
    const rest = Object.assign({}, givenHttpServerConfig(), config);
    return new RestApplication({rest});
  }

  class MyController {
    @get('/ping')
    ping(@inject(TracingBindings.SPAN) span: Span) {
      const traceId = span
        .context()
        .toString()
        .split(':')[0];
      return 'Hello, world: ' + traceId;
    }
  }
});
