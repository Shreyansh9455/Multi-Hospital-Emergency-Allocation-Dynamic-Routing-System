const mongoose = require('mongoose');

const dispatchLogSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital ID is required'],
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance',
      required: [true, 'Ambulance ID is required'],
    },
    dispatchTime: {
      type: Date,
      default: Date.now,
    },
    arrivalTime: {
      type: Date,
      default: null,
    },
    waitTimeMinutes: {
      type: Number,
      default: null,
      min: 0,
    },
    treatmentStartTime: {
      type: Date,
      default: null,
    },
    method: {
      type: String,
      enum: {
        values: ['FIFO', 'priority'],
        message: '{VALUE} is not a valid dispatch method',
      },
      default: 'priority',
    },
  },
  {
    timestamps: true,
  }
);

dispatchLogSchema.index({ caseId: 1, hospitalId: 1, ambulanceId: 1 });
dispatchLogSchema.index({ dispatchTime: -1 });

const DispatchLog = mongoose.model('DispatchLog', dispatchLogSchema);

module.exports = DispatchLog;
