import { checkJwt as originalCheckJwt } from "../utils/auth.js";

export const checkJwt = (req, res, next) => {
  originalCheckJwt(req, res, next);
};
