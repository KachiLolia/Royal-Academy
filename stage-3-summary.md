# Stage 3 Summary: User Management & Intelligent Bulk Imports

This document serves as a detailed breakdown of all the features implemented, the underlying logic, and the design decisions made during Stage 3 of the Royal Academy project.

## 1. Advanced Bulk Import Engine
We overhauled the `/admin/import` module to be highly robust and intelligent. Instead of relying on strict prerequisites (like forcing admins to create classes manually before importing users), the import system now automatically builds the school's structure dynamically.

**Logic & Implementation:**
- **Client-Side Parsing:** We integrated `PapaParse` on the frontend (`src/app/(dashboard)/admin/import/page.tsx`) to quickly parse large CSV files into JSON payloads.
- **Auto-Creating Structure:** In the `POST /api/admin/import` route, the backend intercepts structural columns (like `className`, `sectionName`, and `subjectName`). Before processing the user profile, it checks the database to see if those entities exist. If they don't, it seamlessly creates them on the fly using Prisma's `upsert` mechanism.
- **Dynamic Teacher Assignments:** When a Teacher is imported with a `className` and `subjectName`, the system automatically resolves the corresponding IDs and creates a record in the `ClassSubjectTeacher` join table, instantly linking the teacher to their specific subject and class.

## 2. Idempotent & Fault-Tolerant Database Logic
Bulk importing data often leads to edge cases like duplicate rows, conflicting identifiers, or shifting emails. We fortified the backend to handle these gracefully.

**Logic & Implementation:**
- **Primary Identifier Priority:** The system now prioritizes looking up existing records by their true, unchanging identifiers (`staffId` for teachers, `admissionNumber` for students, and `phone` for parents). This prevents database collisions if a user's email address changes or is left blank.
- **Duplicate Safeguards:** We added explicit safety checks for unique constraints (`phone` and `email`). If the system detects that an email or phone number in the CSV is already owned by *another* user, it gracefully drops that specific field update rather than crashing the entire import process with a `500 Internal Server Error`.
- **String Sanitization:** To handle dirty CSV data, we implemented a `sanitizeUnique` helper function that automatically strips out useless placeholder values like `"N/A"`, `"-"`, `"null"`, and empty spaces before attempting to save them as unique fields.

## 3. Dynamic User Management Interface
We refined the `/admin/users` page to provide a highly tailored, role-specific viewing experience.

**Logic & Implementation:**
- **Contextual Columns:** The data table dynamically alters its columns based on the active tab. For example, Students no longer show a useless "Phone Number" column, and Parents no longer show a generic "Identifier" column.
- **Nested Relational Display:** We updated the `GET /api/admin/users` endpoint to aggressively `include` nested relational data. As a result, the UI can now directly display a Student's current Class, a Teacher's multiple Subject/Class assignments, and a Parent's explicitly linked children.

## 4. Manual Reassignment System (Edit Modal)
While Bulk Imports handle the initial setup, Admins need a way to easily tweak user assignments on a day-to-day basis without re-uploading CSVs.

**Logic & Implementation:**
- **The Interface:** We added an "Actions" column featuring an "Edit" button for Students and Teachers. Clicking this triggers the `EditUserModal.tsx` component.
- **Live Data Fetching:** The modal independently fetches the school's live structural data (Classes, Sections, Subjects) via the `/api/admin/structure` endpoint to populate its dropdown menus.
- **Teacher Assignment Arrays:** For Teachers, the modal supports an array of assignments. Admins can click "Add Assignment" to add new rows, allowing a single teacher to be dynamically assigned to multiple subjects across different classes.
- **The Assignment API:** We created a dedicated `PUT /api/admin/users/assign` endpoint. 
  - For **Students**, it safely executes a targeted `prisma.student.update()` to change their `classId` and `sectionId`.
  - For **Teachers**, it takes the array of new assignments, wipes the teacher's old records in the `ClassSubjectTeacher` table, and cleanly inserts the new ones in one go, ensuring absolute parity between the UI and the database.

## Next Steps
With Stage 3 fully completed, the foundation of the system is rock solid. We have a fully built academic structure, user authentication, robust bulk imports, and dynamic role management. We are now perfectly positioned to move into **Stage 4: Academics**, where we will build out the Attendance, Grading, and Timetabling modules.
