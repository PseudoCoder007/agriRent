# AgriRent Testing Guide

This folder contains step-by-step manual test procedures for every feature in AgriRent. Each document walks you through what to do and what to expect.

No automated test knowledge needed — just a browser and a few minutes per feature.

## How to use

1. Open the app at [agrirent.shop](https://agrirent.shop) (or `http://localhost:3000` locally)
2. Pick a feature below
3. Follow the steps in order

## Test documents

| # | Feature | What it covers |
|---|---------|----------------|
| 01 | [Authentication](01-authentication.md) | Sign up, log in, log out, password reset |
| 02 | [Equipment Listings](02-equipment-listings.md) | Create, browse, view, edit, delete listings |
| 03 | [Bookings](03-bookings.md) | Request, approve, reject, complete, cancel bookings |
| 04 | [Favorites](04-favorites.md) | Save and unsave equipment |
| 05 | [Reviews](05-reviews.md) | Write and read reviews |
| 06 | [Notifications](06-notifications.md) | Bell icon, unread count, mark as read |
| 07 | [Profile](07-profile.md) | Edit name, phone, upload avatar |
| 08 | [AI Chat](08-ai-chat.md) | AgriMate AI assistant |
| 09 | [Full Flow Smoke Test](09-full-flow-smoke-test.md) | End-to-end walkthrough of the entire app |

## Tips

- Create two accounts (one farmer, one owner) — most features need both roles
- Use real image files under 5 MB for uploads
- For booking tests, pick future dates (today + 2 days, today + 5 days)
