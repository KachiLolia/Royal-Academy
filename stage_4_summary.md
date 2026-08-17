# Stage 4: Academics, Timetabling & Grading (Summary)

This document provides a comprehensive overview of the work completed during **Stage 4** of the Royal Academy School Management System. In this stage, we transitioned from basic user and structure management to the core academic functionalities that power the school's day-to-day operations.

## 🎯 Primary Goals Achieved
- **Class Timetables**: A robust interface for administrators to schedule classes, subjects, and teachers throughout the week.
- **Attendance Tracking**: A streamlined portal for teachers to log daily student attendance for their assigned subjects.
- **Grade Management**: A system for teachers to record continuous assessments and exam scores based on the school's grading policy.
- **Report Card Generation**: An administrative view to aggregate student performance across attendance, assignments, assessments, and exams into formal report cards.

---

## 🏗️ 1. Database Schema Additions
To support academic operations, we expanded the Prisma schema (`prisma/schema.prisma`) with the following core models:

1. **`ClassSubjectTeacher`**: Acts as the central assignment mapping. It explicitly links a specific `Class` to a `Subject` and assigns a `Teacher`. This ensures teachers only see the subjects they actually teach, and classes only schedule subjects they offer.
2. **`TimetablePeriod`**: Represents a single block of time on the weekly schedule. It stores the `dayOfWeek`, `startTime`, `endTime`, and references the `Class`, `Subject`, `Teacher`, and `Term`.
3. **`Attendance`**: Records daily student presence per subject. It stores `status` (PRESENT, ABSENT, LATE, EXCUSED) and references the `Student`, `Subject`, and `Term`.
4. **`Grade`**: Holds the academic scores for a student in a specific subject for a specific term. It splits scores according to the school's policy:
   - Assignments (5%)
   - Continuous Assessment (30%)
   - Exams (60%)
   - *(Note: Attendance makes up the remaining 5%, which is calculated dynamically).*

---

## 🛠️ 2. Administrative Features (Backend & UI)

### Class Timetable Builder (`/admin/timetable`)
- **Visual Interface**: We built a 5-day weekly calendar view using Tailwind CSS and Lucide icons to display scheduled periods.
- **Dynamic Filtering Logic**: When adding a new period, the system intelligently filters dropdowns. Subjects and Teachers are filtered based on the actual `ClassSubjectTeacher` assignments in the database. Selecting a specific subject strictly filters the teacher list to those qualified, and vice versa.
- **Backend API**: Created `POST /api/admin/timetable` to handle bulk saving of periods for a class, and `GET /api/admin/timetable` to retrieve them. The backend actively validates that the submitted periods do not cause teacher scheduling conflicts (e.g., assigning a teacher to two different classes at the exact same time).

### Report Cards Viewer (`/admin/report-cards`)
- **Aggregation Engine**: Built the `/api/admin/report-cards` endpoint which performs complex data aggregation. For a selected class and term, it pulls every student, calculates their attendance percentage, fetches their `Grade` records, and compiles a final score for every subject.
- **Grading Policy Integration**: The backend automatically weights the scores (5% Attendance, 5% Assignments, 30% CA, 60% Exam) to generate a final percentage and letter grade.
- **UI Display**: Created a tabular interface that displays students alongside their calculated grades.

---

## 👩‍🏫 3. Teacher Features (Backend & UI)

To ensure teachers can actually input the data that feeds into the report cards, we built two dedicated portals accessible only to the `TEACHER` role:

### Teacher Attendance Portal (`/teacher/attendance`)
- **Filtered Access**: Teachers use a dropdown to select one of their assigned classes. The dropdown is populated securely via the `/api/teacher/attendance` API, which checks the authenticated teacher's ID against the `ClassSubjectTeacher` database.
- **Daily Roster**: Upon selecting a class and date, a roster of enrolled students appears.
- **Quick Logging**: Teachers can rapidly mark students as Present, Absent, Late, or Excused, with data saving automatically.

### Teacher Grades Portal (`/teacher/grades`)
- **Score Input**: Similar to attendance, teachers select their assigned class and subject. They are presented with a roster where they can input raw scores for Assignments (out of 5), Continuous Assessment (out of 30), and Exams (out of 60).
- **Backend API**: The `POST /api/teacher/grades` endpoint uses Prisma's `upsert` functionality to efficiently create or update grade records without creating duplicates if a teacher corrects a score later.

---

## 🐛 4. Bug Fixes & Improvements
- **UI Library Glitches**: We encountered a significant issue where the third-party UI library (`shadcn` + `@base-ui/react`) failed to render asynchronous dropdown values correctly, leading to "uncontrolled/controlled" React state errors and displaying raw database IDs instead of names.
  - **Resolution**: We completely replaced the buggy external Select components with styled, native HTML `<select>` elements across all 4 academic pages. This provided a 100% reliable, bug-free user experience.
- **Database Seeding**: To facilitate immediate testing of the new interfaces without forcing manual data entry, we wrote custom backend scripts (`scripts/seed-terms.ts` and `scripts/seed-assignments.ts`) to programmatically inject an active Academic Term and randomly assign teachers to subjects across all classes.

---

## 🚀 Next Steps
With the core academic structure, scheduling, and grading completed, the application is ready to transition to **Stage 5: Finance & Fees**. This next phase will introduce financial tracking, student ledgers, fee structures, and payment receipts.
