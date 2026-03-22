import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { google } from 'googleapis';
import User from '../models/User.js';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../utils/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const normalizeFrontendUrl = () => FRONTEND_URL.replace(/\/+$/, '');

const buildGoogleCallbackUrl = (request) => {
  if (GOOGLE_REDIRECT_URI) {
    return GOOGLE_REDIRECT_URI;
  }

  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || 'http';
  return `${proto}://${request.headers.host}/api/auth/google-callback`;
};

const findOrCreateGoogleUser = async ({ googleId, email, name, profilePicture }) => {
  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (!user) {
    user = new User({
      name,
      email: email.toLowerCase(),
      googleId,
      profilePicture,
      isVerified: true
    });
    await user.save();
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.profilePicture = profilePicture;
    user.isVerified = true;
    await user.save();
  }

  return user;
};

// Password validation
const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
};

// Signup
export const signup = async (request, reply) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return reply.status(400).send({ message: 'All fields are required' });
    }

    if (!validatePassword(password)) {
      return reply.status(400).send({ message: 'Password must be strong.' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return reply.status(400).send({ message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: true
    });

    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    return reply.status(201).send({
      message: 'Account created successfully. You can login now.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

// Login
export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Security: Do not reveal if email exists or not
    if (!user) {
      return reply.status(401).send({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.send({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

// Forgot Password
export const forgotPassword = async (request, reply) => {
  try {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return reply.send({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token (expires in 15 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendResetPasswordEmail(user.email, user.name, resetToken);

    return reply.send({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

// Reset Password
export const resetPassword = async (request, reply) => {
  try {
    const { token, password } = request.body;

    if (!token || !password) {
      return reply.status(400).send({ message: 'Token and password are required' });
    }

    if (!validatePassword(password)) {
      return reply.status(400).send({ message: 'Password must be strong.' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return reply.status(400).send({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return reply.send({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

// Verify Email
export const verifyEmail = async (request, reply) => {
  try {
    const { token } = request.body;

    // Verification is optional now; keep endpoint backward-compatible for old links.
    if (!token) {
      return reply.send({ message: 'Email verification is no longer required. You can login now.' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return reply.send({ message: 'Email verification is no longer required. You can login now.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return reply.send({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

export const googleLoginRedirect = async (request, reply) => {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reply.status(500).send({ message: 'Google OAuth is not configured' });
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      buildGoogleCallbackUrl(request)
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent'
    });

    return reply.redirect(authUrl);
  } catch (error) {
    console.error('Google redirect error:', error);
    return reply.status(500).send({ message: 'Failed to start Google login' });
  }
};

export const googleCallback = async (request, reply) => {
  try {
    const { code } = request.query;
    if (!code) {
      return reply.redirect(`${normalizeFrontendUrl()}/login?oauthError=missing_code`);
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      buildGoogleCallbackUrl(request)
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data?.id || !data?.email) {
      return reply.redirect(`${normalizeFrontendUrl()}/login?oauthError=profile_missing`);
    }

    const user = await findOrCreateGoogleUser({
      googleId: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      profilePicture: data.picture
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.redirect(`${normalizeFrontendUrl()}/login?token=${encodeURIComponent(token)}&oauth=success`);
  } catch (error) {
    console.error('Google callback error:', error);
    return reply.redirect(`${normalizeFrontendUrl()}/login?oauthError=callback_failed`);
  }
};

// Google Login
export const googleLogin = async (request, reply) => {
  try {
    const { googleId, email, name, profilePicture } = request.body;

    if (!googleId || !email) {
      return reply.status(400).send({ message: 'Google ID and email are required' });
    }

    const user = await findOrCreateGoogleUser({ googleId, email, name, profilePicture });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.send({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
};
