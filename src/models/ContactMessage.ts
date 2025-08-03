import mongoose, { Schema, Document } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "closed";
  repliedAt?: Date;
  repliedBy?: string;
  replyMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]+$/, "Số điện thoại không hợp lệ"],
    },
    subject: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },
    message: {
      type: String,
      required: [true, "Nội dung tin nhắn là bắt buộc"],
      trim: true,
      maxlength: [2000, "Nội dung không được vượt quá 2000 ký tự"],
    },
    status: {
      type: String,
      enum: ["new", "read", "replied", "closed"],
      default: "new",
    },
    repliedAt: {
      type: Date,
    },
    repliedBy: {
      type: String,
      trim: true,
    },
    replyMessage: {
      type: String,
      trim: true,
      maxlength: [2000, "Nội dung phản hồi không được vượt quá 2000 ký tự"],
    },
  },
  {
    timestamps: true,
    collection: "contactmessages",
  }
);

// Indexes for better query performance
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });
ContactMessageSchema.index({ createdAt: -1 });

// Virtual for formatted date
ContactMessageSchema.virtual("formattedCreatedAt").get(function (
  this: IContactMessage
) {
  return this.createdAt.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Methods
ContactMessageSchema.methods.markAsRead = function () {
  this.status = "read";
  return this.save();
};

ContactMessageSchema.methods.markAsReplied = function (
  repliedBy: string,
  replyMessage: string
) {
  this.status = "replied";
  this.repliedAt = new Date();
  this.repliedBy = repliedBy;
  this.replyMessage = replyMessage;
  return this.save();
};

ContactMessageSchema.methods.markAsClosed = function () {
  this.status = "closed";
  return this.save();
};

// Static methods
ContactMessageSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$count" },
        statuses: {
          $push: {
            status: "$_id",
            count: "$count",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        new: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$statuses",
                        cond: { $eq: ["$$this.status", "new"] },
                      },
                    },
                    as: "status",
                    in: "$$status.count",
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        read: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$statuses",
                        cond: { $eq: ["$$this.status", "read"] },
                      },
                    },
                    as: "status",
                    in: "$$status.count",
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        replied: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$statuses",
                        cond: { $eq: ["$$this.status", "replied"] },
                      },
                    },
                    as: "status",
                    in: "$$status.count",
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        closed: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$statuses",
                        cond: { $eq: ["$$this.status", "closed"] },
                      },
                    },
                    as: "status",
                    in: "$$status.count",
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
  ]);
};

export const ContactMessage = mongoose.model<IContactMessage>(
  "ContactMessage",
  ContactMessageSchema
);
