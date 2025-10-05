import express from "express";
import Branch from "../models/folderModel.js";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const createBranchBody = z.object({
  branchName: z.string().min(1).max(50),
  years: z.array(
    z.object({
      years_subfolders: z.enum(["First", "Second", "Third", "Final"]),
    })
  ),
});

export const createBranch = async (req, res) => {
  try {
    const result = createBranchBody.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }
    const { branchName, years } = result.data;

    const existingBranch = await Branch.findOne({ branchName });
    if (existingBranch) {
      return res.status(409).json({ message: "Branch already exists" });
    }

    const branch = await Branch.create({ branchName, years });
    res.status(201).json({ message: "Branch created", branch });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching branches" });
  }
};

export const getBranchByID = async (req, res) => {
  try {
    const branches = await Branch.findById(req.params.id);
    res.status(200).json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching branches" });
  }
};

export const getSubjectContent = async (req, res) => {
  try {
    const { branchId, yearId, subjectId } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) res.status(404).json({ message: "Branch not found" });

    const year = branch.years.id(yearId);
    if (!year)
      res.status(404).json({ message: "Year not found in this branch" });

    const subject = year.subjects.id(subjectId);
    if (!subject)
      res.status(404).json({ message: "Subject not found in this year" });

    res.status(200).json({
      articles: subject.posts.articles,
      files: subject.posts.files,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const addSubjectBody = z.object({
  yearId: z.string().length(24),
  subjectName: z.string().min(1).max(50),
});

export const addSubject = async (req, res) => {
  try {
    const result = addSubjectBody.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }

    const { branchId } = req.params;
    const { yearId, subjectName } = result.data;
    const createdById = req.userId;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const year = branch.years.id(yearId);
    if (!year) {
      return res.status(404).json({ message: "Year not found in this branch" });
    }

    if (
      year.subjects.some(
        (s) => s.name.toLowerCase() === subjectName.toLowerCase()
      )
    ) {
      return res
        .status(409)
        .json({ message: "Subject already exists in this year" });
    }

    year.subjects.push({
      name: subjectName,
      posts: { articles: [], files: [] },
      createdById,
    });

    await branch.save();

    res.status(201).json({
      message: "Subject added successfully",
      year,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const uploadArticleBody = z.object({
  yearId: z.string().length(24),
  subjectId: z.string().length(24),
  type: z.enum(["article", "file"]),
  content: z.string().optional(),
  postedByName: z.string().min(1).max(50),
  postedByBranch: z.string().min(1).max(50),
});

export const uploadArticleOrFile = async (req, res) => {
  try {
    let data;
    try {
      data = JSON.parse(req.body.data);
    } catch {
      return res.status(400).json({ message: "Invalid JSON format in form data" });
    }

    const result = uploadArticleBody.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }

    const { branchId } = req.params;
    const {
      yearId,
      subjectId,
      type,
      content,
      postedByName,
      postedByBranch,
      fileName, // <-- custom text name from frontend
    } = result.data;

    const postedById = req.userId;

    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    const year = branch.years.id(yearId);
    if (!year) return res.status(404).json({ message: "Year not found" });

    const subject = year.subjects.id(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    if (type === "article") {
      if (!content)
        return res.status(400).json({ message: "Content is required for article" });

      subject.posts.articles.push({
        article: content,
        postedById,
        postedByName,
        postedByBranch,
      });
    } else if (type === "file") {
      if (!req.file)
        return res.status(400).json({ message: "File is required" });

      const baseUrl = process.env.BACKEND_URL.replace(/\/$/, "");
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      subject.posts.files.push({
        fileName, // ✅ your custom name (user text)
        storedFileName: req.file.filename, // internal saved name
        realFileName: req.file.originalname, // original file name (optional)
        fileUrl, // public link
        postedById,
        postedByName,
        postedByBranch,
      });
    }

    await branch.save();
    res.status(201).json({ message: `${type} uploaded successfully`, subject });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPostsByFaculty = async (req,res) => {
  try {
    const facultyId = req.userId;
    const branches = await Branch.find({}).lean();

    const results = [];

    branches.forEach(branch => {
      branch.years.forEach(year => {
        year.subjects.forEach(subject => {
          // Filter articles
          const facultyArticles = (subject.posts?.articles || []).filter(
            article => article.postedById.toString() === facultyId
          );

          // Filter files
          const facultyFiles = (subject.posts?.files || []).filter(
            file => file.postedById.toString() === facultyId
          );

          if (facultyArticles.length > 0 || facultyFiles.length > 0) {
            results.push({
              branchName: branch.branchName,
              year: year.years_subfolders,
              subject: subject.name,
              articles: facultyArticles,
              files: facultyFiles,
            });
          }
        });
      });
    });

    res.status(200).json({ message: "Posts fetched successfully", results });
  } catch (err) {
    console.error("Error fetching posts by faculty:", err);
    throw err;
  }
};
