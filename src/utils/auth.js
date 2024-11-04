import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import axios from "axios";

import { User } from "../models/userModel.js";
import { createConnectedAccount } from "../services/stripeServices.js";

const client = jwksRsa({
  jwksUri: `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/.well-known/jwks.json`,
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
    audience: "https://dev-pivq3jzqbm4ia5qt.us.auth0.com/api/v2/",
    issuer: `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/`,
    algorithms: ["RS256"],
  };

  jwt.verify(token, getKey, options, async (err, decoded) => {
    if (err) {
      return res.status(401).send("Token invalide");
    }
    req.user = decoded;
    const user = await User.findOne({ sub: decoded.sub }).exec();
    if (!user) {
      const connectedAccount = await createConnectedAccount();
      User.create({
        sub: decoded.sub,
        connected_account_id: connectedAccount.id,
      });
    } else if (!user.connected_account_id) {
      const connectedAccount = await createConnectedAccount();
      user.connected_account_id = connectedAccount.id;
      await user.save();
    }
    next();
  });
};

const getAuth0Token = async () => {
  try {
    const response = await axios.post(
      `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/oauth/token`,
      {
        client_id: "zRuOJZQRJu4GO2zTvfR8nYVX6AaxQkl6",
        client_secret:
          "TpBfO9phNsJ8EeUCH3ymjjVeDejOWJSS5a2s2UMR-5UyU0BWV-4lUmFLM3OoASkO",
        audience: "https://dev-pivq3jzqbm4ia5qt.us.auth0.com/api/v2/",
        grant_type: "client_credentials",
      }
    );

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
      `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/api/v2/users/${userId}`,
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
      `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/api/v2/users/${userId}`,
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
      `https://dev-pivq3jzqbm4ia5qt.us.auth0.com/api/v2/users-by-email?email=${email}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data[0];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par email Auth0:",
      error.response?.data || error.message
    );
    throw new Error("Impossible de récupérer l'utilisateur par email");
  }
};
