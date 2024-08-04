import express from "express";

import {
    registerUser,
    loginUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();



router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
