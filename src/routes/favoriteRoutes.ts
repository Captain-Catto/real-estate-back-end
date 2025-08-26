import { Router } from "express";
import { FavoriteController } from "../controllers";
import { authenticateUser } from "../middleware";

const router = Router();
const favoriteController = new FavoriteController();

router.post(
  "/",
  authenticateUser,
  favoriteController.addToFavorites.bind(favoriteController)
);

router.delete(
  "/:postId",
  authenticateUser,
  favoriteController.removeFromFavorites.bind(favoriteController)
);

router.get(
  "/",
  authenticateUser,
  favoriteController.getFavorites.bind(favoriteController)
);

router.get(
  "/check/:postId",
  authenticateUser,
  favoriteController.checkFavoriteStatus.bind(favoriteController)
);

router.get(
  "/stats",
  authenticateUser,
  favoriteController.getFavoriteStats.bind(favoriteController)
);

export default router;