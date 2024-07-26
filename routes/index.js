let express = require('express');
let router = express.Router();
let v1ApiRouter = require("./v1-api");
const webhook = require("./webhook");
const Products = require("../models").Products;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
router.use("/v1", v1ApiRouter);

router.get('/', function (req, res, next) {
    res.render('index', { title: 'E-Commerce App' });
});

router.use("/webhook", webhook);


router.post("/addColumns",async (req, res) => {
    let productsArray = await Products.findAll();
    let promiseArray = [];

    const updateProduct = async(newObj, id) => {
        console.log("UPDATE FUNCTION", newObj, id)
        await Products.update(newObj,{
            where: {
                id
            }
        }).then((result) => console.log("RESULT : ", result)).catch(err=> console.log("ERROR : ", err))
    }
    for(let i = 0; i < productsArray.length; i++){
        console.log("FOR LOOP")
        let tempOBJ = productsArray[i].dataValues.rental_fee;
        let parsedObj = await isJSON(tempOBJ) ? JSON.parse(tempOBJ) : tempOBJ;
        let id = productsArray[i].dataValues.id;
        console.log("PARSED OBJ : ", parsedObj)
        let newObj = {
            two_weeks: parsedObj["2weeks"],
            three_weeks: parsedObj["3weeks"],
            four_weeks: parsedObj["4weeks"],
            five_weeks: parsedObj["5weeks"],
            six_weeks: parsedObj["6weeks"]
        };
        console.log("NEW OBJ : ",newObj)
        await Promise.all(promiseArray).then(async () => {
            promiseArray.push(await updateProduct(newObj, id))
        });
    }
    Promise.all(promiseArray).then(() => {
        res.status(200).send("UPDATED SUCCESSFULLY")
    }).catch(err => res.status(400).send("FALIED"))
})

module.exports = router;