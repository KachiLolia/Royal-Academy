# Product Requirements Document: Royal Academy School Management System

**Version:** 1.0
**Prepared for:** Development on Google Antigravity IDE
**Scope:** Single school, single campus, 500–2000 students

---

## 1. Overview

Royal Academy needs a web-based system to run day-to-day school operations across five roles: super admin, school admin, teachers, students, and parents. It replaces manual or fragmented processes for attendance, grading, fee collection, timetabling, and communication with one system everyone logs into.

This is a single-tenant build. There is one school. "Super admin" is not a multi-school manager; it's the top-level account above school admin, used for system configuration, user role management, and anything a school admin shouldn't be able to touch (academic year setup, fee structure changes, system-wide announcements, audit logs).

Built for one school in the 500–2000 student range on one campus, not architected for multi-tenancy. If Royal Academy later wants to run this for other schools, that's a phase 2 conversation and it changes the database design, so don't build it in "just in case" now. Building speculative multi-tenancy support you don't need yet adds real complexity for no current benefit.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Backend | Node.js (Express or Next.js API routes / route handlers) |
| Database | PostgreSQL |
| Auth | Email/password + phone OTP for parents |
| Payments | Paystack or Flutterwave |
| File storage | S3-compatible bucket (for documents, profile photos, report card PDFs) |
| Hosting | TBD — confirm with team before build (Vercel for frontend + Railway/Render for backend+DB is a reasonable default) |

**Open question to resolve before build starts:** Express as a separate backend, or Next.js API routes/route handlers as the backend? This affects the whole project structure. If unsure, Next.js route handlers is the simpler path for a team already committed to Next.js on the frontend, but Express gives cleaner separation if the API might serve a mobile app later.

---

## 3. User Roles and Permissions

### 3.1 Super Admin
- Creates and manages school admin accounts
- Configures academic year, terms, grading scale, fee structure
- Full system access, including audit logs
- Can impersonate other roles for support/debugging (with logging)

### 3.2 School Admin
- Manages teacher, student, and parent accounts (create, edit, deactivate)
- Manages class/section structure and student enrollment
- Manages timetable
- Oversees fee records and payment status
- Sends school-wide or class-wide announcements
- Cannot change system-level config (academic year structure, grading scale definitions) — that's super admin territory

### 3.3 Teacher
- Marks attendance for assigned classes
- Enters CA scores and exam scores for assigned subjects
- Views and manages their own timetable
- Sends messages/announcements to their classes and individual parents
- Views student profiles for their own students only (not full school roster)

### 3.4 Student
- Views own attendance, grades, timetable, report card
- Receives announcements
- Views own fee payment status (read-only, no payment authority)

### 3.5 Parent
- Views their child/children's attendance, grades, timetable, report card
- Pays fees via Paystack/Flutterwave
- Receives announcements and messages from teachers/admin
- Can have multiple children linked to one parent account
- Logs in via phone number + OTP

**Open question:** Can a parent account have more than one child at different grade levels? (Almost certainly yes for a school this size — confirm and build the parent-to-student relationship as many-to-many from the start, since retrofitting this later is painful.)

---

## 4. Core Modules

### 4.1 Attendance
- Teachers mark attendance per class per day (present/absent/late)
- Admin can view attendance across all classes
- Parents/students see attendance history
- Flag for consecutive absences (configurable threshold, e.g., 3 days) that notifies admin

### 4.2 Grading and Exams (Nigerian curriculum standard)
- CA (Continuous Assessment) scores entered by subject teachers throughout the term
- Exam score entered at end of term
- System calculates term result: CA + Exam per configurable weighting (commonly 40/60 or 30/70 — confirm Royal Academy's actual split, don't assume)
- Report card generated per term, per student, showing subject-by-subject breakdown, term average, class position (optional), teacher comments, principal comments
- Report cards exportable as PDF

**Open question:** Does Royal Academy rank students by class position on the report card? Some schools have moved away from this. Confirm before building the ranking logic, since it affects the query design (computing rank requires comparing against the full class, not just the one student).

### 4.3 Timetable
- Admin builds timetable per class (subject, teacher, time slot, day)
- Teachers see their own schedule across all classes they teach
- Students/parents see their class schedule
- Conflict detection: a teacher can't be scheduled in two places at once

### 4.4 Fees
- Admin defines fee structure per term/class (tuition, other charges)
- Parents pay via Paystack or Flutterwave, itemized by fee type
- Payment history and receipts
- Admin dashboard showing paid/outstanding balances across the school
- Manual payment recording for cash/bank transfer payments made outside the system

### 4.5 Library
- Book catalog (title, author, ISBN, copies available)
- Issue/return tracking, linked to student
- Overdue tracking

**Open question:** Does the library module need to be student-facing (students browse and request books) or purely staff-run (librarian issues/returns manually at the desk)? This changes the scope significantly. A staff-run version is much smaller to build.

### 4.6 Transport
- Route management (route name, stops, assigned vehicle)
- Student-to-route assignment
- Parent visibility into their child's assigned route and stop

**Open question:** Is live tracking (GPS on buses) part of this, or just route assignment and static schedule info? Live tracking is a materially bigger build (device integration, real-time location, maps). If it's not explicitly needed for v1, scope it out and note it as phase 2 — flag this back to Royal Academy rather than assuming.

### 4.7 Announcements / Communication

Every announcement needs an audience, and that audience isn't always "everyone" or "one person." Usually it's a role-based group, sometimes scoped to a class, sometimes a combination (a PTA meeting notice goes to parents, teachers, and school admin, but not students).

**Audience model.** Instead of hardcoding fixed announcement "types," build the audience as two filters combined:

- **Roles included**: any mix of parent, teacher, student, school_admin (super admin sends announcements, doesn't need to receive them)
- **Scope**: whole school, or specific class(es)/section(s)

This covers every case without special-casing each one:
- Public holiday or school event → roles: all, scope: whole school
- PTA meeting → roles: parent, teacher, school_admin, scope: whole school
- Note to JSS2 parents about a field trip → roles: parent, scope: JSS2
- Message to one specific parent about their child → not a broadcast at all, see "direct messages" below

**Quick-select presets in the UI**, so admin isn't building a filter from scratch every time: All Users, All Parents, All Teachers, All Staff (teachers + school admin), Specific Class/Section, Custom (build your own role + scope combination).

**Data model:**
- `announcements`: id, title, body, created_by, created_at
- `announcement_audience`: announcement_id, role (nullable = all roles), class_id (nullable = all classes)
- At read time, the system resolves who matches by joining against current role and class enrollment, rather than freezing a recipient list at creation time. Class enrollment can change; the audience resolution shouldn't go stale because of it.

**Direct messages** (a teacher messaging one parent about their specific child) are a separate, smaller feature: no audience resolution, just a 1:1 message between two users. Worth keeping this out of the broadcast announcement model rather than forcing both into one system, since threading and read receipts behave differently for a conversation than for a posted notice.

**Delivery:** in-app feed is the baseline for v1. Whether urgent announcements (school closure, PTA reminder) also need SMS or email push is worth deciding now, since it determines whether you need an SMS provider outside the OTP login flow, and whether parent email becomes a required field rather than optional (currently only phone is required for parent login).

**Open question:** Track read status per announcement (so admin can see "180 of 200 parents have seen this")? Useful for something like a PTA notice, but it's an extra table and extra complexity that's easy to cut from v1 if it's not actually needed.

### 4.8 Dashboards
- Super admin: system health, user counts, academic year status
- School admin: enrollment numbers, attendance summary, fee collection summary, upcoming events
- Teacher: their classes, pending grade entries, today's schedule
- Student/Parent: attendance summary, latest grades, fee status, announcements

### 4.9 Bulk Data Import and Export (CSV)

Admins need to onboard several hundred to a couple thousand records without typing each one in by hand, and need a way to pull data out for reporting or backup.

**The core problem: CSVs are flat, but the data isn't.** A parent-student link, or a teacher-subject-classroom assignment, is a relationship between two entities. A flat CSV row can carry that relationship, but only if there's a way to say "this row refers to that student" without relying on internal database IDs an admin has no way of knowing. The resolution is to key every import off human-readable unique identifiers, never database primary keys.

**Identifiers to standardize on:**
- Students: `admission_number` (unique, school-assigned — Royal Academy almost certainly already has these)
- Teachers/staff: `staff_id`
- Parents: `email` or `phone_number` (phone is more reliable here, since parent login is phone-based)
- Classes: `class_code` (e.g. `JSS1A`)
- Subjects: `subject_code`

**Two kinds of CSV:**

1. **Entity CSVs** create the record itself: `students.csv`, `teachers.csv`, `parents.csv`, `classes.csv`, `subjects.csv`. Each row is one entity, and its admission_number/staff_id/etc becomes the reference key everything else points to.

2. **Relationship CSVs** link entities that already exist:
   - `parent_student_links.csv` — columns: `parent_email, student_admission_number, relationship` (father/mother/guardian). One row per link, so a parent with three kids has three rows, and a student with two linked parents has two rows. This naturally handles the many-to-many case without any special logic.
   - `teacher_assignments.csv` — columns: `staff_id, subject_code, class_code`. One row per teaching assignment. A teacher who teaches Math to three classes has three rows.

**Import flow (same pattern for every entity type):**
1. Admin downloads a template CSV with the correct headers
2. Admin uploads the filled file
3. System validates every row before touching the database: correct columns present, no duplicate identifiers within the file, referenced entities actually exist (a relationship row can't reference a student admission_number that doesn't exist yet)
4. Admin sees a preview: "X rows will be created, Y rows have errors" with the specific problem listed per row, not just a generic failure message
5. Admin confirms, or fixes the file and re-uploads
6. On confirm, valid rows commit and an import log is saved (who imported, when, row counts, downloadable error report for anything that failed)

**Re-uploads should not create duplicates.** If an admin fixes three bad rows and re-uploads the same file, existing admission_numbers should update rather than duplicate. Imports need to be upserts keyed on the identifier, not blind inserts.

**Export:** every list view (students, teachers, fee status, attendance for a date range) gets an export-to-CSV button that respects whatever filters are currently applied, not a dump of the entire table regardless of context. A separate "export everything" option makes sense for admin/super admin, mainly for backup purposes.

**Open question:** Does Royal Academy already have admission numbers and staff IDs in an existing spreadsheet or system, or does the system need to generate them on first import? If they already exist, import needs to preserve them exactly as-is. Re-numbering students who already have ID cards and printed records with their current admission number would break every physical document already in circulation.

---

## 5. Non-Functional Requirements

- **Mobile responsive**: every screen usable on a phone, not just scaled-down desktop. Parents in particular will use this almost entirely on mobile.
- **Performance**: dashboard and list views should load in under 2 seconds for a school of this size (500–2000 students means class rosters, not massive datasets, so this should not be difficult if the database is indexed properly)
- **Security**: role-based access control enforced at the API layer, not just hidden in the UI. Passwords hashed (bcrypt or argon2). OTP codes expire and are rate-limited.
- **Audit trail**: who changed what and when, at minimum for grade entries, fee records, and user account changes
- **Data backup**: automated daily database backups
- **Uptime**: no formal SLA needed for a single school, but backups and a reasonable hosting choice matter more than elaborate infrastructure

---

## 6. Database Entities (high level)

Not a full schema, but the core entities to design around:

- `users` (base table with role, shared auth fields)
- `students`, `teachers`, `parents`, `admins` (role-specific profile data, linked to `users`)
- `parent_student` (many-to-many join table)
- `classes`, `sections`, `subjects`
- `class_subject_teacher` (which teacher teaches which subject to which class)
- `attendance_records`
- `ca_scores`, `exam_scores`, `term_results`
- `timetable_entries`
- `fee_structures`, `fee_payments`
- `library_books`, `library_transactions`
- `transport_routes`, `student_routes`
- `announcements`, `announcement_audience` (role + class scope per announcement), `direct_messages`
- `academic_years`, `terms`
- `audit_logs`
- `import_logs`, `import_errors` (import history and per-row failure detail, tied back to the admin who ran it)

---

## 7. Authentication Flow

- **Staff (super admin, school admin, teacher)**: email + password
- **Students**: email + password (or admin-issued credentials, since younger students may not have their own email — confirm with Royal Academy whether students get individual logins or share a household login with parents)
- **Parents**: phone number + OTP (SMS-based, via a provider like Termii or Africa's Talking, which are commonly used with Nigerian phone numbers)

**Open question:** For students, especially younger ones, is an individual login even necessary, or should younger students' academic data just be visible entirely through the parent account? Confirm the age range covered by "student" role, since a JSS1 student's login needs look different from an SS3 student's.

---

## 8. Out of Scope for Version 1

To keep this buildable, these are explicitly deferred unless Royal Academy says otherwise:

- Multi-school / multi-tenant support
- Live GPS bus tracking
- In-app real-time chat (announcements and messages are one-directional or threaded, not a live chat system)
- Mobile native apps (this is a responsive web app, not iOS/Android apps)
- Alumni management
- HR/payroll for staff

---

## 9. Open Questions Requiring Answers Before Development Starts

1. Express vs. Next.js route handlers for the backend
2. Exact CA/exam weighting for term results
3. Whether report cards include class ranking
4. Library module: student-facing or staff-only
5. Transport: live tracking or static route assignment only
6. Student login model, especially for younger grades
7. Hosting provider preference
8. SMS/OTP provider for parent login
9. Does Royal Academy already have admission numbers and staff IDs, or does the system need to generate them
10. Do announcements need SMS/email push, or is the in-app feed enough for v1
11. Does announcement read tracking matter, or is that a cut-for-v1 feature

---

## 10. Success Criteria for V1 Launch

- All five roles can log in and see role-appropriate data on both desktop and mobile
- A teacher can mark attendance and enter grades for a full term
- A parent can view their child's report card and pay a fee successfully
- Admin can generate a fee collection report and see who has outstanding balances
- No role can access data or actions outside its permission scope, verified by testing, not just assumed
