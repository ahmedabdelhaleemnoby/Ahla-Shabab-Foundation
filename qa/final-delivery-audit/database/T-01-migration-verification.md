# T-01 evidence — Prisma baseline migration

Generated: prisma/migrations/0_init/migration.sql (741 lines)

## migrate deploy on CLEAN database
```
All migrations have been successfully applied.
Database schema is up to date!
```
## Verified counts
- tables: 39 (38 models + _prisma_migrations)
- foreign keys: 28
- indexes: 75

## Drift check
`prisma migrate diff --from-url <db> --to-schema-datamodel` → "This is an empty migration." (ZERO DRIFT)

## Table list
_prisma_migrations
activity_log
admin_users
articles
bookings
case_updates
cases
cms_media
cms_state
consultants
consultation_requests
contact_messages
device_tokens
donations
faqs
favorites
foundation_stats
foundation_values
governorates
initiatives
milestones
notification_preferences
notifications
otp_codes
portfolio_items
project_stages
project_updates
projects
provider_schedules
provider_unavailable_dates
providers
refresh_tokens
roles
service_categories
service_form_fields
services
users
volunteer_applications
work_areas
