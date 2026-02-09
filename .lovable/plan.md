

# Plan: Weekly Report Save/Draft, Admin Viewing, and Submission Notifications

## 1. Auto-Save / Draft Support for Weekly Report Form

**Problem:** The weekly report form has 25+ fields and no way to save progress. If a team member closes the browser or navigates away, they lose everything.

**Solution:** Add localStorage-based auto-save to `WeeklyReportForm.tsx`, keyed by the report token.

**Changes to `src/pages/WeeklyReportForm.tsx`:**
- On every field change, debounce-save all form state to `localStorage` using key `weekly-report-draft-{token}`
- On page load, check localStorage for existing draft and restore all fields
- Show a small "Draft saved" indicator (e.g., near the submit button) so users know progress is being preserved
- Clear localStorage on successful submission
- The draft auto-saves every time any field changes (debounced ~1 second)

This is a frontend-only change -- no database modifications needed.

---

## 2. Admin Access to Weekly Reports

**Current state:** Admins can already view reports at `/admin/weekly-reports` (the `AdminWeeklyReports` page lists all sessions and links to `/admin/weekly-report/:id` for the full detail view via `WeeklyReportDetail`). This is accessible from the admin dashboard.

No changes needed here -- the functionality already exists.

---

## 3. Admin Notifications When Reports Are Submitted

**Problem:** When a team member submits a weekly report, no notification is sent to admins.

**Solution:** After the report is successfully submitted in `WeeklyReportForm.tsx`, call a new (or updated) backend function to email both admins.

**Changes:**
- **Update `supabase/functions/send-weekly-report/index.ts`** (or create a new function `notify-weekly-report-submitted`) to accept a "report submitted" notification mode that emails both `nana@verigo54.com` and `admin@verigo54.com` with report details (operator name, week ending, link to view in admin dashboard)
- **Update `src/pages/WeeklyReportForm.tsx`** to call this notification function after successful submission
- The email will include the operator's name, week ending date, and a link for admins to view the full report

---

## 4. Update Application Notification to Include Both Admins

**Problem:** `send-application-notification` only emails `admin@verigo54.com`.

**Change:** Update the `to` field in `supabase/functions/send-application-notification/index.ts` from `["admin@verigo54.com"]` to `["admin@verigo54.com", "nana@verigo54.com"]`.

---

## Technical Summary

| Change | Type | File(s) |
|--------|------|---------|
| localStorage auto-save for weekly report form | Frontend | `src/pages/WeeklyReportForm.tsx` |
| Notify admins on report submission | New backend function + frontend call | `supabase/functions/notify-weekly-report-submitted/index.ts`, `src/pages/WeeklyReportForm.tsx` |
| Send application notifications to both admins | Backend function edit | `supabase/functions/send-application-notification/index.ts` |

