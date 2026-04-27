export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false, 
                message: "Unauthorized" 
            });
        }

        const hasRole = req.user.role.some(role => roles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        next();
    }
}