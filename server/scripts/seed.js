const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Request = require('../models/Request');

const PASSWORD = 'Test1234';
const CATEGORIES = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];

const ISRAELI_CITIES = [
  { name: 'תל אביב-יפו', coordinates: [34.7818, 32.0853] },
  { name: 'ירושלים', coordinates: [35.2137, 31.7683] },
  { name: 'חיפה', coordinates: [34.9896, 32.794] },
  { name: 'באר שבע', coordinates: [34.7915, 31.2529] },
  { name: 'נתניה', coordinates: [34.8595, 32.3215] },
  { name: 'אשדוד', coordinates: [34.6506, 31.8044] },
  { name: 'רמת גן', coordinates: [34.814, 32.082] },
  { name: 'ראשון לציון', coordinates: [34.8018, 31.973] },
  { name: 'פתח תקווה', coordinates: [34.872, 32.084] },
  { name: 'הרצליה', coordinates: [34.8414, 32.1663] },
  { name: 'בני ברק', coordinates: [34.8338, 32.0907] },
  { name: 'אילת', coordinates: [34.9482, 29.5577] },
];

const userTemplates = [
  {
    name: 'יעל כהן',
    phone: '0501111001',
    isVolunteer: true,
    cityIndex: 0,
    volunteerProfile: { capabilities: ['מזון', 'הסעה'], radius: 15, isAvailable: true },
    rating: { avg: 4.8, count: 12 },
  },
  {
    name: 'דוד לוי',
    phone: '0501111002',
    isVolunteer: true,
    cityIndex: 1,
    volunteerProfile: { capabilities: ['לינה', 'ילדים'], radius: 20, isAvailable: true },
    rating: { avg: 4.5, count: 8 },
  },
  {
    name: 'מירי אשכנזי',
    phone: '0501111003',
    isVolunteer: true,
    cityIndex: 2,
    volunteerProfile: { capabilities: ['תרופות', 'נפשי'], radius: 10, isAvailable: true },
    rating: { avg: 5.0, count: 5 },
  },
  {
    name: 'אבי פרץ',
    phone: '0501111004',
    isVolunteer: true,
    cityIndex: 3,
    volunteerProfile: { capabilities: ['הסעה', 'תרופות'], radius: 25, isAvailable: true },
    rating: { avg: 4.2, count: 15 },
  },
  {
    name: 'רונית מזרחי',
    phone: '0501111005',
    isVolunteer: true,
    cityIndex: 4,
    volunteerProfile: { capabilities: ['מזון', 'ילדים'], radius: 12, isAvailable: false },
    rating: { avg: 4.6, count: 9 },
  },
  {
    name: 'יוסי גולדברג',
    phone: '0501111006',
    isVolunteer: true,
    cityIndex: 5,
    volunteerProfile: { capabilities: ['לינה', 'מזון'], radius: 18, isAvailable: true },
    rating: { avg: 4.9, count: 20 },
  },
  {
    name: 'נועה שפירא',
    phone: '0501111007',
    isVolunteer: true,
    cityIndex: 6,
    volunteerProfile: { capabilities: ['נפשי', 'ילדים'], radius: 8, isAvailable: true },
    rating: { avg: 4.7, count: 6 },
  },
  {
    name: 'איתמר בן דוד',
    phone: '0501111008',
    isVolunteer: true,
    cityIndex: 7,
    volunteerProfile: { capabilities: ['הסעה', 'מזון', 'תרופות'], radius: 30, isAvailable: true },
    rating: { avg: 4.4, count: 11 },
  },
  {
    name: 'שירה רוזנברג',
    phone: '0502222001',
    isVolunteer: false,
    cityIndex: 0,
  },
  {
    name: 'משה אברהם',
    phone: '0502222002',
    isVolunteer: false,
    cityIndex: 1,
  },
  {
    name: 'תמר חדד',
    phone: '0502222003',
    isVolunteer: false,
    cityIndex: 4,
  },
  {
    name: 'אלון סגל',
    phone: '0502222004',
    isVolunteer: false,
    cityIndex: 8,
  },
  {
    name: 'הדס לוי',
    phone: '0502222005',
    isVolunteer: false,
    cityIndex: 10,
  },
];

const requestTemplates = [
  {
    requesterIndex: 8,
    volunteerIndex: 0,
    category: 'מזון',
    description: 'משפחה עם 3 ילדים צריכה סלי מזון בסיסי לשבוע הקרוב. אין לנו אפשרות לצאת מהבית בגלל מצב רפואי.',
    cityIndex: 0,
    urgency: 'high',
    status: 'open',
  },
  {
    requesterIndex: 9,
    volunteerIndex: 1,
    category: 'הסעה',
    description: 'דרושה הסעה לבית החולים הדסה עין כרם למחר בבוקר. אין רכב זמין והתחבורה הציבורית מוגבלת.',
    cityIndex: 1,
    urgency: 'high',
    status: 'open',
  },
  {
    requesterIndex: 10,
    volunteerIndex: 2,
    category: 'לינה',
    description: 'משפחה מפונים מחפשת מקום לינה זמני ל-3 לילות, 2 מבוגרים וילדה בת 6.',
    cityIndex: 2,
    urgency: 'medium',
    status: 'open',
  },
  {
    requesterIndex: 11,
    volunteerIndex: 3,
    category: 'תרופות',
    description: 'קשישה בת 78 זקוקה לאיסוף תרופות כרוניות מבית המרקחת ברחוב הרצל. לא יכולה לצאת לבד.',
    cityIndex: 3,
    urgency: 'medium',
    status: 'open',
  },
  {
    requesterIndex: 12,
    volunteerIndex: 4,
    category: 'נפשי',
    description: 'מחפש/ת ליווי רגשי קצר ושיחה טלפונית הערב. מרגיש/ה לחץ וחרדה לאחר ימים קשים.',
    cityIndex: 4,
    urgency: 'low',
    status: 'open',
  },
  {
    requesterIndex: 8,
    volunteerIndex: 5,
    category: 'ילדים',
    description: 'זקוקים לבייביסיטר ל-2 ילדים בגילאי 4 ו-7 למשך 4 שעות מחר אחר הצהריים.',
    cityIndex: 6,
    urgency: 'medium',
    status: 'open',
  },
  {
    requesterIndex: 9,
    volunteerIndex: 6,
    category: 'מזון',
    description: 'זקוקים לחבילת מזון יבש לשבוע — 2 מבוגרים, אין גישה לסupermarket קרוב.',
    cityIndex: 5,
    urgency: 'high',
    status: 'open',
  },
  {
    requesterIndex: 10,
    volunteerIndex: 0,
    category: 'הסעה',
    description: 'נדרשת הסעה לטיפול דialysis ביום שלישי וחמישי בשעה 07:00.',
    cityIndex: 0,
    urgency: 'high',
    status: 'locked',
  },
  {
    requesterIndex: 11,
    volunteerIndex: 1,
    category: 'לינה',
    description: 'זוג מבוגרים מחפש לינה ללילה אחד עד שמצאו דירה חלופית.',
    cityIndex: 1,
    urgency: 'medium',
    status: 'locked',
  },
  {
    requesterIndex: 12,
    volunteerIndex: 2,
    category: 'תרופות',
    description: 'איסוף תרופות דחופות מבית מרקחת בחיפה — אין אפשרות להגיע בעצמי.',
    cityIndex: 2,
    urgency: 'high',
    status: 'locked',
  },
  {
    requesterIndex: 8,
    volunteerIndex: 3,
    category: 'מזון',
    description: 'משפחה עם תינוק זקוקה לעזרה בהכנת ארוחות חמות ל-3 ימים.',
    cityIndex: 7,
    urgency: 'medium',
    status: 'locked',
  },
  {
    requesterIndex: 9,
    volunteerIndex: 4,
    category: 'ילדים',
    description: 'ילד בן 9 זקוק לליווי לחוג כדורגל פעמיים בשבוע.',
    cityIndex: 4,
    urgency: 'low',
    status: 'locked',
  },
  {
    requesterIndex: 10,
    volunteerIndex: 5,
    category: 'הסעה',
    description: 'הסעה לבדיקות רפואיות בבית חולים אסף הרופא — הושלמה בהצלחה.',
    cityIndex: 8,
    urgency: 'medium',
    status: 'closed',
    requesterConfirmed: true,
    volunteerConfirmed: true,
  },
  {
    requesterIndex: 11,
    volunteerIndex: 6,
    category: 'מזון',
    description: 'חלוקת מזון ל-5 ימים למשפחה בת 4 נפשות — הושלמה.',
    cityIndex: 5,
    urgency: 'high',
    status: 'closed',
    requesterConfirmed: true,
    volunteerConfirmed: true,
  },
  {
    requesterIndex: 12,
    volunteerIndex: 7,
    category: 'נפשי',
    description: 'שיחת תמיכה טלפונית למשך שבוע — הושלמה.',
    cityIndex: 10,
    urgency: 'low',
    status: 'closed',
    requesterConfirmed: true,
    volunteerConfirmed: true,
  },
  {
    requesterIndex: 8,
    volunteerIndex: 0,
    category: 'תרופות',
    description: 'איסוף תרופות מבית מרקחת ברמת גן — הושלם.',
    cityIndex: 6,
    urgency: 'medium',
    status: 'closed',
    requesterConfirmed: true,
    volunteerConfirmed: true,
  },
  {
    requesterIndex: 9,
    volunteerIndex: 1,
    category: 'לינה',
    description: 'לינה זמנית ל-2 לילות למשפחה מפונה — הושלמה.',
    cityIndex: 1,
    urgency: 'high',
    status: 'closed',
    requesterConfirmed: true,
    volunteerConfirmed: true,
  },
  {
    requesterIndex: 10,
    volunteerIndex: 2,
    category: 'ילדים',
    description: 'ליווי ילדים לגן בבוקר במשך שבוע — הושלם.',
    cityIndex: 9,
    urgency: 'medium',
    status: 'closed',
    requesterConfirmed: true,
    volunteerConfirmed: true,
  },
];

const printUsage = () => {
  console.log('Usage: node scripts/seed.js --force');
  console.log('');
  console.log('This script clears all User and Request documents and inserts seed data.');
  console.log('Pass --force to confirm deletion. Without it, no changes are made.');
  console.log('');
  console.log('  npm run seed -- --force');
};

const buildUserDoc = (template) => {
  const city = ISRAELI_CITIES[template.cityIndex];
  const doc = {
    name: template.name,
    phone: template.phone,
    password: PASSWORD,
    role: 'user',
    location: {
      type: 'Point',
      coordinates: city.coordinates,
    },
  };

  if (template.isVolunteer) {
    doc.volunteerProfile = template.volunteerProfile;
    if (template.rating) doc.rating = template.rating;
  }

  return doc;
};

const buildRequestDoc = (template, users) => {
  const city = ISRAELI_CITIES[template.cityIndex];
  const doc = {
    requesterId: users[template.requesterIndex]._id,
    category: template.category,
    description: template.description,
    location: {
      type: 'Point',
      coordinates: city.coordinates,
    },
    city: city.name,
    urgency: template.urgency,
    status: template.status,
  };

  if (template.status === 'locked' || template.status === 'closed') {
    doc.volunteerId = users[template.volunteerIndex]._id;
  }

  if (template.status === 'closed') {
    doc.requesterConfirmed = template.requesterConfirmed ?? true;
    doc.volunteerConfirmed = template.volunteerConfirmed ?? true;
  }

  return doc;
};

const seed = async () => {
  await connectDB();

  console.log('Clearing User and Request collections...');
  const [deletedRequests, deletedUsers] = await Promise.all([
    Request.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log(`  Removed ${deletedUsers.deletedCount} users, ${deletedRequests.deletedCount} requests`);

  console.log(`Creating ${userTemplates.length} users...`);
  const createdUsers = [];
  for (const template of userTemplates) {
    const user = await User.create(buildUserDoc(template));
    createdUsers.push(user);
    const label = template.isVolunteer ? 'volunteer' : 'requester';
    console.log(`  + ${user.name} (${user.phone}) [${label}]`);
  }

  const volunteerCount = userTemplates.filter((u) => u.isVolunteer).length;
  const requesterCount = userTemplates.length - volunteerCount;

  console.log(`Creating ${requestTemplates.length} help requests...`);
  const requestDocs = requestTemplates.map((t) => buildRequestDoc(t, createdUsers));
  const createdRequests = await Request.insertMany(requestDocs);

  const statusCounts = createdRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  for (const request of createdRequests) {
    const requester = createdUsers.find((u) => u._id.equals(request.requesterId));
    console.log(`  + [${request.status}] ${request.category} — ${request.city} (${requester?.name})`);
  }

  console.log('\nSeed completed successfully.');
  console.log(`  Users created: ${createdUsers.length} (${volunteerCount} volunteers, ${requesterCount} requesters)`);
  console.log(`  Requests created: ${createdRequests.length}`);
  console.log(`  Request statuses: open=${statusCounts.open || 0}, locked=${statusCounts.locked || 0}, closed=${statusCounts.closed || 0}`);
  console.log(`  Categories used: ${CATEGORIES.join(', ')}`);
  console.log(`  Password for all users: ${PASSWORD}`);
};

const main = async () => {
  if (!process.argv.includes('--force')) {
    printUsage();
    process.exit(0);
  }

  try {
    await seed();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

main();
