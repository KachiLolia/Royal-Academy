# Royal Academy: Project Roadmap & Stages

This document outlines the phased development plan for the Royal Academy School Management System based on the PRD. It breaks the project down into distinct, manageable stages.

---

## ✅ Stage 1: Authentication & Core Layouts (Completed)
**Goal:** Establish the foundational security and visual layout of the application.
- **What it contains:**
  - Setup of Next.js, Tailwind CSS, and shadcn/ui.
  - Creation of the base `User` database model.
  - Secure login flow using JWT (Email/Password for staff, Phone/OTP structure for parents).
  - Role-based middleware to protect routes.
  - Basic dashboard scaffolding and sidebar layout.

## ✅ Stage 2: Database Setup & Bulk Imports (Completed)
**Goal:** Build the academic structure and onboard the school's raw data.
- **What it contains:**
  - Database schema expansion (Academic Years, Terms, Classes, Sections, Subjects).
  - Admin UI to define the school's structure (`/admin/structure`).
  - Comprehensive CSV Bulk Import module (`/admin/import`) for Students, Teachers, Parents, and Parent-Student links.
  - Strict data validation and unique identifier enforcement (Admission Numbers, Staff IDs).

## ✅ Stage 3: User Profiles & Dashboards (Completed)
**Goal:** Consolidate the user experience and provide admin tools for managing people.
- **What it contains:**
  - Universal smart routing (`/dashboard`) that renders different interfaces based on user role.
  - Dynamic sidebar navigation that hides/shows links based on permissions.
  - The Admin User Management Interface (`/admin/users`) to view and filter all imported users (Students, Teachers, Parents) in detailed data tables.
  - Live statistical widgets on the Admin dashboard.

---

## ✅ Stage 4: Academics & Timetabling (Completed)
**Goal:** Build out the core functionality that manages actual school operations (classes, grades, attendance).
- **What it contains:**
  - Class subject mapping (assigning teachers to subjects in specific classes).
  - Admin weekly Timetable builder with clash detection.
  - Teacher portals for Daily Attendance and Grade entry.
  - Automatic termly Report Card generation factoring in continuous assessments and exams.
  - Timetabling: Admin tool to build class schedules (preventing double-booking teachers); dynamic timetable views for students and teachers.

## ⏳ Stage 5: Finance & Fees
**Goal:** Streamline tuition collection and track school revenue.
- **What it contains:**
  - **Fee Structures:** Admin tools to define tuition and extra charges per term/class.
  - **Payment Integration:** Integration with Paystack/Flutterwave for parents to pay fees online.
  - **Manual Payments:** Admin ability to record cash/bank transfers.
  - **Financial Dashboard:** Admin view of paid vs. outstanding balances across the entire school.

## ⏳ Stage 6: Communication
**Goal:** Keep everyone informed securely within the portal.
- **What it contains:**
  - **Role-Based Announcements:** Admin and Teachers can broadcast messages to specific audiences (e.g., "All JSS1 Parents" or "All Teachers").
  - **Direct Messages:** 1-to-1 secure messaging (e.g., a Teacher messaging a specific Parent about their child).
  - **Push Notifications:** (Optional) SMS or Email delivery for urgent alerts.

## ⏳ Stage 7: Library & Transport (Extras)
**Goal:** Manage auxiliary school services.
- **What it contains:**
  - **Library:** Book cataloging, issue/return tracking, and overdue management (Staff-operated).
  - **Transport:** Route and stop management, assigning students to specific buses, and providing parents visibility into their child's transport schedule.

---

## 🚀 Phase 2 (Post-Launch Add-ons)
**Goal:** "Nice-to-have" features to polish the system after the core operations are live.
- **What it contains:**
  - Public-facing marketing website (Admissions, About Us).
  - Dynamic Theme Builder (Super Admin UI to change logos and colors without coding).
  - Persistent UI Audit Logs for CSV imports.
