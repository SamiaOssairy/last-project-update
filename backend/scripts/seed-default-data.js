const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Models
const FamilyAccount = require("../models/FamilyAccountModel");
const MemberType = require("../models/MemberTypeModel");
const Member = require("../models/MemberModel");
const TaskCategory = require("../models/task_categoryModel");
const Task = require("../models/taskModel");
const Inventory = require("../models/inventoryModel");
const InventoryCategory = require("../models/inventoryCategoryModel");
const InventoryItem = require("../models/inventoryItemModel");
const Unit = require("../models/unitModel");
const Budget = require("../models/budgetModel");
const FutureEvent = require("../models/futureEventModel");
const PeriodBudget = require("../models/periodBudgetModel");
const Expense = require("../models/ExpenseModel");

dotenv.config({ path: path.join(__dirname, "../.env") });

const dbAtlasString = process.env.DB.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);

const FAMILY_EMAIL = "habiba1278@gmail.com";

async function seedData() {
  try {
    await mongoose.connect(dbAtlasString); 
    console.log("DB connection successfully for seeding");

    // 1. Find the Family Account
    const family = await FamilyAccount.findOne({ mail: FAMILY_EMAIL });
    if (!family) {
      console.error(`Family with email ${FAMILY_EMAIL} not found. Please create it first.`);
      process.exit(1);
    }
    console.log(`Found Family: ${family.Title} (${family._id})`);

    // 2. Create Default Member Types (Parent, Child)
    const memberTypes = [
      { type: "Parent", family_id: family._id, Permissions: ["all"] },
      { type: "Child", family_id: family._id, Permissions: ["view_tasks", "complete_tasks"] }
    ];

    const seededMemberTypes = [];
    for (const mt of memberTypes) {
      const existing = await MemberType.findOne({ type: mt.type, family_id: family._id });
      if (!existing) {
        const newMt = await MemberType.create(mt);
        seededMemberTypes.push(newMt);
        console.log(`Created Member Type: ${mt.type}`);
      } else {
        seededMemberTypes.push(existing);
        console.log(`Member Type already exists: ${mt.type}`);
      }
    }

    const parentType = seededMemberTypes.find(t => t.type === "Parent");
    const childType = seededMemberTypes.find(t => t.type === "Child");

    // 3. Create a Default Member (if none exists)
    const existingMember = await Member.findOne({ family_id: family._id });
    if (!existingMember) {
      const defaultMember = await Member.create({
        username: "Family Admin",
        mail: FAMILY_EMAIL,
        family_id: family._id,
        member_type_id: parentType._id,
        birth_date: new Date(1990, 0, 1),
        isFirstLogin: true
      });
      console.log(`Created Default Member: ${defaultMember.username}`);
    } else {
      console.log("Members already exist for this family.");
    }

    // 4. Create Task Categories
    const taskCategories = [
      { title: "Kitchen", family_id: family._id },
      { title: "Garden", family_id: family._id },
      { title: "General", family_id: family._id }
    ];

    const seededCategories = [];
    for (const cat of taskCategories) {
      const existing = await TaskCategory.findOne({ title: cat.title, family_id: family._id });
      if (!existing) {
        const newCat = await TaskCategory.create(cat);
        seededCategories.push(newCat);
        console.log(`Created Task Category: ${cat.title}`);
      } else {
        seededCategories.push(existing);
        console.log(`Task Category already exists: ${cat.title}`);
      }
    }

    // 5. Create some default Tasks
    const tasks = [
      {
        title: "Wash Dishes",
        description: "Wash all dishes in the sink",
        created_by: "System",
        family_id: family._id,
        category_id: seededCategories.find(c => c.title === "Kitchen")._id,
        reward_type: "points"
      },
      {
        title: "Water Plants",
        description: "Water the plants in the front yard",
        created_by: "System",
        family_id: family._id,
        category_id: seededCategories.find(c => c.title === "Garden")._id,
        reward_type: "points"
      }
    ];

    for (const t of tasks) {
      const existing = await Task.findOne({ title: t.title, family_id: family._id });
      if (!existing) {
        await Task.create(t);
        console.log(`Created Task: ${t.title}`);
      } else {
        console.log(`Task already exists: ${t.title}`);
      }
    }

    // 6. Create Default Units
    const units = [
      { unit_name: "kg", unit_type: "weight" },
      { unit_name: "Liter", unit_type: "volume" },
      { unit_name: "Piece", unit_type: "count" }
    ];

    const seededUnits = {};
    for (const u of units) {
      let existing = await Unit.findOne({ unit_name: u.unit_name });
      if (!existing) {
        existing = await Unit.create(u);
        console.log(`Created Unit: ${u.unit_name}`);
      }
      seededUnits[u.unit_name] = existing._id;
    }

    // 7. Create Default Inventories
    const inventoryData = [
      { title: "Main Kitchen Fridge", type: "Food", family_id: family._id },
      { title: "Pantry", type: "Food", family_id: family._id },
      { title: "Bathroom Closet", type: "Personal Care", family_id: family._id }
    ];

    const seededInventories = {};
    for (const inv of inventoryData) {
      let existing = await Inventory.findOne({ title: inv.title, family_id: family._id });
      if (!existing) {
        existing = await Inventory.create(inv);
        console.log(`Created Inventory: ${inv.title}`);
      }
      seededInventories[inv.title] = existing._id;
    }

    // 8. Create Inventory Categories (Global or per family - assuming global for now based on model)
    const invCategories = [
      { title: "Dairy", description: "Milk, Cheese, Yogurt" },
      { title: "Vegetables", description: "Fresh greens and roots" },
      { title: "Grains", description: "Rice, Pasta, Flour" },
      { title: "Hygiene", description: "Soap, Shampoo, Toothpaste" }
    ];

    const seededInvCats = {};
    for (const cat of invCategories) {
      let existing = await InventoryCategory.findOne({ title: cat.title });
      if (!existing) {
        existing = await InventoryCategory.create(cat);
        console.log(`Created Inventory Category: ${cat.title}`);
      }
      seededInvCats[cat.title] = existing._id;
    }

    // 9. Create Inventory Items
    const items = [
      {
        item_name: "Milk",
        inventory_id: seededInventories["Main Kitchen Fridge"],
        item_category: seededInvCats["Dairy"],
        quantity: 2,
        unit_id: seededUnits["Liter"],
        threshold_quantity: 1,
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      },
      {
        item_name: "Tomato",
        inventory_id: seededInventories["Main Kitchen Fridge"],
        item_category: seededInvCats["Vegetables"],
        quantity: 5,
        unit_id: seededUnits["kg"],
        threshold_quantity: 1
      },
      {
        item_name: "Rice",
        inventory_id: seededInventories["Pantry"],
        item_category: seededInvCats["Grains"],
        quantity: 10,
        unit_id: seededUnits["kg"],
        threshold_quantity: 2
      },
      {
        item_name: "Soap",
        inventory_id: seededInventories["Bathroom Closet"],
        item_category: seededInvCats["Hygiene"],
        quantity: 3,
        unit_id: seededUnits["Piece"],
        threshold_quantity: 1
      },
      {
        item_name: "Shampoo",
        inventory_id: seededInventories["Bathroom Closet"],
        item_category: seededInvCats["Hygiene"],
        quantity: 1,
        unit_id: seededUnits["Piece"],
        threshold_quantity: 1
      }
    ];

    for (const item of items) {
      const existing = await InventoryItem.findOne({ 
        item_name: item.item_name, 
        inventory_id: item.inventory_id 
      });
      if (!existing) {
        await InventoryItem.create(item);
        console.log(`Created Inventory Item: ${item.item_name}`);
      } else {
        console.log(`Inventory Item already exists: ${item.item_name}`);
      }
    }

    // 9b. Add more inventory items for testing
    const extraItems = [
      {
        item_name: "Eggs",
        inventory_id: seededInventories["Main Kitchen Fridge"],
        item_category: seededInvCats["Dairy"],
        quantity: 12,
        unit_id: seededUnits["Piece"],
        threshold_quantity: 6,
        expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        item_name: "Bread",
        inventory_id: seededInventories["Pantry"],
        item_category: seededInvCats["Grains"],
        quantity: 2,
        unit_id: seededUnits["Piece"],
        threshold_quantity: 1,
        expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        item_name: "Cheese",
        inventory_id: seededInventories["Main Kitchen Fridge"],
        item_category: seededInvCats["Dairy"],
        quantity: 1,
        unit_id: seededUnits["kg"],
        threshold_quantity: 0.2,
        expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    ];
    for (const item of extraItems) {
      const existing = await InventoryItem.findOne({ 
        item_name: item.item_name, 
        inventory_id: item.inventory_id 
      });
      if (!existing) {
        await InventoryItem.create(item);
        console.log(`Created Extra Inventory Item: ${item.item_name}`);
      } else {
        console.log(`Extra Inventory Item already exists: ${item.item_name}`);
      }
    }

    // 10. Create Default Budgets
    const budgets = [
      { category_name: "Groceries", budget_amount: 500, spent_amount: 150, family_id: family._id },
      { category_name: "Entertainment", budget_amount: 200, spent_amount: 50, family_id: family._id },
      { category_name: "Utilities", budget_amount: 300, spent_amount: 0, family_id: family._id }
    ];

    for (const b of budgets) {
      const existing = await Budget.findOne({ category_name: b.category_name, family_id: family._id });
      if (!existing) {
        await Budget.create(b);
        console.log(`Created Budget Category: ${b.category_name}`);
      } else {
        console.log(`Budget Category already exists: ${b.category_name}`);
      }
    }

    // 11. Create Future Events
    const events = [
      {
        title: "Family Picnic",
        description: "A fun day out at the park",
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks away
        estimated_cost: 100,
        funding_source: "budget",
        family_id: family._id
      },
      {
        title: "Birthday Party",
        description: "John's 10th birthday",
        event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month away
        estimated_cost: 500,
        funding_source: "member_contributions",
        family_id: family._id
      }
    ];

    for (const e of events) {
      const existing = await FutureEvent.findOne({ title: e.title, family_id: family._id });
      if (!existing) {
        await FutureEvent.create(e);
        console.log(`Created Future Event: ${e.title}`);
      } else {
        console.log(`Future Event already exists: ${e.title}`);
      }
    }

    // 12. Create Period Budgets (Newer system)
    const periodBudgets = [
      {
        title: "April 2026 Monthly Budget",
        period_type: "monthly",
        start_date: new Date(2026, 3, 1),
        end_date: new Date(2026, 3, 30),
        total_amount: 2000,
        family_id: family._id,
        is_active: true
      }
    ];

    for (const pb of periodBudgets) {
      const existing = await PeriodBudget.findOne({ title: pb.title, family_id: family._id });
      if (!existing) {
        await PeriodBudget.create({
          ...pb,
          emergency_fund_percentage: 15, // 15% of 2000 = 300
          emergency_fund_spent: 50 // Test spent amount
        });
        console.log(`Created Period Budget: ${pb.title}`);
      } else {
        // Update existing to ensure emergency fields are there
        existing.emergency_fund_percentage = 15;
        existing.emergency_fund_spent = 50;
        await existing.save();
        console.log(`Updated Period Budget with Emergency Info: ${pb.title}`);
      }
    }

    // 13. Create Expenses
    const expenses = [
      {
        title: "Grocery Shopping",
        amount: 150,
        category: "Groceries",
        family_id: family._id,
        date: new Date()
      },
      {
        title: "Movie Night",
        amount: 50,
        category: "Entertainment",
        family_id: family._id,
        date: new Date()
      }
    ];

    for (const ex of expenses) {
      const existing = await Expense.findOne({ title: ex.title, family_id: family._id });
      if (!existing) {
        await Expense.create(ex);
        console.log(`Created Expense: ${ex.title}`);
      } else {
        console.log(`Expense already exists: ${ex.title}`);
      }
    }

    // 14. Create Meals for the family
    const Meal = require("../models/mealModel");
    const member = await Member.findOne({ mail: FAMILY_EMAIL, family_id: family._id });
    if (member) {
      const meals = [
        {
          family_id: family._id,
          meal_name: "Omelette",
          meal_date: new Date(),
          meal_type: "Breakfast",
          recipe_id: null,
          created_by: member._id
        },
        {
          family_id: family._id,
          meal_name: "Cheese Sandwich",
          meal_date: new Date(),
          meal_type: "Lunch",
          recipe_id: null,
          created_by: member._id
        },
        {
          family_id: family._id,
          meal_name: "Tomato Rice",
          meal_date: new Date(),
          meal_type: "Dinner",
          recipe_id: null,
          created_by: member._id
        }
      ];
      for (const meal of meals) {
        const existing = await Meal.findOne({ meal_name: meal.meal_name, meal_date: meal.meal_date, family_id: family._id });
        if (!existing) {
          await Meal.create(meal);
          console.log(`Created Meal: ${meal.meal_name}`);
        } else {
          console.log(`Meal already exists: ${meal.meal_name}`);
        }
      }
    } else {
      console.log("No member found to assign meals.");
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seedData();
