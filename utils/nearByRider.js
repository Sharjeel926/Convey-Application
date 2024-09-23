const userModel = require("../models/userModel");
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

module.exports = { getNearByDrivers, milesToMeters, getRegistrationToken };
