# Diet Factory Digital Menu

Mobile-first digital menu for [Diet Factory](https://dietfactory.in): customers scan a QR code and
browse the menu; the owner manages everything from `/admin`.

**Stack:** Next.js (App Router, Cache Components) · TypeScript · Tailwind CSS · Supabase (Postgres,
Auth, Storage) · Vercel free tier.

The 35 menu items, prices and six categories (Juices, Shakes & Smoothies, Toasts, Bowls, Salads,
Hot Drinks) come from dietfactory.in. Descriptions, ingredients, allergens and nutrition are empty
on purpose and can be added from `/admin`.

## Quick preview (no Supabase needed)

```bash
npm install
npm run dev        # http://localhost:3000
```

Until Supabase is configured, the public menu renders from `data/menu.json`. `/admin` needs Supabase.

## Setup

### 1. Create the Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the whole of `supabase/schema.sql` and run it. It creates the tables,
   Row Level Security policies, and the `menu-images` storage bucket. It is safe to re-run.
3. Under **Project Settings > API**, copy the project URL, the `anon` key and the `service_role` key.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
The service role key is used only by the seed script on your machine. Never add it to Vercel and
never prefix it with `NEXT_PUBLIC_`.

### 3. Load the menu

```bash
npm run seed
```

This loads `data/menu.json` (categories, settings, 35 items). It can be re-run safely: rows are
matched by slug and updated in place, so it will overwrite edits made to those items in `/admin`.

### 4. Create the first admin

1. Supabase dashboard > **Authentication > Users > Add user**: enter an email and password and tick
   *Auto Confirm User*. Public sign-ups do not exist in the app.
2. In the **SQL Editor**, make that user an admin:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'owner@example.com';
```

Signing in with an account that is not in `admin_users` is rejected, and the database refuses its
writes as well.

### 5. Run

```bash
npm run dev
```

Open `/` for the menu and `/admin` for the admin panel.

## Deploy to Vercel

1. Push this repo to GitHub and import it in [vercel.com](https://vercel.com) (Hobby plan is free).
2. Add these environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   and optionally `NEXT_PUBLIC_SITE_URL` (your final public address, used as the QR default).
3. Deploy. Then in Supabase **Authentication > URL Configuration**, set the Site URL to your Vercel
   address.
4. Open `/admin/qr`, confirm the address, and download the QR as PNG or SVG.

## How it works

- **Public menu** (`/`) is prerendered and cached under the `menu` tag. Every admin write calls
  `updateTag("menu")`, so changes show up on the next page load.
- **Data access** lives in `lib/menu.ts`. Public reads use an anonymous client; admin reads and all
  writes use the signed-in user's session, so Row Level Security decides what is allowed.
- **Auth:** `proxy.ts` redirects signed-out visitors away from `/admin`; the admin layout and every
  server action re-check the admin role; RLS is the last line of defence.
- **Images** are compressed in the browser to WebP (about 200 KB max), then uploaded through a server
  action that checks the file signature and size (300 KB cap, also enforced by the bucket).
- **CSV:** export from `/admin/import-export`. Lists use `|` between values. On import, rows whose
  `slug` matches update that item, others are added. Errors are shown before anything is saved.

## Login protection on the free tier

- The login action throttles repeated failures (5 per 15 minutes per email and IP). On serverless
  hosting this is in-memory and best effort only.
- Supabase Auth applies its own rate limits. For stronger protection, enable CAPTCHA under
  **Authentication > Attack Protection** and use a long, unique admin password.

## Nutrition data

Nutrition values are estimates. Verify them against IFCT (Indian Food Composition Tables) or USDA
FoodData Central before launch. Nutrition fields are optional: the nutrition panel, calorie badge,
and the high-protein, calorie and nutrition-sort filters appear only once items have those values.

## Project layout

```
app/            public menu and /admin routes (with server actions)
components/     menu/ (public), admin/, ui/
lib/            menu.ts (repository), validation, csv, filters, supabase clients
types/          shared TypeScript types
data/           menu.json seed file
supabase/       schema.sql (tables, RLS, storage)
scripts/        seed.ts
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks) |
| `npm run lint` | ESLint |
| `npm run seed` | Load `data/menu.json` into Supabase |

## Planned later (designed for, not built)

Cart and checkout, WhatsApp ordering (a `wa.me` link helper already exists in `lib/format.ts`),
loyalty points, multi-role staff accounts, and an AI diet recommender.
