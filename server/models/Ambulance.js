const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID / registration number is required'],
      unique: true,
      trim: true,
    },
    currentLocation: {
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
        values: ['idle', 'enroute', 'busy'],
        message: '{VALUE} is not a valid ambulance status',
      },
      default: 'idle',
    },
    assignedCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ambulanceSchema.index({ status: 1 });
ambulanceSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);

module.exports = Ambulance;
