import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import connectCloudinary from "./configs/cloudinary.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

connectDB();
connectCloudinary();

const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing

// API to listen to Stripe Webhooks
app.post("/api/stripe",express.raw({ type: "application/json" }),stripeWebhooks);

// Middleware to parse JSON
app.use(express.json());
app.use(clerkMiddleware());

// API to listen to Clerk Webhooks
app.use("/api/clerk", clerkWebhooks);

app.get("/", (req, res) => res.send("API is working"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// server/server.js (or app.js/index.js)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced MongoDB connection with proper error handling
const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('Environment check:');
    console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Enhanced connection options for Vercel/serverless
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000, // 8 seconds
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      bufferMaxEntries: 0, // Disable mongoose buffering
      useNewUrlParser: true,
      useUnifiedTopology: true
    };

    // Add connection event listeners
    mongoose.connection.on('connecting', () => {
      console.log('🔄 Connecting to MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      console.log('- Database:', mongoose.connection.name);
      console.log('- Host:', mongoose.connection.host);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Handle connection gracefully on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

    // Connect to MongoDB with timeout handling
    await Promise.race([
      mongoose.connect(process.env.MONGODB_URI, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);

    console.log('✅ Database connected successfully');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    // Don't exit in production, let Vercel handle restarts
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Import routes
const userRoutes = require('./routes/userRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const testRoutes = require('./routes/testRoutes'); // Add this new test route

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', testRoutes); // Add test routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 DB Test: http://localhost:${PORT}/api/test-db`);
});

module.exports = app;