# DentalTracker

A dental health tracking application built with Vite, React, TypeScript, Tailwind CSS, and Supabase.

## Overview

DentalTracker is a frontend application for tracking dental health records, appointments, and oral hygiene habits. The current implementation includes:

- User authentication (signup, email confirmation, sign-in) via Supabase Auth
- Protected routes for authenticated users
- Database integration with Supabase (PostgreSQL) using Row Level Security (RLS)
- Responsive UI with Tailwind CSS v4

The app is in active development with core authentication and dashboard shell completed. Feature screens for detailed tooth tracking and appointment management are built and tested.

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: react-router-dom
- **Backend**: Supabase (PostgreSQL database, Auth service, Row Level Security)
- **State Management**: React Context (for auth)
- **HTTP Client**: Supabase JS client

## Current Capabilities

����������������������������- ����� ��� ��� � ��� � � ✅ **Welcome Screen** - App introduction with feature highlights and call-to-action buttons  
������������������������������✅ **Account Creation** - Email/password signup with Supabase Auth  
������������������������������✅ **Email Confirmation Flow** - 
   - Check email screen showing sent confirmation
   - Resend confirmation email with 30-second cooldown to prevent abuse
   - Auth callback handler to process confirmation links from email
������������������������������✅ **Sign In** - 
   - Email/password authentication
   - Clear error handling for invalid credentials and unconfirmed email
   - Redirect to resend confirmation email when needed
������������������������������✅ **Protected Routes** - 
   - Dashboard route protected by authentication check
   - Unauthenticated users redirected to welcome screen
������������������������������✅ **Session Persistence** - 
   - Auth state persisted across page refreshes via Supabase client
������������������������������✅ **Sign Out** - 
   - Secure sign out that clears session
������������������������������✅ **Dashboard Shell** - 
   - Placeholder UI showing basic stats (Total Records, Last Visit, Streak, Next Checkup)
   - Currently shows zero/empty state until record-tracking UI is implemented
   - Real-time data fetching from Supabase `tooth_records` table with RLS enforcement
������������������������������✅ **Tooth Chart** - Visual grid showing each tooth's status (healthy, cavity, filling, etc.) with ability to add records per tooth
������������������������������✅ **Appointments & Reminders** - Schedule, view, and manage dental appointments with date/time selection and provider field
��������������������������✅ **Automated Reminders** - Hourly email reminders for upcoming appointments (using Resend, sends to account's registered email until domain verified)

## Security Measures

DentalTracker implements security at multiple layers:

- **Authentication**: Full authentication lifecycle managed by Supabase Auth (no custom password handling)
- **Email Verification**: Required before accessing protected routes (dashboard)
- **Row Level Security (RLS)**: 
   - Enabled on all database tables (`profiles`, `tooth_records`, `appointments`)
   - Policies restrict access to `auth.uid() = user_id` ensuring users can only access their own data
   - Enforced at the database layer for defense-in-depth
- **Environment Variables**: 
   - All Supabase credentials (URL, anon key) stored in `.env` file
   - `.env` is explicitly ignored by Git (see `.gitignore`)
   - Setup instructions reference `.env.example` (never commit real credentials)
- **Data in Transit**: 
   - TLS enforced by Supabase for all API communications
- **Session Management**: 
   - JWT-based tokens handled automatically by Supabase Auth
   - Automatic token refresh and secure storage

For complete security details and planned future measures, please see [SECURITY.md](SECURITY.md).

## Database Schema

The application uses three core tables in the Supabase PostgreSQL database:

1. **profiles** - Stores user profile information (id, full_name, avatar_url, etc.)
   - RLS Policy: Users can only view/update/delete their own profile
2. **tooth_records** - Stores dental health records for individual teeth
   - Fields: id, user_id (foreign key to auth.users), tooth_number (1-32), condition, notes, date, timestamps
   - RLS Policy: Users can only access records where `user_id = auth.uid()`
3. **appointments** - Stores dental appointments with providers
   - Fields: id, user_id, provider_name, appointment_date, notes, timestamps
   - RLS Policy: Users can only access appointments where `user_id = auth.uid()`

All tables have Row Level Security enabled with policies that restrict access to the authenticated user's own data only.

## Getting Started

Follow these steps to set up and run the DentalTracker project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/SyeHyderJ/Dental_Tracker.git
   cd Dental_Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   - Open `.env` and fill in:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase project anon key
   - �������� ������ ������ ���� ������ ���� ���� �� ������ ���� ���� �� ���� �� �� ⚠������������������������������️ Never commit your `.env` file - it's ignored by Git for security

4. **Set up the database**
   - Log in to your [Supabase dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to the SQL Editor
   - Copy and run the contents of `supabase/migrations/0001_init.sql`
   - This creates the tables (`profiles`, `tooth_records`, `appointments`) and enables Row Level Security

5. **Start the development server**
   ```bash
   npm run dev
   ```
   - Open your browser to `http://localhost:5173`
   - The app should load showing the Welcome screen

## Roadmap / Planned Features

- �������� ������ ������ ���� ������ ���� ���� �� ������ ���� ���� �� ���� �� �� 📊 **Progress Reports** - Charts and graphs showing oral health trends over time
- �������� ������ ������ ���� ������ ���� ���� �� ������ ���� ���� �� ���� �� �� 🪥 **Daily Habit Tracking** - Log brushing, flossing, rinsing with streak counters
- �������� ������ ������ ���� ������ ���� ���� �� ������ ���� ���� �� ���� �� �� 📄 **Export/Import** - Export records as PDF/CSV and import historical data
- ������� ����� ����� ��� ����� ��� ��� � ����� ��� ��� � ��� � � 🔔 **Notifications** - Push notifications for appointment reminders and recommended checkups
- �������� ������ ������ ���� ������ ���� ���� �� ������ ���� ���� �� ���� �� �� 💾 **Offline Support** - Service worker for basic offline functionality
- �������� ������ ������ ���� ������ ���� ���� �� ������ ���� ���� �� ���� �� �� 📧 **Email Domain Verification** - Verify Resend domain to allow sending appointment reminders to real users (currently limited to test account due to sandbox sender)

## Project Structure

```
src/
├── components/         # Reusable UI components (buttons, forms, etc.)
├── screens/            # Page-level components (Welcome, SignIn, Dashboard, etc.)
├── lib/                # Utility services and context
│   ├── auth.ts         # Auth context and helper functions
│   └── supabase.ts     # Supabase client initialization
├── types/              # TypeScript type definitions
├── App.tsx             # Main application component with routing
���������������└── main.tsx            # Entry point

supabase/
├── migrations/         # Database migration scripts
���������������└── ...                 # Other Supabase configuration files

.public/                # Static assets (favicon, etc.)
.index.html             # Main HTML entry point
```

## Contributing

This is a personal project. Feel free to fork and experiment, but pull requests are not currently accepted.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Supabase](https://supabase.com) for the awesome backend-as-a-service
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Vite](https://vitejs.dev) for the fast development build tool
- [React](https://reactjs.org) and [TypeScript](https://www.typescriptlang.org) for the UI foundation