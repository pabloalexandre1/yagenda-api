const Users = require("../Models/UserModel");
const Servicers = require("../Models/ServiceModel");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
const SMTPPool = require("nodemailer/lib/smtp-pool");
const jwt = require('jsonwebtoken');
const jwtsecret = 'umburana2011';

class UserController {
    register = async(req, res) => {
        console.log(req.body);
        var {name, email, password} = req.body;
        var validate = true;
        var nameV = name.trim();
        var emailV = email.trim();
        var passwordV = password.trim();

        if(nameV != ''){
            if(emailV != ''){
                
                if(passwordV != '' && passwordV.length >= 6){
                    validate = true;
                }else{
                    validate = false;
                    res.json({
                        
                        msg: "error",
                        error: "senha invalida, ela deve ter ao menos 6 caracteres"
                    });
                }
            }else{
                validate = false
                res.json({
                    
                    msg: "error",
                    error: "email invalido, preencha corretamente"
                });
            }
        }else{
            validate = false;
            res.json({
                msg: "error",
                error: "nome vazio, preencha-o para continuar"
            });
        }

        //after all validation of the informations, validate if email is not already registered
        if(validate == true){
            
            var user = await Users.findByEmail(emailV);
            
            if(user.length > 0) {
                res.json({
                    msg: "error",
                    error: "email ja cadastrado"
                });
                //below if all validations had success
            }else{
                const hashPassword = async (password, saltRounds = 10) => {
                    try {
                      // Generate a salt
                      const salt = await bcrypt.genSalt(saltRounds)
                  
                      // Hash password
                      return await bcrypt.hash(password, salt)
                    } catch (error) {
                      console.log(error)
                    }
                  
                    // Return null if error
                    return null
                }
                try{
                    var passwordHash = await hashPassword(password);
                }catch(error){
                    console.log(error);
                    res.json({error});
                }
                
                try{
                    var userCreate = await Users.create(name, email, passwordHash);
                }catch(error){
                    console.log(error);
                    res.json({error});
                }
                
                try{
                    var k = await Users.findByEmail(email);
                }catch(error){
                    res.json({error})
                }

                try{
                    var u = await Users.findByEmail(email);
                }catch(error){res.json({error})}


                
                if(u[0]){
                    
                    var idd = u[0]._id;

                    //sending the confirmation e-mail to the user
                    var transporter = nodeMailer.createTransport({
                        host: 'smtp.office365.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: "pablo.barros1@outlook.com",
                            pass: "umburana2012"
                        }
                    });

                     
                    transporter.sendMail({
                        from: "Pablo Barros <pablo.barros1@outlook.com>",
                        to: email,
                        subject: "YAGENDA - confirmação de email",
                        text: "obrigado por realizar a inscrição na nossa plataforma, falta apenas um passo para começar a usufrir da mesma, clique no link a seguir e confirme que este email é seu!: "+ process.env.FRONT_URL +"/user/emailconfirmation/" + idd,
                        html: "<h1 style='color: #bea562;background: #212121;padding:15px;border-radius:8px;'> obrigado por se inscrever na plataforma da Yagenda, clique no botão a seguir para confirmar seu e-mail: </h1> <br> <a href='"+ process.env.FRONT_URL +"/user/emailconfirmation/" + idd + "'> CONFIRMAR </a> <br>"
                    }).then(message => {
                        console.log('--email rwesult');
                        console.log(message);
                    }).catch(err => {
                        console.log('--email error')
                        console.log(err);
                    });

                    res.json({msg: 'success'});
                }

                     
                
                        

                
            }
            
        }

    }

    emailConfirmation = async(req, res) => {
        var id = req.params.id;
        var user = await Users.confirmEmail(id);
        if(user == 'invalid'){
            res.json({
                msg: "error",
                error: "usuario invalido"
            })
        }
        if(user == 'success'){
            res.json({
                msg: "success"
            });
        }
        
        
    }

    login = async(req, res) => {
        var {email, password} = req.body;
        var user = await Users.findByEmail(email);

        if(user.length > 0){
            var result = await bcrypt.compare(password, user[0].password);
            if(result == true){
                if(user[0].valid == 'yes'){
                    var token = jwt.sign({name: user[0].name, email: user[0].email, role: 'user'}, jwtsecret);
                    
                    res.json({
                        msg: "success",
                        user: {
                            token: token,
                            name: user[0].name,
                            email: user[0].email
                        }
                    });
                }else{
                    res.json({
                        msg: "error",
                        error: "você ainda não confirmou seu e-mail"
                    })
                }
                
            }else{
                res.json({
                    msg: "error",
                    error: "senha incorreta"
                });
            }
            
        }else{
            console.log(req.body);
            res.json({
                msg: "error",
                error: "email de usuário não encontrado no banco de dados"
            })
        }
        

        
    }

    verifyToken = async (req, res) => {
        var token = req.params.token;
        try{
            var decoded = jwt.verify(token, jwtsecret);
            
            if(decoded.role == 'user'){

                try{
                    var user = await Users.findByEmail(decoded.email);
                }catch(err){
                    res.json({msg: "error", error: err});
                }
                if(user.length > 0 && user[0].valid == 'yes'){
                    res.json(decoded);
                }else{
                    res.json({msg: "error", error: "invalid"});
                }

            }else if(decoded.role == 'servicer'){
                try{
                    var servicer = await Servicers.findByEmail(decoded.email);
                }catch(err){
                    res.json({msg: "error", error: err});
                }
                if(servicer.length > 0 && servicer[0].valid == 'yes'){
                    res.json(decoded);
                }else{
                    res.json({msg: "error", error: "invalid"});
                }
                
            }
            
            
        }catch(err){
            res.json({err});
        }
        
        
    }

    getServices = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtsecret);
        var email = result2.email;

        try{
            var a = await Users.findByEmail(email);
        }catch(error){
            res.json({error})
        }
        
        res.json({
            msg: 'success',
            servicers: a[0].services
        })
    }

    addServicer = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtsecret);
        var email = result2.email;
        var name = result2.name;
        try{
            var a = await Servicers.findByEmail(req.body.email);
        }catch(error){
            res.json({error})
        }
        if(a.length <= 0) {
            res.json({msg: 'error', error: 'negócio não encontrado'});
        }else{
            var clients = a[0].clients;
            var newClient = {
                name: name,
                email:email,
                accepted: 'no'
            }
            clients.push(newClient);
            try{
                var b = Servicers.addClient(clients, req.body.email, email);
            }catch(error){
                res.json({error});
            }
            
            
            res.json({
                msg: 'success'
            });
        }
        
        
    }

    deleteServicer = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtsecret);
        var email = result2.email;
        //delete servicer from user collection
        try{
            var a = await Users.findByEmail(email);
        }catch(error){
            res.json({error})
        }
        if(a.length <= 0) {
            res.json({msg: 'error', error: 'negócio não encontrado'});
        }else{
            var servicers = a[0].services;
            var k = servicers.length;
            console.log(servicers[0].email);
            console.log(k);
            console.log(req.body.email);
            console.log(servicers);
            var indexToDelete = null;
            for(var i = 0; i < k; i++){
                var servicerEmail = servicers[i].email;

                if (servicerEmail == req.body.email){
                    indexToDelete = i;
                    console.log('achou')
                }
                
                
            }
            var servicerrs = servicers;
               
            servicerrs.splice(indexToDelete, 1);
            
            try{
                var b = await Users.addServicer(email, servicerrs);
            }catch(error){
                res.json({error});
            }

            //delete client from servicers collection
            try{
                var servicer = await Servicers.findByEmail(req.body.email);
            }catch(error){
                res.json(error)
            }
            
            var indexToDelete = null;
            var clients = servicer[0].clients;
            var k = clients.length;
            for(var l = 0; l < k; l++){
                if(clients[l].email == email){
                    indexToDelete = l
                }
            }
            var clientss = clients;
            clientss.splice(indexToDelete, 1);
            try{
                var j = await Servicers.updateSolicitation(req.body.email, clientss);
            }catch(error){
                res.json(error);
            }
            
            
            res.json({
                msg: 'success'
            });
        }
    }

    getScheduled = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtsecret);
        var email = result2.email;

        try{
            var foundUser = await Users.findByEmail(email);
        }catch(error){
            res.json({error});
        }
        
        var scheduled = foundUser[0].scheduled_services;

        res.json({
            msg: 'success',
            scheduled: scheduled
        });
    }

    postScheduled = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtsecret);
        var email = result2.email;

        try{
            var foundUser = await Users.findByEmail(email);
        }catch(error){
            res.json({error});
        }

        try{
            var foundServicer = await Servicers.findByEmail(req.body.servicerEmail);
        }catch(error){
            res.json({error});
        }

        var scheduled = foundUser[0].scheduled_services;
        var servicerScheduled = foundServicer[0].scheduled_services;

        servicerScheduled.push(req.body.newScheduled);

        var userScheduled = req.body.newScheduled;
        userScheduled.servicer = foundServicer[0].name_business;
        userScheduled.servicerEmail = foundServicer[0].email;
        scheduled.push(userScheduled);
        

        try{
            var a = await Users.addScheduled(email, scheduled);
        }catch(error){
            res.json({error});
        }

        try{
            var b = await Servicers.postScheduled(req.body.servicerEmail, servicerScheduled);
        }catch(error){
            res.json({error});
        }

        if(a == 'success' && b == 'success'){
            res.json({
                msg: 'success'
            });
        }

    }

    deleteScheduled = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtsecret);
        var email = result2.email;

        try{
            var user = await Users.findByEmail(email);
        }catch(error){
            res.json({error});
        }
        if(user[0]){
            var userScheduled = user[0].scheduled_services;
            var itemScheduled = req.body.item;

            var length = userScheduled.length;
            var index = null;
            for(var i = 0; i < length; i++){
                if(userScheduled[i]._id == itemScheduled._id){
                    index = i;
                }
            }
            if(index != null){
                userScheduled.splice(index, 1);

                try{
                    var a = await Users.addScheduled(email, userScheduled);
                }catch(error){
                    res.json({error});
                }
                
            }
        }

        //delete from the servicers collection too

        try{
            var servicer = await Servicers.findByEmail(req.body.item.servicerEmail);
        }catch(error){
            res.json({error});
        }

        if(servicer[0]){
            var servicerScheduled = servicer[0].scheduled_services;
            var ll = servicerScheduled.length;
            var indexx = null;
            
            for(var u = 0; u < ll; u++){
                if(servicerScheduled[u].date == req.body.item.date && servicerScheduled[u].time == req.body.item.time){
                    indexx = u;
                }

            }
            if(indexx != null){
                servicerScheduled.splice(indexx,1);
                try{
                    var b = await Servicers.postScheduled(req.body.item.servicerEmail, servicerScheduled);
                }catch(error){
                    res.json({error});
                }
                
            }
        }


        //after all

        
            res.json({msg: 'success'});
        
        
    }

    recoverPassword = async (req, res) => {
        var email = req.body.email;
        try{
            var a = await Users.findByEmail(email);
        }catch(error){
            console.log(error);
        }

        if(a.length > 0){
            var date = new Date();
            var day = date.getDate();
            if(day < 10){
                day = '0'+day;
            }
            var month = date.getMonth();
            month = month + 1;
            if(month < 10){
                month = '0' + month;
            }
            var year = date.getFullYear();

            var fullDate = day + '-' + month + '-' + year;
            function getRandomIntInclusive(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            var number = getRandomIntInclusive(0, 999999);

            var recoverpass = `${number}/${fullDate}/no`;
            try{
                var b = await Users.defineRecoverPass(email, recoverpass)
            }catch(error){
                console.log(error);
                res.json({
                    error0,
                });
            }
            //sending the emaill to recover to the user

            var transporter = nodeMailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                auth: {
                    user: "pablo.barros1@outlook.com",
                    pass: "umburana2012"
                }
            });

             
            transporter.sendMail({
                from: "Pablo Barros <pablo.barros1@outlook.com>",
                to: email,
                subject: "YAGENDA - redefinição de senha",
                text: "clique no link a seguir, ou copie e cole no seu navegador, para ir para a pagina de redefinição de sua senha: "+ process.env.FRONT_URL +"/user/define-password/"+ email + '/' + recoverpass,
                html: "<h1 style='color: #bea562;background: #212121;padding:15px;border-radius:8px;'> Clique no botão a seguir para ir à página de redefinição de senha da YawAgenda, se a solicitação não foi feita por você, apenas ignore </h1> <br> <a style='color: #212121; background: #bea562; padding: 20px; border-radius: 8px;' href='"+ process.env.FRONT_URL +"/user/define-password/" + email + '/' + recoverpass + "'> DEFINIR SENHA </a> <br>"
            }).then(message => {
                console.log('--email rwesult');
                console.log(message);
            }).catch(err => {
                console.log('--email error')
                console.log(err);
            });

            res.json(
                {msg: 'success'    
            });
            
        }else{
            res.json({msg: error, error: 'usuário não encontrado'});
        }
    }

    updatePassword = async (req, res) => {
        console.log(req.body);
        var email = req.body.email;
        var dateCode = req.body.date;
        var numberPass = req.body.number;
        var status = req.body.status;
        if(email){
            try{
                var user = await Users.findByEmail(email)
            }catch(error){
                res.json({error: 'erro ao procurar usuário'});
            }
            var recoverPass = user[0].recoverpass.split('/');
            var numberPassRecover = recoverPass[0];
            var dateCodeRecover = recoverPass[1];
            var status = recoverPass[2];
            if(status == 'no'){
                if(dateCode == dateCodeRecover && numberPass == numberPassRecover){
                    const hashPassword = async (password, saltRounds = 10) => {
                        try {
                          // Generate a salt
                          const salt = await bcrypt.genSalt(saltRounds)
                      
                          // Hash password
                          return await bcrypt.hash(password, salt)
                        } catch (error) {
                          console.log(error)
                        }
                      
                        // Return null if error
                        return null
                    }
                    try{
                        var definedPass = await hashPassword(req.body.password);
                    }catch(error){
                        res.json({error: 'erro no hashPassword'});
                    }
                    var newRecover = `${recoverPass[0]}/${recoverPass[1]}/yes`;
                    if(definedPass){
                        try{
                            console.log('defined : ' + req.body.password);
                            var a = await Users.updatePassword(email, definedPass, newRecover);
                            res.json({
                                msg: 'success'
                            });
                        }catch(error){
                            res.json({error: 'erro no update password function'})
                        }
                        
                    }else{
                        res.json({error: 'algum erro aconteceu'})
                    }
                }
            }else{
                res.json({error: 'este código já foi utilizado'});
            }
        }else{
            res.json({
                error: 'nenhum usuário com este email'
            })
        }

    }
}

module.exports = new UserController();