# Project: Studio Teacher Attendance & Log System

## 1. Project Overview
A lightweight, offline-first web application designed for a recording studio to log attendance and session hours of teachers. The system focuses on simplicity, tracking who came, on which date, and for how many hours, without any financial or pricing calculations.

## 2. Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
* **Styling:** Tailwind CSS (via CDN).
* **Database:** Dexie.js (Wrapper for IndexedDB to store data locally in the browser without a backend).

## 3. Core Database Schema (Dexie.js)
Define a database named `StudioLogDB` with two main stores (tables):

* **teachers**:
    * Stores: `++id, name`
* **attendance**:
    * Stores: `++id, teacherId, teacherName, date, startTime, endTime, duration`

## 4. Technical Requirements & Features

### A. Teacher Management
* **Add Teacher:** A simple form to input a teacher's name and save it to the database.
* **Teacher List:** A view or dropdown to see all registered teachers.

### B. Attendance / Session Logging (Core Feature)
* The user must be able to log a session using a single form.
* **Inputs required:**
    * Teacher Selection (Dropdown loaded from the `teachers` store).
    * Date (Defaulted to current date).
    * Start Time (Can be manual or fetched via a "Check-in" button).
    * End Time (Can be manual or fetched via a "Check-out" button).
* **Duration Calculation Logic:** * A JavaScript function must automatically calculate the total hours and minutes between `startTime` and `endTime`.
    * Format to save: Total hours (e.g., `2.5 hours` or `02:30`).

### C. Log History / Dashboard
* A clean table showing all attendance records.
* Columns needed: `Date`, `Teacher Name`, `Start Time`, `End Time`, `Total Hours`.
* Records must be sorted by date (newest first).
* A simple delete button for each record to remove accidental entries.

## 5. UI/UX Design Guidelines (Tailwind CSS)
* **Theme:** Modern, clean, dark mode preferred for studio environments, or a clean professional light layout.
* **Layout:** Single-page application (SPA) layout with distinct sections for "New Log", "Add Teacher", and "History Log".
* **Responsiveness:** Must be fully responsive and optimized for both desktop and mobile/tablet screens.
* **Interactive Elements:** Use rounded corners, soft shadows, and clear focus states on inputs and buttons.

## 6. Implementation Instructions for the Developer/AI

1.  **Structure:** Create a single `index.html` file or separate `index.html`, `style.css`, and `app.js` files.
2.  **CDN Links:** Include Tailwind CSS Play CDN and Dexie.js CDN in the `<head>` of the HTML.
3.  **Database Initialization:** * Initialize Dexie in `app.js`.
    * Handle database open errors gracefully.
4.  **Event Listeners:**
    * Map the "Save Log" button to calculate the duration before pushing the final object to the Dexie store.
    * Implement a "Refresh Table" function that runs after every add/delete action to keep the UI updated without page reloads.
5.  **Form Validations:** Ensure a log cannot be saved without selecting a teacher or filling in both the start and end times.