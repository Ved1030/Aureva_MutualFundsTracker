# Aureva Fund Insight Tracker

## Live Application

Frontend: https://aureva-mutual-funds-tracker.vercel.app

Backend: https://aureva-backend-437k.onrender.com

Repository: https://github.com/Ved1030/Aureva_MutualFundsTracker

---

# Overview

Aureva Fund Insight Tracker is a full-stack MERN application that allows users to search Indian Mutual Funds, save funds to a personal watchlist, and analyze historical NAV performance through interactive charts.

The application uses the public MFAPI service for mutual fund data and stores user/watchlist data in MongoDB Atlas.

---

# Features

### Authentication

* User Registration
* User Login
* JWT-based Authentication
* Protected Watchlist Access

### Search & Discover

* Search Indian Mutual Funds
* Debounced Search Requests
* Scheme Name and Scheme Code Display
* Responsive Search Results

### Watchlist Management

* Add Mutual Funds to Watchlist
* Remove Mutual Funds from Watchlist
* Persistent Storage in MongoDB Atlas
* Duplicate Prevention

### Fund Detail Dashboard

* Historical NAV Analysis
* Interactive NAV Charts
* Range Filters:

  * 1 Year
  * 3 Years
  * 5 Years
  * All Available Data
* Area Chart and Line Chart Views
* Fund Statistics:

  * Latest NAV
  * Highest NAV
  * Lowest NAV
  * Growth Percentage
  * Total Data Points
  * History Length

### Additional Enhancements

* Backend API Caching
* Responsive Mobile Design
* Loading States
* Error Handling
* Backend Health Endpoints

---

# Tech Stack

## Frontend

* React
* Vite
* React Router
* Axios
* Recharts

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* Bcrypt

## Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

---

# Environment Variables

## Backend (.env)

```env
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173
```

## Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

# Running Locally

## Clone Repository

```bash
git clone https://github.com/Ved1030/Aureva_MutualFundsTracker.git

cd Aureva_MutualFundsTracker
```

---

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# API Endpoints

## Authentication

```http
POST /api/auth/register

POST /api/auth/login
```

## Watchlist

```http
GET /api/watchlist

POST /api/watchlist

DELETE /api/watchlist/:schemeCode
```

## Mutual Funds

```http
GET /api/funds/search

GET /api/funds/:schemeCode
```

## Health

```http
GET /

GET /health
```

---

# Assumptions

* MFAPI is publicly available and does not require authentication.
* Historical NAV data returned by MFAPI is accurate and updated daily.
* Users are authenticated using JWT tokens.
* Watchlists are user-specific.
* Internet connectivity is required to access MFAPI data.

---

# Known Limitations

* Application depends on MFAPI availability.
* Some mutual funds may have limited historical NAV data.
* Free-tier Render deployment may experience cold starts after inactivity.
* Chart history availability depends on data provided by MFAPI.
* Search results are limited to data returned by the external API.

---

# Deployment

Frontend deployed on Vercel.

Backend deployed on Render.

MongoDB Atlas is used as the cloud database.

Environment variables are configured separately on deployment platforms and are not committed to the repository.

---

# Author

Ved Mehta

Aureva Fund Insight Tracker - MERN Stack Take Home Assignment
