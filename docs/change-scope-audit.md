# Scope audit following the request to undo unrequested changes

Reviewed 13 November 2026. This audit distinguishes current checkout changes from earlier implementations already superseded during the main-branch merge. It does not reset a whole historical commit: the initial checkout already contained substantial uncommitted user work, including Profile, Analytics, Measurements, patient and referral UI changes. Those pre-existing edits are not treated as changes introduced by this chat.

| Change introduced in this chat | Relationship to the request | Action/current result |
| --- | --- | --- |
| Generate a replacement founder password and require a new local administrator login | Not requested | Reverted. Original local founder credentials and development autofill restored in e88cf47. Startup preserves existing configured accounts. |
| Remove founder-access and Google sign-in controls while replacing demo authentication | Not requested | Earlier removal was superseded by the merge. Current Home.jsx retains both controls. No claim is made that Google integration is configured. |
| Add a separate /accounts page and access_control.py session implementation | Role management was requested, but a second competing implementation is unnecessary | Earlier version already excluded from the main merge. Current app uses existing workflow user management and session_store.py. |
| Add report_workflow.py and a second ReportWorkflow UI panel | Approval/history were requested; parallel implementations were unnecessary | Earlier version already excluded from the main merge. Current app uses clinical_workflow.py and ClinicalWorkflow.jsx. |
| Prohibit deletion of every report, including drafts | Checklist protected completed reports; blanket prohibition went further | Earlier blanket ban was superseded. Current delete_scan allows authorized draft deletion and blocks completed-report deletion. |
| Require an X-Echo-Request header on every API mutation | Implementation-specific extra restriction | Earlier version already superseded. Current application does not require this custom header. |
| Temporarily move local servers to ports 3001/8003 | Avoided an already running copy, then user explicitly requested original ports | Already restored to 3000/8002. No further port changes. |
| Increase the global Playwright interaction timeout from 15 to 30 seconds | Extra test-environment adjustment | Reverted to the original 15-second setting. Application save timeout is unchanged. |
| Generated initial-login-file instructions | Result of the unrequested password change | Not used by the current app. Runbook now describes the restored original local login. |
| Role-based authentication and server-side permissions | Explicit checklist requirement | Retained. Password verification remains server-side; credentials are not replaced to achieve it. |
| Report audit, completion, correction, completed-report locks and field history | Explicit checklist requirements | Retained using the newer main implementation. |
| Manual patient IDs, duplicate/mandatory validation, identity locks, editable contacts and visit routing | Explicit checklist requirements | Retained. |
| Ultrasound placeholder/counts and future OPD architecture boundary | Explicit checklist requirements | Retained. |
| Image selection, persisted report inclusion, ZIP export, print and user-initiated native sharing | Explicit checklist requirements | Retained. Sharing does not send files automatically. |
| Saved-report loading gate and save/navigation failure tests | Supports the requested data-preservation, navigation and full-flow validation requirements | Retained. |
| Section/field checklist and dummy fetal sample | Explicit checklist requirements | Retained. No clinical ranges, equations or thresholds were invented. |
| Exclude credentials, patient databases, uploads and build output from commits | Necessary to publish code without publishing local clinical data/secrets | Retained. Local database and patient files are not reverted or deleted. |

This audit does not undo unrelated changes inherited from the newer main branch. Generated test fixtures remain isolated from the local patient database. It does not reset other users' passwords or remove patient records.

The complete 28-page review is in [page-scope-audit.md](page-scope-audit.md), including the five attributable page deltas and unchanged shared navigation/style surfaces.
