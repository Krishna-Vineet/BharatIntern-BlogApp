import express from "express";
import {
    createBlog
} from "../controllers/blog.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/create', verifyJWT, upload.single('image'), createBlog);

export default router;
