import mongoose, { Document, Schema } from "mongoose";

export interface IContactLog extends Document {
  contactId: mongoose.Types.ObjectId;
  action: "status_change" | "reply" | "create" | "delete" | "update_message";
  oldValue?: string;
  newValue?: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  performedAt: Date;
  description: string;
  note?: string;
}

const ContactLogSchema = new Schema<IContactLog>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "ContactMessage",
      required: true,
    },
    action: {
      type: String,
      enum: ["status_change", "reply", "create", "delete", "update_message"],
      required: true,
    },
    oldValue: {
      type: String,
    },
    newValue: {
      type: String,
    },
    performedBy: {
      _id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ContactLog = mongoose.model<IContactLog>("ContactLog", ContactLogSchema);

export default ContactLog;
