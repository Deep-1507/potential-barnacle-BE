import express from "express";
import {
  signup,
  signin,
  getFacultyById,
  getFacultyByToken,
  updateFaculty,
  deleteFaculty,
} from "../controllers/faculty.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/", signup);
router.post("/signin", signin);
router.get("/faculty-details", authMiddleware, getFacultyByToken);
router.get("/:id", getFacultyById);
router.patch("/", authMiddleware, updateFaculty);
router.delete("/", authMiddleware, deleteFaculty);

export default router;
