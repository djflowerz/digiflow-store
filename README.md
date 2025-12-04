# Digiflow Store

A modern, mobile-first eCommerce platform built with React, TypeScript, and Tailwind CSS.

## Features

- **Full eCommerce Functionality**: Product browsing, cart management, and checkout.
- **M-Pesa Integration**: Real-time payments using Safaricom Daraja API (via Supabase Edge Functions).
- **Admin Dashboard**: Dedicated admin panel for managing products, orders, and users.
- **Supabase Backend**: Secure authentication, real-time database, and row-level security.
- **AI-Powered**: Gemini AI integration for chatbot support and review summarization.
- **Responsive Design**: Mobile-first UI with Dark Mode support.

## Project Structure

- `index.html`: Main Storefront entry point.
- `admin.html`: Admin Dashboard entry point.
- `src/pages`: Route components (Home, Shop, Cart, etc.).
- `src/services`: API integrations (Supabase, M-Pesa, Gemini).

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/djflowerz/digiflow-store.git
   ```

2. **Supabase Setup**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL scripts provided in `db_schema.sql` and `db_seed.sql` in your Supabase SQL Editor.
   - Configure Edge Functions for M-Pesa payments.

3. **Running Locally**
   - This project uses ES Modules via `index.html`. You can serve it using any static server (e.g., `npx serve`, Live Server).

## Deployment

To push updates to GitHub:

```bash
git add .
git commit -m "Update features"
git push origin main
```

## Security Note

API Keys and Secrets are **not** stored in this frontend code. 
- **M-Pesa Keys**: Stored in Supabase Edge Function Secrets.
- **Supabase Keys**: Only the `ANON` key is exposed (RLS protected).
- **Admin Access**: Protected via Row Level Security and Auth Guards.

---
© 2024 Digiflow Store