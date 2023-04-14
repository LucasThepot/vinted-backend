const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // Le token reçu est dans req.headers.authorization
    //console.log(req.headers.authorization);
    // Vérification de la réception d'un token
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" }); // si pas de token erreur
    }
    //   Je vais chercher mon token envoyé par le client et j'enlève "Bearer " devant
    const token = req.headers.authorization.replace("Bearer ", "");

    // Vérification que le token correspond bien à un user, je vais chercher dans ma collection User un élément dont la clef token contient le token reçu, je veux qu'on ne me renvoit que sa clef account
    const user = await User.findOne({ token: token }).select("account");
    // console.log(user);

    // Si je n'en trouve pas ====> erreur
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    // Si J'en trouve un, je le stocke dans req.user pour le garder sous la main et pouvoir le réutiliser dans ma route
    req.user = user;
    // Je passe au middleware suivant
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
