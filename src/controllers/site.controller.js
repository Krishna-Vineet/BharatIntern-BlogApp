import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";

const getHomePage = asyncHandler(async (req, res, next) => {
    let user = null;
    if (req?.user?._id) {
        user = await User.findById(req.user._id).select("-password -refreshToken");
    }
    
    try {
        // Fetch latest blogs
        const latestBlogs = await Blog.find({}).sort({ createdAt: -1 }).limit(8).populate("author", "_id username avatar");

        // Fetch popular blogs
        const popularBlogs = await Blog.find({}).sort({ likes: -1 }).limit(8).populate("author", "_id username avatar");

        // Fetch statistics
        const totalUsers = await User.countDocuments();
        const totalBlogs = await Blog.countDocuments();
        const topAuthor = await User.findOne().sort({ blogCount: -1 });
        const mostLikedBlog = await Blog.findOne().sort({ likes: -1 });

        // Fetch trending blogs
        // const trendingBlogs = await Blog.find({}).sort({ views: -1 }).limit(3);

        // Fetch blogs from people user follows (assuming req.user contains the logged-in user's info)
        // let followedUserBlogs = [];
        // if (user) {
        //     const followedUsers = await Follow.find({ follower: user._id }).populate('following', '_id');
        //     followedUserBlogs = await Blog.find({ author: { $in: followedUsers.map(follow => follow.following._id) } }).limit(10);
        // }

        // Render the home page with fetched data
        const data = {
            user,
            latestBlogs,
            popularBlogs,
            // topAuthors,
            statistics: {
                totalUsers,
                totalBlogs,
                topAuthor: topAuthor ? topAuthor.username : 'N/A',
                mostLikedBlog: mostLikedBlog ? mostLikedBlog.title : 'N/A'
            },
            // trendingBlogs,
            // followedUserBlogs
        };
        console.log(data);
        
        res.render('home', data);
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while fetching home page data"));
    }
});


const getHeaderDetails = asyncHandler(async (req, res, next) => {
    let user = null;
    if (req?.user?._id) {
        user = await User.findById(req.user._id).select("-password -refreshToken");
    }
    try {
        const topAuthors = await User.find({}).sort({ blogCount: -1 }).limit(3);
        const trendingBlogs = await Blog.find({}).sort({ views: -1 }).limit(3);
    
            // Fetch blogs from people user follows (assuming req.user contains the logged-in user's info)
        let followedUserBlogs = [];
        if (user) {
            const followedUsers = await Follow.find({ follower: user._id }).populate('following', '_id');
            followedUserBlogs = await Blog.find({ author: { $in: followedUsers.map(follow => follow.following._id) } }).limit(10);
        }

        res.json({ user, topAuthors, trendingBlogs, followedUserBlogs });
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while fetching header details"));
    }
    
    
})


const getAddBlogPage = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        console.log("Login to add blog");
        res.render('login');
    }
    res.render('add-blog');
}) 



export { getHomePage, getAddBlogPage, getHeaderDetails };
