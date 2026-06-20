# EzraKrova — Tasks & QA

Track bug fixes, features, and release checklist.

---

## Current Sprint

| # | Item | Description | Status |
|---|------|-------------|--------|
| 1 | Profile picture display | Fix upload → save → render flow; resolve image URLs (Cloudinary + legacy local paths) | ✅ |
| 2 | Cloudinary image storage | Profile uploads via `multer-storage-cloudinary` → `ezrakrova/profile-images`; URL saved in `profileImage` | ✅ |
| 3 | Location input (manual + device) | Manual address with Nominatim autocomplete + device geolocation button; used in request form and profile settings | ✅ |
| 4 | MongoDB Atlas connection | Atlas URI in `.env`, startup logs confirm cluster vs local (credentials masked) | ✅ |
| 5 | TASKS.md | This file — tracks status, upgrades, and QA checklist | ✅ |

---

## Environment Variables (server/.env)

Copy from `server/.env.example` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CLIENT_URL` | Yes | Angular app URL for CORS |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For uploads | Cloudinary API secret |

**Geocoding:** Uses OpenStreetMap Nominatim via server proxy (`/api/geocode`) — no API key needed.

Without Cloudinary credentials the server starts normally but profile image uploads return a Hebrew error message.

---

## Upgrade Notes (Future Features)

- **Ratings UI** — `POST /requests/:id/rate` exists; add client rating dialog after request closure ✅
- **Leaflet map** — show request/volunteer locations on an interactive map (PLANNING.md)
- **Push notifications** — notify volunteers of nearby requests
- **SMS verification** — phone OTP on registration
- **Admin dashboard** — stats, charts, export
- **Dispute resolution** — admin workflow for `disputed` requests
- **Image cleanup** — delete old Cloudinary assets when user replaces profile photo
- **Migrate legacy uploads** — one-time script to move existing `server/uploads/` files to Cloudinary

---

## Manual QA Checklist (Before Each Release)

### Auth
- [ ] Register new user with valid phone/password
- [ ] Login with registered credentials
- [ ] Logout clears session
- [ ] Protected routes redirect unauthenticated users

### Profile & Images
- [ ] Upload profile image (Cloudinary configured) — image displays immediately after upload
- [ ] Refresh page — profile image persists
- [ ] Upload without Cloudinary creds — Hebrew error shown, server does not crash

### Location
- [ ] Request form: type city name — autocomplete suggestions appear
- [ ] Select suggestion — location marked as set, request submits successfully
- [ ] Request form: "use device location" — fills address (or coordinates if reverse geocode fails)
- [ ] Deny geolocation permission — Hebrew error, manual input still works
- [ ] Profile settings: save volunteer location — nearby requests work on volunteer dashboard

### Requests
- [ ] Create request with all fields
- [ ] View open requests list
- [ ] Lock request as volunteer
- [ ] Confirm completion (both parties)
- [ ] Shabbat guard blocks new requests Fri 18:00 – Sat night

### Real-time
- [ ] New request appears in list without refresh (Socket.io)
- [ ] Lock/completion events update UI

### Admin
- [ ] Admin can view users table
- [ ] Admin can delete user

### Infrastructure
- [ ] Server startup logs MongoDB Atlas cluster name (not credentials)
- [ ] Server startup warns if Cloudinary not configured
- [ ] `npm test` passes in server
- [ ] Client builds without errors (`ng build`)
