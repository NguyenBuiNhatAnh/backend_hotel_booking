import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                success: false,
                message: "No token provided" 
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lưu user info vào request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false,
            message: "Invalid token" 
        });
    }
};
