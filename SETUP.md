# LaunchPath Waitlist Setup

## 1. Environment Variables
Ensure your `.env.local` has the following Supabase keys (already present in project):
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 2. Database Setup
Run the SQL migration in your Supabase SQL Editor to create the `waitlist` table and RLS policies.
File: `supabase/migrations/20240208_create_waitlist_table.sql`

## 3. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to see the waitlist page.

## 4. Tester login (auth)
Login is **sign-in only** (no public sign-up). To log in as a tester:

1. In Supabase Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Set email and password for the tester.
3. In the app, go to `/login` and sign in with those credentials. After login you are redirected to `/dashboard`.
4. Use **Log out** in the dashboard header to sign out.

Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing at your LaunchPath project.

## 5. Testing (waitlist)
- Try submitting a valid email.
- Try submitting an invalid email.
- Check the `waitlist` table in Supabase to verify the data.
