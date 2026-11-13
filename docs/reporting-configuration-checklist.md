# Reporting configuration checklist

Use this checklist to configure each section. A checked item means the application behavior has been implemented; it does not indicate clinical sign-off. Mandatory clinical fields and reference ranges remain clinician-configured.

## Shared workflow

- [x] Report title is generated from scan type and patient name.
- [x] Patient and visit are linked to each report.
- [x] Report data is saved and loaded as structured data.
- [x] Draft, In Progress, and Completed states are supported.
- [x] Next navigation saves and validates before advancing; Back is available.
- [x] Completed reports/scans reject edits through the API.
- [x] Field-level changes are recorded for clinical workspace reports.
- [ ] Configure authenticated role permissions on the server.
- [ ] Confirm which report roles can edit, audit, complete, reopen, and print.
- [ ] Provide a clinic-approved fetal and pediatric Z-score model name, equations, units, and normal limits before enabling calculated scores.

## New patient and visit

- [x] Patient ID is manually entered and unique.
- [x] Patient ID, name, gender, DOB, and age are locked after creation.
- [x] Address, phone, mobile, email, referral doctor, and institute remain editable.
- [x] DOB or age is required; future DOBs and negative ages are rejected.
- [x] Save & Go to Reporting creates a visit when needed and opens the selected scan type.
- [ ] Run the browser-based new-patient workflow against a disposable database.
- [ ] Confirm the final mandatory-field matrix and error copy with the clinic.

## Fetal Echo

- [x] LMP, EDD, and embryo-transfer date fields use a single dating source.
- [x] Gestational age and EDD are calculated from LMP; GA display is no longer duplicated in the entry header.
- [x] Number of fetuses is required before saving.
- [x] Every listed measurement has a comment field; numeric measurements support lower and upper ranges.
- [x] Z-scores and configurable lower/upper limits can be entered; values outside those limits are highlighted.
- [x] Auditing Done and Report Completed are separate fields.
- [x] Operator and auditor fields are available.
- [ ] Select a validated gestational-age convention for embryo-transfer dating.
- [ ] Add a validated fetal Z-score reference model and clinically approved normal ranges.
- [ ] Review fetal section order and required fields with the clinical owner.
- [x] Import DICOM files or query/retrieve studies through DICOMweb; store them by patient and visit; preview multi-frame images and include selected images in print/PDF output.
- [ ] Configure and validate the clinic PACS URL and authentication before connecting DICOMweb.
- [ ] Validate machine-specific transfer syntaxes and device interoperability with the clinic's actual PACS/machines.
- [ ] Sign off a complete clinical template using the dummy sample report.

## Adult Echo

- [x] Existing Adult Echo sections and derived measurements remain available.
- [x] Measurement comments and lower/upper ranges are available in the clinical workspace.
- [x] Auditing Done and Report Completed are separate fields.
- [x] Operator and auditor fields are available.
- [ ] Confirm section parity against the validated fetal framework.
- [ ] Approve required fields, Doppler grouping, valve fields, and derived measurement formulas.
- [ ] Confirm machine-sourced fields and image integration with the device vendor.

## Pediatric Echo

- [x] Existing Pediatric Echo sections and derived measurements remain available.
- [x] Measurement comments and lower/upper ranges are available in the clinical workspace.
- [x] Z-score entry and abnormal highlighting are available.
- [x] Auditing Done and Report Completed are separate fields.
- [x] Operator and auditor fields are available.
- [ ] Confirm section parity against the validated fetal framework.
- [ ] Approve required fields, Doppler grouping, valve fields, and derived measurement formulas.
- [ ] Add a validated pediatric Z-score reference model and normal ranges.

## Ultrasound

- [x] Dashboard counts include Ultrasound.
- [x] Ultrasound reporting placeholder/category is available.
- [ ] Define and build the detailed Ultrasound template later.

## Validation and release

- [x] Backend API smoke checks cover manual/duplicate ID, editable phone, locked identity, visit-linked reports, report history, and completion locks.
- [x] Frontend production build passes.
- [x] Isolated DICOM test covers a two-frame file upload, patient/visit association, frame PNG preview, and rejection of an invalid visit.
- [ ] Run full new-patient and existing-patient/new-visit browser flows on a disposable database.
- [ ] Validate every mandatory/optional rule and visible error message.
- [ ] Validate print output for the final approved fetal, adult, pediatric, and ultrasound templates.
- [ ] Confirm future OPD/patient-master integration contract with the integration owner.
