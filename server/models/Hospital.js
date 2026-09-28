const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    lat: {
      type: Number,
      required: [true, 'Latitude coordinate is required'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude coordinate is required'],
    },
    totalBeds: {
      type: Number,
      default: 0,
      min: [0, 'Total beds cannot be negative'],
    },
    availableBeds: {
      type: Number,
      default: 0,
      min: [0, 'Available beds cannot be negative'],
    },
    icuBeds: {
      type: Number,
      default: 0,
      min: [0, 'ICU beds cannot be negative'],
    },
    availableIcuBeds: {
      type: Number,
      default: 0,
      min: [0, 'Available ICU beds cannot be negative'],
    },
    oxygenStatus: {
      type: String,
      enum: {
        values: ['adequate', 'low', 'critical'],
        message: '{VALUE} is not a valid oxygen status',
      },
      default: 'adequate',
    },
    ventilators: {
      type: Number,
      default: 0,
      min: [0, 'Ventilators cannot be negative'],
    },
    ventilatorsAvailable: {
      type: Number,
      default: 0,
      min: [0, 'Available ventilators cannot be negative'],
    },
    ayushmanEmpanelled: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries and quick lookup
hospitalSchema.index({ lat: 1, lng: 1 });
hospitalSchema.index({ district: 1, locality: 1 });

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
