/*
 * Copyright (C) 2026 Florian Rittmeier
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

'use strict';

let allowedGroups = new Set();

exports.loadSettings = (hookName, {settings}) => {
  const config = settings.ep_openid_connect_group_authorization || {};

  allowedGroups = new Set(
    Array.isArray(config.allowed_groups)
      ? config.allowed_groups.filter(
          (group) => typeof group === 'string' && group.length > 0
        )
      : []
  );
};

const isAllowed = (req) => {
  const groups = req.session?.ep_openid_connect?.userinfo?.groups;

  return Array.isArray(groups) &&
    groups.some((group) => allowedGroups.has(group));
};

exports.preAuthorize = (hookName, {req}) => {
  // OIDC-Endpunkte für Anmeldung und Callback freilassen.
  if (
    req.path === '/ep_openid_connect' ||
    req.path.startsWith('/ep_openid_connect/')
  ) {
    return;
  }

  // Noch keine Anmeldung: regulären Authentifizierungsablauf ermöglichen.
  const hasOidcIdentity =
    req.session?.ep_openid_connect?.userinfo != null;

  if (!hasOidcIdentity && !req.session?.user) return;

  // Bei bestehender Identität ohne passende Gruppe verweigern.
  if (!isAllowed(req)) return false;
};

exports.authorize = (hookName, {req}) => {
  if (!isAllowed(req)) return false;

  return 'create';
};
