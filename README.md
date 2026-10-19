# Bayanihub

Bayanihub is a multi-role platform with separate experiences for administrators, site managers, end-user web clients, and end-user mobile clients. The project demonstrates full-stack Information Systems work across authentication, campaign/application workflows, role-based interfaces, and coordinated multi-application architecture.

## Portfolio Highlights

- Multi-client architecture spanning ADMIN, SITEMAN, ENDUSERWEB, and ENDUSERMOBILE applications in the private development project
- NestJS-based backend services
- Supabase-backed authentication and protected routes
- Role-aware administrative workflows
- Campaign and application management modules
- Environment-based server credentials instead of hardcoded Supabase keys

## Public Snapshot Scope

This repository is a **curated recruiter-facing snapshot**, not a full deployment mirror. The public selection currently focuses on the administrative backend because it demonstrates the project's architecture and security patterns clearly without exposing private operational material.

Representative files include:

```text
ADMIN/backend/.env.example
ADMIN/backend/package.json
ADMIN/backend/src/app.module.ts
ADMIN/backend/src/supabase/supabase.service.ts
ADMIN/backend/src/auth/guards/supabase-auth.guard.ts
```

The private development repository contains the broader ADMIN, SITEMAN, ENDUSERWEB, and ENDUSERMOBILE application trees.

## Security & Repository Policy

Production secrets, local environment files, build artifacts, generated caches, internal worklogs, temporary scripts, and private deployment values are intentionally excluded.

Use local `.env` files for your own credentials and never commit passwords, tokens, Supabase service-role keys, database connection strings, or other private configuration.

## Portfolio Context

The public version focuses on architecture and representative implementation for recruiter and technical-review purposes while the complete development repository remains private.
