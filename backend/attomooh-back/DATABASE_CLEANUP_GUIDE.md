# تنظيف قاعدة البيانات - دليل سريع

## المشكلة

الخطأ:
```
[Error: Invalid salt. Salt must be in the form of: $Vers$log2(NumRounds)$saltvalue]
```

**السبب**: بيانات قديمة في `employees` collection لديها password hash تالف أو غير صحيح.

## الحلول

### الحل 1: MongoDB Compass (الأسهل ✅)

1. افتح **MongoDB Compass**
2. اتصل بقاعدة البيانات
3. اختر database المشروع
4. احذف collections التالية:
   - ✅ `employees` → اضغط Drop Collection
   - ✅ `users` → اضغط Drop Collection (إذا موجودة)
5. أعد تشغيل التطبيق:
   ```bash
   npm run start:dev
   ```

### الحل 2: mongosh (Command Line)

```bash
# الاتصال
mongosh "your-mongodb-uri"

# حذف البيانات
use your-database-name
db.employees.drop()
db.users.drop()
exit

# إعادة تشغيل التطبيق
npm run start:dev
```

### الحل 3: باستخدام الـ Script (يحتاج اتصال بالإنترنت)

```bash
cd backend/attomooh-back
npx tsx src/database/migrations/clean-employees.ts
npm run start:dev
```

## بعد حذف البيانات

عند إعادة تشغيل التطبيق، سيقوم `DatabaseSeeder` تلقائياً بإنشاء:

1. ✅ **Admin Employee**
   - Email: `admin@company.com`
   - Password: `Admin@123`
   - customId: `EMP-000001`

2. ✅ **Technicians**
   - `abo hane` (EMP-000002)
   - `abdalwahab` (EMP-000003)
   - Password لكلاهما: `Tech@123`

## التحقق من نجاح الحل

بعد إعادة التشغيل، يجب أن ترى:
```
[Nest] LOG [DatabaseSeeder] Admin employee seeded successfully
[Nest] LOG [DatabaseSeeder] Technician "abo hane" seeded successfully
[Nest] LOG [DatabaseSeeder] Technician "abdalwahab" seeded successfully
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [Bootstrap] 🚀 Application is running on: http://localhost:3000
```

## إذا استمرت المشكلة

تأكد من:

1. حذف `node_modules` و `dist`:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   npm run start:dev
   ```

2. التأكد من `.env` فيه:
   ```
   MONGODB_URI=your-connection-string
   BCRYPT_SALT_ROUNDS=10
   ADMIN_EMAIL=admin@company.com
   ADMIN_PASSWORD=Admin@123
   ADMIN_NAME=Admin
   ADMIN_PHONE=05484584
   ```
