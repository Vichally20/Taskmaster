import asyncHandler from "express-async-handler";
import User from "../../models/auth/userModel.js"; // Adjust the path as necessary

export const deleteUser = asyncHandler(async(req, res) => {
    const { id } = req.params;

    //attempt to find and delete the user
    try {
        const user = await User.findByIdAndDelete(id);
        if(!user){
            // 404 - Not found
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Cannot delte User" });
    }
});


//get all users
export const getAllUsers = asyncHandler(async(req, res) => {
try {
    const users = await User.find({});
    if(!users){
        // 404 - Not found
        res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);

} catch (error) {
    res.status(500).json({ message: "Cannot get users" });
}
});