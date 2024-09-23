const express = require("express");
const router = express.Router();
const adminCon = require("../controllers/adminController/adminController");
const verifyToken = require("../middleware/verifyToken");
const uploadImage = require("../middleware/uploadImage");
router.post("/addProduct", verifyToken, uploadImage, adminCon.addProduct);
router.post(
  "/addSubcategories",
  verifyToken,
  uploadImage,
  adminCon.addSubcategories
);
/*/
 const categoriesId = req.params.catId;
      const subCatId = req.params.subC;
/*/
router.post("/addCategories", verifyToken, uploadImage, adminCon.addCategories);
router.post(
  "/addSubInCategories/:catId/:subC",
  verifyToken,
  adminCon.addSubInCategories
);
router.get("/getRequestedUsers", verifyToken, adminCon.getRequestedUsers);
router.put(
  "/changeStatusOfUser/:userId",
  verifyToken,
  adminCon.changeStatusOfUser
);
router.post("/createAdmin", verifyToken, adminCon.createAdmin);
router.get("/viewUsers", verifyToken, adminCon.viewUsers);
router.delete("/deleteProduct/:productId", verifyToken, adminCon.deleteProduct);
router.get("/getUserWishList/:userId", verifyToken, adminCon.getUserWishList);
router.patch(
  "/addSaleOnProduct/:productId",
  verifyToken,
  adminCon.addSaleOnProduct
);
router.patch(
  "/removePercentage/:productId",
  verifyToken,
  adminCon.removePercentage
);
router.get("/showProduct", verifyToken, adminCon.showProduct);
router.put(
  "/addProductInSubcategory/:subCatId",
  verifyToken,
  adminCon.addProductInSubcategory
);
router.post(
  "/createSubcategory",
  verifyToken,
  uploadImage,
  adminCon.createSubcategory
);
router.get("/getUserById/:userId", verifyToken, adminCon.getUserById);
router.post("/adminCreateUser", verifyToken, adminCon.adminCreateUser);
router.put("/updateUser/:userId", verifyToken, adminCon.updateUser);
router.put("/deActivateUser/:userId", verifyToken, adminCon.deActivateUser);
router.get("/getAllAdmins", verifyToken, adminCon.getAllAdmins);
router.delete("/deleteAdmin/:adminId", verifyToken, adminCon.deleteAdmin);
router.get("/showAllRiders", verifyToken, adminCon.showAllRiders);
router.put(
  "/updateCategories/:categoryId",
  uploadImage,
  adminCon.updateCategories
);
router.put(
  "/updateSubCategory/:subCategoryId",
  uploadImage,
  adminCon.updateSubCategory
);
router.put("/updateProduct/:productId", uploadImage, adminCon.updateProduct);
router.get("/getOrdersForAdmin", verifyToken, adminCon.getOrdersForAdmin);
router.get("/getActiveDrivers", verifyToken, adminCon.getActiveDrivers);
router.post(
  "/allocateDriver/:riderId/:orderId",
  verifyToken,
  adminCon.allocateDriver
);
router.get("/getReturnOrder", verifyToken, adminCon.getReturnOrder);
module.exports = router;
/*/getUserById,

  adminCreateUser,
  updateUser,
  deActivateUser,
  getAllAdmins,
  deleteAdmin,
/*/
//abc∏
