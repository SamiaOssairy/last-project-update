const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const Task = require("../models/taskModel");
const TaskDetails = require("../models/task_historyModel");
const TaskCategory = require("../models/task_categoryModel");
const Member = require("../models/MemberModel");
const MemberType = require("../models/MemberTypeModel");
// Anyone can create tasks and assign to anyone
// Non-parent assignments need parent approval
// Child marks complete → Parent approves → Points auto-awarded
// Auto/manual penalty for missed deadlines
// Task priority and mandatory flags
//========================================================================================
// Create a new task template
exports.createTask = catchAsync(async (req, res, next) => {
  const { title, description, is_mandatory, category_id } = req.body;
  
  if (!title || !category_id) {
    return next(new AppError("Please provide title and category_id", 400));
  }
  
  // Verify category exists and belongs to this family
  const category = await TaskCategory.findOne({ 
    _id: category_id, 
    family_id: req.familyAccount._id 
  });
  
  if (!category) {
    return next(new AppError("Category not found or doesn't belong to your family", 404));
  }
  
  const newTask = await Task.create({
    title,
    description: description || '',
    is_mandatory: is_mandatory || false,
    created_by: req.member.mail,
    category_id,
    family_id: req.familyAccount._id
  });
  
  await newTask.populate('category_id');
  
  res.status(201).json({
    status: "success",
    data: { task: newTask }
  });
});

//========================================================================================
// Get all tasks for the family
exports.getAllTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ family_id: req.familyAccount._id })
    .populate('category_id');
  
  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: { tasks }
  });
});

//========================================================================================
// Update/Edit a task
exports.updateTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { title, description, is_mandatory, category_id } = req.body;
  
  const task = await Task.findOne({ 
    _id: taskId, 
    family_id: req.familyAccount._id 
  });
  
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  
  // Only parent or creator can edit
  const memberType = await MemberType.findById(req.member.member_type_id);
  if (memberType.type !== 'Parent' && task.created_by !== req.member.mail) {
    return next(new AppError("You don't have permission to edit this task", 403));
  }
  
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (is_mandatory !== undefined) task.is_mandatory = is_mandatory;
  if (category_id) {
    // Verify new category belongs to family
    const category = await TaskCategory.findOne({ 
      _id: category_id, 
      family_id: req.familyAccount._id 
    });
    if (!category) {
      return next(new AppError("Category not found", 404));
    }
    task.category_id = category_id;
  }
  
  await task.save();
  await task.populate('category_id');
  
  res.status(200).json({
    status: "success",
    data: { task }
  });
});

//========================================================================================
// Delete a task
exports.deleteTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  
  const task = await Task.findOne({ 
    _id: taskId, 
    family_id: req.familyAccount._id 
  });
  
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  
  // Only parent or creator can delete
  const memberType = await MemberType.findById(req.member.member_type_id);
  if (memberType.type !== 'Parent' && task.created_by !== req.member.mail) {
    return next(new AppError("You don't have permission to delete this task", 403));
  }
  
  await Task.findByIdAndDelete(taskId);
  
  res.status(204).json({
    status: "success",
    data: null
  });
});

//========================================================================================
// Assign a task to a member
exports.assignTask = catchAsync(async (req, res, next) => {
  const { task_id, member_mail, assigned_points, penalty_points, deadline, priority } = req.body;
  
  if (!task_id || !member_mail || !assigned_points || !deadline) {
    return next(new AppError("Please provide task_id, member_mail, assigned_points, and deadline", 400));
  }
  
  // Verify task exists and belongs to family
  const task = await Task.findOne({ 
    _id: task_id, 
    family_id: req.familyAccount._id 
  });
  
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  
  // Verify member exists and belongs to family
  const targetMember = await Member.findOne({ 
    mail: member_mail, 
    family_id: req.familyAccount._id 
  });
  
  if (!targetMember) {
    return next(new AppError("Member not found in your family", 404));
  }
  
  // Check if assigner is Parent
  const assignerType = await MemberType.findById(req.member.member_type_id);
  const needsApproval = assignerType.type !== 'Parent';
  
  const taskDetail = await TaskDetails.create({
    task_id,
    member_mail,
    assigned_points,
    penalty_points: penalty_points || 0,
    deadline,
    assigned_by: req.member.mail,
    assignment_approved: !needsApproval,
    assignment_approved_by: needsApproval ? null : req.member.mail,
    priority: priority || 0,
    status: 'assigned'
  });
  
  await taskDetail.populate('task_id');
  
  res.status(201).json({
    status: "success",
    message: needsApproval ? "Task assigned successfully. Waiting for parent approval." : "Task assigned successfully.",
    data: { taskDetail }
  });
});

//========================================================================================
// Approve task assignment (Parent only)
exports.approveTaskAssignment = catchAsync(async (req, res, next) => {
  const { taskDetailId } = req.params;
  const { approved } = req.body; // true or false
  
  if (approved === undefined) {
    return next(new AppError("Please provide approval status (approved: true/false)", 400));
  }
  
  const taskDetail = await TaskDetails.findById(taskDetailId)
    .populate('task_id');
  
  if (!taskDetail) {
    return next(new AppError("Task assignment not found", 404));
  }
  
  // Verify task belongs to family
  const task = await Task.findById(taskDetail.task_id);
  if (task.family_id.toString() !== req.familyAccount._id.toString()) {
    return next(new AppError("This task doesn't belong to your family", 403));
  }
  
  if (taskDetail.assignment_approved) {
    return next(new AppError("This task assignment is already approved", 400));
  }
  
  if (approved) {
    taskDetail.assignment_approved = true;
    taskDetail.assignment_approved_by = req.member.mail;
    await taskDetail.save();
    
    res.status(200).json({
      status: "success",
      message: "Task assignment approved",
      data: { taskDetail }
    });
  } else {
    // Reject - delete the assignment
    await TaskDetails.findByIdAndDelete(taskDetailId);
    
    res.status(200).json({
      status: "success",
      message: "Task assignment rejected and removed"
    });
  }
});

//========================================================================================
// Get pending task assignments (Parent only - for approval)
exports.getPendingAssignments = catchAsync(async (req, res, next) => {
  const taskDetails = await TaskDetails.find({ assignment_approved: false })
    .populate({
      path: 'task_id',
      match: { family_id: req.familyAccount._id },
      populate: { path: 'category_id' }
    });
  
  // Filter out null task_id (tasks from other families)
  const filteredTaskDetails = taskDetails.filter(td => td.task_id !== null);
  
  res.status(200).json({
    status: "success",
    results: filteredTaskDetails.length,
    data: { pendingAssignments: filteredTaskDetails }
  });
});

//========================================================================================
// Get member's assigned tasks
exports.getMyTasks = catchAsync(async (req, res, next) => {
  // Get ALL tasks assigned to this member (regardless of approval status)
  const taskDetails = await TaskDetails.find({ 
    member_mail: req.member.mail
  })
    .populate({
      path: 'task_id',
      populate: { path: 'category_id' }
    })
    .sort({ deadline: 1 });
  
  res.status(200).json({
    status: "success",
    results: taskDetails.length,
    data: { tasks: taskDetails }
  });
});

//========================================================================================
// Get all assigned tasks for family (Parent can see all)
exports.getAllAssignedTasks = catchAsync(async (req, res, next) => {
  const taskDetails = await TaskDetails.find({ assignment_approved: true })
    .populate({
      path: 'task_id',
      match: { family_id: req.familyAccount._id },
      populate: { path: 'category_id' }
    })
    .sort({ createdAt: -1 });
  
  // Filter out null task_id (tasks from other families)
  const filteredTaskDetails = taskDetails.filter(td => td.task_id !== null);
  
  res.status(200).json({
    status: "success",
    results: filteredTaskDetails.length,
    data: { assignedTasks: filteredTaskDetails }
  });
});

//========================================================================================
// Mark task as completed (by assignee)
exports.completeTask = catchAsync(async (req, res, next) => {
  const { taskDetailId } = req.params;
  const notes = req.body?.notes || '';
  
  const taskDetail = await TaskDetails.findById(taskDetailId)
    .populate('task_id');
  
  if (!taskDetail) {
    return next(new AppError("Task assignment not found", 404));
  }
  
  // Only the assigned member can mark it complete
  if (taskDetail.member_mail !== req.member.mail) {
    return next(new AppError("You can only complete tasks assigned to you", 403));
  }
  
  if (!taskDetail.assignment_approved) {
    return next(new AppError("This task assignment is not yet approved", 400));
  }
  
  if (taskDetail.status === 'approved') {
    return next(new AppError("This task is already approved", 400));
  }
  
  taskDetail.status = 'completed';
  taskDetail.completed_at = Date.now();
  if (notes) taskDetail.notes = notes;
  await taskDetail.save();
  
  res.status(200).json({
    status: "success",
    message: "Task marked as completed. Waiting for parent approval.",
    data: { taskDetail }
  });
});

//========================================================================================
// Get completed tasks waiting for approval (Parent only)
exports.getTasksWaitingApproval = catchAsync(async (req, res, next) => {
  const taskDetails = await TaskDetails.find({ status: 'completed' })
    .populate({
      path: 'task_id',
      match: { family_id: req.familyAccount._id },
      populate: { path: 'category_id' }
    })
    .sort({ completed_at: -1 });
  
  const filteredTaskDetails = taskDetails.filter(td => td.task_id !== null);
  
  res.status(200).json({
    status: "success",
    results: filteredTaskDetails.length,
    data: { tasksWaitingApproval: filteredTaskDetails }
  });
});

//========================================================================================
// Approve/Reject completed task and award points (Parent only)
exports.approveTaskCompletion = catchAsync(async (req, res, next) => {
  const { taskDetailId } = req.params;
  const { approved, notes } = req.body;
  
  if (approved === undefined) {
    return next(new AppError("Please provide approval status (approved: true/false)", 400));
  }
  
  const PointWallet = require("../models/point_walletModel");
  const PointDetails = require("../models/point_historyModel");
  
  const taskDetail = await TaskDetails.findById(taskDetailId)
    .populate('task_id');
  
  if (!taskDetail) {
    return next(new AppError("Task assignment not found", 404));
  }
  
  // Verify belongs to family
  const task = await Task.findById(taskDetail.task_id);
  if (task.family_id.toString() !== req.familyAccount._id.toString()) {
    return next(new AppError("This task doesn't belong to your family", 403));
  }
  
  if (taskDetail.status !== 'completed') {
    return next(new AppError("Task is not marked as completed", 400));
  }
  
  if (approved) {
    // Approve and award points
    taskDetail.status = 'approved';
    taskDetail.approved_by = req.member.mail;
    taskDetail.approved_at = Date.now();
    if (notes) taskDetail.notes += `\nApproval notes: ${notes}`;
    await taskDetail.save();
    
    // Update point wallet
    let wallet = await PointWallet.findOne({ member_mail: taskDetail.member_mail });
    if (!wallet) {
      wallet = await PointWallet.create({ 
        member_mail: taskDetail.member_mail, 
        total_points: 0 
      });
    }
    
    wallet.total_points += taskDetail.assigned_points;
    await wallet.save();
    
    // Create point history entry
    await PointDetails.create({
      wallet_id: wallet._id,
      member_mail: taskDetail.member_mail,
      points_amount: taskDetail.assigned_points,
      reason_type: 'task_completion',
      task_id: taskDetail.task_id,
      granted_by: req.member.mail,
      description: `Task completed: ${task.title}`
    });
    
    res.status(200).json({
      status: "success",
      message: `Task approved! ${taskDetail.assigned_points} points awarded.`,
      data: { taskDetail, wallet }
    });
  } else {
    // Reject
    taskDetail.status = 'rejected';
    taskDetail.approved_by = req.member.mail;
    if (notes) taskDetail.notes += `\nRejection reason: ${notes}`;
    await taskDetail.save();
    
    res.status(200).json({
      status: "success",
      message: "Task completion rejected",
      data: { taskDetail }
    });
  }
});

//========================================================================================
// Set point deduction for undone tasks (manual penalty by Parent)
exports.manualPenalty = catchAsync(async (req, res, next) => {
  const { taskDetailId } = req.params;
  const { penalty_points, notes } = req.body;
  
  if (!penalty_points || penalty_points <= 0) {
    return next(new AppError("Please provide valid penalty_points", 400));
  }
  
  const PointWallet = require("../models/point_walletModel");
  const PointDetails = require("../models/point_historyModel");
  
  const taskDetail = await TaskDetails.findById(taskDetailId)
    .populate('task_id');
  
  if (!taskDetail) {
    return next(new AppError("Task assignment not found", 404));
  }
  
  const task = await Task.findById(taskDetail.task_id);
  if (task.family_id.toString() !== req.familyAccount._id.toString()) {
    return next(new AppError("This task doesn't belong to your family", 403));
  }
  
  // Update wallet
  let wallet = await PointWallet.findOne({ member_mail: taskDetail.member_mail });
  if (!wallet) {
    wallet = await PointWallet.create({ 
      member_mail: taskDetail.member_mail, 
      total_points: 0 
    });
  }
  
  wallet.total_points = Math.max(0, wallet.total_points - penalty_points);
  await wallet.save();
  
  // Create penalty history
  await PointDetails.create({
    wallet_id: wallet._id,
    member_mail: taskDetail.member_mail,
    points_amount: -penalty_points,
    reason_type: 'penalty',
    task_id: taskDetail.task_id,
    granted_by: req.member.mail,
    description: notes || `Penalty for task: ${task.title}`
  });
  
  // Update task status
  if (taskDetail.status === 'assigned') {
    taskDetail.status = 'late';
  }
  taskDetail.notes += `\nPenalty applied: -${penalty_points} points. ${notes || ''}`;
  await taskDetail.save();
  
  res.status(200).json({
    status: "success",
    message: `Penalty applied: -${penalty_points} points`,
    data: { taskDetail, wallet }
  });
});
