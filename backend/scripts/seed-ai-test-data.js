/**
 * Comprehensive AI test data seed for habiba1278@gmail.com
 * Run: node backend/scripts/seed-ai-test-data.js
 *
 * Seeds: members, tasks, point wallets/history, 3 months of expenses,
 * period budgets, recipes + ingredients, inventory, meals, leftovers, future events.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const FamilyAccount    = require('../models/FamilyAccountModel');
const MemberType       = require('../models/MemberTypeModel');
const Member           = require('../models/MemberModel');
const TaskCategory     = require('../models/task_categoryModel');
const Task             = require('../models/taskModel');
const TaskDetails      = require('../models/task_historyModel');
const PointWallet      = require('../models/point_walletModel');
const PointHistory     = require('../models/point_historyModel');
const Expense          = require('../models/ExpenseModel');
const PeriodBudget     = require('../models/periodBudgetModel');
const FutureEvent      = require('../models/futureEventModel');
const Inventory        = require('../models/inventoryModel');
const InventoryCategory = require('../models/inventoryCategoryModel');
const InventoryItem    = require('../models/inventoryItemModel');
const Unit             = require('../models/unitModel');
const Recipe           = require('../models/recipeModel');
const RecipeIngredient = require('../models/recipeIngredientModel');
const Meal             = require('../models/mealModel');
const Leftover         = require('../models/leftoverModel');

dotenv.config({ path: path.join(__dirname, '../.env') });

const FAMILY_EMAIL = 'habiba1278@gmail.com';

const daysAgo      = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFromNow  = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

async function upsert(Model, query, data) {
  const existing = await Model.findOne(query);
  if (!existing) {
    const doc = await Model.create(data);
    console.log(`  + Created ${Model.modelName}: ${Object.values(query)[0]}`);
    return doc;
  }
  console.log(`  ~ Exists  ${Model.modelName}: ${Object.values(query)[0]}`);
  return existing;
}

async function seedData() {
  const dbStr = process.env.DB.replace('<db_password>', process.env.DB_PASSWORD);
  await mongoose.connect(dbStr);
  console.log('Connected to DB\n');

  // ── Family ────────────────────────────────────────────────────────────────
  const family = await FamilyAccount.findOne({ mail: FAMILY_EMAIL });
  if (!family) { console.error(`Family not found for ${FAMILY_EMAIL}`); process.exit(1); }
  console.log(`Family: "${family.Title}"  id=${family._id}\n`);

  // ── Member types ──────────────────────────────────────────────────────────
  console.log('=== Member Types ===');
  const parentType = await upsert(MemberType, { type: 'Parent', family_id: family._id },
    { type: 'Parent', family_id: family._id, Permissions: ['all'] });
  const childType  = await upsert(MemberType, { type: 'Child', family_id: family._id },
    { type: 'Child',  family_id: family._id, Permissions: ['view_tasks', 'complete_tasks'] });

  // ── Members ───────────────────────────────────────────────────────────────
  console.log('\n=== Members ===');
  await upsert(Member, { mail: FAMILY_EMAIL, family_id: family._id }, {
    username: 'Habiba', mail: FAMILY_EMAIL,
    family_id: family._id, member_type_id: parentType._id,
    birth_date: new Date(1985, 5, 15),
  });
  const ahmed = await upsert(Member, { mail: 'ahmed.family@gmail.com', family_id: family._id }, {
    username: 'Ahmed', mail: 'ahmed.family@gmail.com',
    family_id: family._id, member_type_id: childType._id,
    birth_date: new Date(2012, 2, 10),
  });
  const noor = await upsert(Member, { mail: 'noor.family@gmail.com', family_id: family._id }, {
    username: 'Noor', mail: 'noor.family@gmail.com',
    family_id: family._id, member_type_id: childType._id,
    birth_date: new Date(2015, 8, 20),
  });
  const ziad = await upsert(Member, { mail: 'ziad.family@gmail.com', family_id: family._id }, {
    username: 'Ziad', mail: 'ziad.family@gmail.com',
    family_id: family._id, member_type_id: childType._id,
    birth_date: new Date(2010, 0, 5),
  });

  // ── Task categories ───────────────────────────────────────────────────────
  console.log('\n=== Task Categories ===');
  const kitchenCat  = await upsert(TaskCategory, { title: 'Kitchen',  family_id: family._id }, { title: 'Kitchen',  family_id: family._id });
  const cleaningCat = await upsert(TaskCategory, { title: 'Cleaning', family_id: family._id }, { title: 'Cleaning', family_id: family._id });
  const gardenCat   = await upsert(TaskCategory, { title: 'Garden',   family_id: family._id }, { title: 'Garden',   family_id: family._id });
  const studyCat    = await upsert(TaskCategory, { title: 'Study',    family_id: family._id }, { title: 'Study',    family_id: family._id });

  // ── Tasks ─────────────────────────────────────────────────────────────────
  console.log('\n=== Tasks ===');
  const dishTask     = await upsert(Task, { title: 'Wash Dishes',   family_id: family._id }, { title: 'Wash Dishes',   description: 'Wash all dishes in the sink',             created_by: FAMILY_EMAIL, family_id: family._id, category_id: kitchenCat._id,  reward_type: 'points' });
  const mopTask      = await upsert(Task, { title: 'Mop Floor',     family_id: family._id }, { title: 'Mop Floor',     description: 'Mop the living room and kitchen floor',   created_by: FAMILY_EMAIL, family_id: family._id, category_id: cleaningCat._id, reward_type: 'points' });
  const tidyTask     = await upsert(Task, { title: 'Tidy Room',     family_id: family._id }, { title: 'Tidy Room',     description: 'Clean and organize your bedroom',          created_by: FAMILY_EMAIL, family_id: family._id, category_id: cleaningCat._id, reward_type: 'points' });
  const plantsTask   = await upsert(Task, { title: 'Water Plants',  family_id: family._id }, { title: 'Water Plants',  description: 'Water all plants in the garden',           created_by: FAMILY_EMAIL, family_id: family._id, category_id: gardenCat._id,   reward_type: 'points' });
  const tableTask    = await upsert(Task, { title: 'Set the Table', family_id: family._id }, { title: 'Set the Table', description: 'Set the dining table before meals',        created_by: FAMILY_EMAIL, family_id: family._id, category_id: kitchenCat._id,  reward_type: 'points' });
  const homeworkTask = await upsert(Task, { title: 'Do Homework',   family_id: family._id }, { title: 'Do Homework',   description: 'Complete all homework assignments',        created_by: FAMILY_EMAIL, family_id: family._id, category_id: studyCat._id,    reward_type: 'points' });

  // ── Point wallets ─────────────────────────────────────────────────────────
  console.log('\n=== Point Wallets ===');
  const ahmedWallet = await upsert(PointWallet, { member_mail: ahmed.mail, family_id: family._id },
    { member_mail: ahmed.mail, family_id: family._id, total_points: 310 });
  const noorWallet  = await upsert(PointWallet, { member_mail: noor.mail,  family_id: family._id },
    { member_mail: noor.mail,  family_id: family._id, total_points: 145 });
  const ziadWallet  = await upsert(PointWallet, { member_mail: ziad.mail,  family_id: family._id },
    { member_mail: ziad.mail,  family_id: family._id, total_points: 220 });

  await PointWallet.findByIdAndUpdate(ahmedWallet._id, { total_points: 310 });
  await PointWallet.findByIdAndUpdate(noorWallet._id,  { total_points: 145 });
  await PointWallet.findByIdAndUpdate(ziadWallet._id,  { total_points: 220 });

  // ── Point history (last 2 weeks) ──────────────────────────────────────────
  // Ahmed: 80 pts (best)  |  Ziad: 50 pts  |  Noor: 35 pts
  console.log('\n=== Point History (last 2 weeks) ===');
  const phEntries = [
    // Ahmed — 80 pts
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 10, reason_type: 'task_completion', description: 'Wash Dishes',  task_id: dishTask._id,     createdAt: daysAgo(1)  },
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 10, reason_type: 'task_completion', description: 'Wash Dishes',  task_id: dishTask._id,     createdAt: daysAgo(3)  },
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 10, reason_type: 'task_completion', description: 'Wash Dishes',  task_id: dishTask._id,     createdAt: daysAgo(6)  },
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 10, reason_type: 'task_completion', description: 'Mop Floor',    task_id: mopTask._id,      createdAt: daysAgo(2)  },
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 10, reason_type: 'task_completion', description: 'Mop Floor',    task_id: mopTask._id,      createdAt: daysAgo(8)  },
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 15, reason_type: 'task_completion', description: 'Do Homework',  task_id: homeworkTask._id, createdAt: daysAgo(4)  },
    { member_mail: ahmed.mail, wallet_id: ahmedWallet._id, points_amount: 15, reason_type: 'bonus',           description: 'Great effort this week',                   createdAt: daysAgo(5)  },
    // Ziad — 50 pts
    { member_mail: ziad.mail,  wallet_id: ziadWallet._id,  points_amount: 10, reason_type: 'task_completion', description: 'Tidy Room',    task_id: tidyTask._id,     createdAt: daysAgo(2)  },
    { member_mail: ziad.mail,  wallet_id: ziadWallet._id,  points_amount: 10, reason_type: 'task_completion', description: 'Tidy Room',    task_id: tidyTask._id,     createdAt: daysAgo(7)  },
    { member_mail: ziad.mail,  wallet_id: ziadWallet._id,  points_amount: 10, reason_type: 'task_completion', description: 'Mop Floor',    task_id: mopTask._id,      createdAt: daysAgo(4)  },
    { member_mail: ziad.mail,  wallet_id: ziadWallet._id,  points_amount: 15, reason_type: 'task_completion', description: 'Do Homework',  task_id: homeworkTask._id, createdAt: daysAgo(6)  },
    { member_mail: ziad.mail,  wallet_id: ziadWallet._id,  points_amount:  5, reason_type: 'task_completion', description: 'Set the Table',task_id: tableTask._id,    createdAt: daysAgo(9)  },
    // Noor — 35 pts
    { member_mail: noor.mail,  wallet_id: noorWallet._id,  points_amount: 10, reason_type: 'task_completion', description: 'Water Plants', task_id: plantsTask._id,   createdAt: daysAgo(3)  },
    { member_mail: noor.mail,  wallet_id: noorWallet._id,  points_amount: 10, reason_type: 'task_completion', description: 'Water Plants', task_id: plantsTask._id,   createdAt: daysAgo(10) },
    { member_mail: noor.mail,  wallet_id: noorWallet._id,  points_amount:  5, reason_type: 'task_completion', description: 'Set the Table',task_id: tableTask._id,    createdAt: daysAgo(2)  },
    { member_mail: noor.mail,  wallet_id: noorWallet._id,  points_amount:  5, reason_type: 'task_completion', description: 'Set the Table',task_id: tableTask._id,    createdAt: daysAgo(5)  },
    { member_mail: noor.mail,  wallet_id: noorWallet._id,  points_amount:  5, reason_type: 'task_completion', description: 'Set the Table',task_id: tableTask._id,    createdAt: daysAgo(12) },
  ];
  for (const e of phEntries) {
    await PointHistory.create({ ...e, family_id: family._id, granted_by: FAMILY_EMAIL });
  }
  console.log(`  + Created ${phEntries.length} point history entries`);

  // ── Task completions ──────────────────────────────────────────────────────
  console.log('\n=== Task Completions ===');
  const tdEntries = [
    { task_id: dishTask._id,     member_mail: ahmed.mail, assigned_points: 10, deadline: daysAgo(1),  status: 'approved', completed_at: daysAgo(1)  },
    { task_id: dishTask._id,     member_mail: ahmed.mail, assigned_points: 10, deadline: daysAgo(3),  status: 'approved', completed_at: daysAgo(3)  },
    { task_id: dishTask._id,     member_mail: ahmed.mail, assigned_points: 10, deadline: daysAgo(6),  status: 'approved', completed_at: daysAgo(6)  },
    { task_id: mopTask._id,      member_mail: ahmed.mail, assigned_points: 10, deadline: daysAgo(2),  status: 'approved', completed_at: daysAgo(2)  },
    { task_id: homeworkTask._id, member_mail: ahmed.mail, assigned_points: 15, deadline: daysAgo(4),  status: 'approved', completed_at: daysAgo(4)  },
    { task_id: tidyTask._id,     member_mail: ziad.mail,  assigned_points: 10, deadline: daysAgo(2),  status: 'approved', completed_at: daysAgo(2)  },
    { task_id: mopTask._id,      member_mail: ziad.mail,  assigned_points: 10, deadline: daysAgo(4),  status: 'approved', completed_at: daysAgo(4)  },
    { task_id: homeworkTask._id, member_mail: ziad.mail,  assigned_points: 15, deadline: daysAgo(6),  status: 'approved', completed_at: daysAgo(6)  },
    { task_id: plantsTask._id,   member_mail: noor.mail,  assigned_points: 10, deadline: daysAgo(3),  status: 'approved', completed_at: daysAgo(3)  },
    { task_id: tableTask._id,    member_mail: noor.mail,  assigned_points:  5, deadline: daysAgo(2),  status: 'approved', completed_at: daysAgo(2)  },
  ];
  for (const td of tdEntries) {
    await TaskDetails.create({ ...td, penalty_points: 0, assigned_by: FAMILY_EMAIL });
  }
  console.log(`  + Created ${tdEntries.length} task completions`);

  // ── Period budgets (3 months) ─────────────────────────────────────────────
  console.log('\n=== Period Budgets ===');
  await upsert(PeriodBudget, { title: 'February 2026 Budget', family_id: family._id }, {
    title: 'February 2026 Budget', period_type: 'monthly',
    start_date: new Date(2026, 1, 1), end_date: new Date(2026, 1, 28),
    total_amount: 5000, spent_amount: 3500, family_id: family._id, is_active: false,
  });
  await upsert(PeriodBudget, { title: 'March 2026 Budget', family_id: family._id }, {
    title: 'March 2026 Budget', period_type: 'monthly',
    start_date: new Date(2026, 2, 1), end_date: new Date(2026, 2, 31),
    total_amount: 5000, spent_amount: 4600, family_id: family._id, is_active: false,
  });
  await upsert(PeriodBudget, { title: 'April 2026 Budget', family_id: family._id }, {
    title: 'April 2026 Budget', period_type: 'monthly',
    start_date: new Date(2026, 3, 1), end_date: new Date(2026, 3, 30),
    total_amount: 5000, spent_amount: 5300, family_id: family._id, is_active: false,
  });
  await upsert(PeriodBudget, { title: 'May 2026 Budget', family_id: family._id }, {
    title: 'May 2026 Budget', period_type: 'monthly',
    start_date: new Date(2026, 4, 1), end_date: new Date(2026, 4, 31),
    total_amount: 5000, spent_amount: 0, family_id: family._id, is_active: true,
  });

  // ── Expenses — Feb, Mar, Apr 2026 ─────────────────────────────────────────
  // Feb total ≈ 3500  |  Mar total ≈ 4600  |  Apr total ≈ 5300 (overspent)
  console.log('\n=== Expenses (3 months) ===');
  const expenses = [
    // February 2026
    { title: 'Supermarket - Feb Week 1',  amount:  800, category: 'Groceries',     expense_date: new Date(2026, 1,  5) },
    { title: 'Supermarket - Feb Week 3',  amount:  750, category: 'Groceries',     expense_date: new Date(2026, 1, 18) },
    { title: 'Fruit Market Feb',          amount:  450, category: 'Groceries',     expense_date: new Date(2026, 1, 25) },
    { title: 'Electricity Bill - Feb',    amount:  450, category: 'Utilities',     expense_date: new Date(2026, 1, 10) },
    { title: 'Internet Bill - Feb',       amount:  200, category: 'Utilities',     expense_date: new Date(2026, 1, 12) },
    { title: 'Water Bill - Feb',          amount:  150, category: 'Utilities',     expense_date: new Date(2026, 1, 14) },
    { title: 'Cinema Feb',                amount:  180, category: 'Entertainment', expense_date: new Date(2026, 1, 20) },
    { title: 'Kids Activities Feb',       amount:  120, category: 'Entertainment', expense_date: new Date(2026, 1, 22) },
    { title: 'Transport - Feb',           amount:  200, category: 'Transport',     expense_date: new Date(2026, 1, 28) },
    { title: 'School Supplies Feb',       amount:  200, category: 'Education',     expense_date: new Date(2026, 1,  8) },
    // March 2026
    { title: 'Supermarket - Mar Week 1',  amount:  850, category: 'Groceries',     expense_date: new Date(2026, 2,  3) },
    { title: 'Supermarket - Mar Week 2',  amount:  820, category: 'Groceries',     expense_date: new Date(2026, 2, 12) },
    { title: 'Supermarket - Mar Week 4',  amount:  530, category: 'Groceries',     expense_date: new Date(2026, 2, 26) },
    { title: 'Electricity Bill - Mar',    amount:  480, category: 'Utilities',     expense_date: new Date(2026, 2, 10) },
    { title: 'Internet Bill - Mar',       amount:  200, category: 'Utilities',     expense_date: new Date(2026, 2, 12) },
    { title: 'Water Bill - Mar',          amount:  170, category: 'Utilities',     expense_date: new Date(2026, 2, 14) },
    { title: 'Restaurant Dinner Mar',     amount:  350, category: 'Dining Out',    expense_date: new Date(2026, 2, 15) },
    { title: 'Birthday Gift Mar',         amount:  250, category: 'Gifts',         expense_date: new Date(2026, 2, 20) },
    { title: 'Cinema Mar',                amount:  200, category: 'Entertainment', expense_date: new Date(2026, 2, 22) },
    { title: 'Transport - Mar',           amount:  250, category: 'Transport',     expense_date: new Date(2026, 2, 31) },
    { title: 'Cafe Mar',                  amount:  500, category: 'Entertainment', expense_date: new Date(2026, 2, 28) },
    // April 2026
    { title: 'Supermarket - Apr Week 1',  amount:  900, category: 'Groceries',     expense_date: new Date(2026, 3,  4) },
    { title: 'Supermarket - Apr Week 2',  amount:  870, category: 'Groceries',     expense_date: new Date(2026, 3, 11) },
    { title: 'Supermarket - Apr Week 3',  amount:  630, category: 'Groceries',     expense_date: new Date(2026, 3, 21) },
    { title: 'Electricity Bill - Apr',    amount:  520, category: 'Utilities',     expense_date: new Date(2026, 3, 10) },
    { title: 'Internet Bill - Apr',       amount:  200, category: 'Utilities',     expense_date: new Date(2026, 3, 12) },
    { title: 'Water Bill - Apr',          amount:  180, category: 'Utilities',     expense_date: new Date(2026, 3, 14) },
    { title: 'Restaurant Dinner Apr 1',   amount:  420, category: 'Dining Out',    expense_date: new Date(2026, 3,  5) },
    { title: 'Restaurant Dinner Apr 2',   amount:  380, category: 'Dining Out',    expense_date: new Date(2026, 3, 19) },
    { title: 'Amusement Park Apr',        amount:  600, category: 'Entertainment', expense_date: new Date(2026, 3,  8) },
    { title: 'Cinema Apr',                amount:  220, category: 'Entertainment', expense_date: new Date(2026, 3, 25) },
    { title: 'Transport - Apr',           amount:  280, category: 'Transport',     expense_date: new Date(2026, 3, 30) },
    { title: 'Clothes Shopping Apr',      amount:  900, category: 'Clothing',      expense_date: new Date(2026, 3, 15) },
    { title: 'Doctor Visit Apr',          amount:  200, category: 'Healthcare',    expense_date: new Date(2026, 3, 18) },
  ];
  for (const ex of expenses) {
    const exists = await Expense.findOne({ title: ex.title, family_id: family._id });
    if (!exists) {
      await Expense.create({ ...ex, family_id: family._id, member_mail: FAMILY_EMAIL, description: ex.title });
      console.log(`  + ${ex.title}`);
    } else {
      console.log(`  ~ ${ex.title}`);
    }
  }

  // ── Future events ─────────────────────────────────────────────────────────
  console.log('\n=== Future Events ===');
  await upsert(FutureEvent, { title: 'Summer Family Trip', family_id: family._id }, {
    title: 'Summer Family Trip', description: 'Trip to Alexandria in July',
    event_date: new Date(2026, 6, 15), estimated_cost: 8000, total_contributed_money: 2000,
    funding_source: 'member_contributions', family_id: family._id,
  });
  await upsert(FutureEvent, { title: 'Eid Shopping', family_id: family._id }, {
    title: 'Eid Shopping', description: 'Clothes and gifts for Eid',
    event_date: new Date(2026, 5, 20), estimated_cost: 3000, total_contributed_money: 500,
    funding_source: 'budget', family_id: family._id,
  });
  await upsert(FutureEvent, { title: "Ahmed's School Trip", family_id: family._id }, {
    title: "Ahmed's School Trip", description: 'Annual school excursion',
    event_date: new Date(2026, 5, 10), estimated_cost: 800, total_contributed_money: 800,
    funding_source: 'budget', family_id: family._id,
  });

  // ── Units ─────────────────────────────────────────────────────────────────
  console.log('\n=== Units ===');
  const unitPiece = await upsert(Unit, { unit_name: 'Piece' }, { unit_name: 'Piece', unit_type: 'count'  });
  const unitKg    = await upsert(Unit, { unit_name: 'kg'    }, { unit_name: 'kg',    unit_type: 'weight' });
  const unitG     = await upsert(Unit, { unit_name: 'g'     }, { unit_name: 'g',     unit_type: 'weight' });
  const unitLiter = await upsert(Unit, { unit_name: 'Liter' }, { unit_name: 'Liter', unit_type: 'volume' });
  const unitMl    = await upsert(Unit, { unit_name: 'ml'    }, { unit_name: 'ml',    unit_type: 'volume' });

  // ── Inventory categories ──────────────────────────────────────────────────
  console.log('\n=== Inventory Categories ===');
  const catDairy     = await upsert(InventoryCategory, { title: 'Dairy'      }, { title: 'Dairy',      description: 'Milk, Cheese, Yogurt'    });
  const catVeg       = await upsert(InventoryCategory, { title: 'Vegetables' }, { title: 'Vegetables', description: 'Fresh vegetables'          });
  const catGrain     = await upsert(InventoryCategory, { title: 'Grains'     }, { title: 'Grains',     description: 'Rice, Pasta, Bread, Flour' });
  const catProtein   = await upsert(InventoryCategory, { title: 'Protein'    }, { title: 'Protein',    description: 'Eggs, Meat, Chicken'       });
  const catCondiment = await upsert(InventoryCategory, { title: 'Condiments' }, { title: 'Condiments', description: 'Oil, Salt, Spices'          });

  // ── Inventories ───────────────────────────────────────────────────────────
  console.log('\n=== Inventories ===');
  const fridge = await upsert(Inventory, { title: 'Main Kitchen Fridge', family_id: family._id },
    { title: 'Main Kitchen Fridge', type: 'Food', family_id: family._id });
  const pantry = await upsert(Inventory, { title: 'Pantry', family_id: family._id },
    { title: 'Pantry', type: 'Food', family_id: family._id });

  // ── Inventory items ───────────────────────────────────────────────────────
  console.log('\n=== Inventory Items ===');
  const invItems = [
    { item_name: 'Eggs',      inventory_id: fridge._id, item_category: catProtein._id,   quantity: 12,  unit_id: unitPiece._id, threshold_quantity: 6,   expiry_date: daysFromNow(10) },
    { item_name: 'Cheese',    inventory_id: fridge._id, item_category: catDairy._id,     quantity: 400, unit_id: unitG._id,     threshold_quantity: 100, expiry_date: daysFromNow(14) },
    { item_name: 'Milk',      inventory_id: fridge._id, item_category: catDairy._id,     quantity: 2,   unit_id: unitLiter._id, threshold_quantity: 1,   expiry_date: daysFromNow(7)  },
    { item_name: 'Tomatoes',  inventory_id: fridge._id, item_category: catVeg._id,       quantity: 1,   unit_id: unitKg._id,    threshold_quantity: 0.5 },
    { item_name: 'Cucumber',  inventory_id: fridge._id, item_category: catVeg._id,       quantity: 4,   unit_id: unitPiece._id, threshold_quantity: 2   },
    { item_name: 'Lettuce',   inventory_id: fridge._id, item_category: catVeg._id,       quantity: 1,   unit_id: unitPiece._id, threshold_quantity: 1,   expiry_date: daysFromNow(5)  },
    { item_name: 'Yogurt',    inventory_id: fridge._id, item_category: catDairy._id,     quantity: 3,   unit_id: unitPiece._id, threshold_quantity: 2,   expiry_date: daysFromNow(6)  },
    { item_name: 'Rice',      inventory_id: pantry._id, item_category: catGrain._id,     quantity: 3,   unit_id: unitKg._id,    threshold_quantity: 1   },
    { item_name: 'Pasta',     inventory_id: pantry._id, item_category: catGrain._id,     quantity: 500, unit_id: unitG._id,     threshold_quantity: 200 },
    { item_name: 'Bread',     inventory_id: pantry._id, item_category: catGrain._id,     quantity: 1,   unit_id: unitPiece._id, threshold_quantity: 1,   expiry_date: daysFromNow(3)  },
    { item_name: 'Flour',     inventory_id: pantry._id, item_category: catGrain._id,     quantity: 2,   unit_id: unitKg._id,    threshold_quantity: 0.5 },
    { item_name: 'Olive Oil', inventory_id: pantry._id, item_category: catCondiment._id, quantity: 500, unit_id: unitMl._id,    threshold_quantity: 100 },
    { item_name: 'Onion',     inventory_id: pantry._id, item_category: catVeg._id,       quantity: 5,   unit_id: unitPiece._id, threshold_quantity: 2   },
    { item_name: 'Salt',      inventory_id: pantry._id, item_category: catCondiment._id, quantity: 1,   unit_id: unitKg._id,    threshold_quantity: 0.2 },
  ];
  for (const item of invItems) {
    const exists = await InventoryItem.findOne({ item_name: item.item_name, inventory_id: item.inventory_id });
    if (!exists) {
      await InventoryItem.create(item);
      console.log(`  + ${item.item_name}`);
    } else {
      await InventoryItem.findByIdAndUpdate(exists._id, { quantity: item.quantity });
      console.log(`  ~ Updated qty: ${item.item_name}`);
    }
  }

  // ── Recipes ───────────────────────────────────────────────────────────────
  console.log('\n=== Recipes ===');
  const recOmelette  = await upsert(Recipe, { recipe_name: 'Cheese Omelette',         family_id: family._id }, { recipe_name: 'Cheese Omelette',         member_mail: FAMILY_EMAIL, family_id: family._id, category: 'Breakfast',   serving_size: 2, prep_time:  5, cook_time: 10, description: 'Fluffy cheese omelette'              });
  const recTomRice   = await upsert(Recipe, { recipe_name: 'Tomato Rice',              family_id: family._id }, { recipe_name: 'Tomato Rice',              member_mail: FAMILY_EMAIL, family_id: family._id, category: 'Main Course', serving_size: 4, prep_time: 10, cook_time: 25, description: 'Egyptian-style tomato rice'          });
  const recPasta     = await upsert(Recipe, { recipe_name: 'Pasta with Tomato Sauce', family_id: family._id }, { recipe_name: 'Pasta with Tomato Sauce', member_mail: FAMILY_EMAIL, family_id: family._id, category: 'Dinner',      serving_size: 4, prep_time: 10, cook_time: 20, description: 'Classic pasta with homemade sauce'   });
  const recSandwich  = await upsert(Recipe, { recipe_name: 'Cheese Sandwich',          family_id: family._id }, { recipe_name: 'Cheese Sandwich',          member_mail: FAMILY_EMAIL, family_id: family._id, category: 'Snack',       serving_size: 2, prep_time:  5, cook_time:  0, description: 'Quick cheese sandwich'               });
  const recSalad     = await upsert(Recipe, { recipe_name: 'Green Salad',              family_id: family._id }, { recipe_name: 'Green Salad',              member_mail: FAMILY_EMAIL, family_id: family._id, category: 'Side Dish',   serving_size: 4, prep_time: 10, cook_time:  0, description: 'Fresh cucumber and lettuce salad'    });
  const recPancakes  = await upsert(Recipe, { recipe_name: 'Pancakes',                 family_id: family._id }, { recipe_name: 'Pancakes',                 member_mail: FAMILY_EMAIL, family_id: family._id, category: 'Breakfast',   serving_size: 4, prep_time: 10, cook_time: 15, description: 'Fluffy breakfast pancakes'           });

  // ── Recipe ingredients ────────────────────────────────────────────────────
  console.log('\n=== Recipe Ingredients ===');
  const riData = [
    { recipe_id: recOmelette._id, ingredient_name: 'Eggs',      quantity: 3,   unit_id: unitPiece._id },
    { recipe_id: recOmelette._id, ingredient_name: 'Cheese',    quantity: 50,  unit_id: unitG._id     },
    { recipe_id: recOmelette._id, ingredient_name: 'Olive Oil', quantity: 15,  unit_id: unitMl._id    },
    { recipe_id: recTomRice._id,  ingredient_name: 'Rice',      quantity: 300, unit_id: unitG._id     },
    { recipe_id: recTomRice._id,  ingredient_name: 'Tomatoes',  quantity: 0.5, unit_id: unitKg._id    },
    { recipe_id: recTomRice._id,  ingredient_name: 'Onion',     quantity: 1,   unit_id: unitPiece._id },
    { recipe_id: recTomRice._id,  ingredient_name: 'Olive Oil', quantity: 30,  unit_id: unitMl._id    },
    { recipe_id: recPasta._id,    ingredient_name: 'Pasta',     quantity: 400, unit_id: unitG._id     },
    { recipe_id: recPasta._id,    ingredient_name: 'Tomatoes',  quantity: 0.5, unit_id: unitKg._id    },
    { recipe_id: recPasta._id,    ingredient_name: 'Onion',     quantity: 1,   unit_id: unitPiece._id },
    { recipe_id: recPasta._id,    ingredient_name: 'Olive Oil', quantity: 30,  unit_id: unitMl._id    },
    { recipe_id: recSandwich._id, ingredient_name: 'Bread',     quantity: 2,   unit_id: unitPiece._id },
    { recipe_id: recSandwich._id, ingredient_name: 'Cheese',    quantity: 40,  unit_id: unitG._id     },
    { recipe_id: recSalad._id,    ingredient_name: 'Lettuce',   quantity: 1,   unit_id: unitPiece._id },
    { recipe_id: recSalad._id,    ingredient_name: 'Cucumber',  quantity: 2,   unit_id: unitPiece._id },
    { recipe_id: recSalad._id,    ingredient_name: 'Olive Oil', quantity: 20,  unit_id: unitMl._id    },
    { recipe_id: recPancakes._id, ingredient_name: 'Flour',     quantity: 200, unit_id: unitG._id     },
    { recipe_id: recPancakes._id, ingredient_name: 'Eggs',      quantity: 2,   unit_id: unitPiece._id },
    { recipe_id: recPancakes._id, ingredient_name: 'Milk',      quantity: 200, unit_id: unitMl._id    },
  ];
  for (const ri of riData) {
    const exists = await RecipeIngredient.findOne({ recipe_id: ri.recipe_id, ingredient_name: ri.ingredient_name });
    if (!exists) {
      await RecipeIngredient.create(ri);
      console.log(`  + ${ri.ingredient_name} → ${riData.indexOf(ri) < 3 ? 'Omelette' : '...'}`);
    } else {
      console.log(`  ~ ${ri.ingredient_name}`);
    }
  }

  // ── Meals this week (not today — so AI can suggest today's meals) ─────────
  console.log('\n=== Meals This Week ===');
  const mealData = [
    { meal_name: 'Cheese Omelette',        meal_date: daysAgo(1), meal_type: 'Breakfast', recipe_id: recOmelette._id },
    { meal_name: 'Cheese Sandwich',        meal_date: daysAgo(1), meal_type: 'Lunch',     recipe_id: recSandwich._id },
    { meal_name: 'Tomato Rice',            meal_date: daysAgo(2), meal_type: 'Lunch',     recipe_id: recTomRice._id  },
    { meal_name: 'Pasta with Tomato Sauce',meal_date: daysAgo(2), meal_type: 'Dinner',    recipe_id: recPasta._id    },
    { meal_name: 'Pancakes',               meal_date: daysAgo(3), meal_type: 'Breakfast', recipe_id: recPancakes._id },
    { meal_name: 'Green Salad',            meal_date: daysAgo(3), meal_type: 'Lunch',     recipe_id: recSalad._id    },
  ];
  for (const m of mealData) {
    const exists = await Meal.findOne({ meal_name: m.meal_name, meal_date: m.meal_date, family_id: family._id });
    if (!exists) {
      await Meal.create({ ...m, family_id: family._id, created_by: FAMILY_EMAIL });
      console.log(`  + ${m.meal_type}: ${m.meal_name}`);
    } else {
      console.log(`  ~ ${m.meal_name}`);
    }
  }

  // ── Leftovers (available, not expired) ────────────────────────────────────
  console.log('\n=== Leftovers ===');
  const leftoverData = [
    { item_name: 'Leftover Tomato Rice', quantity: 2, unit_id: unitPiece._id, date_added: daysAgo(1), expiry_date: daysFromNow(1) },
    { item_name: 'Leftover Pasta',       quantity: 1, unit_id: unitPiece._id, date_added: daysAgo(2), expiry_date: daysFromNow(2) },
  ];
  for (const lf of leftoverData) {
    const exists = await Leftover.findOne({ item_name: lf.item_name, family_id: family._id });
    if (!exists) {
      await Leftover.create({ ...lf, family_id: family._id, member_mail: FAMILY_EMAIL });
      console.log(`  + ${lf.item_name}`);
    } else {
      console.log(`  ~ ${lf.item_name}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('Seeding complete! Expected AI answers:');
  console.log('  Budget (3 mo avg):  5000 EGP/month budgeted');
  console.log('  Spending (3 mo avg): ~4466 EGP/month');
  console.log('  Apr overspent by:   300 EGP (budget 5000, spent 5300)');
  console.log('  Top category Apr:   Groceries (2400) + Entertainment (820)');
  console.log('  Best child (2 wk):  Ahmed 80pts > Ziad 50pts > Noor 35pts');
  console.log('  Meal suggestion:    Pancakes (breakfast), Green Salad (lunch),');
  console.log('                      Cheese Omelette or Pasta (dinner)');
  console.log('  Leftovers to use:   Tomato Rice, Pasta');
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
