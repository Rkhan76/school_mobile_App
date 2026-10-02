# Mobile implementation status

Tracks which modules from `verdant_backend/MOBILE_API_DOCS.md` are wired to real API calls in this app (vs. still mock data). This file lives in the mobile repo — `MOBILE_API_DOCS.md` itself is in the backend repo and isn't edited from here.

- [x] 0. Conventions — N/A (infra, not a screen)
- [x] 1. Auth — login/refresh/logout, silent bootstrap, token storage
- [x] 2. Admissions — list (infinite scroll), stats, detail, create/edit (multipart + image uploads), approve/bulk-approve/reject/cancel/delete
- [x] 3. Students — list (infinite scroll), stats, detail (personal/guardians/bank/hostel/enrollment history), status toggle, block. Attendance/Fees/Documents/Reports tabs left on mock (other modules, out of scope)
- [x] 4. Teachers — list/create/status/block, profile/detail screen (personal/bank/employment-history), edit. Timetable/Attendance/Payroll/Reports tabs on detail screen left as "not available yet" (no backend endpoint in scope)
- [x] 5. Non-teaching staff — list/create/status/block
- [x] 6. Subjects (academic module) — list (unpaginated, client-side filter), create/edit/delete, section assignment sync
- [x] 7. Examinations — exam types, schedules CRUD, results entry (bulk) + publish/lock
- [x] 8. Syllabus — plans (full-replace), copy-to-sections, exam syllabus links. "Mark as reviewed" is local-only client state (no server completion-tracking exists)
- [x] 9. Attendance (student) — roster mark/bulk-mark, history, same-day correction (reason required). Staff attendance left on mock (separate, undocumented backend module)
- [x] 10. Timetable — weekly grid (single-slot create/edit/delete), periods, "My schedule" (self). Substitutions + periods-management: API functions exist but no UI built yet (no prior mock UI existed for them)
- [ ] 11. Common lookup APIs — partially done (`src/features/common/api.ts`: classes-master, academic-years-master, guardians-lookup); other lookups (subjects, teachers, periods, exam-types) are implemented inline per-module rather than shared.
- [x] 12. Members / portal accounts — list (infinite scroll), resend-invite/reset-password (+ plaintext fallback)/block, role assignment. No create UI (no backend endpoint — accounts come from Student/Teacher/Staff modules)
- [x] 13. Roles & Permissions — permission catalog, roles CRUD (default ADMIN role permission-locked), assign-role-to-user
- [~] 14. Reports — all 8 domains + admin-dashboard + binary export (xlsx/pdf via share sheet) + plan-gating upgrade prompt. Known gap: class/section/academic-year filter pickers still use placeholder display strings, not real UUIDs (needs follow-up wiring to common lookups)
- [x] 15. School Documents — both halves done: org-docs (categories read-only, no CUD endpoint documented; upload/versions/classified visibility), and Documents (types, requests incl. bulk-by-class/section for students only, review queue, expiring, checklist)
- [x] 16. Notice Board — list (infinite scroll, pinned-first), create/edit/delete, PDF download+share
- [x] 17. Events — CRUD (month-bounded fetch, not infinite scroll — calendar UI), media upload (direct-to-Cloudinary two-step), PDF export
- [x] 18. Chat / Messages — groups + messages (REST), realtime via Socket.IO, member picker, oversight mode
- [x] 19. Audit Logs — list (infinite scroll), filters, detail diff view. Missing-permission (403) handled with a dedicated message
- [x] 20. Certificates — issue/list (infinite scroll)/revoke, HTML-export+share (no backend PDF generation exists). Driver recipient picker falls back to a manual uuid field (no driver lookup endpoint documented)
- [x] 21. Ledger — read-only list + summary (infinite scroll), no add/edit/delete UI (none exists server-side)
- [x] 22. Cashbook — create/read/delete (no edit — none exists server-side), independent per-tab plan-gating from Ledger
- [~] 23. Master data CRUD — Academic Years (set-active routed correctly, never raw PATCH), Leave Types, Fee Categories, Exam Types, Periods all wired. Document Categories read-only (no CUD endpoint documented)
- [x] 24. Leave requests — new standalone screen (list, infinite scroll, status/role/date filters, approve/reject with separation-of-duties guard), linked from More → HR
