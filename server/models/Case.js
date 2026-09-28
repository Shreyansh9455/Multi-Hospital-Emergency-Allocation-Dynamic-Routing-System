const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age must be positive'],
    },
    severityScore: {
      type: Number,
      default: null,
      min: 1,
      max: 10,
    },
    symptomTags: {
      type: [String],
      default: [],
    },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
    },
    status: {
      type: String,
      enum: {
        values: ['waiting', 'dispatched', 'admitted'],
        message: '{VALUE} is not a valid case status',
      },
      default: 'waiting',
    },
    assignedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    assignedAmbulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance',
      default: null,
    },
    estimatedArrival: {
      type: Date,
      default: null,
    },
    etaMinutes: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

caseSchema.index({ status: 1, createdAt: -1 });
caseSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;
