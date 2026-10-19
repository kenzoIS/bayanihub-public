# Bayanihub

Bayanihub is an integrated Disaster Risk Reduction and Management (DRRM) resource and mission management platform designed to coordinate volunteers, donations, campaigns, deployments, tasks, and operational reporting across multiple user roles and client applications.

The system supports administrators, site managers, and end users through dedicated web and mobile interfaces backed by shared APIs and Supabase-based data services.

## Highlights

- Multi-application architecture covering **Admin**, **Site Manager**, **End User Web**, and **End User Mobile** clients.
- Role-based workflows for **3 primary user roles**: Admin, Site Manager, and End User.
- Supports volunteer applications, campaign management, donations, mission activation, QR-based verification, task assignment, deployment coordination, and notifications.
- Uses NestJS REST APIs and Supabase/PostgreSQL for shared backend services, authentication, and application data.
- Includes descriptive analytics and operational dashboards for mission, campaign, volunteer, and resource coordination.
- Implements ETL-style transformation of disaster-response records into normalized missions, campaigns, deployments, shifts, and reporting structures.
- Developed as a coordinated Agile project across **6 sprints**, with modular client applications and shared backend services.

## Project Structure

```text
bayanihub/
├── ADMIN/              # Administrative web application and backend
│   ├── backend/        # NestJS APIs and Supabase integration
│   └── ...             # Next.js admin interface
├── SITEMAN/            # Site Manager application
├── ENDUSERWEB/         # End-user web application
├── ENDUSERMOBILE/      # React Native / Expo mobile application
├── .github/            # Repository ownership and workflow configuration
└── README.md
```

Each client is maintained as an independent application while sharing common business processes and backend data services.

## Tech Stack

### Web Applications
- Next.js
- React
- TypeScript
- React Query
- Radix UI
- Recharts
- Framer Motion

### Mobile Application
- React Native
- Expo
- TypeScript

### Backend
- NestJS
- Node.js
- TypeScript
- REST APIs
- Class validation / DTO-based request handling

### Database & Services
- Supabase
- PostgreSQL
- Supabase Authentication

### Development & Delivery
- Git / GitHub
- Agile / Scrum
- API testing and QA workflows

## Environment Setup

Real credentials are not included in this repository. Backend services that connect to Supabase should use local environment files created from the supplied examples.

For example:

```bash
cp ADMIN/backend/.env.example ADMIN/backend/.env
```

Example values:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

Repeat the same approach for any application that requires its own environment configuration. Use credentials from your own Supabase project and never commit `.env` files or service-role keys.

## Local Setup

Because Bayanihub contains multiple applications, install and run the required client independently.

### Admin Web Application

```bash
cd ADMIN
npm install
npm run dev
```

The Admin application is configured to run on port `8080` in development.

### Admin Backend

Open another terminal:

```bash
cd ADMIN/backend
npm install
npm run start:dev
```

Create `ADMIN/backend/.env` before starting services that require Supabase connectivity.

### Other Web Clients

For the Site Manager or End User Web applications, enter the corresponding project directory and install its dependencies:

```bash
cd SITEMAN
npm install
npm run dev
```

or:

```bash
cd ENDUSERWEB
npm install
npm run dev
```

### Mobile Client

For the React Native / Expo application:

```bash
cd ENDUSERMOBILE
npm install
npx expo start
```

Exact ports and client-specific environment values can be adjusted according to each application's configuration.

## Core Workflows

The platform is organized around coordinated DRRM operations, including:

```text
User / Volunteer Registration
        ↓
Application & Role Verification
        ↓
Campaign / Mission Activation
        ↓
Donation & Resource Coordination
        ↓
Volunteer Deployment / QR Verification
        ↓
Task & Shift Assignment
        ↓
Mission Monitoring
        ↓
Operational Reports & Analytics
```

## Configuration & Security Notes

- Use separate development credentials for local testing.
- Keep Supabase service-role keys strictly server-side.
- Do not expose privileged credentials in web or mobile clients.
- Review Row Level Security and role-based authorization policies before production deployment.
- Local environment files, generated builds, caches, and temporary development artifacts should remain excluded from version control.
