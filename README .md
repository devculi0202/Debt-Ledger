# Debt Ledger MVP

A lightweight, single-page web application designed to track personal debts, receivables, and liabilities. 

## 🚀 Features

*   **KPI Dashboard:** Automatically calculates and displays your overall Net Position, Total Receivables, and Total Liabilities.
*   **Transaction Management:** Easily log transactions by categorizing them as "Owed to Me" (+) or "I Owe" (-).
*   **Detailed Records:** Store essential details including the entity/person's name, amount in VNĐ, transaction date, due date, and optional notes.
*   **Interactive Ledger:** View all records in a table format with the ability to filter by month or status (Active Only / Settled Only), and search by name or notes.
*   **Quick Actions:** Instantly toggle the status of a debt (Active/Settled), edit existing records, or delete them entirely.
*   **Dark Mode Support:** Built-in toggle to switch between light and dark themes, which also respects the user's system preferences[cite: 1].

## 🛠️ Tech Stack

*   **Frontend:** HTML5 and JavaScript (Vanilla)[cite: 1].
*   **Styling:** Tailwind CSS (loaded via CDN)[cite: 1].
*   **Typography & Icons:** Google Fonts (Inter) and Font Awesome 6[cite: 1].
*   **Backend / Database:** Supabase JS Client (loaded via CDN) for database operations and optimistic UI updates[cite: 1].

## ⚙️ Setup & Installation

1. Clone or download this repository to your local machine.
2. Open the `index.html` file in your preferred code editor.
3. Locate the **Supabase Configuration** section in the `<script>` tag[cite: 1].
4. Replace the placeholder credentials with your actual Supabase project details:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; //[cite: 1]
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; //[cite: 1]