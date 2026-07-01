# FoodBridge Network

FoodBridge Network is a MERN food donation management platform inspired by the public-service structure and warm nonprofit theme of Arkansas Foodbank, adapted for donors, NGOs, volunteers, recipients, and admins.

## Architecture

- `client`: React + Vite single-page app with role-based dashboards.
- `server`: Node.js + Express REST API.
- `database`: MongoDB via Mongoose.
- `auth`: JWT access tokens with role-based authorization.

## Setup

Install dependencies for the full app:
  `npm run install:all`

Start MongoDB locally (one-time setup):
  `mongod --dbpath <your-mongodb-data-folder>`

  If you use MongoDB Atlas instead, update `server/.env` with your `MONGO_URI`.

Seed demo data:
  `npm run seed --prefix server`

Run the app:
  `npm run dev`

This starts the backend and the React frontend together using the root package scripts.

Individual services:
  `npm run dev:server`
  `npm run dev:client`

Client: `http://localhost:5175`

Server: `http://localhost:5001`

Email setup for newsletter and password reset:
  Add SMTP values in `server/.env`. For Gmail, use a Gmail App Password, not your normal Gmail password.
  Required keys: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, and `CLIENT_URL`.

## Demo Users

All seeded demo users use password `Password123!`.

- Donor: `donor@foodbridge.org`
- NGO: `ngo@foodbridge.org`
- Volunteer: `volunteer@foodbridge.org`
<!-- - Recipient: `recipient@foodbridge.org` -->
- Admin: `admin@foodbridge.org`



Login with one of the demo accounts. After login, click `Dashboard`.

Role routes:

- Donor: `/dashboard/donor`
- NGO: `/dashboard/ngo`
- Volunteer: `/dashboard/volunteer`
- Recipient: `/dashboard/recipient`
- Admin: `/dashboard/admin`

The dashboard is backend-connected through these protected APIs:

```text
GET /api/auth/me
GET /api/dashboard/:role
GET /api/donations
POST /api/donations
PATCH /api/donations/:id/accept
PATCH /api/donations/:id/status
PATCH /api/admin/ngos/:id/verification
POST /api/support-requests
```

Role protection is enforced by JWT. Example: a donor token can open `/api/dashboard/donor`, but `/api/dashboard/ngo` returns `403 Forbidden`.

## Core Workflows

- Donors register and post surplus food.
- NGOs and volunteers view available donations and accept pickups.
- Pickup status moves from posted to accepted, pickup scheduled, picked up, delivered, cancelled, or expired.
- Recipients can request assistance.
- Admins verify NGOs, monitor donations, and review platform activity.

Shubham 


kartik
