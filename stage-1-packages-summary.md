# Stage 1: Packages and Tools Summary

This document outlines all the frameworks, tools, and packages installed during Stage 1 of the Royal Academy Management System build. It explains why each was chosen and how it supports our upcoming development phases.

## 1. Core Framework & Language
*   **Next.js (`next`) & React (`react`, `react-dom`)**
    *   **Relevance:** Next.js is our foundational App Router framework. It handles everything from rendering UI components to server-side logic and routing (e.g., separating `/login` from `/dashboard`).
    *   **Impact:** Ensures the app is fast, SEO-friendly, and provides a clear structure. All future pages (Attendance, Fees, etc.) will be built using Next.js routing.
*   **TypeScript (`typescript`)**
    *   **Relevance:** Adds static typing to JavaScript.
    *   **Impact:** Catches bugs before we run the code. When building complex data structures (like term results or fee calculations), TypeScript ensures we don't accidentally pass the wrong data types, significantly reducing runtime crashes.

## 2. Database & Data Layer
*   **Prisma ORM (`prisma`, `@prisma/client`)**
    *   **Relevance:** Prisma acts as the bridge between our Next.js backend and the database. It allows us to interact with the database using type-safe TypeScript instead of raw SQL queries.
    *   **Impact:** Rapid development of database queries. When we build the database schemas for Students, Teachers, and Payments, Prisma will automatically generate the types for us.
*   **SQLite (configured via Prisma)**
    *   **Relevance:** A lightweight, file-based database currently used for local development.
    *   **Impact:** Allows us to quickly build and test database structures on our local machines without needing a full PostgreSQL server running yet. When we are ready for production, changing one line of configuration will swap SQLite for PostgreSQL.

## 3. Styling & UI Architecture
*   **Tailwind CSS (`tailwindcss`, `@tailwindcss/postcss`)**
    *   **Relevance:** A utility-first CSS framework that allows us to style components rapidly without leaving our HTML/TSX files.
    *   **Impact:** Guarantees a consistent, responsive, and premium design language across the entire application.
*   **shadcn (`shadcn`) & Base UI (`@base-ui/react`)**
    *   **Relevance:** `shadcn` provides beautifully designed, accessible components (like Buttons, Inputs, Dialogs) that we fully own and can customize. `@base-ui/react` supplies the unstyled, accessible behavioral logic under the hood.
    *   **Impact:** Saves us hundreds of hours of building accessible dropdowns, modals, and tables from scratch. We get premium UI elements out of the box that match our design goals.
*   **Lucide React (`lucide-react`)**
    *   **Relevance:** Our primary icon library.
    *   **Impact:** Provides a consistent, clean, and modern set of icons for our sidebars, buttons, and dashboard widgets.

## 4. UI Utilities
*   **class-variance-authority (`class-variance-authority`)**
    *   **Relevance:** A utility for managing CSS classes based on component variants (e.g., making it easy to have a `primary`, `secondary`, or `destructive` button).
    *   **Impact:** Keeps our component code clean and scalable as we add more UI variations.
*   **clsx & tailwind-merge (`clsx`, `tailwind-merge`)**
    *   **Relevance:** Helper libraries used together to conditionally combine Tailwind classes and resolve any conflicts (e.g., if a base component says `bg-blue-500` but we pass a custom class `bg-red-500`, this ensures `bg-red-500` wins).
    *   **Impact:** Enables flexible, reusable UI components that can be safely customized in different contexts without styling bugs.
*   **Tailwind Animate (`tw-animate-css`)**
    *   **Relevance:** Provides smooth micro-animations for our components.
    *   **Impact:** Crucial for achieving the "premium and dynamic" feel requested in the PRD, making the interface feel responsive and alive when users interact with it.

---
**Summary for Next Steps (Stage 2 & Beyond):**
The packages installed in Stage 1 give us a full vertical stack. We have the frontend (Next.js/React + Tailwind/shadcn) to build the UI, the backend routing (Next.js) to handle logic, and the database layer (Prisma) to store data. Moving forward, we won't need to spend time configuring architecture—we can jump straight into building features like Authentication, Dashboards, and Data Management.
