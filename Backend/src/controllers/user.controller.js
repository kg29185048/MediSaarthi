import asyncCreator from "../utils/aysncCreator.js";
import errorHandler from "../utils/errorHandler.js";
import User from "../DataModels/user.model.js";
import { resHandler, ok, badRequest } from "../utils/resHandler.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new errorHandler(404, "User not found while generating tokens");

    const accessToken = user.generateAccessTokens();
    const refreshToken = user.generateRefreshTokens();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.error("Error generating tokens:", err);
    throw new errorHandler(500, "Error generating tokens");
  }
};

const registerUser = asyncCreator(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new errorHandler(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new errorHandler(409, "User already exists. Please log in.");
  }

  const token = jwt.sign(
    { name, email, password },
    process.env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "24h" }
  );

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  // Send verification email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MediSaarthi" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your email address with MediSaarthi",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Please verify your email by clicking below:</p>
      <a href="${verificationLink}" style="background:#007bff;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  });

  return res
    .status(200)
    .json(
      new resHandler(
        200,
        { email },
        "Verification email sent. Please check your inbox."
      )
    );
});

const verifyEmail = asyncCreator(async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
    const { name, email, password } = decoded;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new errorHandler(409, "User already verified. Please log in.");
    }

    // Create the user now
    const newUser = await User.create({
      name,
      email,
      password,
      isVerified: true,
    });

    return res
      .status(201)
      .json(
        new resHandler(
          201,
          { user: { _id: newUser._id, name: newUser.name, email: newUser.email } },
          "Email verified successfully. You can now log in."
        )
      );
  } catch (err) {
    console.error("Email verification error:", err);
    throw new errorHandler(400, "Invalid or expired verification link");
  }
});


const loginUser = asyncCreator(async (req, res) => {
  const { email, password } = req.body;
  const emailTrimmed = email?.trim().toLowerCase();

  if (!emailTrimmed) throw new errorHandler(400, "Enter your email id");

  const user = await User.findOne({ email: emailTrimmed });
  if (!user) throw new errorHandler(404, "User does not exist! Please register");

  const isValid = await user.isPassCorrect(password);
  if (!isValid) throw new errorHandler(401, "Please enter the correct password");

  if (!user.isVerified) {
    throw new errorHandler(403, "Please verify your email before logging in");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true, 
    sameSite: "none",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new resHandler(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});


const logoutUser = asyncCreator(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new resHandler(200, {}, "User logged out successfully"));
});


const refreshAccessToken = asyncCreator(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken || incomingRefreshToken === "undefined") {
    throw new errorHandler(401, "No refresh token provided");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new errorHandler(401, "User not found");

    if (incomingRefreshToken !== user.refreshToken) {
      throw new errorHandler(401, "Invalid or expired refresh token");
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = await generateAccessAndRefreshTokens(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new resHandler(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (err) {
    console.error("Refresh token error:", err);
    throw new errorHandler(401, "Invalid refresh token");
  }
});


export const updateUser = asyncCreator(async (req, res) => {
  const userId = req.user._id;
  const {
    fullName,
    mobileNumber,
    dob,
    timeZone,
    emailNotifications,
    pushNotifications,
  } = req.body;

  const updateData = {
    ...(fullName && { name: fullName }),
    ...(mobileNumber && { mobileNumber }),
    ...(dob && { dob }),
    ...(timeZone && { timeZone }),
    ...(typeof emailNotifications === "boolean" && { emailNotifications }),
    ...(typeof pushNotifications === "boolean" && { pushNotifications }),
  };

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  });

  if (!updatedUser) return badRequest(res, "User not found");

  return ok(res, { user: updatedUser }, "Profile updated successfully");
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
};
