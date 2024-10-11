import { getTokenPayload } from "../utils/helpers.js";
import { User } from "../models/userModel.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Accès non autorisé. Token manquant." });
  }
  try {
    const userId = getTokenPayload(token);
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Accès non autorisé. Utilisateur non trouvé." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Accès non autorisé. Token invalide." });
  }
};

export default authMiddleware;
