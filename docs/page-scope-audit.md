# Page-by-page scope audit

Reviewed 13 November 2026. Compared current committed content against `c2ca04f`, the resolved main/feature merge whose tree preserved newer main implementations. All 28 files directly under `frontend/src/pages` were checked. There are six changed pages and 22 unchanged pages. Visits.jsx was subsequently changed in response to the explicit request to remove the empty space beside Visits.

This baseline is explicit: it does not assert that the application was unchanged since the start of the conversation. The initial checkout already contained substantial uncommitted edits, and the merge subsequently retained newer main work. Those edits cannot safely be treated as unauthorized work introduced by this chat. The earlier competing implementations and their removal are documented in [change-scope-audit.md](change-scope-audit.md).

| Page | Result | What remains / what was checked | Instruction mapping |
| --- | --- | --- | --- |
| [AIAssistant.jsx](../frontend/src/pages/AIAssistant.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Administration.jsx](../frontend/src/pages/Administration.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [AdultEchoReport.jsx](../frontend/src/pages/AdultEchoReport.jsx) | Keep — supports requested report validation | Saved report content must load before editing/navigation controls appear; no clinical fields, styling, formulas or template order changed in this delta. | Block next-page navigation until saved/valid; validate errors; full patient/report flow |
| [Analytics.jsx](../frontend/src/pages/Analytics.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [CRM.jsx](../frontend/src/pages/CRM.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [ClinicalWorkspace.jsx](../frontend/src/pages/ClinicalWorkspace.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Dashboard.jsx](../frontend/src/pages/Dashboard.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [EchoScan.jsx](../frontend/src/pages/EchoScan.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [EchoStudies.jsx](../frontend/src/pages/EchoStudies.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [EditPatient.jsx](../frontend/src/pages/EditPatient.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [EditReferralDoctor.jsx](../frontend/src/pages/EditReferralDoctor.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [FetalEchoReport.jsx](../frontend/src/pages/FetalEchoReport.jsx) | Keep — supports requested report validation | Saved report content must load before editing/navigation controls appear; no clinical fields, styling, formulas or template order changed in this delta. | Block next-page navigation until saved/valid; validate errors; full patient/report flow |
| [Home.jsx](../frontend/src/pages/Home.jsx) | Restore original credential behavior | Original local founder password autofill restored. No other Home changes survive relative to the merged baseline. | Undo unrequested password change |
| [ImagesViewer.jsx](../frontend/src/pages/ImagesViewer.jsx) | Keep — explicit checklist feature | Select up to the existing layout capacity of 16 images; clear selection when visit changes; attach to report, print/PDF, ZIP export and user-initiated share. | Design image selection/export/print/share workflow |
| [Landing.jsx](../frontend/src/pages/Landing.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Measurements.jsx](../frontend/src/pages/Measurements.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [NewPatient.jsx](../frontend/src/pages/NewPatient.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [NewReferralDoctor.jsx](../frontend/src/pages/NewReferralDoctor.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [PatientRecords.jsx](../frontend/src/pages/PatientRecords.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Patients.jsx](../frontend/src/pages/Patients.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [PediatricEchoReport.jsx](../frontend/src/pages/PediatricEchoReport.jsx) | Keep — supports requested report validation | Saved report content must load before editing/navigation controls appear; no clinical fields, styling, formulas or template order changed in this delta. | Block next-page navigation until saved/valid; validate errors; full patient/report flow |
| [Profile.jsx](../frontend/src/pages/Profile.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [ReferralDoctors.jsx](../frontend/src/pages/ReferralDoctors.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Reports.jsx](../frontend/src/pages/Reports.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Search.jsx](../frontend/src/pages/Search.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [SearchQuery.jsx](../frontend/src/pages/SearchQuery.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Settings.jsx](../frontend/src/pages/Settings.jsx) | Unchanged — preserve | File content is identical to the merged baseline. | No change to undo in this delta |
| [Visits.jsx](../frontend/src/pages/Visits.jsx) | Keep — explicit subsequent layout request | Removed the empty 320px sidebar grid track so Visits fills the available width. | User screenshot and request to remove unnecessary space beside Visits |

## Shared page surfaces

- `App.jsx`, `Layout.jsx`, `Sidebar.jsx`, `style.css`, API modules and Vite configuration are unchanged relative to the merged baseline. No new navigation redesign, page restyling, global stylesheet change or port change survives in the current delta.
- `ClinicalWorkflow.jsx` adds only selected report-image rendering and print readiness. This implements the requested image/report/print flow.
- `ReportImages.jsx` loads the saved visit selection and prevents printing a report with missing selected images. It does not introduce clinical calculations or change report text.
- `SelectedMediaActions.jsx` implements explicit selection attachment, ZIP export, print and user-triggered sharing. It does not send files automatically. Its selection capacity matches the existing 16-slot layout validation. Changing visits clears prepared exports to avoid sharing the wrong visit selection.
- The Founder Access card and Google sign-in control remain present. The obsolete `/accounts` page, `access_control.py`, `report_workflow.py` and duplicate `ReportWorkflow.jsx` panel are absent from the current tree.

## Rollback result

The unrequested credential replacement was restored in `e88cf47`; the extra global browser-test timeout was restored in `5291a4a`. Current tests retain the original 15-second interaction setting. No further page-code rollback was justified by the attributable delta above. Requested features, local patient records and unrelated main-branch edits were preserved.

This audit makes no production-deployment claim. The restored local founder login was verified separately; production account storage is not modified by this audit.
