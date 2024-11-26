import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import axios from "axios";

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;

const client = jwksRsa({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      return callback(err);
    }
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
    audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ["RS256"],
  };

  jwt.verify(token, getKey, options, async (err, decoded) => {
    if (err) {
      return res.status(401).send("Token invalide");
    }
    req.user = decoded;
    next();
  });
};

const getAuth0Token = async () => {
  try {
    const response = await axios.post(`https://${AUTH0_DOMAIN}/oauth/token`, {
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
    });

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du token d'accès Auth0:",
      error.response?.data || error.message
    );
    throw new Error("Impossible d'obtenir le token d'accès Auth0");
  }
};

export const getUser = async (userId) => {
  try {
    const token = await getAuth0Token();
    const response = await axios.get(
      `https://${AUTH0_DOMAIN}/api/v2/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur Auth0:",
      error.response?.data || error.message
    );
    throw new Error("Impossible de récupérer l'utilisateur");
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    const token = await getAuth0Token();
    const response = await axios.patch(
      `https://${AUTH0_DOMAIN}/api/v2/users/${userId}`,
      {
        user_metadata: updatedData,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'utilisateur Auth0:",
      error.response?.data || error.message
    );
    throw new Error("Impossible de mettre à jour l'utilisateur");
  }
};

export const getUserByEmail = async (email) => {
  try {
    const token = await getAuth0Token();
    const response = await axios.get(
      `https://${AUTH0_DOMAIN}/api/v2/users-by-email?email=${email}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const sortedUsers = response.data.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    return sortedUsers[0];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par email Auth0:",
      error.response?.data || error.message
    );
    throw new Error("Impossible de récupérer l'utilisateur par email");
  }
};
