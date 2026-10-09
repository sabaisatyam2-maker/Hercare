const User = require('../models/User');

const updateOnboarding = async (req, res) => {
  try {
    const body = req.body || {};
    const { 
      goals, 
      activityLevel, 
      dietPreference, 
      cycleLength, 
      sleepGoalHours, 
      waterGoalLiters 
    } = body;

    if (
      goals === undefined && 
      activityLevel === undefined && 
      dietPreference === undefined && 
      cycleLength === undefined && 
      sleepGoalHours === undefined && 
      waterGoalLiters === undefined
    ) {
      return res.status(400).json({ message: 'Please provide at least one onboarding field' });
    }

    const updateData = {
      onboardingCompleted: true
    };

    if (goals !== undefined) {
      if (!Array.isArray(goals)) {
        return res.status(400).json({ message: 'Goals must be an array' });
      }

      const processedGoals = [];
      for (const g of goals) {
        if (typeof g !== 'string') {
          return res.status(400).json({ message: 'Each goal must be a non-empty string' });
        }
        const trimmed = g.trim();
        if (trimmed.length === 0) {
          return res.status(400).json({ message: 'Each goal must be a non-empty string' });
        }
        processedGoals.push(trimmed);
      }

      const uniqueGoals = [...new Set(processedGoals)];

      if (uniqueGoals.length > 10) {
        return res.status(400).json({ message: 'You can select at most 10 goals' });
      }

      updateData.goals = uniqueGoals;
    }

    if (activityLevel !== undefined) {
      const validActivityLevels = ['sedentary', 'light', 'moderate', 'active'];
      if (!validActivityLevels.includes(activityLevel)) {
        return res.status(400).json({ message: `activityLevel must be one of: ${validActivityLevels.join(', ')}` });
      }
      updateData.activityLevel = activityLevel;
    }

    if (dietPreference !== undefined) {
      const validDietPrefs = ['no-preference', 'vegetarian', 'vegan', 'eggetarian'];
      if (!validDietPrefs.includes(dietPreference)) {
        return res.status(400).json({ message: `dietPreference must be one of: ${validDietPrefs.join(', ')}` });
      }
      updateData.dietPreference = dietPreference;
    }

    if (cycleLength !== undefined) {
      const cl = Number(cycleLength);
      if (!Number.isInteger(cl) || cl < 15 || cl > 90) {
        return res.status(400).json({ message: 'cycleLength must be a whole number between 15 and 90' });
      }
      updateData.cycleLength = cl;
    }

    if (sleepGoalHours !== undefined) {
      const sgh = Number(sleepGoalHours);
      if (isNaN(sgh) || sgh < 4 || sgh > 12) {
        return res.status(400).json({ message: 'sleepGoalHours must be a number between 4 and 12' });
      }
      updateData.sleepGoalHours = sgh;
    }

    if (waterGoalLiters !== undefined) {
      const wgl = Number(waterGoalLiters);
      if (isNaN(wgl) || wgl < 0.5 || wgl > 10) {
        return res.status(400).json({ message: 'waterGoalLiters must be a number between 0.5 and 10' });
      }
      updateData.waterGoalLiters = wgl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const safeUser = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      onboardingCompleted: updatedUser.onboardingCompleted,
      goals: updatedUser.goals,
      activityLevel: updatedUser.activityLevel,
      dietPreference: updatedUser.dietPreference,
      cycleLength: updatedUser.cycleLength,
      sleepGoalHours: updatedUser.sleepGoalHours,
      waterGoalLiters: updatedUser.waterGoalLiters
    };

    res.status(200).json({
      message: 'Onboarding completed',
      user: safeUser
    });

  } catch (error) {
    console.error('Error during onboarding update:', error);
    res.status(500).json({ message: 'Server error during onboarding update' });
  }
};

module.exports = {
  updateOnboarding
};
