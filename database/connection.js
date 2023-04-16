const mongoose = require("mongoose");

var connection = mongoose.connect("mongodb+srv://yawara:umburana2011@yawara.8cmlzoy.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

module.exports = connection;