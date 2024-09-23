const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const shopCon = require("../controllers/shopController/shopController");
router.get("/getLatestCategories", verifyToken, shopCon.getLatestCategories);
router.get(
  "/getAllSubcategories/:categoryId",
  verifyToken,
  shopCon.getAllSubcategories
);
router.get(
  "/getAllProductOfSubCategory/:id",
  verifyToken,
  shopCon.getAllProductOfSubCategory
);
//abc
router.get("/showProductDetail/:id", verifyToken, shopCon.showProductDetail);
router.get("/popular", shopCon.popular);
router.get("/newest", shopCon.newest);
router.get("/lowToHigh", shopCon.lowToHigh);
router.get("/highToLow", shopCon.highToLow);
router.get("/searchProduct", shopCon.searchProduct);
router.post("/addWishList", verifyToken, shopCon.addWishList);
router.post("/addToCart", verifyToken, shopCon.addToCart);
router.get("/getBasket", verifyToken, shopCon.getBasket);
router.get(
  "/userDistanceFromStore",
  verifyToken,
  shopCon.userDistanceFromStore
);
router.post("/orderNow/:basketId", verifyToken, shopCon.orderNow);
router.delete(
  "/removeFromCart/:cartId/:productId",
  verifyToken,
  shopCon.removeFromCart
);
router.put("/decreaseQuantity", verifyToken, shopCon.decreaseQuantity);
router.get("/getMoreRiders/:orderId", verifyToken, shopCon.getMoreRiders);
router.post("/secondSearch", verifyToken, shopCon.secondSearch);
router.post(
  "/getAllSubcategoryOfACategory",
  verifyToken,
  shopCon.getAllSubcategoryOfACategory
);
router.post("/filterAndSort", verifyToken, shopCon.filterAndSort);
router.delete(
  "/removeAllProductsFromCart/:cartId",
  verifyToken,
  shopCon.removeAllProductsFromCart
);
router.post(
  "/filterAndSortSubCategory",
  verifyToken,
  shopCon.filterAndSortSubCategory
);
router.get("/subCatSearch", verifyToken, shopCon.subCatSearch);
router.get("/getSaleProducts", verifyToken, shopCon.getSaleProducts);
module.exports = router;
