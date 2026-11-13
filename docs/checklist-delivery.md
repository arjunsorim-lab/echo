# Checklist delivery and remaining dependencies

This is a software implementation record, not clinical approval. “Implemented” describes the available code path; test results and failures are recorded separately. No clinical formula, threshold or device protocol is assumed.

| ID | Requirement | Delivery state | Evidence or exact remaining dependency |
| --- | --- | --- | --- |
| 1 | Ultrasound category and dashboard counts | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 2 | Keep future OPD/patient-master integration in architecture | Implemented | Architecture documented in patient-master-integration.md; implementing an OPD connector is future scope. |
| 3 | Patient ID must be manually entered | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 4 | Duplicate Patient ID validation | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 5 | Enforce registration mandatory fields | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 6 | DOB / Age either-or validation | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 7 | Default country/state lists | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 8 | Clean mandatory indicators | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 9 | Rename Family Doctor to Referral Doctor/Institute | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 10 | Support referral lookup, add-new and Self | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 11 | Lock core identity fields after first save | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 12 | Retain editable address and phone details | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 13 | Remove repeated scan selection while retaining visit referrals | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 14 | Prefill current referral doctor and allow visit-level change | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 15 | Use explicit Save & Go to Reporting | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 16 | Route the current visit to its selected report | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 17 | Remove redundant scan-type selector on next page | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 18 | Verify existing visit history navigation | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 19 | Machine-sourced scan fields must be read-only | Blocked — device specification | No scanner is selected and no vendor payload/mapping exists. Read-only machine fields cannot be identified or tested without the manufacturer/model, protocol and representative exports. |
| 20 | Generate a standard title from scan type | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 21 | Patient details auto-populate final report | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 22 | Add common indication choices + free text | Implemented | Fetal indication suggestions and free text are implemented; clinical approval of vocabulary remains external. |
| 23 | Define field-specific date and value validation | Implemented baseline; clinical rules blocked | Date, numeric, required-field and progression checks exist. Exhaustive physiological limits need an approved per-field specification with units and boundaries. |
| 24 | Persist report lifecycle and show status on visit list | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 25 | Block next-page navigation until page is saved/valid | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 26 | Confirm Next/Back step design and save behaviour | Implemented | Next/Back and save-before-progression are implemented and browser-tested. |
| 27 | Apply report hierarchy and clinical grouping | Implemented layout; clinical sign-off blocked | The software has a section order. Calling it the agreed final clinical order requires clinician-approved annotated templates. |
| 28 | Replace generic deletion task with explicit removals | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 29 | LMP / EDD / Embryo Transfer Date either-or rule | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 30 | Auto-calculate gestational age | Blocked — dating method | LMP, EDD and transfer-date entry and validation exist. Automatic dating requires the agreed reference date, transfer embryo age, rounding and conflicting-date precedence. No method has been approved. |
| 31 | Number of fetuses mandatory | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 32 | Verify per-variable comments capability | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 33 | Clarify clinical optionality without blanket required fields | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 34 | Remove IoT section/page | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 35 | Avoid repeating gestational age in biometry output | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 36 | Integrate approved per-measurement Z-score calculations | Framework only; formulas blocked | An approved-rule arithmetic framework exists. No Z-score reference dataset, population, gestational/age adjustment, formula or independent expected cases has been supplied. |
| 37 | Flag Z-scores outside the discussed threshold | Blocked — thresholds | Automatic abnormal flags require the approved Z-score method and thresholds; choosing a generic cutoff would introduce an unapproved clinical rule. |
| 38 | Rework Doppler fields, grouping and valve section | Blocked — final field specification | Existing Doppler controls are usable. Final grouping, valve fields, units and removals require the clinician screenshot/field list. |
| 39 | Add lower/upper range support | Blocked — clinical ranges | No per-measurement reference population, units or lower/upper boundaries are approved. The app does not invent physiological reference intervals. |
| 40 | Calculate read-only derived measurements and recalculate on input change | Framework done; clinical activation blocked | Versioned arithmetic and synthetic tests exist. Clinical calculations need approved formulas, source references, units and independently calculated boundary cases. |
| 41 | Keep optional imaging-quality/additional comments in printed report | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 42 | Keep primary/secondary consultants without duplicate signature fields | Implemented | Primary/secondary consultant controls are implemented; final signature styling remains clinician acceptance. |
| 43 | Retain entered-by and whole-report reviewer identity | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 44 | Enforce cumulative L1/L2/L3 permissions | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 45 | Separate 'Auditing Done' and 'Report Completed' | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 46 | Lock the completed report | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 47 | Clarify technical field-change logging separately from clinical audit | Implemented | Field-level history and correction reasons are implemented separately from clinical audit. |
| 48 | Remove image width/height/row metadata from clinical report page | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 49 | Define clinical image selection, export, print and sharing | Implemented | Visit-selected report images, ZIP export, PDF print preview and native browser sharing are implemented. Browser sharing depends on platform support; downloaded files remain available. |
| 50 | Support multi-frame image handling | Video playback done; DICOM blocked | MP4/WebM clips can be reviewed. DICOM multi-frame decoding, timing, transfer syntaxes and frame review require representative device exports and V1 scope. |
| 51 | Discover scanner ingestion feasibility before implementation commitment | Blocked — external device | Scanner/PACS integration needs the chosen device, vendor protocol/documentation, network access, credentials/AE titles and representative files. No target is selected. |
| 52 | Replicate validated fetal reporting framework for Adult Echo | Shared software workflow done; clinical template blocked | Adult saving, navigation, audit, completion and print are implemented. Final adult fields, formulas and layout need separate clinician approval. |
| 53 | Replicate validated framework for Pediatric Echo | Shared software workflow done; clinical template blocked | Paediatric saving, navigation, audit, completion and print are implemented. Paediatric age/size ranges, formulas and layout need separate clinician approval. |
| 54 | Add Ultrasound category and include its counts | Implemented | Implemented in the current application; clinical acceptance is separate from software testing. |
| 55 | Build detailed Ultrasound template later | Blocked — template not supplied | Ultrasound navigation/category/counts exist. Abdominal/other report fields and workflow cannot be derived from the word Ultrasound; provide approved templates. |
| 56 | Run the full new-patient workflow | Implemented | Browser regression covers new-patient registration, report saving, preview, audit, completion and reload. |
| 57 | Run existing-patient and new-visit workflow | Implemented | Browser regression covers existing-patient new visits, visit-specific referrals and duplicate prevention. |
| 58 | Run acceptance regression for agreed rules | Implemented-rule testing; full clinical acceptance blocked | Software regression tests cover specified workflows. Every clinical required/optional rule and boundary cannot be validated before those rules are supplied. |
| 59 | Produce complete fetal sample report with dummy data | Implemented | Synthetic fetal preview and print tests exist. This is a software sample, not clinician validation. |
| 60 | Create configuration checklist per section | Implemented | Both section configuration worksheets exist. Clinicians must supply clinical ranges, formulas and approval records. |

## Verification scope

The browser fixture uses disposable synthetic patients and a separate database. Workflow tests cover new patients, existing-patient new visits, referrals, navigation, save failures, roles, audit, completion, locks, history and correction. PDF tests exercise A4 output and multi-page synthetic reports. This does not verify a physical printer, every operating-system share target, clinical diagnostic accuracy or a scanner connection.

The image-delivery test verifies persisted visit selections, bounded ZIP export, cross-patient rejection, print readiness and selected images in the clinical report preview. The exported originals remain distinct from annotations. Exporting a ZIP does not anonymize its contents. Sharing is an explicit user action through the browser/operating-system dialog; platforms that do not support file sharing can use the downloaded ZIP.

Regenerate the field-level worksheet with `node frontend/scripts/export-field-checklist.mjs`. It inventories 524 stored template fields. Its order is the stored template order, not a claimed approved clinical sequence. The empty clinical approval/range/formula columns are intentional dependencies.

Regenerate the complete synthetic fetal HTML sample with `npm run build && npm test` from `frontend`; the result is `frontend/test-output/fetal-sample.html`. It omits Z-score calculations and contains explicit dummy labels. The preview is for software layout review, not clinical sign-off.

## Delivery test record — 13 November 2026

- Backend: 24 integration/unit tests passed, including authenticated ZIP content round-trip, invalid/duplicate IDs, unauthenticated export and archived-media rejection.
- Frontend: eight unit tests plus the complete synthetic fetal preview assertions passed.
- A broad browser run passed 31 cases and exposed three report-loading/preview failures; three later print cases were skipped after a serial failure. Those results were not represented as an all-pass run.
- After correcting the saved-report loading gate, all nine targeted browser cases passed: selected-image persistence/export/print/report inclusion; A4 reports for all three echo types; long-report pagination for all three; new-patient fetal audit/completion; and L1/L2/L3 approval/locking.
- The route smoke test now checks rendered content instead of waiting for indefinite global network idleness. Browser interaction timeout allows 30 seconds for the local fixture; clinical save timeout remains independently bounded at 30 seconds.
- The production build passed. Physical printer output and native operating-system sharing recipients are not automatically exercised; PDF generation and ZIP download are tested.
- All three delayed-network regression tests passed: fetal, adult and paediatric report controls stay unavailable until their saved content loads, then navigation works.
