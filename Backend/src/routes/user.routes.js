import { Router } from "express";
import { registerUser,loginUser, logoutUser, updateUser,refreshAccessToken , verifyEmail} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import verifyJWT from "../middleware/auth.middleware.js"

const router = Router();

// router.route("/register").post(
//     upload.fields( //multer middleware for file handling
//         [
//             {
//                 name: "coverImage",
//                 maxCount: 1,
//             }
//         ] 
//     ),
//     registerUser
// )
router.route("/register").post(registerUser);

router.route("/me").get(verifyJWT, (req, res) => {
  res.status(200).json({ user: req.user });
});

router.route("/signin").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT , logoutUser) //that's how you use middleware // before logout we are checking if he logged in or not
router.route("/update").put(verifyJWT, updateUser);
router.route("/refresh-token").post(refreshAccessToken);
router.get("/verify-email/:token", verifyEmail);


export default router;
