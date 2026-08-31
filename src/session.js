'use strict';

const crypto = require('node:crypto');

class Session {
  constructor(sessionId, sessionData) {
    this.sessionId = sessionId; // Changed from 'token' to 'sessionId'
    this.state = sessionData; // Full canonical session data
  }

  // Helper getters for convenience (domain layer uses context.user for e.g. agent department in helpdesk triage)
  get user() {
    return {
      id: this.state.auth?.user_id,
      roles: this.state.auth?.roles || [],
      permissions: this.state.auth?.permissions || [],
      department_id:
        this.state.auth?.department_id ??
        this.state.auth?.department?.id ??
        null,
      department: this.state.auth?.department || null,
    };
  }

  get csrfToken() {
    return this.state.security?.csrf_token;
  }

  // Backward compatibility: keep 'token' property for now
  get token() {
    return this.sessionId;
  }
}

class Context {
  constructor(client) {
    this.client = client;
    this.uuid = crypto.randomUUID();
    this.state = {};
    this.eventBus = client?.eventBus ?? null;
    this.application = client?.application ?? null;
    this.notificationManager = client?.notificationManager ?? null;
  }
  get session() {
    return this.client.session;
  }
  /** Current user from session (id, roles, permissions, department_id, department). Used by e.g. helpdesk triage for agent's department. */
  get user() {
    return this.client?.session?.user ?? null;
  }
}


module.exports = { Session, Context };
