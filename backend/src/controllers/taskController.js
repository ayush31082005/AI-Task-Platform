const Task = require("../models/Task");
const redis = require("../config/redis");

const VALID_OPERATIONS = [
  "uppercase",
  "lowercase",
  "reverse",
  "word_count",
];

async function createTask(req, res, next) {
  try {
    const { title, inputText, operation } = req.body;

    if (!title || !inputText || !operation) {
      return res.status(400).json({
        success: false,
        message: "Title, inputText and operation are required",
      });
    }

    if (!VALID_OPERATIONS.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported operation",
      });
    }

    const task = await Task.create({
      userId: req.user._id,
      title: title.trim(),
      inputText,
      operation,
      status: "Pending",
      logs: [{ message: "Task created" }],
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
}

async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
}

async function runTask(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.status === "Running") {
      return res.status(409).json({
        success: false,
        message: "Task is already running",
      });
    }

    task.status = "Pending";
    task.result = null;
    task.error = null;
    task.startedAt = null;
    task.completedAt = null;
    task.logs.push({ message: "Task queued" });
    await task.save();

    await redis.lpush(
      "ai_tasks",
      JSON.stringify({
        taskId: task._id.toString(),
      })
    );

    res.status(202).json({
      success: true,
      message: "Task queued",
      task,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createTask, listTasks, getTask, runTask };
