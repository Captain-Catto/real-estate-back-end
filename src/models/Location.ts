import mongoose from "mongoose";

const WardSchema = new mongoose.Schema({
  name: String,
  type: String,
  slug: String,
  name_with_type: String,
  path: String,
  path_with_type: String,
  code: String,
  parent_code: String, // Liên kết với province code
});

const ProvinceSchema = new mongoose.Schema({
  name: String,
  slug: String,
  type: String,
  name_with_type: String,
  code: String,
});

export const ProvinceModel = mongoose.model("Province", ProvinceSchema);
export const WardModel = mongoose.model("Ward", WardSchema);
