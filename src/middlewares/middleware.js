import { checkJwt as originalCheckJwt } from "../utils/auth.js";
import multer from "multer";
import path from "path";

const __dirname = path.resolve();
const uploadDir = path.join(__dirname, "src", "tmp");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

export const multerUpload = (req, res, next) => {
  upload(req, res, (err) => {
    next();
  });
};

export const checkJwt = (req, res, next) => {
  originalCheckJwt(req, res, next);
};
