const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    article: {
      type: String,
      required: true,
    },
    postedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    postedByName: {
      type: String,
      required: true,
    },
    postedByBranch: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const fileSchema = new mongoose.Schema(
  {
    file: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    postedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    postedByName: {
      type: String,
      required: true,
    },
    postedByBranch: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  posts: {
    articles: [articleSchema],
    files: [fileSchema],
  },
  createdById:{
    type: String,
    required: true,
  }
});

const yearSchema = new mongoose.Schema({
  years_subfolders: {
    type: String,
    enum: ["First", "Second", "Third", "Final"],
    required: true,
  },
  subjects: [subjectSchema],
});

const branchSchema = new mongoose.Schema({
  branchName: {
    type: String,
    required: true,
    unique: true,
  },
  years: [yearSchema],
});

const BranchModel = mongoose.model("Branch", branchSchema);

module.exports = BranchModel;