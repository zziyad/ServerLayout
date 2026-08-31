# Database boot

Empty Postgres, local:

```bash
psql -f application/db/install.sql
psql -d app -f application/db/auth_schema.sql
psql -d app -f application/db/rbac_seed.sql
psql -d app -f application/db/migrations/001_add_system_roles_super_admin_admin_guest.sql
psql -d app -f application/db/migrations/002_add_permission_management_permissions.sql
psql -d app -f application/db/migrations/003_add_department_and_department_role_permissions.sql
psql -d app -f application/db/migrations/013_user_import_activation.sql
psql -d app -f application/db/migrations/014_seed_core_permissions_and_user_role_api.sql
psql -d app -f application/db/migrations/025_notification_email_outbox.sql
psql -d app -f application/db/migrations/026_notification_email_settings.sql
psql -d app -f application/db/migrations/027_notification_email_delivery_controls.sql
```

`zi-schema.sql` — старый слепок, не boot.
