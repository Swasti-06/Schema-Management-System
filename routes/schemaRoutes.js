import { Router } from "express";
import multer from "multer";
import { uploadSchema, editSchema, getSchema } from "../controllers/schemaControllers.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/schemas/upload", upload.single("file"), uploadSchema);
router.post("/schemas/edit", upload.single("file"), editSchema);
router.get("/schemas", getSchema);

export default router;
