# Playing the Market – Backend API Contract

This doc defines what the frontend can rely on from the API.
All routes require an `Authorization` header with the user’s email (no `Bearer`).

---

## Auth

All requests must include:

- `Authorization: <user-email>`
- `Content-Type: application/json` for any request with a body

Example:

```http
Authorization: alm157@gmail.com
Content-Type: application/json