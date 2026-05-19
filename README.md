# Smart Kitchen ERP & Cloud Inventory Management System

A modern, responsive, full-stack ERP web application for kitchens, hostels, mess halls, catering, temples, and school cafeterias. The system tracks raw ingredients, defines scalable dish recipes, performs deficit & warning calculations before cooking execution, issues low-stock alerts, generates historical audit logs, and renders advanced analytics dashboards.

---

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router DOM, Axios, Recharts
- **Backend:** Node.js, Express.js, Prisma ORM, JWT, bcryptjs, pg (PostgreSQL driver adapter)
- **Database:** PostgreSQL (Supabase)

---

## Folder Structure

```
smart-kitchen-erp/
├── client/                      # Frontend Vite + React project
│   ├── src/
│   │   ├── api/                 # Axios configured client
│   │   ├── components/          # ProtectedRoute and other layout helpers
│   │   ├── context/             # AuthContext (JWT session + roles check)
│   │   ├── layouts/             # DashboardLayout (Sidebar, Navbar, Alerts panel)
│   │   ├── pages/               # Dashboard, Ingredients, Inventory, Cooking, Analytics, etc.
│   │   ├── App.jsx              # Routing configurations
│   │   └── index.css            # Core styles & Tailwind directives
│   └── tailwind.config.js       # Tailwind CSS config
│
├── server/                      # Node.js Express backend
│   ├── src/
│   │   ├── config/              # Prisma database connection with PG adapter
│   │   ├── controllers/         # Auth, Ingredients, Dishes, Cooking, Inventory, Reports controllers
│   │   ├── middleware/          # JWT protect and role restrictive middlewares
│   │   ├── routes/              # Express Router files mapping API endpoints
│   │   ├── services/            # Stock notifications service
│   │   └── index.js             # Main server setup and route definitions
│   ├── prisma/
│   │   └── schema.prisma        # Prisma models (PostgreSQL compatibility)
│   ├── prisma.config.ts         # Prisma 7 config for connection variables
│   └── .env                     # Server environment variables
```

---

## Installation & Local Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL Database URL** (e.g., Supabase instance)

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>"
JWT_SECRET="your_secure_random_jwt_secret_key"
```
*Note: `DIRECT_URL` is required by Prisma for database migrations and schema pushes to bypass pooler transaction limits.*

### 3. Initialize Database & Generate Clients
Navigate to the `server/` directory and run:
```bash
cd server
npm install
npx prisma db push
npx prisma generate
```

### 4. Start the Application

#### Run the Backend Server
From the `server/` directory:
```bash
npm run dev
```
The backend server will run on `http://localhost:5000`.

#### Run the Frontend Client
Open a new terminal, navigate to the `client/` directory and run:
```bash
cd client
npm install
npm run dev
```
The React frontend will spin up on `http://localhost:5173`.

---

## Core System Architecture & Logic

### 1. Authentication & Role-Based Access Control
Complete JWT security workflow including role checks for:
- **Admin:** Full rights including role modifications, user deletions, and database cleanup.
- **Store Manager:** Full CRUD for ingredients, recipes, and posting Stock In/Out entries.
- **Kitchen Staff:** Calculate required quantities and execute meal session deductions.
- **Viewer:** Read-only dashboard view.

*Bootstrap Feature: The first user registered in the database automatically receives the `ADMIN` role.*

### 2. Cooking Scale & Stock Deduction Logic
When starting a meal session:
- Select a configured dish and enter the people count.
- The system checks ingredients in the recipe (quantity required per person * count).
- It compares the required amount against the live database stock:
  - If required > current stock, it marks the deficit amount and warns of a **Shortage**.
  - If current stock after deduction will drop below the safety limit, it flags a **Low Stock Warning**.
- When executing cooking:
  - Stock is atomically decremented (deficit items are allowed to go negative to log deficit volume).
  - Transaction logs are generated with type `COOKING`.
  - Alerts are published to the Notifications panel.
  - A cooking history snapshot of ingredients is preserved.

### 3. Low Stock Notification Center
Monitors stock updates during transactions and cooking. If items drop below the designated safety limit (`minStock`), a database warning record is generated. Unread warnings blink on the top navbar panel and are listed in the dashboard alert center.

---

## Production Deployment

### Frontend (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `client/` directory.
3. Configure Environment Variables in Vercel:
   - `VITE_API_URL`: Your hosted backend URL (e.g. `https://your-backend.onrender.com/api`).

### Backend (Render / Heroku)
1. Set up a Web Service on Render connecting to your Git repository.
2. Specify the root directory as `server`.
3. Set the Build Command: `npm install && npx prisma generate`
4. Set the Start Command: `node src/index.js`
5. Inject Environment Variables:
   - `DATABASE_URL`, `DIRECT_URL` (Supabase URLs)
   - `JWT_SECRET`
   - `NODE_ENV=production`
