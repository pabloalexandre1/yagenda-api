var bodyParser = require('body-parser')
const express = require("express");
const app = express();
var cors = require("cors");
var router = require("./routes/routes");
var mongoose = require("mongoose");
var connection = require("./database/connection");
require('dotenv').config();

//set cors
app.use(cors());
//set body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use('/servicer/payment-success', bodyParser.raw({type: "*/*"}));
app.use(bodyParser.json());
//get routes from the routes archive

app.use("/", router);

app.listen(4000, () => {
    console.log("server ready");
});