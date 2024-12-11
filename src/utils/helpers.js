import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import { uploadFile } from "./aws.js";
import fs from "fs";

const jwtSecret = process.env.JWT_SECRET;

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

export const uploadBase64ImageToS3 = async (base64Image, bucketName, key) => {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const dataBuffer = Buffer.from(base64Data, "base64");

  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: dataBuffer,
    ContentEncoding: "base64",
    ContentType: "image/jpeg",
  };
  try {
    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image :", error);
    throw error;
  }
};

export const generateRandom = (length) =>
  Math.floor(
    Math.pow(10, length - 1) +
      Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)
  );

export const generateRandomPassword = (length) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const generateAccessToken = (user) => {
  return jwt.sign(user, jwtSecret);
};

export const getTokenPayload = (token) => {
  if (!token) {
    throw new Error("Token manquant");
  }
  try {
    jwt.verify(token, jwtSecret);
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    throw new Error("Token invalide");
  }
};

export const handleUploadedFile = async (bucketName, file) => {
  if (file) {
    const handledFile = await uploadFile(
      file.path,
      bucketName,
      file.filename,
      file.mimetype
    );
    await fs.promises.unlink(file.path);
    return handledFile;
  }
  return null;
};

export const currencyMap = {
  usd: "$",
  eur: "€",
  gbp: "£",
};
