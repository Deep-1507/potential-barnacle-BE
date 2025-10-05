import { z } from "zod";
import Faculty from "../models/facultyModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const signupBody = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .min(3)
    .max(50),
  name: z.string({ required_error: "Name is required" }).min(1).max(30),
  password: z.string({ required_error: "Password is required" }).min(5).max(60),
  department: z.string({ required_error: "Department is required" }).min(1),
});

export const signup = async (req, res) => {
  try {
    const result = signupBody.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ errors: formattedErrors });
    }
    const data = result.data;

    const existingFaculty = await Faculty.findOne({ email: data.email });
    if (existingFaculty) {
      return res.status(409).json({ message: "Faculty already exists" });
    }

    const faculty = await Faculty.create({
      email: data.email,
      name: data.name,
      password: data.password,
      department: data.department,
    });

    const token = jwt.sign(
      {
        facultyId: faculty._id,
        email: faculty.email,
        name: faculty.name,
        department: faculty.department,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Faculty created successfully",
      token,
      faculty: { id: faculty._id },
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

const signinBody = z.object({
  email: z.string({ required_error: "Email is required" }).email().min(3).max(50),
  password: z.string({ required_error: "Password is required" }).min(5).max(50),
});

export const signin = async (req, res) => {
  try {
    const result = signinBody.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ errors: formattedErrors });
    }
    const data = result.data;

    const faculty = await Faculty.findOne({ email: data.email });
    if (!faculty) {
      return res.status(401).json({ message: "Faculty not found! Kindly register first" });
    }

    const isPasswordValid = await bcrypt.compare(data.password, faculty.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ facultyId: faculty._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Welcome, you are logged in",
      token,
      faculty: { id: faculty._id },
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const getFacultyById = async (req, res) => {
  try {
    const facultyId = req.params.id;
    const faculty = await Faculty.findById(facultyId).select("-password");
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res.status(200).json({ faculty, message: "Faculty found" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const getFacultyByToken = async (req, res) => {
  try {
    const facultyId = req.userId;
    const faculty = await Faculty.findById(facultyId).select("-password");
 console.log(faculty)
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res.status(200).json({ faculty, message: "Faculty found" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

const updateFacultyBody = z.object({
  email: z.string().email().min(3).max(50).optional(),
  name: z.string().min(1).max(30).optional(),
  password: z.string().min(5).max(50).optional(),
  department: z.string().min(1).max(30).optional(),
});

export const updateFaculty = async (req, res) => {
  try {
    const result = updateFacultyBody.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ errors: formattedErrors });
    }

    const facultyId = req.userId;
    const updates = result.data;

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    Object.assign(faculty, updates);
    const updatedFaculty = await faculty.save();

    res.status(200).json({
      message: "Faculty updated successfully",
      faculty: {
        id: updatedFaculty._id,
        email: updatedFaculty.email,
        name: updatedFaculty.name,
        department: updatedFaculty.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const facultyId = req.userId; // from auth middleware
    const faculty = await Faculty.findByIdAndDelete(facultyId);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};