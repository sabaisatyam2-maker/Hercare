const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Refresh token
    refreshToken: {
      type: String,
      select: false
    },

    // Onboarding / wellness assessment
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    goals: [String],
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active']
    },
    dietPreference: {
      type: String,
      enum: ['no-preference', 'vegetarian', 'vegan', 'eggetarian']
    },
    cycleLength: Number,
    sleepGoalHours: Number,
    waterGoalLiters: Number
  },
  {
    timestamps: true
  }
);

// 1. Password hashing pre-save hook
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 2. Password check karne ka method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 3. Email verification token generate karne ka method
userSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// 4. Password reset token generate karne ka method
userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
