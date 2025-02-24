import bcrypt from "bcryptjs";
import crypto from "crypto";


import { User } from "../models/user.model.js";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/emails.js";


//Sign up a new user
export const signup = async (req, res) => {
    const {email, password, name} = req.body;

    try {
        if(!email || !password || !name) {
            throw new Error("All fields are required");
        }

        const userAlreadyExists = await User.findOne({email});
        if(userAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();

        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, //24hours
        });

        //jwt
        generateTokenAndSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined,
            }
        });

    }catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        })
    }
};

//Verify Email
export const verifyEmail = async (req, res) => {
    // 1 2 3 4 5 6
    const {code} = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: {$gt: Date.now()}
        })

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }

        user.isVerified = true;
        user.createdAt = Date.now();
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully", 
            user: {
                ...user._doc,
                password: undefined,
            }
        });

    } catch (error) {
        console.log("Error in verifying email", error);
        res.send(500).json({
            success: false,
            message: "Server Error",
        })
    }
};

//Login 
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({
                success: false,
                message: "Invlaid Credentials",
            });
        };

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials",
            });
        };

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged In Successfully", 
            user: {
                ...user._doc,
                password: undefined,
            }
        });

    } catch (error) {
        console.log("ERROR in Login ", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

//Logout
export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logged Out Successfully"
    });
};

//forgot Password
export const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found",
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();

        //send Email
        await sendPasswordResetEmail(user.email, `http://localhost:5173/reset-password/${resetToken}`);

        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });
        
    } catch (error) {
        console.log("ERROR in forgot Passeord: ", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

//reset Password
export const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // update password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;

        await user.save();
        
        await sendResetSuccessEmail(user.email);

        res.status(200).json({
            success: true,
            message: "Password Reset Successful"
        });

    } catch (error) {
        console.log("ERROR in reset Passeord: ", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

//Check Auth
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found",
            })
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.log("Error in Check Auth: ", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
