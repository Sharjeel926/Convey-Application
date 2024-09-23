const shopModel = require("../../models/shopModel");
const bcrypt = require("bcrypt");
const userModel = require("../../models/userModel");
const productModel = require("../../models/productModel");
const subCategoryModel = require("../../models/subCategoryModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const secretKey = require("../../config/config");
const categoryModel = require("../../models/categoryModel");
const { findByIdAndUpdate } = require("../../models/productModel");
const orderModel = require("../../models/orderModel");
const cancelOrderSchema = require("../../models/cancelOrderSchema");
const { sendNotification } = require("../../utils/sendNotification");
const {
  getNearByDrivers,
  milesToMeters,
  getRegistrationToken,
} = require("../../utils/nearByRider");
const maxDistanceMiles = 1.6;
const storeLongitude = parseFloat(process.env.storeLongitude);
const storeLatitude = parseFloat(process.env.storeLatitude);
const storeCoordinates = [storeLongitude, storeLatitude];
const maxDistanceMeters = milesToMeters(maxDistanceMiles);
/*/
categoryName: {
    type: String,
    required: true,
  },
  categoryPic: {
    type: String,
    required: true,
  },
  subCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCategories",
    },
  ],
});
/*/

const addCategories = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if profilePicUrl is present
      const categoryPic = req.profilePicUrl;
      if (!categoryPic) {
        return res
          .status(400)
          .json({ message: "Profile picture URL is required" });
      }

      const { categoryName, subCategories } = req.body;

      // Validate required fields
      if (!categoryName) {
        return res
          .status(400)
          .json({ message: "Category name and subcategories are required" });
      }

      const newCategory = new categoryModel({
        categoryName: categoryName,
        categoryPic: categoryPic,
        subCategories: [],
      });

      try {
        const savedCategory = await newCategory.save();
        return res.status(201).json(savedCategory);
      } catch (saveError) {
        return res.status(500).json({ message: saveError.message });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const addProduct = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const { productName, productPrice } = req.body;
      const productPic = req.profilePicUrl;
      const userId = auth.userId;

      try {
        const newProduct = new productModel({
          productName: productName,
          productPrice: productPrice,
          productPic: productPic,
        });
        await newProduct.save();
        return res.status(200).json({
          message: "Product added successfully",
          newProduct: newProduct,
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    return res.status(501).json({ error: error.message });
  }
};
const addSubcategories = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const { subCategoryName, productIds } = req.body;
      const subCategoryPic = req.profilePicUrl;
      //console.log(productId);

      const parsedProducts = JSON.parse(productIds);
      const productId = parsedProducts.map(
        (productId) => new mongoose.Types.ObjectId(productId)
      );
      const newSubCategory = new subCategoryModel({
        subCategoryName: subCategoryName,
        subCategoryPic: subCategoryPic,
        products: productId,
      });

      // Save the new subcategory
      await newSubCategory.save();

      // Respond with success
      return res
        .status(200)
        .json({ message: "Subcategory added successfully" });
    });
  } catch (error) {
    return res.status(501).json({ error: error.message });
  }
};

const addSubInCategories = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const cid = req.params.catId;
      const subCatId = req.params.subC;
      const findCategory = await categoryModel.findById(cid);

      const findSub = await subCategoryModel.findById(subCatId);
      if (!findCategory) {
        return res.status(404).json({
          message: "Category not found. Please select the correct one",
        });
      }
      if (!findSub) {
        return res.status(404).json({
          message: "SubCategory not found. Please select the correct one",
        });
      }
      findCategory.subCategories.push(subCatId);

      await findCategory.save();
      return res
        .status(200)
        .json({ message: "Subcategory added successfully to the category" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const productId = req.params.productId;
      const findProduct = await productModel.findById(productId);

      if (!findProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      await productModel.findByIdAndDelete(productId);
      return res.status(200).json({ message: "Product deleted successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteSubcategories = async (req, res) => {};
const deleteCategories = async (req, res) => {};
const viewUsers = async (req, res) => {
  jwt.verify(req.token, secretKey.secretKey, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ JWTErr: err });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
      const findUsers = await userModel
        .find({ userType: "user" })
        .skip(skip)
        .limit(limit);

      if (!findUsers || findUsers.length === 0) {
        return res.status(404).json({ message: "Users not found" });
      }

      return res.status(200).json({ users: findUsers });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  });
};
const approveRejectUsers = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const id = req.params.UserId;
      const userId = auth.userId;
      const { status } = req.body;

      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const findUserToAcceptOrReject = await userModel.findByIdAndUpdate(
        id,
        { status: status },
        { new: true }
      );

      if (!findUserToAcceptOrReject) {
        return res
          .status(404)
          .json({ message: "User to approve/reject not found" });
      }

      return res.status(200).json({
        message: "User status updated successfully",
        user: findUserToAcceptOrReject,
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const createAdmin = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const { email, userName, password, confirmPass, userType } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Please enter email" });
      }
      if (!userName) {
        return res.status(400).json({ message: "Please enter userName" });
      }
      if (!password) {
        return res.status(400).json({ message: "Please enter password" });
      }
      if (!confirmPass) {
        return res.status(400).json({ message: "Please enter confirmPass" });
      }
      if (!userType) {
        return res.status(400).json({ message: "Please enter userType" });
      }

      const findUser = await userModel.findById(auth.userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (password !== confirmPass) {
        return res.status(400).json({
          message: "Please check, your password does not match confirmPass",
        });
      }

      if (findUser.userType !== "Admin") {
        return res
          .status(403)
          .json({ message: "You are not allowed to create an Admin" });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const newAdmin = new userModel({
        email: email,
        userName: userName,
        password: hashPassword,
        userType: userType,
        isVerified: true,
        status: true,
        approved: true,
      });

      await newAdmin.save();

      return res
        .status(201)
        .json({ message: "Admin created successfully", admin: newAdmin });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getRequestedUsers = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const requestedUsers = await userModel.find({ approved: false });
      if (!requestedUsers || requestedUsers.length === 0) {
        return res.status(404).json({ message: "No requested users found" });
      }

      return res.status(200).json({ allRequestedUsers: requestedUsers });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const changeStatusOfUser = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const userId = req.params.userId;
      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Toggle the user's status
      findUser.status = !findUser.status;

      // Save the updated user
      await findUser.save();

      return res
        .status(200)
        .json({ message: "User status updated successfully", user: findUser });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getUserWishList = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const userId = req.params.userId;
      const findUser = await userModel.findById(userId).populate("wishList");

      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ wishList: findUser.wishList });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const showAllRiders = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Get page and limit from query parameters with defaults
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Calculate the skip value
      const skip = (page - 1) * limit;

      // Find riders with pagination
      const riders = await userModel
        .find({ userType: "rider" })
        .skip(skip)
        .limit(limit);

      if (!riders || riders.length === 0) {
        return res.status(404).json({ message: "No riders found" });
      }

      // Get total count of riders
      const totalRiders = await userModel.countDocuments({ userType: "rider" });

      return res.status(200).json({
        totalRiders,
        currentPage: page,
        totalPages: Math.ceil(totalRiders / limit),
        riders,
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getAllIssues = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
    });
  } catch (error) {}
};

const addSaleOnProduct = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const productId = req.params.productId;
      const { percentage } = req.body;
      const findUser = await userModel.findOne({
        _id: auth.userId,
        userType: "Admin",
      });
      if (!findUser) {
        return res.status(403).json({
          message: "Only admin is allowed to add sale on any product",
        });
      }
      const findProduct = await productModel.findById(productId);
      if (!findProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const newPrice =
        findProduct.productPrice -
        findProduct.productPrice * (percentage / 100);

      const findAndUpdate = await productModel.findByIdAndUpdate(
        productId,
        { sale: true, salePercentage: percentage, salePrice: newPrice },
        { new: true }
      );

      if (!findAndUpdate) {
        return res
          .status(404)
          .json({ message: "Product not found after update" });
      }

      return res
        .status(200)
        .json({ message: "Sale added to product", product: findAndUpdate });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const removePercentage = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const productId = req.params.productId;
      const findProduct = await productModel.findById(productId);

      if (!findProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const originalPrice =
        findProduct.productPrice ||
        findProduct.productPrice / (1 - findProduct.salePercentage / 100);

      const findAndUpdate = await productModel.findByIdAndUpdate(
        productId,
        { sale: false, salePercentage: 0, productPrice: originalPrice },
        { new: true }
      );

      if (!findAndUpdate) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json({
        message: "Sale percentage removed from product",
        product: findAndUpdate,
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const showProduct = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Unauthorized access", JWTErr: err });
      }

      try {
        const allProducts = await productModel.find();
        if (allProducts.length === 0) {
          return res.status(404).json({ message: "Products not found" });
        }

        return res.status(200).json({ products: allProducts });
      } catch (productError) {
        return res.status(500).json({
          message: "An error occurred while fetching products",
          error: productError.message,
        });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};

const addProductInSubcategory = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Unauthorized access", JWTErr: err });
      }

      const { productIds } = req.body; // Expecting an array of product IDs
      const subCatId = req.params.subCatId;

      // Find the subcategory by ID
      const findSubcategory = await subCategoryModel.findById(subCatId);
      if (!findSubcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      // Validate each product ID in the array
      const validProductIds = [];
      for (const productId of productIds) {
        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
          return res
            .status(404)
            .json({ message: `Product not found: ${productId}` });
        }
        validProductIds.push(findProduct._id);
      }

      // Add valid product IDs to the subcategory
      findSubcategory.products.push(...validProductIds);
      const savedSubcategory = await findSubcategory.save();

      return res.status(200).json({
        message: "Products added to subcategory successfully",
        subcategory: savedSubcategory,
      });
    });
  } catch (error) {
    console.error("Error while adding products to subcategory:", error);
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};

const createSubcategory = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const { subCategoryName, categoryId } = req.body;
      const subCategoryPic = req.profilePicUrl;
      console.log(subCategoryName);
      console.log(categoryId);
      // Find the category by ID
      const findCategory = await categoryModel.findOne({ _id: categoryId });
      if (!findCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Create the subcategory
      const newSubCategory = new subCategoryModel({
        subCategoryName,
        subCategoryPic,
        products: [],
      });

      const savedSubCategory = await newSubCategory.save();

      // Add the subcategory ID to the parent category's subcategories array
      findCategory.subCategories.push(savedSubCategory._id);
      await findCategory.save();

      return res.status(201).json({
        message: "Subcategory created and added to category successfully",
        subcategory: savedSubCategory,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
}; //abc
//new ones
const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const findUser = await userModel.findById(userId).select("-password");

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: findUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};

const adminCreateUser = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Unauthorized access", JWTErr: err });
      }

      const adminUser = await userModel.findById(auth.userId);
      if (!adminUser || adminUser.userType !== "Admin") {
        return res
          .status(403)
          .json({ message: "Only admins are allowed to create users" });
      }

      const {
        email,
        userName,
        password,
        userType,
        homeAddress,
        deliveryAddress,
        preferredDeliveryArea,
        preferredTimeSlot,
        startDate,
      } = req.body;

      const checkUser = await userModel.findOne({ email: email });
      if (checkUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = new userModel({
        userName,
        email,
        password: hashPassword,
        userType,
        homeAddress,
        deliveryAddress,
        preferredDeliveryArea,
        preferredTimeSlot,
        startDate,
      });

      await newUser.save();

      return res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};
const updateUser = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const userId = req.params.userId;
      const updatedFields = { ...(req.body || {}) };

      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const checkAdmin = await userModel.findById(auth.userId);
      if (!checkAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (
        checkAdmin.userType !== "Admin" &&
        checkAdmin.userType !== "superAdmin"
      ) {
        return res.status(403).json({
          message: "Only admins are allowed to deactivate users",
        });
      }

      const findUserAndUpdated = await userModel.findByIdAndUpdate(
        userId,
        {
          $set: updatedFields,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "User updated successfully",
        user: findUserAndUpdated,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};

const deActivateUser = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const userId = req.params.userId;

      // Find the user by ID
      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the requesting user is an admin
      const checkAdmin = await userModel.findById(auth.userId);
      if (!checkAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      console.log("check Admin", checkAdmin.userType);
      if (
        checkAdmin.userType !== "Admin" &&
        checkAdmin.userType !== "superAdmin"
      ) {
        return res.status(403).json({
          message: "Only admins are allowed to deactivate users",
        });
      }

      // Toggle the deActiveStatus field
      findUser.deActiveStatus = !findUser.deActiveStatus;
      await findUser.save();

      return res.status(200).json({
        message: `User ${
          findUser.deActiveStatus ? "deactivated" : "activated"
        } successfully`,
        user: findUser,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};
const getAllAdmins = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      // Verify the authenticated user is an admin
      const findAdmin = await userModel.findById(auth.userId);
      if (!findAdmin) {
        return res.status(404).json({ message: "User not found" });
      }

      if (findAdmin.userType !== "Admin") {
        return res.status(403).json({
          message: "Only admins are allowed to access this resource",
        });
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Find all users with userType 'Admin' and apply pagination
      const findAll = await userModel
        .find({ userType: "Admin" })
        .skip(skip)
        .limit(limit);

      // Get the total count of admin users for pagination info
      const totalAdmins = await userModel.countDocuments({ userType: "Admin" });

      return res.status(200).json({
        message: "Admins retrieved successfully",
        admins: findAll,
        pagination: {
          totalAdmins,
          currentPage: page,
          totalPages: Math.ceil(totalAdmins / limit),
        },
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An internal error occurred", error: error.message });
  }
};
const deleteAdmin = async (req, res) => {
  //getUserById adminCreateUser updateUser deActivateUser getAllAdmins deleteAdmin
  jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
    if (err) {
      return res.status(401).json({ JWTErr: err });
    }

    const adminId = req.params.adminId;
    const findRequestingAdmin = await userModel.findById(auth.userId);

    if (!findRequestingAdmin) {
      return res.status(404).json({ message: "Requesting admin not found" });
    }

    if (findRequestingAdmin.userType !== "superAdmin") {
      return res.status(403).json({
        message: "Only superAdmins are allowed to delete other admins",
      });
    }

    const findAdminToDelete = await userModel.findById(adminId);
    if (!findAdminToDelete) {
      return res.status(404).json({ message: "Admin to delete not found" });
    }

    if (findAdminToDelete.userType === "superAdmin") {
      return res.status(403).json({
        message: "Admins cannot delete superAdmins",
      });
    }

    await userModel.findByIdAndDelete(adminId);

    return res.status(200).json({ message: "Admin deleted successfully" });
  });
};
const updateCategories = async (req, res) => {
  try {
    // Extract categoryId from the request parameters
    const categoryId = req.params.categoryId;

    // Extract categoryPic from the request (assumed to be set in middleware or another part of the application)
    const categoryPic = req.profilePicUrl;

    // Create an update object that includes all the fields from req.body
    const updateData = { ...req.body };

    // If categoryPic is present, add it to the updateData
    if (categoryPic) {
      updateData.categoryPic = categoryPic;
    }

    // Find the category by ID and update it with the updateData
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true }
    );

    // Check if the category was found and updated
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Return the updated category
    res.status(200).json(updatedCategory);
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    // Extract categoryId from the request parameters
    const subCategoryId = req.params.subCategoryId;

    // Extract categoryPic from the request (assumed to be set in middleware or another part of the application)
    const subCategoryPic = req.profilePicUrl;

    // Create an update object that includes all the fields from req.body
    const updateData = { ...req.body };

    // If categoryPic is present, add it to the updateData
    if (subCategoryPic) {
      updateData.subCategoryPic = subCategoryPic;
    }

    // Find the category by ID and update it with the updateData
    const updatedCategory = await subCategoryModel.findByIdAndUpdate(
      subCategoryId,
      updateData,
      { new: true }
    );

    // Check if the category was found and updated
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Return the updated category
    res.status(200).json(updatedCategory);
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    // Extract categoryId from the request parameters
    const productId = req.params.productId;

    // Extract categoryPic from the request (assumed to be set in middleware or another part of the application)
    const productPic = req.profilePicUrl;

    // Create an update object that includes all the fields from req.body
    let updatedFields = { ...(req.body || {}) };

    if (productPic) {
      updatedFields.productPic = productPic;
    } else {
      delete updatedFields.productPic;
    }
    // Find the category by ID and update it with the updateData
    const updatedCategory = await productModel.findByIdAndUpdate(
      productId,
      { $set: updatedFields },
      { new: true }
    );

    // Check if the category was found and updated
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Return the updated category
    res.status(200).json(updatedCategory);
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getOrdersForAdmin = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const checkAdmin = await userModel.findById(auth.userId);
      if (checkAdmin.userType !== "superAdmin") {
        return res.status(403).json({
          message: "Only super Admin is allowed to check this section",
        });
      }
      try {
        const getOrders = await orderModel.find({
          requestToAdmin: true,
          // riderDone: false,
        });

        /*/ if (!getOrders || getOrders.length === 0) {
          return res.status(404).json({ message: "No order found" });
        }/*/

        return res.status(200).json({ userOrders: getOrders });
      } catch (dbError) {
        return res
          .status(500)
          .json({ message: "Database error", error: dbError.message });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const getActiveDrivers = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token", error: err });
      }
      const checkAdmin = await userModel.findById(auth.userId);
      if (checkAdmin.userType !== "superAdmin") {
        return res.status(403).json({
          message: "Only super Admin is allowed to check this section",
        });
      }
      const getRiders = await userModel.find({
        userType: "rider",
        openToWork: true,
      });

      if (!getRiders || getRiders.length === 0) {
        return res.status(404).json({ message: "No active riders found" });
      }

      return res.status(200).json({ activeRiders: getRiders });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const allocateDriver = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token", error: err });
      }

      let title = "ORDER FROM ADMIN";
      let body = "Order assigned to you by Admin";
      const riderId = req.params.riderId;
      const orderId = req.params.orderId;

      // Check if riderId and orderId are provided
      if (!riderId || !orderId) {
        return res
          .status(400)
          .json({ message: "Rider ID and Order ID are required" });
      }
      const checkAdmin = await userModel.findById(auth.userId);
      if (checkAdmin.userType !== "superAdmin") {
        return res.status(403).json({
          message: "Only super Admin is allowed to check this section",
        });
      }
      const findDriver = await userModel.findById(riderId);
      if (!findDriver) {
        return res.status(404).json({ message: "Rider not found" });
      }

      if (!findDriver.openToWork) {
        return res
          .status(400)
          .json({ message: "Rider is not available for work" });
      }

      const findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if the order already has a rider assigned
      if (findOrder.riderId) {
        return res
          .status(400)
          .json({ message: "Order already has a rider assigned" });
      }

      // Get the registration token for notification
      const token = await getRegistrationToken(riderId);

      await sendNotification(token, title, body);

      // Allocate the rider to the order
      findOrder.orderStatus = "confirm";
      findOrder.riderId = riderId;
      findOrder.riderDone = true;
      await findOrder.save();

      return res
        .status(200)
        .json({ message: "Driver allocated successfully", order: findOrder });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const getReturnOrder = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const getReturnOrders = await cancelOrderSchema
        .find({})
        .sort({ createdAt: -1 });

      if (!getReturnOrders || getReturnOrders.length === 0) {
        return res.status(404).json({ message: "No return orders found" });
      }

      return res.status(200).json({ returnOrders: getReturnOrders });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createAdmin,
  addProduct,
  addSubcategories,
  addCategories,
  addSubInCategories,
  deleteProduct,
  viewUsers,
  getRequestedUsers, //user which are requested for the approval of registration
  approveRejectUsers, //those users who were rejected now want to change the status
  changeStatusOfUser, //toggle for span/unspan
  getUserWishList,
  showAllRiders,
  getAllIssues,
  addSaleOnProduct,
  removePercentage,
  showProduct,
  addProductInSubcategory,
  createSubcategory,
  getUserById,

  adminCreateUser,
  updateUser,
  deActivateUser,
  getAllAdmins,
  deleteAdmin,
  updateCategories,
  updateSubCategory,
  updateProduct,
  getOrdersForAdmin, //get order from admin
  getActiveDrivers,
  allocateDriver,
  getReturnOrder,
};
