/*
 * Copyright (C) 2026 Florian Rittmeier
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const plugin = require('../index.js');

const configure = (groups) => {
  plugin.loadSettings('loadSettings', {
    settings: {
      ep_openid_connect_group_authorization: {
        allowed_groups: groups,
      },
    },
  });
};

const request = (groups, path = '/p/example') => ({
  path,
  session: {
    user: {},
    ep_openid_connect: {
      userinfo: {groups},
    },
  },
});

test('authorizes a user with a matching group', () => {
  configure(['editors']);
  const req = request(['editors']);
  assert.equal(plugin.preAuthorize('preAuthorize', {req}), undefined);
  assert.equal(plugin.authorize('authorize', {req}), 'create');
});

test('authorizes users with multiple groups if one matches', () => {
  configure(['editors']);
  const req = request(['project-team', 'editors']);
  assert.equal(plugin.authorize('authorize', {req}), 'create');
});

test('denies users without a matching group', () => {
  configure(['editors']);
  const req = request(['project-team']);
  assert.equal(plugin.preAuthorize('preAuthorize', {req}), false);
  assert.equal(plugin.authorize('authorize', {req}), false);
});

test('denies access when groups are missing', () => {
  configure(['editors']);
  const req = request(undefined);
  assert.equal(plugin.preAuthorize('preAuthorize', {req}), false);
  assert.equal(plugin.authorize('authorize', {req}), false);
});

test('denies access when no allowed groups are configured', () => {
  configure([]);
  const req = request(['editors']);
  assert.equal(plugin.authorize('authorize', {req}), false);
});

test('allows unauthenticated requests to continue to OIDC login', () => {
  configure(['editors']);
  const req = {path: '/p/example', session: {}};
  assert.equal(plugin.preAuthorize('preAuthorize', {req}), undefined);
});

test('does not block OIDC callback endpoints', () => {
  configure(['editors']);
  const req = request(['project-team'], '/ep_openid_connect/callback');
  assert.equal(plugin.preAuthorize('preAuthorize', {req}), undefined);
});

test('matches group names case-sensitively', () => {
  configure(['editors']);
  const req = request(['Editors']);
  assert.equal(plugin.authorize('authorize', {req}), false);
});
