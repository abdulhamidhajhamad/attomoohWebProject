# User to Employee Migration - Summary

## ما تم إنجازه

تم دمج جدولين (Users و Employees) في جدول واحد (Employees) بنجاح.

## التغييرات التي تمت

### 1. تحديث Database Seeder
- **الملف**: `src/database/seeders/database.seeder.ts`
- **التغيير**: استبدال `User` model بـ `Employee` model
- **التفاصيل**:
  - Admin و Technicians الآن يتم إنشاؤهم كـ Employees
  - تم إضافة `customId` و `jobTitle` لكل موظف
  - الحقول الاختيارية (email, password, role) تُستخدم فقط للموظفين الذين لديهم وصول للنظام

### 2. تحديث Database Module
- **الملف**: `src/database/database.module.ts`
- **التغيير**: استبدال `UserSchema` بـ `EmployeeSchema`

### 3. إزالة User Module
- **الملف**: `src/app.module.ts`
- **التغيير**: حذف `UserModule` من الـ imports
- **السبب**: لم يعد هناك حاجة له بعد دمج كل شيء في `EmployeesModule`

### 4. حذف مجلد User
- **المجلد**: `src/user/`
- **الملفات المحذوفة**:
  - `user.schema.ts`
  - `user.service.ts`
  - `user.controller.ts`
  - `user.module.ts`
  - `user.repository.ts`
  - جميع DTO files

### 5. تحديث Maintenance Module
- **الملفات**:
  - `src/maintenance/maintenance.service.ts`
  - `src/maintenance/maintenance.module.ts`
  - `src/maintenance/maintenance.controller.ts`
- **التغيير**: استبدال `UserService` بـ `EmployeesService` في جميع الأماكن

### 6. تحديث Service Orders Module
- **الملفات**:
  - `src/service-orders/service-orders.service.ts`
  - `src/service-orders/service-orders.module.ts`
- **التغيير**: استبدال `UserService` بـ `EmployeesService`

### 7. إنشاء Migration Script
- **الملف**: `src/database/migrations/migrate-users-to-employees.ts`
- **الغرض**: نقل البيانات من `users` collection إلى `employees` collection

## كيفية استخدام التغييرات

### الخطوة 1: نقل البيانات القديمة (إذا كانت موجودة)

إذا كان لديك بيانات في `users` collection، قم بتشغيل migration script:

```bash
npx tsx src/database/migrations/migrate-users-to-employees.ts
```

**ملاحظة**: راجع `src/database/migrations/README.md` للتفاصيل الكاملة.

### الخطوة 2: حذف Users Collection (اختياري)

بعد التأكد من نجاح الـ migration، يمكنك حذف `users` collection:

```javascript
// في MongoDB Shell
use your_database_name
db.users.drop()
```

### الخطوة 3: إعادة تشغيل التطبيق

```bash
npm run start:dev
```

عند بدء التطبيق، سيقوم DatabaseSeeder تلقائياً بإنشاء:
- Admin employee (إذا لم يكن موجوداً)
- Technician employees (إذا لم يكونوا موجودين)

## البنية الجديدة

### Employee Schema

الآن كل الموظفين (بما فيهم الذين لديهم وصول للنظام) يُخزّنون في `employees` collection:

```typescript
{
  customId: string,        // مطلوب - معرف فريد (مثل: EMP-000001)
  name: string,            // مطلوب
  phone: string,           // افتراضي
  jobTitle: string,        // افتراضي
  category: string,        // افتراضي (PERMANENT, TEMPORARY, etc.)
  area: ObjectId,          // اختياري - مرجع لـ Area
  address: string,         // افتراضي
  notes: string,           // افتراضي
  isActive: boolean,       // افتراضي: true

  // Auth fields (اختياري - للموظفين الذين لديهم وصول للنظام)
  email: string | null,    // اختياري - فريد
  password: string | null, // اختياري - مُشفّر
  role: string | null,     // اختياري (ADMIN, TECHNICIAN, USER)
  technicianStatus: string // افتراضي: AVAILABLE
}
```

## الفوائد

✅ **تبسيط البنية**: جدول واحد بدلاً من جدولين مكررين
✅ **سهولة الصيانة**: كود أقل وأوضح
✅ **مرونة أكبر**: موظف واحد يمكن أن يكون له وصول للنظام أو لا
✅ **تنظيم أفضل**: كل معلومات الموظفين في مكان واحد

## ملاحظات مهمة

⚠️ **Authentication**: النظام الآن يستخدم `Employee` model بالكامل للـ authentication
⚠️ **Seeding**: Admin والـ Technicians يتم إنشاؤهم كـ employees عند أول تشغيل
⚠️ **Backward Compatibility**: تم حذف User module بالكامل - لا يمكن الرجوع للنظام القديم إلا عبر Git

## الملفات المتأثرة

جميع الملفات التي تم تعديلها:

```
✅ src/database/seeders/database.seeder.ts
✅ src/database/database.module.ts
✅ src/app.module.ts
✅ src/maintenance/maintenance.service.ts
✅ src/maintenance/maintenance.module.ts
✅ src/maintenance/maintenance.controller.ts
✅ src/service-orders/service-orders.service.ts
✅ src/service-orders/service-orders.module.ts
❌ src/user/ (deleted)
➕ src/database/migrations/migrate-users-to-employees.ts
➕ src/database/migrations/README.md
```

## التواصل

إذا واجهت أي مشاكل بعد التحديث، تأكد من:
1. تشغيل migration script إذا كانت لديك بيانات قديمة
2. حذف `node_modules` و `dist` وإعادة البناء
3. التأكد من أن `.env` يحتوي على جميع المتغيرات المطلوبة
