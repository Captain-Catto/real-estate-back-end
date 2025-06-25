import mongoose from "mongoose";

const WardSchema = new mongoose.Schema({
  name: String,
  code: Number,
  codename: String,
  division_type: String,
  short_codename: String,
});

const DistrictSchema = new mongoose.Schema({
  name: String,
  code: Number,
  codename: String,
  division_type: String,
  short_codename: String,
  wards: [WardSchema],
});

const ProvinceSchema = new mongoose.Schema({
  name: String,
  code: Number,
  codename: String,
  division_type: String,
  phone_code: Number,
  districts: [DistrictSchema],
});

export const LocationModel = mongoose.model("Location", ProvinceSchema);
