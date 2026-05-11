/**
 * Role-based access control middleware
 */

/**
 * Teacher-only access
 */
export const teacherOnly = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Teacher privileges required.' 
    });
  }
};

/**
 * Student-only access
 */
export const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Student privileges required.' 
    });
  }
};

/**
 * Admin-only access
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};
