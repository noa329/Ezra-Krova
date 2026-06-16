# עזרה קרובה (EzraKrova)

פלטפורמת עזרה הדדית בחירום — מחברת בין אנשים הזקוקים לסיוע לבין מתנדבים, בזמן אמת, לפי מיקום וקטגוריה.

## מה זה עזרה קרובה?

עזרה קרובה היא מערכת דיגיטלית המאפשרת:
- **פתיחת בקשות עזרה** בקטגוריות: לינה, הסעה, מזון, תרופות, ילדים, נפשי
- **התנדבות לפי מיקום** — מתנדבים רואים בקשות בסביבתם לפי רדיוס מוגדר
- **תקשורת בזמן אמת** — עדכוני Socket.io
- **אישור דו-צדדי** — הן המבקש והן המתנדב מאשרים השלמה
- **מערכת דירוג** — ניתן לדרג אחד את השני לאחר סיום

## טכנולוגיות

### שרת (Backend)
- Node.js + Express
- MongoDB Atlas (Mongoose)
- Socket.io
- JWT Authentication
- Multer (העלאת תמונות)

### לקוח (Frontend)
- Angular 17 (Standalone Components)
- Angular Material
- Leaflet (מפות)
- Socket.io Client

## הרצה מקומית

### שרת
```bash
cd server
cp .env.example .env
# ערוך את .env עם פרטי MongoDB Atlas שלך
npm install
npm run dev
```

### לקוח
```bash
cd client
npm install
npm start
```

## מבנה הפרויקט

```
EzraKrova/
├── server/
│   ├── config/        # הגדרות DB ו-Multer
│   ├── controllers/   # לוגיקה עסקית
│   ├── middleware/    # Auth, Admin, Shabbat Guard
│   ├── models/        # Mongoose schemas
│   ├── routes/        # API routes
│   ├── sockets/       # Socket.io handlers
│   └── uploads/       # תמונות פרופיל
└── client/
    └── src/
        └── app/
            ├── core/          # Services, interceptors
            └── features/      # Components by feature
```

## הערות חשובות

- **שבת גארד**: השירות חסום בשבת (שישי 18:00 — מוצ"ש)
- **2dsphere index**: נדרש עבור שאילתות מיקום ($near)
- לפני הרצה יש להגדיר MONGO_URI ו-JWT_SECRET ב-.env
