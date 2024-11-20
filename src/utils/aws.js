import AWS from "aws-sdk";
import fs from "fs";

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

export const uploadFile = async (filePath, bucketName, key, contentType) => {
  try {
    const fileData = fs.readFileSync(filePath);

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileData,
      ContentType: contentType,
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier :", error);
    throw error;
  }
};

export const signedS3Url = async (bucketName, url) => {
  const urlParts = new URL(url);
  const key = decodeURIComponent(urlParts.pathname.substring(1)); // Décodage des caractères spéciaux
  const signedUrl = s3.getSignedUrl("getObject", {
    Bucket: bucketName,
    Key: key,
    Expires: 60 * 60,
  });
  return signedUrl;
};
