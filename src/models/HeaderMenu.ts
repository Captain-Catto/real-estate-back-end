import mongoose, { Document, Schema } from "mongoose";

export interface IDropdownItem {
  id: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  children?: IDropdownItem[];
}

export interface IHeaderMenu extends Document {
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  hasDropdown: boolean;
  dropdownItems: IDropdownItem[];
  createdAt: Date;
  updatedAt: Date;
}

const DropdownItemSchema = new Schema<IDropdownItem>({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  href: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    default: 1,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  children: [
    {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  ],
});

const HeaderMenuSchema = new Schema<IHeaderMenu>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    href: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    hasDropdown: {
      type: Boolean,
      required: true,
      default: false,
    },
    dropdownItems: {
      type: [DropdownItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient sorting by order
HeaderMenuSchema.index({ order: 1 });
HeaderMenuSchema.index({ isActive: 1 });

export const HeaderMenu = mongoose.model<IHeaderMenu>(
  "HeaderMenu",
  HeaderMenuSchema
);
