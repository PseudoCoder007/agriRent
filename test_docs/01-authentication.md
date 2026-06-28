# Authentication

**What it does:** Lets users create accounts (as a Farmer or Owner), log in, log out, and reset their password if forgotten.

---

## 1. Sign Up

1. Open `/signup`
2. Enter your name, email, password, and pick a role (**Farmer** or **Owner**)
3. Click "Create account"
4. **Expected:** You are logged in and redirected to your dashboard

## 2. Log In

1. Open `/login`
2. Enter the email and password you signed up with
3. Click "Log in"
4. **Expected:** You land on your dashboard (farmer or owner)

## 3. Log Out

1. Click your avatar or name in the top-right corner
2. Click "Log out"
3. **Expected:** You are redirected to the home page

## 4. Session Persistence

1. Log in, then refresh the browser tab
2. **Expected:** You stay logged in (not redirected to login page)

## 5. Google OAuth

1. On `/login` or `/signup`, click "Continue with Google"
2. Authorise with a Google account
3. **Expected:** You are logged in. Note: Google signup defaults to the Farmer role.

## 6. Password Reset

1. Open `/forgot-password`
2. Enter the email you registered with and submit
3. **Expected:** "If an account exists, a reset link has been sent"
4. Open the link from your email, set a new password
5. Log in with the new password

## Edge Cases

- **Wrong password:** Shows "Invalid credentials" — never reveals if email exists
- **Duplicate email:** Shows "A user with this email already exists"
- **Rate limit:** If you request too many password resets, you'll see a "Too many requests" message
