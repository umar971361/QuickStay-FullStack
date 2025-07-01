import User from "../models/User.js";

// Middleware to check if user is authenticated
export const protect = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    // Try to find user by Clerk userId first
    let user = await User.findOne({ clerkId: userId });
    
    // If user doesn't exist, create a new user record
    if (!user) {
      // Get user data from Clerk
      try {
        user = new User({
          clerkId: userId,
          role: 'guest', // default role
          recentSearchedCities: []
        });
        await user.save();
        console.log("New user created:", userId);
      } catch (createError) {
        console.error("Error creating user:", createError);
        return res.status(500).json({ success: false, message: "Error creating user profile" });
      }
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ success: false, message: "Authentication error" });
  }
};