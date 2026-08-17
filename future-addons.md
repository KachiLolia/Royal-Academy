# Future Add-ons & Phase 2 Features

This document tracks feature requests and enhancements that fall outside the core scope of the initial PRD. These items are officially deferred to the end of the project (Phase 2) to ensure the core School Management System is completed and stabilized first.

## 1. Public Marketing Website
- **Description:** A public-facing promotional website for the school (e.g., Home, About Us, Admissions, Academics, Contact).
- **Purpose:** While the core app is a private portal for enrolled students and staff, this website will serve as the digital front door for prospective parents and the general public.
- **Integration:** The website will live alongside the portal, potentially sharing the same domain (e.g., `royalacademy.com` for the website, and `portal.royalacademy.com` for the management system).

## 2. Dynamic Branding & Theme Builder (Super Admin)
- **Description:** A dedicated settings page in the Super Admin dashboard that allows the admin to dynamically change the look and feel of the portal without touching the codebase.
- **Features:**
  - Upload/Change the school logo.
  - Modify the primary and secondary color schemes (which will dynamically update the Tailwind CSS variables).
  - Update global typography/fonts.
  - Modify standard system texts (e.g., footer text, login screen welcome message).
- **Purpose:** Allows for easy white-labeling and visual updates managed directly by non-technical administrators.

## 3. Import Audit Logs (UI History)
- **Description:** A persistent database table (`ImportLogs`) that tracks the history of all CSV bulk imports.
- **Features:**
  - Shows who performed the import, timestamp, entity type, and success/failure row counts.
  - Displays directly in the `/admin/import` UI so previous imports aren't lost when the page refreshes.
- **Purpose:** Provides accountability and historical tracking for bulk data operations.

---
*Note: We will revisit these items once the core 7 stages of the School Management System (Dashboards, Academics, Finance, etc.) have been successfully launched.*
