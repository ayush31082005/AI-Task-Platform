const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    inputText: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    operation: {
      type: String,
      required: true,
      enum: ["uppercase", "lowercase", "reverse", "word_count"],
    },
    status: {
      type: String,
      enum: ["Pending", "Running", "Success", "Failed"],
      default: "Pending",
      index: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    logs: {
      type: [logSchema],
      default: [],
    },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
