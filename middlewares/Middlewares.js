const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwtSecret');


class Middlewares {
    authenticateServicer = async (req, res, next) => {
        
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        if(result2.role == 'servicer'){
            next();
        }else{
            console.log(result2);
            res.json("operação inválida para sua conta");
        }
        
    }

    authenticateUser = async (req, res, next) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        if(result2.role == 'user'){
            next();
        }else{
            console.log(result2);
            res.json("operação inválida para sua conta");
        }
    }
}

module.exports = new Middlewares();