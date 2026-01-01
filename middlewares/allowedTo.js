import appError from "../utils/app_error.js"
import httpStatusText from "../utils/httpStatusText.js"

const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return next(appError.create("Unauthorized - Please login first", 401, httpStatusText.ERROR));
    }

    if (req.user.role !== 'admin') {
        return next(appError.create("Access denied - Admins only", 403, httpStatusText.FAIL));
    }

    next();
};
export default authorizeAdmin;