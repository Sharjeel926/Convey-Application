/*/const jwt = require("jsonwebtoken");
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader !== undefined) {
    const tokenArray = authHeader.split(" ");
    const token = tokenArray[1];
    req.token = token;
    next();
  } else {
    return res.status(501).json({ message: "Token is not provided" });
  }
};
module.exports = verifyToken;
/*/
const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (typeof authHeader !== "undefined") {
    const tokenArray = authHeader.split(" ");
    const token = tokenArray[1];
    req.token = token;
    next();
  } else {
    return res.status(501).json({ message: "Token is not provided" });
  }
};
module.exports = verifyToken;
