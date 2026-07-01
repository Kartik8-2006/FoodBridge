# FoodBridge Network

FoodBridge Network is a MERN food donation management platform inspired by the public-service structure and warm nonprofit theme of Arkansas Foodbank, adapted for donors, NGOs, volunteers, recipients, and admins.

## Architecture

- `client`: React + Vite single-page app with role-based dashboards.
- `server`: Node.js + Express REST API.
- `database`: MongoDB via Mongoose.
- `auth`: JWT access tokens with role-based authorization.

## Setup

Install package:
  `cd client`
  `npm init -y`
  `npm install`

  same for server
  `cd server`
  `npm init -y`
  `npm install`


Run the app:
for server:
    `cd server`
    `npm run dev`
for frontend:
    `cd client`
    `npm run dev`

Client: `http://localhost:5173`

Server: `http://localhost:5000`

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
