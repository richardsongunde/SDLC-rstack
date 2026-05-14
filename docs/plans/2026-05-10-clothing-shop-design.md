# Clothing Shopping Website — Design Doc
**Date:** 2026-05-10  
**Stack:** Next.js 14 App Router + Supabase + Vercel  
**Payments:** Stubbed (to be wired in a later sprint)

## Architecture

```
Vercel (Edge/Serverless)
└── Next.js 14 App Router
    ├── /app/(store)/          → Storefront: product listing, detail, cart, checkout
    ├── /app/(auth)/           → Login, register, forgot password
    ├── /app/account/          → Order history, profile, saved addresses
    ├── /app/admin/            → Admin dashboard (products, orders, users)
    └── /app/api/              → Route handlers (cart sync, orders, revalidation)

Supabase
├── Auth                       → Email/password + optional Google OAuth
├── Postgres                   → products, categories, orders, order_items, profiles
├── Storage                    → Product images (CDN-backed bucket)
└── Row Level Security         → Customers see own orders; admins see all
```

## Database Schema

### Tables
- **profiles** — extends Supabase auth.users (full_name, address, role: customer|admin)
- **categories** — id, name, slug, description, image_url
- **products** — id, category_id, name, slug, description, price, stock_count, images[], is_active
- **orders** — id, user_id, status (pending|confirmed|shipped|delivered|cancelled), total, shipping_address, created_at
- **order_items** — id, order_id, product_id, quantity, unit_price

### RLS Policies
- Customers: SELECT own profile + orders; INSERT orders
- Admins: Full CRUD on all tables (role check via profiles.role)
- Public: SELECT active products + categories

## Pages & Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Homepage — hero + featured products | Public |
| `/shop` | Product grid with filters | Public |
| `/shop/[category]` | Category page | Public |
| `/products/[slug]` | Product detail + add to cart | Public |
| `/cart` | Cart page | Public |
| `/checkout` | Checkout form (address + order summary) | Required |
| `/account` | Order history + profile | Required |
| `/admin` | Admin dashboard home | Admin only |
| `/admin/products` | Product CRUD | Admin only |
| `/admin/orders` | Order management | Admin only |
| `/login` `/register` | Auth pages | Guest only |

## Components

- `ProductCard` — image, name, price, add-to-cart button
- `ProductGrid` — responsive grid with skeleton loaders
- `CartDrawer` — slide-out cart panel
- `CategoryFilter` — sidebar filter by category, price range
- `AdminTable` — reusable table with sort/filter for admin views

## Cart Strategy

localStorage cart for unauthenticated users. On checkout, user is prompted to log in — cart merges into DB order.

## Deployment

- Vercel project connected to GitHub repo
- Supabase project (free tier) with env vars set in Vercel dashboard
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `vercel.json` with build config

## What's Stubbed

- Payment processing (Stripe integration deferred)
- Email notifications (order confirmation emails)
- Search (basic filtering only; Algolia/full-text search deferred)
