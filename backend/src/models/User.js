import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function () { return !this.googleId; }
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpiry: {
    type: Date
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  googleId: {
    type: String,
    sparse: true
  },
  profilePicture: {
    type: String
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
