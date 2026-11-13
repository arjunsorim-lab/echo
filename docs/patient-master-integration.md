# Future OPD / patient-master boundary

Keep the internal integer patient key and the manually entered clinic Patient ID separate. Visits, scans, media and report history reference the internal key; an external system must not rewrite those relationships or bypass protected identity fields.

A future connector should maintain a separate mapping with source-system name, external patient identifier, internal patient key, source version and synchronization timestamp. Require uniqueness per source-system/external identifier. Do not match or merge patients by name or phone alone. Ambiguous matches need an authorized reconciliation step with a recorded reason. Imported contacts can be proposed for review; completed report content and historical demographics remain attributable to the original report version.

The connector must use authenticated service credentials and the same validation/authorization services as interactive requests. Require idempotency identifiers for patient/visit creation, explicit conflict handling, audit events and retryable delivery. An inbound source must never set auditor/completer identities or modify completed clinical reports.

Implementation requires the OPD vendor/API, identifier ownership, data dictionary, consent/access model, synchronization direction and conflict-resolution policy. No external connector is enabled now.
