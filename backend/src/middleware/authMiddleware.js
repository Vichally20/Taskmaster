import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/auth/userModel.js";

export const protect = asyncHandler(async (req, res, next) => {
    try {
        //check if user is logged in
        const token = req.cookies.token;

        if(!token){
            // 401 - Unauthorized
            res.status(401).json({ message: "Not authorized, no token" });
        } 
        //verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
           
        //get user details from the token====> excluding the password
        const user = await User.findById(decoded.id).select("-password");

        //check if user exists
        if (!user) {
            res.status(404).json({ message: "User not found!" });
        }

        //set the user details in the request object
        req.user = user;

        next();
    } catch (error) {
        // 401 - Unauthorized
        res.status(401).json({ message: "Not authorized, token failed" });
    }
});


//admin middleware
export const adminMiddleware = asyncHandler(async(req, res, next) => {
    if(req.user && req.user.role === "admin"){
        //if user is admin call next middleware
        next();
        return;
    }
    //if not admin, send 403 - Forbidden
    res.status(403).json({ message: "only admin can do this" });
});


//creator middleware
export const creatorMiddleware = asyncHandler(async(req, res, next) => {
    if ((req.user && req.user.role === "creator") && (req.user && req.user.role === "admin")) {
        //if user is creator call next middleware
        next();
        return;  
    }
    //if not creator, send 403 - Forbidden
    res.status(403).json({ message: "only creator can do this" });
}); 

// verified middleware
const verifiedMiddleware = asyncHandler(async(req, res, next) => {
    if(req.user && req.user.isVerified){
        //if user is verified call next middleware
        next();
        return;
    }
    //if not verified, send 403 - Forbidden
    res.status(403).json({ message: "please verify your email" });
});