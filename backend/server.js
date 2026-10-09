require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const programRoutes = require('./routes/programRoutes');
const dailyLogRoutes = require('./routes/dailyLogRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');

connectDB();

const app = express();

app.use(helmet());

app.use(cors({ 
  origin: process.env.CLIENT_URL, 
  credentials: true 
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/favorites', favoriteRoutes);

app.get('/', (req, res) => {
  res.send('HerCare API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
