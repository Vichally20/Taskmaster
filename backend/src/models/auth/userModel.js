import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"],
    },

    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },

    password: {
        type: String,
        required: [true, "Please provide a password"],
    },

    photo: {
        type: String,
        default: "no-photo.jpg",
    },

    bio: {
        type: String,
        default: "i am a new user.",
    },

    role: {
        type: String,
        enum: ["user", "admin", "creator"],
        default: "user",
    },

    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, minimize: true }); 

//hash password before saving to database
userSchema.pre("save", async function(next){
    //check if password is not modified
    if(!this.isModified("password")){
        next();
    }
    //hash password using bcrypt
    //generate salt
    const salt = await bcrypt.genSalt(10);
    //hash password with salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    //set password to hashed password
    this.password = hashedPassword;

    //call next middleware
    next();
})

const User = mongoose.model("User", userSchema);

export default User;