# Moonview Medical Center — Hospital Management System (HMS)

Moonview Medical is a comprehensive Hospital Management System built with React 18, Vite, and Supabase.

## Features

- 👑 **Admin Portal**: Staff management, financial tracking, expenses, attendance, audit logs, system configuration, and analytics.
- 🩺 **Doctor Portal**: Full consultation module, appointment management, patient profiles, electronic prescriptions, lab test orders, and reports.
- 🗂️ **Registrar Portal**: Patient registration, active queues, visit history, billing gate, and printing.
- 🧪 **Laboratory Portal**: Interactive workbench, test catalog management, results filing, lab inventory, and analytics.
- 💊 **Pharmacy Portal**: Dispensing workbench, medicine inventory management, procurement, sales tracking, and suppliers.
- 📱 **Progressive Web App (PWA)** support.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Backend / Database**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
