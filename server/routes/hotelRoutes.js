import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { registerHotel } from "../controllers/hotelController.js";

const hotelRouter = express.Router();

hotelRouter.post("/", protect, registerHotel);

export default hotelRouter;
// server/routes/hotelRoutes.js (update your existing file)
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Import your Hotel model (adjust path as needed)
// const Hotel = require('../models/Hotel');

// GET all hotels
router.get('/', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        connectionState: mongoose.connection.readyState
      });
    }

    console.log('📋 Fetching hotels...');
    
    // Replace with your actual Hotel model query
    // const hotels = await Hotel.find({}).limit(50);
    
    // Temporary response for testing
    const hotels = [
      { id: 1, name: 'Test Hotel', location: 'Test City', status: 'active' }
    ];

    res.json({
      success: true,
      count: hotels.length,
      data: hotels
    });

  } catch (error) {
    console.error('❌ Error fetching hotels:', error);
    
    if (error.name === 'MongoTimeoutError' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Database timeout',
        message: 'Please try again later'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch hotels',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST create new hotel
router.post('/', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        connectionState: mongoose.connection.readyState
      });
    }

    console.log('🏨 Creating new hotel:', req.body);

    // Basic validation
    const { name, location, description, price } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and location are required'
      });
    }

    // Replace with your actual Hotel model creation
    // const newHotel = await Hotel.create(req.body);
    
    // Temporary response for testing
    const newHotel = {
      id: Date.now(),
      name,
      location,
      description,
      price,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: newHotel
    });

  } catch (error) {
    console.error('❌ Error creating hotel:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }

    if (error.name === 'MongoTimeoutError' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Database timeout',
        message: 'Please try again later'
      });
    }

    res.status(500).json({
      error: 'Failed to create hotel',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;