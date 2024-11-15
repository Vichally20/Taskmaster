import asyncHandler from 'express-async-handler';
import User from '../../models/auth/userModel.js';
import generateToken from '../../helpers/generateToken.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Token from '../../models/auth/Token.js';
import crypto from 'node:crypto';
import hashToken from '../../helpers/hashToken.js';
import sendEmail from '../../helpers/sendEmail.js';



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

// verify user email
export const verifyEmail = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user._id);

    //if user exist
    if(!user){
        // 404 - Not found
        res.status(404).json({ message: "User not found" });
    }

    //check if user is already verified
    if(user.isVerified){
        // 400 - Bad request
        return res.status(400).json({ message: "User is already verified" });
    }

    let token = await Token.findOne({ userId: user._id });

    //if token exist==============> update the token
    if(token){
        // 400 - Bad request
       await token.deleteOne();
    }

    //create a verification token for user using crypto
    const verificationToken = crypto.randomBytes(64).toString("hex") + user._id;


    //hash the verification token
    const hashedToken = hashToken(verificationToken);

    await new Token({
        userId: user._id,
        verificationToken: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }).save();

    //verification link   
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    //send email
    const subject = "Email Verification - TaskMaster";
    const send_to = user.email;
    const reply_to = "noreply@gmail.com";
    const template = "emailVerification";
    const send_from = process.env.USER_EMAIL;
    const name = user.name;
    const link = verificationLink;

    try {
        await sendEmail({ subject, send_to, send_from,  reply_to, template, name, link });
        return res.status(200).json({ message: " Email sent" });
    } catch (error) {
        console.log("Error sending email: ", error);
        return res.status(500).json({ message: "Email could not be sent" });
    }
}); 

//verify user 
export const verifyUser = asyncHandler(async(req, res) => {
    const { verificationToken } = req.params;

    if(!verificationToken){
        // 400 - Bad request
        return res.status(400).json({ message: "Invalid verification token" });
    }
    //hash the verification token
    const hashedToken = hashToken(verificationToken);

    //find the user with verification Token
    const userToken = await Token.findOne({
         verificationToken: hashedToken,

    //check if token hasnt expired
    expiresAt : { $gt: Date.now() },
         });
    
         if(!userToken){
             // 400 - Bad request
             return res.status(400).json({ message: "Invalid or expired verification token" });
         }

         //find the user with the token
         const user = await User.findById(userToken.userId);

         if(user.isVerified){
            return res.status(400).json({ message: "User is already verified" });
         }

        // update properties

        user.isVerified = true;
        await user.save();
        res.status(200).json({ message: "User verified successfully" });
}); 