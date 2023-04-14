const express = require("express"); // import express
const uid2 = require("uid2"); // Package qui sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string
const router = express.Router();

const User = require("../models/User"); // import d'User

router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body; // on défini nos variables contenus dans req.body, pour les réutiliser

    // si l'un de cas n'existe pas, ou si le type de newsletter n'est pas true/false
    if (!username || !email || !password || typeof newsletter !== "boolean") {
      return res.status(400).json({ message: "Missing parameters" }); // on retourne une erreur avec un message
    }

    const emailToVerify = await User.findOne({ email: email }); // on défini une var qui va chercher en BDD si l'y a un User dont la clé mail, est la même que reçu en request
    // si emailToVerify est différent de nul, donc si il existe déjà en BDD
    if (emailToVerify !== null) {
      return res // on retourne une erreur
        .status(409)
        .json({ message: "Email is already linked to an account" });
    }
    // Générer un Salt
    const salt = uid2(16);
    // Concaténer salt et password et encrypter le tout pour créer un hash
    const hash = SHA256(salt + password).toString(encBase64);
    //Générer un token à renvoyer au client
    const token = uid2(64);
    // on crée un nouvel utilisateur avec les différents éléments récupérés en request + ceux générer dans ma route (salt, hash, token)
    const newUser = new User({
      email: email, //dans req.body
      account: { username: username }, //dans req.body
      newsletter: newsletter, //dans req.body
      token: token, // généré
      hash: hash, // combiné du password + salt, le tout encryptré
      salt: salt, // généré
    });
    //console.log(newUser);
    await newUser.save(); //on sauve newUser dans mongoDB
    res.status(201).json({
      // on répond au client ce qui est attendu dans la consigne de l'exo
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // On crée une const user qui va aller chercher dans ma BDD, dans ma collection User un utilisateur ayant comme email le mail reçu en body
    const user = await User.findOne({ email: email });
    // Si j'en trouve pas, je renvoie une erreur

    if (user === null) {
      //si user défini plus haut n'existe pas
      return res.status(401).json({ message: "Unathorized connection1" });
    }
    // Si j'ai trouvé un email en BDD correspondant à celui envoyé par le client
    // Je dois crée un nouveau hash qui prendra le salt de l'user et le password délivrer par le client en request de connexion
    const newHash = SHA256(user.salt + password).toString(encBase64);
    // Pour pouvoir comparer le nouveau Hash à celui présent en BDD sur le compte de l'user
    // Si ils sont différents
    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unautorized connection" }); // retourner une erreur car le password indiqué par le client n'est pas le bon
    }

    res.json({
      // on répond au client ce qui est demandé dans l'exo
      _id: user._id,
      account: user.account,
      token: user.token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
