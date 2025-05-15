import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  allowNotificationDeletion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    allowNotificationDeletion: {
      type: Boolean,
      default: true
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