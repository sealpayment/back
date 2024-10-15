import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

const client = jwksRsa({
  jwksUri: `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/.well-known/jwks.json`,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

export const checkJwt = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send("Token manquant");
  }

  const options = {
    audience: "https://dev-pivq3jzqbm4ia5qt.us.auth0.com/api/v2/",
    issuer: `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/`,
    algorithms: ["RS256"],
  };

  jwt.verify(token, getKey, options, (err, decoded) => {
    if (err) {
      return res.status(401).send("Token invalide");
    }
    req.user = decoded;
    next();
  });
};
