import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";







const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 });
        const refreshToken = jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 });

        await User.findByIdAndUpdate(userId, { refreshToken });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.");
    }
};



const registerUser = asyncHandler(async (req, res, next) => {
    const { email, username, password } =  req.body;
    
    if ( [email, username, password].some(field => field === "")) {
        return next(new ApiError(400, "All fields are required"));
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, "Invalid email address"));
    }

    if (password.length < 8) {
      return next(new ApiError(400, "Password must be at least 8 characters long"));
    }


    const existedUser = await  User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
       return next(new ApiError(400, "User already exists"));
    }
 
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password
    })
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        return next(new ApiError(500, "Something went wrong while registering the user"));
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
    .status(201)
    .cookie("accessToken", accessToken, {
        httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
        sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
      })
    .cookie("refreshToken", refreshToken, {
        httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
        sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
      })
    .json(new ApiResponse(200, {createdUser, accessToken, refreshToken}, "User created successfully")) || ApiError(500, "Something went wrong while registering the user").redirect("/");
})


const loginUser = asyncHandler(async (req, res, next) => {

    // need auth middleware
    const { email, username, password } = req.body;

    if (!username && !email) {
        return next(new ApiError(400, "Username or Email is required"));
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        return next(new ApiError(404, "User not found"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return next(new ApiError(401, "Invalid password"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");



    // Send response with cookies and redirect URL
    return res
        .status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
            maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
            sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
          })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
            sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
          })
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        ));
});






export {generateAccessAndRefreshToken, registerUser, loginUser}
