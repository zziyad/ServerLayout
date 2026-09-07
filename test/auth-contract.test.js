'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { authorize, createRpcChain, runChain } = require('../src/rpc-pipeline.js');
const { ConsList } = require('../lib/cons-list.js');
const { buildCookieHeader } = require('../lib/cookies.js');

const root = path.join(__dirname, '..');

test('auth canon files exist', () => {
  for (const name of ['signin', 'register', 'signout', 'me', 'activity']) {
    const file = path.join(root, 'application/api/auth', `${name}.js`);
    assert.ok(fs.existsSync(file), file);
  }
});

test('signin schema requires email and password', async () => {
  const raw = fs.readFileSync(
    path.join(root, 'application/lib/schemas/auth/signinSchema.js'),
    'utf8',
  );
  const start = raw.indexOf('async ()');
  const factory = eval(`(${raw.slice(start).replace(/;+\s*$/, '')})`);
  const schema = await factory();
  assert.deepEqual(schema.required, ['email', 'password']);
  assert.equal(schema.additionalProperties, false);
});

test('cookie session_id header is HttpOnly', () => {
  const header = buildCookieHeader({
    name: 'session_id',
    value: 'abc',
    maxAgeSeconds: 60,
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  assert.match(header, /session_id=abc/);
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=None/);
});

test('authorize allows public without session', async () => {
  const ctx = {
    client: new EventEmitter(),
    packet: { id: '1', method: 'auth/signin' },
    proc: () => ({ access: 'public' }),
    server: { semaphore: { leave() {} } },
    halted: false,
  };
  let called = false;
  await runChain(
    ConsList.of(authorize, async () => {
      called = true;
    }),
    ctx,
  );
  assert.equal(called, true);
  assert.equal(ctx.halted, false);
});

test('authorize rejects private without session', async () => {
  const errors = [];
  const ctx = {
    client: Object.assign(new EventEmitter(), {
      session: null,
      clearSessionCookies() {},
      error(code, payload) {
        errors.push({ code, payload });
      },
    }),
    packet: { id: '1', method: 'user/list' },
    proc: () => ({ access: 'user.read' }),
    server: { semaphore: { leave() {} } },
    halted: false,
  };
  let called = false;
  await runChain(
    ConsList.of(authorize, async () => {
      called = true;
    }),
    ctx,
  );
  assert.equal(called, false);
  assert.equal(ctx.halted, true);
  assert.equal(errors[0].code, 401);
});

test('default rpc chain is restoreSession, authorize, invoke', () => {
  const chain = createRpcChain();
  assert.equal(chain.size, 3);
});
