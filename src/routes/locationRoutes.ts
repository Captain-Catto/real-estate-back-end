import { Router } from "express";
import { LocationController } from "../controllers";
import { requirePermission } from "../middleware";

const router = Router();
const locationController = new LocationController();

// Public routes
router.get("/provinces", locationController.getProvinces.bind(locationController));
router.get("/names", locationController.getLocationNames.bind(locationController));
router.get("/province/:slug", locationController.getProvinceBySlug.bind(locationController));
router.get("/districts/:provinceCode", locationController.getDistricts.bind(locationController));
router.get("/wards/:provinceCode", locationController.getWards.bind(locationController));
router.get("/location-by-slug/:provinceSlug/:wardSlug?", locationController.getLocationBySlug.bind(locationController));
router.get("/breadcrumb-from-slug", locationController.getBreadcrumbFromSlug.bind(locationController));

// Admin routes
router.get(
  "/",
  requirePermission("view_settings"),
  locationController.getProvincesWithChildren.bind(locationController)
);

// Province CRUD
router.post(
  "/",
  requirePermission("edit_settings"),
  locationController.createProvince.bind(locationController)
);

router.put(
  "/:id",
  requirePermission("edit_settings"),
  locationController.updateProvince.bind(locationController)
);

router.delete(
  "/:id",
  requirePermission("edit_settings"),
  locationController.deleteProvince.bind(locationController)
);

// Ward CRUD
router.post(
  "/:provinceId/wards",
  requirePermission("edit_settings"),
  locationController.createWard.bind(locationController)
);

router.put(
  "/wards/:id",
  requirePermission("edit_settings"),
  locationController.updateWard.bind(locationController)
);

router.delete(
  "/wards/:id",
  requirePermission("edit_settings"),
  locationController.deleteWard.bind(locationController)
);

export default router;