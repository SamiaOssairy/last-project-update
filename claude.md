# Claude.md — Family Hub Project Context
> Read this file before making ANY modification. It gives full project context so you never need to re-read the entire codebase.

---

## 1. Project Overview

**Name:** Family Hub (graduation project)
**Stack:** Node.js/Express backend · Flutter mobile/desktop app · React web (secondary, less active)
**Database:** MongoDB via Mongoose v9
**Auth:** JWT (family-scoped — one email can belong to multiple families)

---

## 2. Directory Structure

```
auth implementation/
├── backend/                  # Node.js + Express REST API
│   ├── server.js             # Entry point (starts server on PORT=8000)
│   ├── app.js                # Express setup, all routers registered here
│   ├── controllers/          # Request logic
│   ├── routes/               # Route → controller mapping
│   ├── models/               # Mongoose schemas
│   ├── utils/                # catchAsync, AppError, etc.
│   ├── scripts/              # Seed scripts
│   └── .env                  # Secrets (never commit)
├── flutter_app/
│   └── lib/
│       ├── main.dart         # App entry, routes map, MultiProvider
│       ├── pages/            # All screens
│       └── core/
│           ├── services/api_service.dart   # ALL HTTP calls centralized here
│           ├── localization/app_i18n.dart  # AppI18n.t(context, en, ar)
│           └── services/locale_service.dart
└── React_frontend/           # Secondary web client (less active)
```

---

## 3. Run Commands

```bash
# Backend
cd backend && npm run dev        # nodemon (development)
cd backend && npm start          # node server.js (production)

# Flutter
cd flutter_app && flutter run -d windows
cd flutter_app && flutter run -d chrome
cd flutter_app && flutter run              # mobile

# React
cd React_frontend && npm start
```

**Restart backend manually (when nodemon isn't running):**
```powershell
# Find PID on port 8000
netstat -ano | findstr ":8000"
# Kill it
Stop-Process -Id <PID> -Force
# Restart
cd backend; node server.js
```

---

## 4. Auth & JWT Pattern — CRITICAL

JWT payload: `{ id: family_id, member_id }`

The `protect` middleware (in `controllers/AuthController.js`) sets:
- `req.familyAccount` → full FamilyAccount document (has `._id`, `.Title`, `.mail`)
- `req.memberId` → ObjectId of the logged-in member
- `req.member` → full Member document

**Every protected controller uses:**
```javascript
const familyId  = req.familyAccount._id;
const memberId  = req.memberId;
```

All data is **family-scoped**: every query must include `{ family_id: familyId }`.

---

## 5. Backend Architecture

```
Route file  →  protect middleware  →  Controller  →  Model  →  JSON response
```

Error handling: wrap controllers in `catchAsync` from `utils/catchAsync.js`.
Throw errors with `new AppError(message, statusCode)` from `utils/appError.js`.
Global error handler in `app.js` formats all errors as `{ message: "..." }`.

---

## 6. All Registered API Routes (app.js)

| Prefix | Router file |
|--------|-------------|
| `/api/auth` | authRoutes.js |
| `/api/familyAccounts` | familyAccountRoutes.js |
| `/api/members` | memberRoutes.js |
| `/api/memberTypes` | memberTypeRoutes.js |
| `/api/tasks` | taskRoutes.js |
| `/api/task-categories` | taskCategoryRoutes.js |
| `/api/point-wallet` | pointWalletRoutes.js |
| `/api/point-history` | pointHistoryRoutes.js |
| `/api/wishlist` | wishlistRoutes.js |
| `/api/wishlist-categories` | wishlistCategoryRoutes.js |
| `/api/redeem` | redeemRoutes.js |
| `/api/budget` + `/api/budgets` | BudgetRoutes.js |
| `/api/planning` | planningRoutes.js ← **Planning AI** |
| `/api/units` | unitRoutes.js |
| `/api/recipes` | recipeRoutes.js |
| `/api/inventory` | inventoryRoutes.js |
| `/api/inventory-categories` | inventoryCategoryRoutes.js |
| `/api/inventory-alerts` | inventoryAlertRoutes.js |
| `/api/receipts` | receiptRoutes.js |
| `/api/meals` | mealRoutes.js |
| `/api/leftovers` | leftoverRoutes.js |
| `/api/meal-suggestions` | mealSuggestionRoutes.js |
| `/api/location` | locationRoutes.js |
| `/api/grocery-lists` | groceryRoutes.js |

---

## 7. Key Model Schemas (non-obvious fields — read before querying)

### Expense (`models/ExpenseModel.js`)
- `title` (String, required)
- `amount` (Number)
- `category` (String — plain string, NOT a ref)
- `expense_date` (Date) ← use this, NOT `date`
- `member_mail` (String) ← who recorded it, NOT `recorded_by`
- `family_id` (ObjectId ref FamilyAccount)
- ⚠️ Does NOT have `category_id` field — use `budget_category_id` if you need a ref to InventoryCategory

### Member (`models/MemberModel.js`)
- `username`, `mail`, `family_id`, `member_type_id` (ref MemberType), `birth_date`

### Task (`models/taskModel.js`)
- `title`, `created_by` (String/mail), `reward_type` ('points'|'money'|'both'), `money_reward`
- `category_id` (ref TaskCategory), `family_id`
- ⚠️ No `reward_points` field — points are in TaskDetails.assigned_points

### TaskDetails / task history (`models/task_historyModel.js`)
- `task_id` (ref Task), `member_mail` (String), `assigned_points`, `penalty_points`
- `status` ('assigned'|'in_progress'|'completed'|'late'|'approved'|'rejected')
- `assigned_by` (String/mail), `deadline` (Date)
- ⚠️ No `family_id` field — filter by joining with Task.family_id

### PointWallet (`models/point_walletModel.js`)
- `member_mail` (String), `family_id`, `total_points`

### PointHistory (`models/point_historyModel.js`)
- `wallet_id` (ref PointWallet), `member_mail`, `family_id`
- `points_amount`, `reason_type` ('task_completion'|'penalty'|'redeem'|'bonus'|'adjustment'|'manual_grant'|'conversion')
- `granted_by` (String/mail), `task_id` (optional ref), `description`

### Inventory (`models/inventoryModel.js`)
- `family_id`, `title`, `type` ('Food'|'Electronics'|'Cleaning'|'Personal Care'|'Other')

### InventoryItem (`models/inventoryItemModel.js`)
- `inventory_id` (ref Inventory — NOT family_id directly)
- `item_name`, `quantity`, `unit_id` (ref Unit), `item_category` (ref InventoryCategory)
- `threshold_quantity`, `expiry_date`
- ⚠️ No direct `family_id` — to query by family: find Inventory._ids first, then query InventoryItem

### InventoryCategory (`models/inventoryCategoryModel.js`)
- `title` (String) ← field is `title` NOT `name`

### Recipe (`models/recipeModel.js`)
- `recipe_name`, `member_mail`, `family_id`
- `category` (enum: 'Breakfast'|'Lunch'|'Dinner'|'Dessert'|'Snack'|'Appetizer'|'Main Course'|'Side Dish'|'Beverage'|'Other')
- `serving_size`, `prep_time`, `cook_time`, `description`

### RecipeIngredient (`models/recipeIngredientModel.js`)
- `recipe_id` (ref Recipe — NOT family_id directly)
- `ingredient_name`, `quantity`, `unit_id` (ref Unit), `notes`

### Meal (`models/mealModel.js`)
- `family_id`, `meal_name`, `meal_date`, `created_by` (String/mail — NOT ObjectId)
- `meal_type` ('Breakfast'|'Lunch'|'Dinner'|'Snack'), `recipe_id` (optional)

### Leftover (`models/leftoverModel.js`)
- `family_id`, `member_mail`, `item_name`, `quantity`, `unit_id`
- `expiry_date` (required), `date_added`, `meal_id` (optional), `category_id` (optional)

### FutureEvent (`models/futureEventModel.js`)
- `family_id`, `title`, `description`, `event_date`, `estimated_cost`
- `total_contributed_money`, `total_contributed_points`
- `funding_source` ('budget'|'member_contributions'|'points_redeem')
- `created_by` (String/mail)

### PeriodBudget (`models/periodBudgetModel.js`)
- `family_id`, `title`, `period_type` ('weekly'|'monthly'|'yearly'|'custom')
- `start_date`, `end_date`, `total_amount`, `spent_amount`
- `emergency_fund_percentage`, `emergency_fund_spent`, `is_active`

### PlanningConversation (`models/planningConversationModel.js`)
- `family_id`, `member_id`
- `messages[]`: `{ role: 'user'|'assistant', content: String, timestamp: Date }`

---

## 8. Planning AI Module (built in this project)

**Routes** (`routes/planningRoutes.js`) — all protected:
- `POST /api/planning/chat` → `sendMessage`
- `GET  /api/planning/history` → `getChatHistory`
- `DELETE /api/planning/history` → `clearHistory`

**Controller** (`controllers/PlanningAIController.js`):
- Uses **Google Gemini** (`@google/generative-ai` v0.24.1)
- Model: `gemini-2.5-flash-lite` (free tier, works as of May 2026)
- `gatherFamilyContext(familyId)` — runs 2 batches of parallel DB queries:
  - Batch 1: members, expenses, periodBudgets, pointWallets, pointHistory, tasks, taskDetails, futureEvents, inventories, recipes, recentMeals (last 7 days), leftovers (not expired)
  - Batch 2 (depends on batch 1 IDs): inventoryItems (quantity > 0), recipeIngredients
- `buildSystemPrompt(ctx, familyTitle)` — injects all family data as labelled sections
- Conversation history stored in MongoDB (PlanningConversation), last 10 msgs sent to Gemini as chat history
- Gemini role mapping: stored `'assistant'` → Gemini `'model'`

**Gemini API key** in `backend/.env`:
```
GEMINI_API_KEY=AIzaSyDWafwiWXBcCZux9PeTvuRoRN57JlNRmns
```

**⚠️ Known Gemini issues:**
- `gemini-1.5-flash` → 404 (deprecated in v1beta)
- `gemini-2.0-flash` / `gemini-2.0-flash-lite` → 429 quota exceeded on this key
- `gemini-2.5-flash-lite` → ✅ working

---

## 9. Flutter App

**Base URL:** `http://localhost:8000/api` (in `core/services/api_service.dart` line 6)

**All HTTP calls** go through `ApiService` class in `api_service.dart`. Always add new API methods there.

**Localization:** `AppI18n.t(context, 'English text', 'نص عربي')` — bilingual throughout.

**State management:** Provider (`MultiProvider` in `main.dart`). `FamilyBudgetProvider` is the main one.

**Navigation:** Named routes defined in `main.dart`. Add new screens there.

**Key pages:**
| Route | File |
|-------|------|
| `/home` | pages/home.dart |
| `/planning-chat` | pages/planning_chat_screen.dart |
| `/budget` | pages/budget/budget_dashboard_screen.dart |
| `/inventory` | pages/inventory_screen.dart |
| `/meals` | pages/meals_screen.dart |
| `/tasks` | pages/tasks_screen.dart |
| `/rewards` | pages/rewards_screen.dart |
| `/family-map` | pages/family_map_screen.dart |
| `/combined-wallet` | pages/wallet/combined_wallet_screen.dart |
| `/combined-analytics` | pages/analytics/combined_analytics_screen.dart |

**Planning AI screen** (`pages/planning_chat_screen.dart`):
- Suggestion chips, message bubbles (user=green right, AI=white left)
- Calls `_api.sendPlanningMessage()`, `getPlanningHistory()`, `clearPlanningHistory()`
- Bilingual, typing indicator, clear history button

---

## 10. Test Data (for habiba1278@gmail.com — "Habibo's fam")

Seed script: `backend/scripts/seed-ai-test-data.js`
Run: `node backend/scripts/seed-ai-test-data.js`

**Members seeded:**
- Habiba (Parent, habiba1278@gmail.com)
- Ahmed (Child, ahmed.family@gmail.com) — 310 pts total, 80 pts last 2 weeks
- Ziad (Child, ziad.family@gmail.com) — 220 pts total, 50 pts last 2 weeks
- Noor (Child, noor.family@gmail.com) — 145 pts total, 35 pts last 2 weeks

**Expenses (last 3 months):** Feb ~3500 EGP, Mar ~4600 EGP, Apr ~5300 EGP (overspent vs 5000 budget)

**Period budgets:** Feb/Mar/Apr/May 2026, 5000 EGP each

**Recipes:** Cheese Omelette, Tomato Rice, Pasta with Tomato Sauce, Cheese Sandwich, Green Salad, Pancakes

**Inventory:** Eggs (12), Cheese (400g), Milk (2L), Tomatoes (1kg), Rice (3kg), Pasta (500g), Bread (1), Flour (2kg), Olive Oil (500ml), Onion (5), Cucumber (4), Lettuce (1), Yogurt (3), Salt

**Leftovers:** Leftover Tomato Rice (expires +1 day), Leftover Pasta (expires +2 days)

**Future events:** Summer Family Trip (8000 EGP, 2000 contributed), Eid Shopping (3000, 500 contributed), Ahmed's School Trip (800, fully funded)

---

## 11. Known Gotchas & Fixed Bugs

1. **Expense.populate('category_id')** — field doesn't exist, throws Mongoose `strictPopulate` error. Use `e.category` (plain string field) instead.
2. **Expense date field** is `expense_date` NOT `date`.
3. **Expense recorder** is `member_mail` NOT `recorded_by`.
4. **Meal.created_by** is a String (member email) NOT ObjectId.
5. **TaskDetails has no family_id** — filter with `td.task_id?.family_id?.toString() === familyIdStr`.
6. **InventoryItem has no family_id** — must query via `Inventory._ids` first.
7. **RecipeIngredient has no family_id** — query via `Recipe._ids` first.
8. **InventoryCategory uses `title` not `name`**.
9. **Gemini model names** — only `gemini-2.5-flash-lite` works on this free-tier key (May 2026).

---

## 12. .env Variables

```
PORT=8000
DB=mongodb+srv://samia:<db_password>@cluster0.ncj8lb3.mongodb.net/?appName=Cluster0
DB_PASSWORD=samia123
JWT_SECRET=NodeJS_JWT_SECRET_PASSWORD_SECURE
JWT_EXPIRES_IN=90d
GEMINI_API_KEY=AIzaSyDWafwiWXBcCZux9PeTvuRoRN57JlNRmns
```

---

## 13. Adding a New Module — Checklist

1. Create `backend/models/newModel.js` with `family_id` field
2. Create `backend/controllers/newController.js` — wrap all exports in `catchAsync`, use `req.familyAccount._id`
3. Create `backend/routes/newRoutes.js` — apply `protect` middleware
4. Register in `backend/app.js`: `app.use('/api/new-thing', newRouter)`
5. Add API methods to `flutter_app/lib/core/services/api_service.dart`
6. Create screen in `flutter_app/lib/pages/new_screen.dart`
7. Add import + named route in `flutter_app/lib/main.dart`
8. Add navigation button in `flutter_app/lib/pages/home.dart` if needed

---

## 14. Quick Debug: Test Any Endpoint Without the App

```javascript
// backend/scripts/gen-token.js (or run inline)
const jwt = require('jsonwebtoken');
// family_id and member_id from DB
const token = jwt.sign({ id: '<family_id>', member_id: '<member_id>' }, process.env.JWT_SECRET, { expiresIn: '1h' });
```

Then:
```bash
curl -X POST http://localhost:8000/api/planning/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Your test question"}'
```
