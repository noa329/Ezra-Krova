# עזרה קרובה — תכנון הפרויקט

פלטפורמת עזרה הדדית בחירום המחברת בין אנשים הזקוקים לעזרה לבין מתנדבים, בזמן אמת, לפי מיקום וקטגוריה.

**Stack:** Node.js + Express + MongoDB (Atlas) + Angular 17 + Socket.io

---

## החלטות ארכיטקטורה

- **מפות:** OpenStreetMap + Leaflet + Nominatim — חינמי, ללא מפתח API וללא כרטיס אשראי.
- **בסיס נתונים:** MongoDB Atlas (ענן). ה-connection string נשמר רק ב-`.env` המקומי (נמצא ב-`.gitignore`) ולעולם לא נכנס לקומיט.
- **Git:** כל פיצ'ר נבנה בברנץ' נפרד (`feature/<name>`) וממוזג ל-`main` בסיום השלב.
- **Angular 17:** standalone components (ללא NgModules).
- **משתמש אחיד:** כל משתמש רשום יכול גם לבקש עזרה וגם להתנדב. `admin` הוא תפקיד נפרד.

---

## מבנה תיקיות עליון

```
EzraKrova/
  server/      Node + Express + MongoDB + Socket.io
  client/      Angular 17
  PLANNING.md
  README.md
  .gitignore
```

---

## מודל הנתונים

### Users
- `name` (חובה), `phone` (ייחודי, משמש כשם משתמש), `password` (bcrypt)
- `role`: `'user' | 'admin'` (ברירת מחדל `user`)
- `profileImage` (נתיב קובץ, הועלה ב-multer)
- `location`: GeoJSON Point `[lng, lat]`
- `volunteerProfile`: `{ capabilities: [], radius: Number, isAvailable: Boolean }`
- `rating`: `{ avg: Number, count: Number }` (שדרוג)
- `createdAt`

### Requests
- `requesterId` (ref User, חובה)
- `category`: `'לינה' | 'הסעה' | 'מזון' | 'תרופות' | 'ילדים' | 'נפשי'`
- `description` (חובה), `location` (GeoJSON Point), `city`
- `urgency`: `'high' | 'medium' | 'low'` (ברירת מחדל `medium`)
- `status`: `'open' | 'locked' | 'closed' | 'disputed'` (ברירת מחדל `open`)
- `volunteerId` (ref User, null עד נעילה)
- `requesterConfirmed`, `volunteerConfirmed` (Boolean)
- `createdAt`

---

## API Routes

### Auth — `/api/auth`
- `POST /register` → רישום, מחזיר JWT
- `POST /login` → התחברות, מחזיר JWT

### Users — `/api/users`
- `GET /me` → פרופיל נוכחי [auth]
- `PUT /me` → עדכון פרופיל + volunteerProfile [auth]
- `POST /me/image` → העלאת תמונת פרופיל (multer) [auth]
- `GET /` → כל המשתמשים [admin]
- `DELETE /:id` → מחיקה/חסימה [admin]

### Requests — `/api/requests`
- `POST /` → בקשה חדשה [auth + shabbatGuard]
- `GET /` → כל הבקשות הפתוחות [auth]
- `GET /nearby` → בקשות לפי מיקום + רדיוס + יכולות המתנדב [auth]
- `GET /my` → הבקשות שלי [auth]
- `GET /:id` → בקשה בודדת [auth]
- `PUT /:id` → עדכון [owner]
- `DELETE /:id` → מחיקה [owner / admin]
- `POST /:id/lock` → נעילה אטומית (מניעת race) [auth]
- `POST /:id/confirm` → אישור השלמה [auth — מבקש או מתנדב]
- `POST /:id/rate` → דירוג הצד השני אחרי סגירה (שדרוג) [auth]

---

## Socket.io Events

**Server → Client:**
- `new-request` — שידור לכל המחוברים כשנוצרת בקשה
- `request-locked` — שידור כשמתנדב נועל בקשה (`requestId`, `volunteerName`)
- `request-completed` — שידור כששני הצדדים אישרו
- `request-status-update` — לחדר האישי של משתמש כשהסטטוס משתנה

**Client → Server:**
- `join` — הצטרפות לחדר אישי (`userId`)

---

## Middleware

1. `authMiddleware` — אימות JWT, צירוף `req.user`
2. `adminMiddleware` — בדיקת `role === 'admin'`
3. `shabbatGuard` — חסימת `POST /requests` בשישי 18:00 עד מוצ"ש
   - `(day === 5 && hour >= 18) || day === 6` → `403 { message: 'השירות אינו זמין בשבת' }`

---

## דרישות Mongoose

1. `pre('save')` על User → האש סיסמה ב-bcrypt
2. `toJSON()` על User → הסרת שדה `password` מכל תשובה
3. `pre('save')` על Request → קביעת `city` מקואורדינטות (reverse geocode דרך Nominatim, נכשל בשקט אם אין רשת)

---

## לוגיקה עסקית מרכזית

### אלגוריתם התאמה (`GET /requests/nearby`)
סינון בקשות לפי: בתוך רדיוס המתנדב + הקטגוריה ביכולות המתנדב + `status === 'open'`.
מיון: דחיפות (high קודם), ואז מרחק (הקרוב קודם).

### נעילה אטומית (`POST /requests/:id/lock`)
`findOneAndUpdate({ _id, status: 'open' }, { status: 'locked', volunteerId })`.
אם התוצאה `null` → הבקשה כבר נתפסה → `409 Conflict`.

### זרימת השלמה
שני הצדדים חייבים לאשר (`requesterConfirmed` + `volunteerConfirmed`).
כששניהם `true` → `status: 'closed'` + שידור `request-completed`.

---

## העלאת תמונת פרופיל (multer)
- `diskStorage`, יעד: `uploads/profiles/`
- שם קובץ: `userId + timestamp + ext`
- פילטר: תמונות בלבד (jpg, png, webp)
- מגבלה: 5MB
- הגשה סטטית: `app.use('/uploads', express.static('uploads'))`

---

## משתני סביבה (.env)

```
PORT=3000
MONGO_URI=<Atlas connection string — לא נכנס לקומיט>
JWT_SECRET=<יווצר אוטומטית>
CLIENT_URL=http://localhost:4200
```

---

## מבנה Angular (feature-based)

```
src/app/features/
  auth/        login, register, auth.guard.ts, auth.service.ts
  requests/    request-form, requests-list, request-card, request-detail, my-requests, requests.service.ts
  volunteer/   volunteer-dashboard, profile-settings
  admin/       users-table, requests-table
  shared/      navbar, request-card
  core/        interceptors (JWT), socket.service.ts
```

### מסכים
- **ציבורי:** `/home`, `/login`, `/register`
- **משתמש מחובר:** `/requests`, `/requests/new`, `/requests/:id`, `/my-requests`, `/volunteer`, `/profile`
- **אדמין:** `/admin/users`, `/admin/requests`

---

## שלבי בנייה (כל שלב = ברנץ')

### שרת
1. `feature/server-setup` — Express + Mongo Atlas + Socket.io + helmet + rate-limit + `.env` + מבנה תיקיות
2. `feature/auth` — User model (bcrypt pre-save + toJSON), authMiddleware, register/login עם JWT
3. `feature/users` — routes לפרופיל, multer, ו-admin (list/delete)
4. `feature/requests` — Request model (geo index + city pre-save), shabbatGuard, CRUD
5. `feature/requests-lock-confirm` — נעילה אטומית (409) וזרימת אישור השלמה
6. `feature/requests-nearby` — אלגוריתם התאמת בקשות קרובות
7. `feature/rating` — דירוג ומוניטין אחרי סגירת בקשה
8. `feature/sockets` — אירועי Socket.io
9. `feature/ci-tests` — בדיקות Jest לשרת + GitHub Actions CI

### לקוח
10. `feature/client-setup` — פרויקט Angular 17 standalone + RTL/עברית + routing
11. `feature/client-core` — JWT interceptor, socket.service, auth.service + auth.guard
12. `feature/client-auth` — מסכי home/login/register
13. `feature/client-requests` — list/form/detail/my-requests/request-card
14. `feature/client-volunteer` — volunteer-dashboard + profile-settings
15. `feature/client-admin` — users-table + requests-table + ניהול מחלוקות (disputed)
16. `feature/client-shared` — navbar, עיצוב כללי, אינטגרציית מפת Leaflet

---

## שדרוגים שנכללים
- דירוג ומוניטין למתנדבים.
- Rate limiting + helmet לאבטחת ה-API.
- בדיקות אוטומטיות (Jest) + GitHub Actions ל-CI.
- מסך ניהול מחלוקות לאדמין (סטטוס `disputed`).

## שדרוגים לעתיד (לא עכשיו)
- צ'אט בזמן אמת בין מבקש למתנדב.
- התראות Push / PWA לרקע.
