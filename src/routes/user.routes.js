import { Router } from "express";
import { registerUser,loginUser, logoutUser } from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import verifyJWT from "../middleware/auth.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields( //multer middleware for file handling
        [
            {
                name: "coverImage",
                maxCount: 1,
            }
        ] 
    ),
    registerUser
)

router.route("/signin").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT , logoutUser) //that's how you use middleware // before logout we are checking if he logged in or not

export default router;
