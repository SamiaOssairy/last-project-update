
const express=require('express');
const morgan=require('morgan');
const dotenv=require('dotenv');
const cors=require('cors');
dotenv.config({path:'./.env'});
 

const familyAccountRouter = require('./routes/familyAccountRoutes');
const memberRouter = require('./routes/memberRoutes');
const memberTypeRouter = require('./routes/memberTypeRoutes');
const authRouter = require('./routes/authRoutes');


const path = require('path');


const app=express();

// Enable CORS for React frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

 

app.use('/api/familyAccounts', familyAccountRouter);
app.use('/api/members', memberRouter);
app.use('/api/memberTypes', memberTypeRouter);
app.use('/api/auth', authRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: messages.join('. ')
    });
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const fieldName = field === 'mail' ? 'email' : field;
    return res.status(400).json({
      message: `This ${fieldName} is already registered. Please use a different one.`
    });
  }
  
  // Handle custom AppError
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }
  
  // Default error
  res.status(500).json({
    message: err.message || 'Something went wrong! Please try again.'
  });
});

module.exports=app;
