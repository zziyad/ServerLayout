CREATE TYPE helpdesk_ticket_status AS ENUM (
    'new',
    'open',
    'in_progress',
    'waiting_for_user',
    'resolved',
    'closed'
);

CREATE TYPE helpdesk_ticket_priority AS ENUM (
    'low',
    'normal',
    'high',
    'critical'
);

CREATE TYPE helpdesk_sla_adjustment_type AS ENUM (
    'extension',
    'pause',
    'override'
);

CREATE TYPE helpdesk_label_type AS ENUM (
    'system',
    'custom'
);

CREATE TABLE helpdesk_requester (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    department_id   UUID NOT NULL REFERENCES "Department"(id),

    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE helpdesk_sla_policy (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    department_id   UUID NOT NULL REFERENCES "Department"(id) ON DELETE CASCADE,

    name            VARCHAR(150),

    response_time_sec       INTEGER,
    resolution_time_sec     INTEGER,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE helpdesk_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    department_id   UUID NOT NULL REFERENCES "Department"(id) ON DELETE CASCADE,

    name            VARCHAR(150) NOT NULL,
    description     TEXT,

    sla_policy_id   UUID REFERENCES helpdesk_sla_policy(id),

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 🔥 ВАЖНО
    UNIQUE (id, department_id)
);
CREATE TABLE helpdesk_ticket (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    ticket_number   BIGSERIAL UNIQUE,

    requester_id    UUID REFERENCES helpdesk_requester(id),
    assignee_id     UUID REFERENCES "User"(id),

    department_id   UUID NOT NULL REFERENCES "Department"(id),
    queue_id        UUID NOT NULL,

    status          helpdesk_ticket_status NOT NULL,
    priority        helpdesk_ticket_priority,

    description     TEXT NOT NULL,

    is_escalated    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    resolved_at     TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ
);

CREATE TABLE helpdesk_label (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    department_id   UUID NOT NULL REFERENCES "Department"(id) ON DELETE CASCADE,

    name            VARCHAR(150) NOT NULL,
    type            helpdesk_label_type NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE helpdesk_ticket_label (
    ticket_id   UUID REFERENCES helpdesk_ticket(id) ON DELETE CASCADE,
    label_id    UUID REFERENCES helpdesk_label(id) ON DELETE CASCADE,

    PRIMARY KEY (ticket_id, label_id)
);

CREATE TABLE helpdesk_ticket_sla (
    ticket_id              UUID PRIMARY KEY REFERENCES helpdesk_ticket(id) ON DELETE CASCADE,

    sla_policy_id          UUID REFERENCES helpdesk_sla_policy(id),

    started_at             TIMESTAMPTZ,

    response_deadline      TIMESTAMPTZ,
    resolution_deadline    TIMESTAMPTZ,

    breached_at            TIMESTAMPTZ,

    is_paused              BOOLEAN NOT NULL DEFAULT FALSE,
    paused_at              TIMESTAMPTZ,

    total_pause_sec        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE helpdesk_sla_adjustment (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES helpdesk_ticket(id) ON DELETE CASCADE,

    type        helpdesk_sla_adjustment_type NOT NULL,
    delta_sec   INTEGER,

    reason      TEXT NOT NULL,

    created_by  UUID REFERENCES "User"(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE helpdesk_priority_adjustment (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES helpdesk_ticket(id) ON DELETE CASCADE,

    old_priority    helpdesk_ticket_priority,
    new_priority    helpdesk_ticket_priority NOT NULL,

    reason          TEXT NOT NULL,

    changed_by      UUID REFERENCES "User"(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE helpdesk_ticket_event (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES helpdesk_ticket(id) ON DELETE CASCADE,

    actor_id    UUID REFERENCES "User"(id),

    type        VARCHAR(50) NOT NULL,
    payload     JSONB,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE helpdesk_ticket_policy (
    department_id   UUID PRIMARY KEY REFERENCES "Department"(id) ON DELETE CASCADE,

    auto_close_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    auto_close_timeout_sec  INTEGER,

    reopen_window_sec       INTEGER,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE helpdesk_escalation_policy (
    department_id   UUID PRIMARY KEY REFERENCES "Department"(id) ON DELETE CASCADE,

    notify_assignee     BOOLEAN NOT NULL DEFAULT TRUE,
    notify_manager      BOOLEAN NOT NULL DEFAULT TRUE,

    priority_bump       BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_helpdesk_ticket_updated
BEFORE UPDATE ON helpdesk_ticket
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_helpdesk_queue_updated
BEFORE UPDATE ON helpdesk_queue
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_helpdesk_ticket_policy_updated
BEFORE UPDATE ON helpdesk_ticket_policy
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_helpdesk_escalation_policy_updated
BEFORE UPDATE ON helpdesk_escalation_policy
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_helpdesk_ticket_queue_status
ON helpdesk_ticket(queue_id, status);

CREATE INDEX idx_helpdesk_ticket_assignee_status
ON helpdesk_ticket(assignee_id, status);

CREATE INDEX idx_helpdesk_sla_deadline
ON helpdesk_ticket_sla(resolution_deadline, is_paused);

CREATE INDEX idx_helpdesk_ticket_number
ON helpdesk_ticket(ticket_number);

