import { Router } from "express";
import { PriceController } from "../controllers";

const router = Router();
const priceController = new PriceController();

// Public Price Range routes
router.get("/", priceController.getAllPrices.bind(priceController));
router.get("/type/:type", priceController.getPricesByType.bind(priceController));
router.get("/:slug", priceController.getPriceById.bind(priceController));

export default router;