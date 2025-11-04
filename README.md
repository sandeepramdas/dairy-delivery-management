# Fresh Dairy - Delivery Management System

A comprehensive milk delivery management system built with modern web technologies.

## Features

- 📊 **Dashboard** - Real-time overview of deliveries, customers, and revenue
- 👥 **Customer Management** - Complete CRUD operations with Google Maps integration
- 📦 **Product Master Data** - Manage dairy products catalog
- 🗺️ **Area/Zone Management** - Define delivery zones and areas
- 🚚 **Delivery Tracking** - Schedule and track deliveries with calendar view
- 💰 **Subscription Management** - Flexible subscription plans
- 💳 **Payment Processing** - Track payments and invoices
- 📈 **Reports & Analytics** - Business insights and performance metrics

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL (Supabase/Local)
- JWT Authentication

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- Google Maps Places API

## Quick Start

1. Install dependencies: `npm install && cd frontend && npm install`
2. Setup database: `psql -d dairy_delivery -f database/schema.sql`
3. Configure `.env` file
4. Add Google Maps API key in `frontend/index.html`
5. Run: `npm run dev` (backend) and `cd frontend && npm run dev` (frontend)

## Default Login
- Email: admin@milkdelivery.com
- Password: admin123

## Google Maps Setup
Get API key from https://console.cloud.google.com and update frontend/index.html

Built with ❤️ using Node.js, React, and PostgreSQL
