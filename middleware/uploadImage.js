const AWS = require("aws-sdk");
const multer = require("multer");
require("dotenv").config();
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const s3 = new AWS.S3({
  endpoint: process.env.B2_API_ENDPOINT,
  accessKeyId: process.env.B2_ACCESS_KEY_ID,
  secretAccessKey: process.env.secretKeyId,
});
const uploadFileToMiddleWare = (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "Error while upload image", error: err.message });
    }
    try {
      let profilePic = "";
      if (req.file) {
        const uploadParams = {
          Bucket: process.env.bucketName,
          Key: req.file.originalname,
          Body: req.file.buffer,
        };
        const response = await s3.upload(uploadParams).promise();
        profilePic = response.Location;
      }
      req.profilePicUrl = profilePic;
      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });
};
module.exports = uploadFileToMiddleWare;
