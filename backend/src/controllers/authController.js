import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/auth.js';

export const register = async (req, res, next) => {
  try {
    const { name, employeeId, role, assignedRoute, assignedBus, password } = req.body;
    const existing = await User.findOne({ employeeId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Employee ID already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      employeeId,
      role: role || 'conductor',
      assignedRoute,
      assignedBus,
      password: hashedPassword,
    });
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        assignedRoute: user.assignedRoute,
        assignedBus: user.assignedBus,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;
    const user = await User.findOne({ employeeId, isActive: true }).populate('assignedRoute');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        assignedRoute: user.assignedRoute,
        assignedBus: user.assignedBus,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('assignedRoute');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
