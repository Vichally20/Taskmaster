import asyncHandler from 'express-async-handler';
import User from '../../models/auth/userModel.js';
import generateToken from '../../helpers/generateToken.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//User registration
export const registerUser = asyncHandler(async(req, res) => {
    const { name, email, password } = req.body;

    // validation
    if(!name || !email || !password){
        // 400 - Bad request
        res.status(400).json({ message: "All fields are required" }); 
    }

    // check password length
    if(password.length < 6){
        // 400 - Bad request
        return res.status(400).json({ message: "Password must be at least 6 characters long" }); 
    }

    // check if user already exists
    const userExists = await User.findOne({ email });

    if(userExists){
        // 400 - Bad request
        return res.status(400).json({ message: "User already exists" }); 
    }

    //create user

    const user = await User.create({
        name,
        email,
        password
    });

    //generate token with user id

    const token = generateToken(user._id);
    console.log(token);

    //send back the user and token to the client
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: true,
        secure: true,
    });

    if(user){
       const { _id, name, email, role, photo, bio, isVerified } = user;
       // 201 - Created
         res.status(201).json({ _id, name, email, role, photo, bio, isVerified, token });
    }else{
        // 400 - Bad request
        res.status(400).json({ message: "Invalid user data" }); 
    }
});

//User login
export const loginUser = asyncHandler(async(req, res) => {
    //get email and password from the request body
    const { email, password } = req.body;

    //validation
    if(!email || !password){
        // 400 - Bad request
        res.status(400).json({ message: "All fields are required" }); 
    }

    //check if user exists
    const userExists = await User.findOne({ email });
    if(!userExists){
        // 400 - Bad request
        return res.status(400).json({ message: "User not found, sign up" }); 
    }

    // check if password matches hashed password in the database
    const isMatch = await bcrypt.compare(password, userExists.password);
    
    if(!isMatch){
        // 400 - Bad request
        return res.status(400).json({ message: "Invalid credentials" }); 
    }

    //generate token with user id
    const token = generateToken(userExists._id);

    if(userExists && isMatch){
        const { _id, name, email, role, photo, bio, isVerified } = userExists;
        //set token in cookie
        res.cookie("token", token, {
            path: "/",
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: true,
            secure: true,
        });
        //send back the user and token to the client
    res.status(200).json({ _id, name, email, role, photo, bio, isVerified, token });
    }else{
        // 400 - Bad request
        res.status(400).json({ message: "Invalid email or password" }); 
    }
    
});

//logout user

export const logoutUser = asyncHandler(async(req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
});

//get user profile

export const getUser = asyncHandler(async(req, res) => {
     // get user details excluding the password

     const user = await User.findById(req.user._id).select("-password");

     if(user){
         res.status(200).json(user);
        }else{
            // 404 - Not found
            res.status(404).json({ message: "User not found" });
        }
});

//update user profile
export const updateUser = asyncHandler(async(req, res) => {
    //get user profile=========> protect middleware
const user = await User.findById(req.user._id);

if(user){
    //user properites to update
    const { name, bio, photo } = req.body;
    //update user properties
    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    user.photo = req.body.photo || user.photo;

    const updated = await user.save();

    res.status(200).json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        photo: updated.photo,
        bio: updated.bio,
        isVerified: updated.isVerified,
    });
}else{
    // 404 - Not found
    res.status(404).json({ message: "User not found" });
}
});

//login status

export const userLoginStatus = asyncHandler(async(req, res) => {
    const token = req.cookies.token;

    if(!token){
        res.status(401).json({ message: "Not authorized, please login" });
    }
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if(decoded){
        res.status(200).json(true);
    }else{
        res.status(401).json(false);
    }
});
