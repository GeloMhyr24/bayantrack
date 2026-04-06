import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secrettoken';
const PERMISSION_ACTIONS = ['view', 'add', 'edit', 'archive', 'delete'];

function defaultPermissionFlags() {
  return { view: true, add: true, edit: true, archive: true, delete: true };
}

function getModulePermissions(user, moduleKey) {
  const fromUser = user?.adminPermissions?.[moduleKey];
  if (!fromUser) return defaultPermissionFlags();
  return {
    view: fromUser.view !== false,
    add: fromUser.add !== false,
    edit: fromUser.edit !== false,
    archive: fromUser.archive !== false,
    delete: fromUser.delete !== false,
  };
}

function hasPermission(user, moduleKey, action) {
  if (user?.role === 'superadmin') return true;
  if (user?.role !== 'admin') return false;
  if (!PERMISSION_ACTIONS.includes(action)) return false;
  const modulePerms = getModulePermissions(user, moduleKey);
  return modulePerms[action] === true;
}

export const auth = async (req, res, next) => {
  const headerToken = req.header('x-auth-token');
  const bearerToken = req.header('authorization')?.startsWith('Bearer ')
    ? req.header('authorization').replace('Bearer ', '')
    : null;

  const token = headerToken || bearerToken;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('role adminPermissions');

    if (!user) {
      return res.status(401).json({ msg: 'Invalid token user' });
    }

    req.user = {
      id: decoded.user.id,
      role: user.role,
      adminPermissions: user.adminPermissions || {},
      actingChild: decoded.user.actingChild || null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Forbidden' });
  }

  next();
};

export const optionalAuth = async (req, _res, next) => {
  const headerToken = req.header('x-auth-token');
  const bearerToken = req.header('authorization')?.startsWith('Bearer ')
    ? req.header('authorization').replace('Bearer ', '')
    : null;
  const token = headerToken || bearerToken;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('role adminPermissions');
    if (user) {
      req.user = {
        id: decoded.user.id,
        role: user.role,
        adminPermissions: user.adminPermissions || {},
        actingChild: decoded.user.actingChild || null,
      };
    }
  } catch (_err) {
    // ignore invalid optional token
  }

  next();
};

export const requireAdminPermission = (moduleKey, action = 'view') => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }
  if (!hasPermission(req.user, moduleKey, action)) {
    return res.status(403).json({ msg: 'Forbidden: insufficient permission' });
  }
  return next();
};
