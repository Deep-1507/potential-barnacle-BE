import express from "express";
import {
  createBranch,
  getAllBranches,
  getBranchByID,
  getSubjectContent,
  addSubject,
  uploadArticleOrFile,
  upload,
  getPostsByFaculty
} from "../controllers/materialUpload.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";

const router = express.Router();

//make this for superuser or admin only
router.post("/branches", createBranch);

router.get("/branches", getAllBranches);
router.get("/branches/:id", getBranchByID);
router.post("/subject-Content",getSubjectContent); 
router.get("/posts/faculty",authMiddleware,getPostsByFaculty); 
router.post("/branches/:branchId/subjects",authMiddleware, addSubject);
router.post(
  "/branches/:branchId/upload",authMiddleware,
  upload.single("file"),
  uploadArticleOrFile
);

export default router;