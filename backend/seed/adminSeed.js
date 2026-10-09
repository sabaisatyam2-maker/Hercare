const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    // Check for missing environment variables
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be defined in the .env file.');
      process.exitCode = 1;
      return;
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();

    // Connect to the database
    await connectDB();

    // Idempotent Check: Find if a user with this email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('Admin already exists.');
        return; // Exit successfully without making changes
      } else {
        console.error('Error: A normal user already exists with this email address. Cannot promote automatically.');
        process.exitCode = 1;
        return;
      }
    }

    // Create the admin user using new User() to ensure pre("save") hook runs
    const adminUser = new User({
      name: ADMIN_NAME,
      email: email,
      password: ADMIN_PASSWORD, // plain text, pre-save hook will hash it
      role: 'admin',
      isEmailVerified: true,
      onboardingCompleted: true
    });

    await adminUser.save();
    console.log(`Admin created: ${email}`);

  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exitCode = 1;
  } finally {
    // Only close the connection. Node will exit gracefully honoring process.exitCode
    await mongoose.connection.close();
  }
};

seedAdmin();
