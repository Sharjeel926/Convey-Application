const shopModel = require("../../models/shopModel");
const secretKey = require("../../config/config");

const productModel = require("../../models/productModel");
const mongoose = require("mongoose");
const userModel = require("../../models/userModel");
const cartSchema = require("../../models/cartSchema");
const reviewSchema = require("../../models/reviewSchema");
const categoryModel = require("../../models/categoryModel");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
//storeLongitude= 74.29491664504988
//storeLatitude=31.444376752468226
const { sendNotification } = require("../../utils/sendNotification");
//(registrationTokens, messageContent)
const storeLongitude = parseFloat(process.env.storeLongitude);
const storeLatitude = parseFloat(process.env.storeLatitude);
const storeCoordinates = [storeLongitude, storeLatitude];
const subCategoryModel = require("../../models/subCategoryModel");
const orderModel = require("../../models/orderModel");

const getRegistrationToken = async (userId) => {
  try {
    const user = await userModel.findById(userId).select("registrationToken");
    if (!user) {
      throw new Error("User not found");
    }
    return user.registrationToken;
  } catch (error) {
    throw new Error(`Error retrieving registration token: ${error.message}`);
  }
};

const searchProduct = async (req, res) => {
  try {
    const { productName } = req.query;
    const getProducts = await productModel.find({
      productName: { $regex: new RegExp(productName), $options: "i" },
    });
    return res.status(200).json({ Products: getProducts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLatestCategories = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      const findLatest = await categoryModel
        .find()
        .sort({ timeStamp: -1 })
        .limit(10);
      const findBasket = await cartSchema.findOne({
        user: auth.userId,
        orderDone: false,
        paymentStatus: false,
      });
      const totalProducts =
        findBasket && findBasket.items ? findBasket.items.length : 0;

      return res.status(200).json({
        latestCategory: findLatest,
        totalProducts: totalProducts,
      });
    });
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getAllSubcategories = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      const categoryId = req.params.categoryId;
      const findCategories = await categoryModel
        .findById(categoryId)
        .populate("subCategories");

      if (!findCategories) {
        return res.status(404).json({ message: "Subcategories not found" });
      }

      const subCategories = findCategories.subCategories;
      return res.status(200).json({ subCategories });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllProductOfSubCategory = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      const subCategoryId = req.params.id;
      const findSubCategory = await subCategoryModel
        .findById(subCategoryId)
        .populate("products");

      if (!findSubCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      return res.status(200).json({ products: findSubCategory.products });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const showProductDetail = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      const productId = req.params.id;
      const findProduct = await productModel.findById(productId);
      if (!findProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      await productModel.findByIdAndUpdate(productId, {
        $inc: { popularity: 1 },
      });

      return res.status(200).json({ product: findProduct });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const addWishList = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const userId = auth.userId;
      const { productId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const findProduct = await productModel.findById(productId);
      if (!findProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Toggle logic
      const productIndexInUserWishlist = findUser.wishList.indexOf(productId);
      const userIndexInProductWishlist = findProduct.wishList.indexOf(userId);

      if (productIndexInUserWishlist > -1 && userIndexInProductWishlist > -1) {
        // Remove from wishlist
        findUser.wishList.splice(productIndexInUserWishlist, 1);
        findProduct.wishList.splice(userIndexInProductWishlist, 1);
        await findUser.save();
        await findProduct.save();
        return res
          .status(200)
          .json({ message: "Product removed from wishlist successfully" });
      } else {
        // Add to wishlist
        findUser.wishList.push(productId);
        findProduct.wishList.push(userId);
        await findUser.save();
        await findProduct.save();
        return res
          .status(200)
          .json({ message: "Product added to wishlist successfully" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSaleProducts = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const { sortingString } = req.query;

      if (!sortingString) {
        return res
          .status(400)
          .json({ message: "Please enter the sorting string." });
      }

      let sortOption = {};
      switch (sortingString) {
        case "highToLow":
          sortOption = { salePrice: -1 };
          break;
        case "lowToHigh":
          sortOption = { salePrice: 1 };
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        case "popular":
          sortOption = { popularity: -1 };
          break;
        default:
          return res.status(400).json({ message: "Invalid sorting string." });
      }

      const sortedProducts = await productModel
        .find({ sale: true })
        .sort(sortOption)
        .exec();

      return res.status(200).json({ sortedProducts });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const popular = async (req, res) => {
  try {
    const findProduct = await productModel
      .find()
      .sort({ popularity: -1 })
      .exec();

    if (findProduct.length === 0) {
      return res.status(404).json({ message: "No popular product found" });
    }
    return res.status(200).json({ popularProducts: findProduct });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const newest = async (req, res) => {
  try {
    const newestProducts = await productModel
      .find({})
      .sort({ createdAt: -1, updatedAt: -1 })
      .exec();

    if (newestProducts.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({ newestProducts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const mostRated = async (req, res) => {
  try {
  } catch (error) {}
};

const lowToHigh = async (req, res) => {
  try {
    const lowToHighProducts = await productModel
      .find({})
      .sort({ productPrice: 1 })
      .exec();

    if (lowToHighProducts.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({ lowToHighProducts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const highToLow = async (req, res) => {
  try {
    const highToLowProducts = await productModel
      .find({})
      .sort({ productPrice: -1 })
      .exec();

    if (highToLowProducts.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({ highToLowProducts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const addToCart = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;

      const { productId, quantity, price } = req.body;
      if (quantity === 0) {
        return res.status(400).json({ message: "Quantity cannot be zero" }); //abc
      }
      const total = price * quantity;
      const user = await userModel.findById(userId);
      const getD = calculateDistance(
        user.location.coordinates,
        storeCoordinates
      );
      let deliveryCost =
        0 < getD <= 1.3 ? 1.75 : getD > 1.35 && getD <= 3.5 ? 3.5 : 0;
      const totalWithDelivery =
        0 < getD <= 1.3
          ? total + 1.75 + 1.35
          : getD > 1.35 && getD <= 3.5
          ? total + 3.5 + 1.35
          : total;

      try {
        let cart = await cartSchema.findOne({
          user: userId,
          orderDone: false,
          paymentStatus: false,
        });

        if (!cart) {
          cart = new cartSchema({
            user: userId,
            items: [
              {
                productId,
                quantity,
                price,
                total,
              },
            ],
            active: true,
            modifiedOn: Date.now(),
            deliveryCast: deliveryCost,
            subTotal: total,
            serviceCharges: 1.35,
            totalPrice: totalWithDelivery,
          });
        } else {
          const existingItemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
          );

          if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].total += total;
          } else {
            cart.items.push({
              productId,
              quantity,
              price,
              total,
            });
          }

          cart.totalPrice += total;
          cart.modifiedOn = Date.now();
        }

        await cart.save();

        return res.status(200).json({
          message: "Item added to cart",
          cart,
          totalProducts: cart.items.length,
        });
      } catch (dbError) {
        console.error(dbError);
        return res.status(500).json({
          message: "Please enter quantity of product",
          error: dbError,
        });
      }
    });
  } catch (jwtError) {
    console.error(jwtError);
    return res
      .status(500)
      .json({ message: "Error processing JWT", error: jwtError });
  }
};
const removeFromCart = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const cartId = req.params.cartId;
      const productId = req.params.productId;
      const findCart = await cartSchema.findById(cartId);

      if (!findCart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const itemIndex = findCart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Product not found in cart" });
      }

      findCart.totalPrice -= findCart.items[itemIndex].total;
      findCart.items.splice(itemIndex, 1);

      await findCart.save();

      return res.status(200).json({
        message: "Product removed from cart",
        cart: findCart,
        totalProducts: findCart.items.length,
      });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const decreaseQuantity = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const { cartId, productId } = req.body;
      const findCart = await cartSchema.findById(cartId);
      if (!findCart) {
        return res.status(404).json({ message: "Basket not found" });
      }
      const itemIndex = findCart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
      if (itemIndex === -1) {
        return res.status(404).json({ message: "Product not found in basket" });
      }

      const item = findCart.items[itemIndex];
      item.quantity -= 1;
      item.total -= item.price;
      findCart.totalPrice -= item.price;

      if (item.quantity <= 0) {
        findCart.items.splice(itemIndex, 1);
      }

      await findCart.save();
      return res
        .status(200)
        .json({ message: "Product quantity decreased", cart: findCart });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBasket = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const userId = auth.userId;
      const basket = await cartSchema
        .findOne({ user: userId, paymentStatus: false })
        .populate({ path: "items.productId", model: "productModel" });

      if (!basket) {
        return res.status(404).json({ message: "Basket is empty" });
      }

      return res.status(200).json(basket);
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const userDistanceFromStore = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ jwtError: err });
      }
      // const user
      const user = await userModel.findById(auth.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("user", user.location.coordinates);
      console.log("store", storeCoordinates);

      const getD = calculateDistance(
        user.location.coordinates,
        storeCoordinates
      );
      if (getD > 3.5) {
        return res
          .status(403)
          .json({ message: " Exceeded the delivery radius" });
      } else {
        return res.status(200).json({ message: "Within the delivery radius" });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

function calculateDistance(location1, location2) {
  const [lon1, lat1] = location1;
  const [lon2, lat2] = location2;

  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;
  const dIK = distance * 0.621371;
  console.log(dIK);
  return dIK;
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

const orderNow = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      //abc
      // const maxDistance=milesToMeters()
      const userId = auth.userId;
      const basketId = req.params.basketId;
      const { orderPrice } = req.body;

      // const bookingId=r
      // const { location } = req.body;
      //
      const findUser = await userModel.findById(userId);
      if (!findUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const findOrder = await orderModel.find({
        userId: userId,
        basketId: basketId,
        complete: false,
      });
      console.log(findOrder);
      if (findOrder.length > 0) {
        return res.status(404).json({
          message: "You have already an incomplete order to this basket.",
        });
      }
      const maxDistanceMiles = 1.6; // 0.404; //=>1.6 miles to meter(2574.95) then divide 2574/6371 to get in radian which is 0.4040
      const maxDistanceMeters = milesToMeters(maxDistanceMiles);
      const riders = await getNearByDrivers(
        storeCoordinates,
        maxDistanceMeters
      );

      //  console.log(riders[0]);
      console.log("riders", riders.length);
      let title = "ORDER REQUEST";
      let body = " You have an Order Request";
      const riderQueue = riders.map((rider) => rider._id);
      console.log(riderQueue);
      for (const riderQue of riderQueue) {
        const token = await getRegistrationToken(riderQue._id);

        await sendNotification(token, title, body);
      }
      const newOrder = new orderModel({
        orderPrice: orderPrice,
        userId: userId,

        basketId: basketId,
        riderId: null,
        riderQueue: riderQueue,
        orderStatus: "pending",
      });
      const findBasket = await cartSchema.findByIdAndUpdate(
        basketId,
        {
          orderDone: true,
        },
        { new: true }
      );
      await newOrder.save();
      //here we send notification to the rider
      //after that accept reject.
      //if he accept then we assign him the order and change the status in order
      //if he reject

      return res.status(200).json({
        message: "Request sends to riders. Please wait for there response",
        riders: riders,
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

const getMoreRiders = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }
      const userId = auth.userId;
      const orderId = req.params.orderId;
      const findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      const maxDistanceMiles = 1.6;
      const maxDistanceMeters = milesToMeters(maxDistanceMiles);

      const riders = await getNearByDrivers(
        storeCoordinates,
        maxDistanceMeters
      );
      console.log(riders);
      const riderQueue = riders.map((rider) => rider._id);

      findOrder.riderQueue = riderQueue;
      await findOrder.save();

      return res.status(200).json({
        message: "Rider queue updated successfully",
        riderQueue: riderQueue,
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
/*/  $geoNear: {
        near: {
          type: "Point",
          coordinates: [Number(storeLongitude), Number(storeLatitude)],
        },
        distanceField: "dist.calculated",
        maxDistance: Number(maxDistance),
        //spherical: true,
      },
    },

async function getNearByDrivers(storeCoordinates, maxDistance) {
  //storeLongitude), Number(storeLatitude
  const riders = await userModel.aggregate([
    {
    
    $geoNear: {
      near: { type: "Point", coordinates: [parselog, parselat] },
      distanceField: "dist.calculated",
      maxDistance: maxDistance,
      spherical: true,
    },
  }
    {
      $match: {
        userType: "rider",
        openToWork: true,
      },
    },
    {
      $addFields: {
        "dist.calculated": {
          $divide: ["$dist.calculated", 1609.34],
        },
      },
    },
     {
      $project: {
        _id: 1,
      },
    },
  ]);

  return riders;
}/*/
async function getNearByDrivers(storeCoordinates, maxDistance) {
  const [parselog, parselat] = storeCoordinates;

  const riders = await userModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parselog, parselat],
        },
        distanceField: "dist.calculated",
        maxDistance: maxDistance,
        spherical: true,
      },
    },
    {
      $match: {
        userType: "rider",
        openToWork: true,
      },
    },
    {
      $addFields: {
        "dist.calculated": {
          $divide: ["$dist.calculated", 1609.34], // Convert to miles
        },
      },
    },
    /*
      {
        $project: {
          _id: 1,
        }
      }
      */
  ]);

  return riders;
}

function milesToMeters(miles) {
  return miles * 1609.34;
}
const productReview = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      const userId = auth.userId;
      const productId = req.params.productId;
      const { ratting } = req.body;

      const findProduct = await productModel.findById(productId);
      if (!findProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const newRating = new reviewModel({
        userId: userId,
        productId: productId,
        rate: ratting,
      });

      await newRating.save();

      const reviews = await reviewModel.find({ productId: productId });

      const totalReviews = reviews.length;
      const sumOfRatings = reviews.reduce(
        (sum, review) => sum + review.rate,
        0
      );
      const averageRating = sumOfRatings / totalReviews;

      findProduct.averageRating = averageRating;
      await findProduct.save();

      return res
        .status(200)
        .json({ message: "Rating added successfully", averageRating });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const secondSearch = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err.message });
      }

      const { categoriesName, searchString } = req.body;

      try {
        const findCategories = await categoryModel
          .find({
            categoryName: { $in: categoriesName },
          })
          .populate({
            path: "subCategories",
            populate: {
              path: "products",
              model: "productModel",
              match: searchString
                ? { productName: { $regex: searchString, $options: "i" } }
                : {},
            },
          });

        if (!findCategories || findCategories.length === 0) {
          return res.status(404).json({ message: "No categories found" });
        }
        findCategories.forEach((category) => {
          category.subCategories.forEach((subCategory) => {
            subCategory.products = subCategory.products.filter((product) =>
              searchString
                ? product.productName
                    .toLowerCase()
                    .includes(searchString.toLowerCase())
                : true
            );
          });
        });
        res.status(200).json(findCategories);
      } catch (queryError) {
        res.status(500).json({
          error: "An error occurred while querying the database",
          details: queryError.message,
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An unexpected error occurred", details: error.message });
  }
};
const getAllSubcategoryOfACategory = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err.message });
      }

      const { categoryName } = req.body;

      if (!categoryName) {
        return res.status(400).json({ error: "categoryName is required" });
      }

      try {
        const findSubcategories = await categoryModel
          .findOne({ categoryName })
          .populate("subCategories")
          .exec();

        if (!findSubcategories) {
          return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json(findSubcategories.subCategories);
      } catch (queryError) {
        res.status(500).json({
          error: "An error occurred while querying the database",
          details: queryError.message,
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An unexpected error occurred", details: error.message });
  }
};
//abc
//def
//abc

const filterAndSort = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err.message });
      }

      const { sortingString, categoriesName } = req.body;
      if (!categoriesName) {
        return res
          .status(404)
          .json({ message: "Please enter the categories array" });
      }
      let sortedProducts;
      if (categoriesName.length === 0) {
        // Base case: no categories specified
        sortedProducts = await productModel
          .find({})
          .sort({ productPrice: 1 })
          .exec();

        if (sortingString === "highToLow") {
          sortedProducts = await productModel
            .find({})
            .sort({ productPrice: -1 })
            .exec();
        } else if (sortingString === "lowToHigh") {
          sortedProducts = await productModel
            .find({})
            .sort({ productPrice: 1 })
            .exec();
        } else if (sortingString === "newest") {
          sortedProducts = await productModel
            .find({})
            .sort({ createdAt: -1 })
            .exec();
        } else if (sortingString === "popular") {
          sortedProducts = await productModel
            .find({})
            .sort({ popularity: -1 })
            .exec();
        }

        return res.status(200).json({ sortedProducts: sortedProducts });
      }
      try {
        // Find categories based on provided names
        const findCategories = await categoryModel
          .find({ categoryName: { $in: categoriesName } })
          .populate({
            path: "subCategories",
            populate: {
              path: "products",
              model: "productModel",
            },
          });

        let allProducts = [];

        // Extract products from subcategories
        findCategories.forEach((category) => {
          category.subCategories.forEach((subCategory) => {
            allProducts = allProducts.concat(subCategory.products);
          });
        });

        // Apply sorting based on sortingString
        switch (sortingString) {
          case "popular":
            allProducts.sort((a, b) => b.popularity - a.popularity);
            break;
          case "newest":
            allProducts.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            break;

          case "lowToHigh":
            allProducts.sort((a, b) => a.productPrice - b.productPrice);
            break;
          case "highToLow":
            allProducts.sort((a, b) => b.productPrice - a.productPrice);
            break;
          default:
            return res.status(400).json({ error: "Invalid sortingString" });
        }

        if (allProducts.length === 0) {
          return res.status(404).json({ message: "No products found" });
        }

        return res.status(200).json({ sortedProducts: allProducts });
      } catch (queryError) {
        res.status(500).json({
          error: "An error occurred while querying the database",
          details: queryError.message,
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An unexpected error occurred", details: error.message });
  }
};
const removeAllProductsFromCart = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const cartId = req.params.cartId;
      const userId = auth.userId; // assuming the authenticated user's id is stored in the token
      console.log(userId);
      const findBasket = await cartSchema.findById(cartId);

      if (!findBasket) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Check if the authenticated user is the admin of the bucket (cart)
      if (findBasket.user.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You do not have permission to delete this cart" });
      }

      await cartSchema.findByIdAndDelete(cartId);

      return res
        .status(200)
        .json({ message: "All products removed from cart" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const filterAndSortSubCategory = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err.message });
      }

      const { sortingString, subCategoriesName } = req.body;
      if (!subCategoriesName) {
        return res
          .status(404)
          .json({ message: "Please enter the categories array" });
      }
      let sortedProducts;
      if (subCategoriesName.length === 0) {
        // Base case: no categories specified
        sortedProducts = await productModel
          .find({})
          .sort({ productPrice: 1 })
          .exec();

        if (sortingString === "highToLow") {
          sortedProducts = await productModel
            .find({})
            .sort({ productPrice: -1 })
            .exec();
        } else if (sortingString === "lowToHigh") {
          sortedProducts = await productModel
            .find({})
            .sort({ productPrice: 1 })
            .exec();
        } else if (sortingString === "newest") {
          sortedProducts = await productModel
            .find({})
            .sort({ createdAt: -1 })
            .exec();
        } else if (sortingString === "popular") {
          sortedProducts = await productModel
            .find({})
            .sort({ popularity: -1 })
            .exec();
        }

        return res.status(200).json({ sortedProducts: sortedProducts });
      }
      try {
        // Find categories based on provided names
        const findSubCategories = await subCategoryModel
          .find({ subCategoryName: { $in: subCategoriesName } })
          .populate({
            path: "products",
            model: "productModel",
          });

        let allProducts = [];

        // Extract products from subcategories
        findSubCategories.forEach((subCategory) => {
          allProducts = allProducts.concat(subCategory.products);
        });

        // Apply sorting based on sortingString
        switch (sortingString) {
          case "popular":
            allProducts.sort((a, b) => b.popularity - a.popularity);
            break;
          case "newest":
            allProducts.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            break;

          case "lowToHigh":
            allProducts.sort((a, b) => a.productPrice - b.productPrice);
            break;
          case "highToLow":
            allProducts.sort((a, b) => b.productPrice - a.productPrice);
            break;
          default:
            return res.status(400).json({ error: "Invalid sortingString" });
        }

        if (allProducts.length === 0) {
          return res.status(404).json({ message: "No products found" });
        }

        return res.status(200).json({ sortedProducts: allProducts });
      } catch (queryError) {
        res.status(500).json({
          error: "An error occurred while querying the database",
          details: queryError.message,
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An unexpected error occurred", details: error.message });
  }
};
const subCatSearch = async (req, res) => {
  try {
    jwt.verify(req.token, secretKey.secretKey, async (err, auth) => {
      if (err) {
        return res.status(401).json({ JWTErr: err });
      }

      const searchString = req.query.searchString;

      if (!searchString) {
        return res.status(400).json({ message: "Search string is required" });
      }

      try {
        const findSubCategories = await subCategoryModel.find({
          $or: [{ subCategoryName: { $regex: searchString, $options: "i" } }],
        });

        if (findSubCategories.length === 0) {
          return res.status(404).json({ message: "No subcategories found" });
        }

        return res.status(200).json({ subCategories: findSubCategories });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Server error", error: error.message });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  searchProduct,
  getLatestCategories,
  getAllSubcategories,
  getAllProductOfSubCategory,
  showProductDetail,
  addWishList,
  getSaleProducts,
  popular,
  newest,
  lowToHigh,
  highToLow,
  addToCart,
  getBasket,
  userDistanceFromStore,
  orderNow,
  removeFromCart,
  decreaseQuantity,
  getMoreRiders,
  calculateDistance,
  secondSearch,
  getAllSubcategoryOfACategory,
  filterAndSort,
  removeAllProductsFromCart,
  filterAndSortSubCategory,
  subCatSearch,
};
