import asyncHandler from "../utils/asyncHandler.js";
import Blog  from "../models/blog.model.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// Create a new blog
const createBlog = asyncHandler(async (req, res, next) => {
    
    const { title, content } = req.body;
    let { categories } = req.body;
    const imageLocalPath = req.file?.path;
    let image = "";
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ApiError(404, "Login to post blog"));
    }
    if ([title, content].some(field => field === "")) {
        return next(new ApiError(400, "Title and content are required"));
    }

    if (categories) {
        categories = JSON.parse(categories);
    } else {
        categories = [];
    }

    if (imageLocalPath) {    
        image = await uploadOnCloudinary(imageLocalPath);
        image = image.secure_url;
    }
    
    const blog = await Blog.create({
        title,
        content,
        author: user._id,
        categories,
        image
    });

    if (!blog) {
        return next(new ApiError(500, "Something went wrong while creating blog"));
    }

    res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));

});

export {
    createBlog
}