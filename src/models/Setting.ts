import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  allowNotificationDeletion: boolean;
  debugModeEnabled: boolean;
  debugModeUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    allowNotificationDeletion: {
      type: Boolean,
      default: true
    },
    debugModeEnabled: {
      type: Boolean,
      default: false
    },
    debugModeUsers: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// If the model exists, use it, otherwise create it
let Setting: Model<ISetting>;

if (mongoose.models.Setting) {
  Setting = mongoose.models.Setting as Model<ISetting>;
} else {
  Setting = mongoose.model<ISetting>('Setting', SettingSchema);
}

export default Setting; 