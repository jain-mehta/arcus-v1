# Firebase Command Center - Final Architectural Blueprint

## 1. Core Principles: Stability, Scalability, and Security

This plan is the definitive blueprint for building a robust, enterprise-grade backend. It is designed to be scalable for future growth, including a potential transition to a multi-tenant SaaS platform. All past failures have been analyzed, and this architecture directly addresses their root causes.

1.  **Guaranteed Initialization First:** The primary cause of all past errors was a race condition. The new architecture **guarantees** that the Firebase Admin SDK is initialized **once and only once** using a singleton pattern before any database call can be made. This is the most critical principle.
2.  **Strict Separation of Concerns:**
    *   **UI Components (.tsx):** Presentation logic only. Unaware of the database.
    *   **Server Actions (actions.ts):** The only bridge between UI and backend. Handles input validation and permission checks.
    *   **Data Access Layer (firestore.ts):** The only part of the application that directly communicates with Firestore. It will also be responsible for writing to the audit log.
    *   **AI Logic (flows/*.ts):** All Generative AI logic will be isolated in Genkit flows.
3.  **Scalable by Design (Dynamic RBAC is Core):** The architecture is rule-based, not hardcoded. Adding new user roles, permissions, or features does not require rewriting the core application logic. This plan is designed for evolution.
4.  **Security First (Multi-Tenancy Ready):** The system is built on a foundation of multi-tenancy, ensuring data is strictly segregated. This is essential for both internal security and future SaaS capabilities.

---

## 2. Backend Technology Stack

*   **Runtime:** Next.js App Router (Server-side)
*   **Backend Logic:** Next.js Server Actions
*   **Database:** Google Firestore (via Firebase Admin SDK)
*   **Authentication:** Firebase Authentication (for user identity)
*   **AI:** Genkit with Google AI (Gemini)

---

## 3. Core Architecture: The Definitive Fix

This is the most critical component to ensure a stable application.

*   **`src/lib/firebase/firebase-admin.ts`:**
    *   This file will export a single function: `getFirebaseAdmin()`.
    *   This function uses a guarded singleton pattern, checking a cached global variable to see if the Firebase app is already initialized.
    *   If not initialized, it will initialize the app using `admin.initializeApp()`.
    *   It will **always** return the initialized services, e.g., `{ db: getFirestore(), auth: getAuth() }`.
    *   **Crucially, no service instances will be exported directly from this file.**

*   **`src/lib/firebase/firestore.ts`:**
    *   This file will contain all functions that read from or write to Firestore (e.g., `getVendors`, `createPurchaseOrder`).
    *   **Every function** in this file will begin by calling `const { db } = getFirebaseAdmin();` to get a guaranteed-valid Firestore instance.
    *   This layer will handle all data shaping, transformation, and security filtering.

---

## 4. Firestore Schema for a Dynamic, Multi-Tenant RBAC

This schema is designed for a flexible, hierarchical, and multi-tenant system, ready for SaaS.

*   **/organizations** (Top-Level Collection for SaaS)
    *   `{orgId}`: `{ name: string, ownerId: string }`
        *   For our initial build, a single organization document for "Bobs Bath Fittings" will be created. All data will be scoped to this `orgId`.
*   **/users**
    *   `{userId}`: `{ orgId, name, email, roleIds: string[], customPermissions?: string[], storeId?: string, region?: string, reportsTo?: string }`
        *   `orgId`: The organization this user belongs to. **All queries will be scoped by this.**
        *   `roleIds`: An array of references to documents in the `/roles` collection. Supports multiple roles.
        *   `customPermissions`: An array of specific permission IDs that apply only to this user.
        *   `storeId`: For location-specific roles like `Shop Owner`.
        *   `region`: For roles like `Regional Sales Head`.
        *   `reportsTo`: The `userId` of this user's manager, forming a hierarchy.
*   **/roles** (New Collection)
    *   `{roleId}`: `{ orgId, name: string, permissions: string[] }`
        *   Example: `{ orgId: 'bobs-org', name: "Sales Executive", permissions: ["view-own-leads", "create-opportunity"] }`
        *   This allows Admins to create and define roles dynamically within their organization.
*   **/permissions** (Reference Collection)
    *   `{permissionId}`: `{ name: string, description: string }`
        *   Example: `{ name: "view-regional-sales-reports", description: "Allows user to see reports for their region and subordinates." }`
*   **/stores**
    *   `{storeId}`: `{ orgId, name, address, city, region: string }` (Defines shop locations and their region).
*   **/audit_logs** (New Collection for Enterprise-Grade Security)
    *   `{logId}`: `{ orgId, userId, action: string, timestamp: serverTimestamp, details: object }`
        *   Example: `{ orgId: 'bobs-org', userId: 'user-123', action: 'DELETE_LEAD', details: { leadId: 'lead-456', leadName: 'Old Lead' } }`
*   **/leads, /customers, /opportunities, /orders, /inventory, etc.**
    *   `{docId}`: Every single document in these collections **must** have an `orgId`. They will also have fields like `ownerId`, `storeId`, and `region` to enable filtering at every level of the hierarchy.

---

## 5. Dynamic Role-Based Access Control (RBAC) Implementation Plan

This is a comprehensive plan to address the complex hierarchical and modular access requirements.

1.  **Dynamic Role Management:**
    *   An `Admin` will have access to a "User Management" module where they can:
        *   Create, Read, Update, and Delete roles in their organization's `/roles` collection.
        *   Assign a set of granular permissions to each role.
        *   Assign one or more `roleIds` to each user.
        *   Grant special `customPermissions` to individual users.
    *   This provides a UI-driven way to manage who can do what, without needing code changes.

2.  **Hierarchical Data Scoping:**
    *   **Admin:** No data filters are applied *within their organization*.
    *   **Sales President:** Their role has a permission like `view-all-sales`. The data access layer will fetch all sales-related documents within their `orgId` without an `ownerId` or `region` filter.
    *   **Regional Sales Head:**
        *   Their user document has a `region` field (e.g., "North").
        *   When they request data, the system first finds all `Sales Executives` where `reportsTo` equals their user ID.
        *   The final database query will be filtered to show data where `region` is "North" OR where `ownerId` is in their list of subordinates (and always scoped by `orgId`).
    *   **Sales Executive:**
        *   The most basic user. All data fetching functions will be automatically scoped with `.where('ownerId', '==', userId)`.

3.  **Modular Access:**
    *   The concept of `/userModules` is replaced by permissions. A user's combined roles will have permissions like `access-inventory-module` or `access-sales-module`.
    *   The main layout will fetch the user's total permissions and **only render navigation links for modules they are permitted to access.**

4.  **User Deactivation & Data Reassignment (Confirmed Plan):**
    *   When a user is deactivated, an automated cloud function will be triggered.
    *   This function will find all documents where `ownerId` matches the deactivated user's ID and reassign them to the user specified in their `reportsTo` field.
    *   An Admin will also have a UI to manually reassign data.

---

## 6. Implementation Roadmap

This backend will be rebuilt in a structured, batch-based approach to ensure stability at each step.

*   **Batch 1: Core & Foundation.** Implement the `firebase-admin.ts` singleton and update `firestore.ts` to use it. Establish the multi-tenant `organizationId` structure.
*   **Batch 2: Dynamic RBAC Foundation.**
    *   Create the `/roles`, `/permissions`, and updated `/users` schema with hierarchical fields (`reportsTo`, `roleIds`).
    *   Implement the core logic in Server Actions to fetch a user, aggregate their permissions from all roles and custom grants.
*   **Batch 3: User Management Module for Admins.**
    *   Build the UI for Admins to create/edit roles and assign them to users.
*   **Batch 4: Sales Module (with Hierarchy).**
    *   Re-implement the backend for the entire Sales module, ensuring all data-fetching respects the `Sales Executive` -> `Regional Head` -> `President` hierarchy.
*   **Batch 5: Shop Owner & Inventory Modules.**
    *   Re-implement the backend for location-aware inventory and sales, ensuring a `Shop Owner` is strictly scoped to their `storeId`.
*   **Batch 6: AI, Auditing & Dashboard.** Re-implement the Genkit flows, integrate audit logging into all data mutations, and complete the remaining dashboard server actions.

This plan provides a complete and robust blueprint for a scalable, secure, and multi-tenant ready application. I will not proceed with any code until you approve this architecture.
