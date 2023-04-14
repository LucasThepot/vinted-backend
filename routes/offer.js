const express = require("express");
const router = express.Router();
// Import de fileupload qui nous permet de recevoir des formdata
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2; // Import de cloudinary
// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");
const User = require("../models/User");
const Offer = require("../models/Offer");

router.get("/offers", async (req, res) => {
  try {
    // Création d'un objet dans lequel on va sotcker nos différents filtres
    let filters = {};

    // Si on reçoit un query title
    if (req.query.title) {
      // On rajoute une clef product_name contenant une RegExp créée à partir du query title
      filters.product_name = new RegExp(req.query.title, "i");
    }
    // Si on reçoit un query priceMin
    if (req.query.priceMin) {
      // On rajoute une clef à filter contenant { $gte: req.query.priceMin }
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }
    // Si on reçoit un query priceMax
    if (req.query.priceMax) {
      // Si on a aussi reçu un query priceMin
      if (filters.product_price) {
        // On rajoute une clef $lte contenant le query en question
        filters.product_price.$lte = req.query.priceMax;
      } else {
        // Sinon on fait comme avec le query priceMax
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }

    // Création d'un objet sort qui servira à gérer le tri
    let sort = {};
    // Si on reçoit un query sort === "price-desc"
    if (req.query.sort === "price-desc") {
      // On réassigne cette valeur à sort
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      // Si la valeur du query est "price-asc" on réassigne cette autre valeur
      sort = { product_price: 1 };
    }
    // Création de la variable page qui vaut, pour l'instant, undefined
    let page;
    // Si le query page n'est pas un nombre >= à 1
    if (Number(req.query.page) < 1) {
      // page sera par défaut à 1
      page = 1;
    } else {
      // Sinon page sera égal au query reçu
      page = Number(req.query.page);
    }
    // La variable limit sera égale au query limit reçu
    let limit = Number(req.query.limit);
    // On va chercher les offres correspondant aux query de filtre reçus grâce à filters, sort et limit. On populate la clef owner en n'affichant que sa clef account
    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit) // ignorer les x résultats
      .limit(limit); // renvoyer y résultats

    // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
    const count = await Offer.countDocuments(filters);

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// J'utilise les middlewares isAuthenticated et fileUpload(), l'un servant à vérifier que l'user est bien connecté et l'autre permet de recevoir des fichiers
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Destructuring des clefs du body
      const { title, description, price, brand, size, condition, color, city } =
        req.body;
      // Je récupère la photo dans la clef suivante
      const picture = req.files.picture;

      // Upload de mon image sur cloudinary, la réponse de ce dernier sera dans picToUpload
      const picToUpload = await cloudinary.uploader.upload(
        convertToBase64(picture)
      );

      // Création de ma nouvelle offre
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: picToUpload,
        // Ici, je mets mon user entier, du moment que cet objet contient une clef _id, ce sera compris par mongoose comme une référence
        owner: req.user,
      });
      await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
