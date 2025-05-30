import mongoose from 'mongoose';

// Define the reminder log schema
const reminderLogSchema = new mongoose.Schema({
  triggerType: {
    type: String,
    enum: ['day_before', 'last_day'],
    required: true,
  },
  triggerMethod: {
    type: String,
    enum: ['cron', 'manual', 'bypass'],
    required: true,
  },
  triggerTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  omanTime: {
    type: String,
    required: true, // Store formatted Oman time for easy reading
  },
  competitionsFound: {
    type: Number,
    required: true,
    default: 0,
  },
  competitionsProcessed: [{
    competitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: true,
    },
    competitionTitle: {
      type: String,
      required: true,
    },
    emailsSent: {
      type: Number,
      required: true,
      default: 0,
    },
    notificationsCreated: {
      type: Number,
      required: true,
      default: 0,
    },
    success: {
      type: Boolean,
      required: true,
    },
    errors: [{
      type: String,
    }],
    skipped: {
      type: Boolean,
      default: false,
    },
    skipReason: {
      type: String,
    },
  }],
  totalEmailsSent: {
    type: Number,
    required: true,
    default: 0,
  },
  totalNotificationsCreated: {
    type: Number,
    required: true,
    default: 0,
  },
  overallSuccess: {
    type: Boolean,
    required: true,
  },
  executionTimeMs: {
    type: Number,
    required: true,
  },
  errors: [{
    type: String,
  }],
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for efficient querying
reminderLogSchema.index({ triggerTime: -1 });
reminderLogSchema.index({ triggerType: 1, triggerTime: -1 });
reminderLogSchema.index({ triggerMethod: 1, triggerTime: -1 });

// Virtual for formatted trigger time
reminderLogSchema.virtual('formattedTriggerTime').get(function() {
  return this.triggerTime.toLocaleString('en-US', {
    timeZone: 'Asia/Muscat',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
});

// Create or get the ReminderLog model
const ReminderLog = mongoose.models.ReminderLog || mongoose.model('ReminderLog', reminderLogSchema);

export default ReminderLog; 