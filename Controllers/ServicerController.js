const Servicers = require("../Models/ServiceModel");
const Users = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodeMailer");
const SMTPPool = require("nodemailer/lib/smtp-pool");
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51LSSIPGHronIDZ9w2BJQmAR0KwP3DEMdPhAe8lmPhDApC8yGekQMHgBhGsXGAbYKs5y5jDiInbvQYbOuGtb3ywoq00GwdjmKBm');
const jwtSecret = require('../jwtSecret');
const ServicerFunctions = require("./ServicerFunctions");
class ServicerController {
    //main routes functions

    register = async (req, res) => {

        var {name, name_business, email, password} = req.body;
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

        //after ll validation of the informations, validate if email is not already registered
        if(validate == true){
            
            var user = await Servicers.findByEmail(emailV);
            
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
                    var servicerCreate = Servicers.create(name, name_business, email, passwordHash, req.body.address);
                }catch(error){
                    console.log(error);
                    res.json({error});
                }
                
                try{
                    var k = await Servicers.findByEmail(email);
                }catch(error){
                    res.json({error})
                }

                try{
                    var u = await Servicers.findByEmail(email);
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
                        text: "obrigado por realizar a inscrição na nossa plataforma, falta apenas um passo para começar a usufrir da mesma, clique no link a seguir e confirme que este email é seu!: "+ process.env.FRONT_URL +"/servicer/emailconfirmation/" + idd,
                        html: "<h1 style='color: #bea562;background: #212121;padding:15px;border-radius:8px;'> obrigado por se inscrever na plataforma da Yagenda, clique no botão a seguir para confirmar seu e-mail: </h1> <br> <a href='"+ process.env.FRONT_URL +"/servicer/emailconfirmation/" + idd + "'> CONFIRMAR </a> <br>"
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
        var user = await Servicers.confirmEmail(id);
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
        var user = await Servicers.findByEmail(email);

        if(user.length > 0){
            var result = await bcrypt.compare(password, user[0].password);
            if(result == true){
                if(user[0].valid == 'yes'){
                    var token = jwt.sign({name: user[0].name, email: user[0].email, role: 'servicer'}, jwtSecret);
                    
                    res.json({
                        msg: "success",
                        user: {
                            token: token,
                            name: user[0].name,
                            name_business: user[0].name_business,
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
            
            res.json({
                msg: "error",
                error: "email de usuário não encontrado no banco de dados"
            })
        }
        

        
    }

    createCheckout = async (req, res) => {
        const session = await stripe.checkout.sessions.create({
            line_items: [
              {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: 'price_1LXYrRGHronIDZ9weBugR88g',
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: process.env.FRONT_URL +`/successpay`,
            cancel_url: process.env.FRONT_URL + `/cancelpay`,
        });
        console.log("------------  SESSION CRIADA -------------------------");
        console.log(session);
        res.json({
            msg: "success",
            url: session.url
        });
    }

    sucessPayment = async (req, res) => {
        const endpointSecret = "whsec_3d47a0a34fc42629a61a83307a175efc3bbf6cfe5d6cda528898404d1789639e";

        

        const sig = req.headers['stripe-signature'];

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            console.log("=================ESTÁ INDO OK ===================");
            console.log(event.type);
        } catch (err) {
            console.log("=================== ACONTECEU UM ERRO ====================");
            console.log(err);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
            const session = event.data.object;
            // Then define and call a function to handle the event checkout.session.async_payment_succeeded
            console.log("----------- SESSION DO EVENTO -----------");
            console.log(session);
            
            
            break;
            // ... handle other event types
            default:
            console.log(`Unhandled event type ${event.type}`);
        }

        res.send("{'msg': 'ok'}");
    }

    //full logged methods

    postService = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var service = {
            description: req.body.serviceDescription,
            time: req.body.time
        }
        Servicers.postService(result2.email, service).then(ress => {
            res.json({msg: "success"});
        }).catch(err => {
            res.json({
                msg: "errror",
                error: err
            })
        });
 
    }

    getServices = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var user = await Servicers.findByEmail(result2.email);
        res.json({
            msg: "success",
            services: user[0].services
        });
    }

    deleteService = async (req, res) => {
        var id = req.body.id;
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        try{
            var user = await Servicers.findByEmail(result2.email);
            var query = await Servicers.deleteService(user[0]._id, id); 
        }catch(err){
            console.log(err);
            res.json({msg: "error", error: "ocorreu um erro ao deletar o serviço, tente novamente mais tarde"});
        }
        
        res.json({msg: query});
        

    }

    updateRawWeek = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        
        try{
            var result3 = await Servicers.updateRawWeek(result2.email, req.body.rawWeek);
        }catch(err){ res.json({msg: 'error', error: err}); console.log("error in updateRawWeek at ServicerController: " + err)}
        console.log(result3);

        //then save the hours avaiable set by the servicer
        var schedule = [];
        for(var i = 0; i <= 6; i++){
            var init = req.body.rawWeek[i].open;
            var end = req.body.rawWeek[i].close;
            try{
                var availableHours = await ServicerFunctions.calcSchedule(init, end);
            }catch(error){
                console.log(error);
            }
            schedule.push(availableHours);
        }
        Servicers.setSchedule(result2.email, schedule);

        res.json({
            msg: 'success'
        });
        

    }

    getRawWeek = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        try{
            var servicer = await Servicers.findByEmail(result2.email);
            
        }catch(err){
            res.json({
                msg: 'error',
                error: err
            });
        }

        //if try is successfull
        res.json({
            msg: 'success',
            rawWeek: servicer[0].rawWeek
        });
        
    }

    getClients = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;
        try{
            var servicer = await Servicers.findByEmail(email);
        }catch(err){
            console.log(err);
            res.json({
                msg: 'error',
                error: err
            });
        }
        
        res.json({
            msg: 'success',
            clients: servicer[0].clients
        }); 
        
    }

    putSolicitations = async (req, res) => {
        var action = req.body.action

        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;

        try{
            var servicer = await Servicers.findByEmail(email);
            
        }catch(error){
            console.log(error);
            res.json({error});
        }
        var clients = servicer[0].clients;
        
        var l = clients.length;
        for(var i = 0; i < l; i++){
            if(clients[i].email == req.body.email){
                if(action == 'accept'){
                    clients[i].accepted = 'yes';
                    //add the servicer at the user servicers list
                    try{
                        var s = await Users.findByEmail(clients[i].email)                       

                    }catch(error){
                        res.json(error);
                    }
                    var iServicers = s[0].services;
                    iServicers.push({
                        name: servicer[0].name,
                        name_business: servicer[0].name_business,
                        email: servicer[0].email
                    });
                    try{
                        var k = await Users.addServicer(clients[i].email, iServicers);
                    }catch(error){
                        res.json(error);
                    }
                    
                }else{
                    clients.splice(i, 1);
                }
            }
        }
        try{
            var a = await Servicers.updateSolicitation(email, clients);
        }catch(error){
            console.log(error);
            res.json({error});

        }

        
        res.json({
            msg: 'success',
        })
        
        
    }

    getSchedule = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;

        try{
            var a = await Servicers.findByEmail(email);
        }catch(error){
            res.json({error});
        }

        var schedule = a[0].schedule;
        res.json({
            msg: 'success',
            schedule: schedule
        });
        
    }

    getServicer = async (req, res) => {
        try{
            var servicer = await Servicers.findByEmail(req.params.email);
        }catch(error){
            res.json(error);
        } 
        
        if(servicer.length  > 0){
            var servicerNew = {
                name: servicer[0].name,
                name_business: servicer[0].name_business,
                address: servicer[0].address,
                email: servicer[0].email,
                schedule: servicer[0].schedule,
                services: servicer[0].services,
                rawWeek: servicer[0].rawWeek,
                scheduled_services: servicer[0].scheduled_services
            }
            res.json({
                msg: 'success',
                servicer: servicerNew
            })
        }else{
            res.json({
                msg: 'error',
                error: 'negócio não encontrado'
            });
        }
        
    }

    getScheduled = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;

        try{
            var servicer = await Servicers.findByEmail(email);
        }catch(error){
            res.json({error});
        };
        
        var scheduled = servicer[0].scheduled_services;

        res.json({
            msg: 'success',
            scheduled: scheduled
        });
    }

    postScheduled = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;
        
        var scheduled = req.body.scheduled;
        try{
            var servicer = await Servicers.findByEmail(email);
        }catch(err){
            res.json({error: err})
        }
        var scheduledArray = servicer[0].scheduled_services;
        scheduledArray.push(scheduled);

        try{
            var a = await Servicers.postScheduled(email, scheduledArray);
        }catch(error){
            res.json({error});
        }

        res.json({
            msg: 'success'
        })
    }

    deleteScheduled = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;

        try{
            var servicer = await Servicers.findByEmail(email);
        }catch(error){
            res.json({error});
        }

        var scheduled = servicer[0].scheduled_services;
        
        var date = req.body.date;
        var time = req.body.time;
        var user = req.body.user;

        var l = scheduled.length;
        var indexToDelete2 = null;

        for(var i = 0; i < l; i++){
            if(scheduled[i].time == time && scheduled[i].date == date){
                
                var newScheduled = [];
                for(var ll = 0; ll < l; ll++){
                    if(scheduled[ll].time == time && scheduled[ll].date == date){
                        
                    }else{
                        newScheduled.push(scheduled[ll]);
                    }
                }
                

            }
            
        }

        try{
            var a = await Servicers.postScheduled(email, newScheduled);
        }catch(error){
            res.json({error});
        }

        //delete from the user data if there is an user valid for that scheduled

        try{
            var foundUser = await Users.findByEmail(user);
        }catch(error){
            console.log(error);
            res.json({error});
        }
        console.log(foundUser);
        console.log(user);
        if(foundUser[0]){
            

            var scheduled2 = foundUser[0].scheduled_services;
            var length = scheduled2.length;
            var indexToDelete = null;
            
            for(var y = 0; y < length; y++){
                if(scheduled2[y].time == time && scheduled2[y].date == date){
                    indexToDelete = y;

                } 
            }
            
            if(indexToDelete != null){
                scheduled2.splice(indexToDelete, 1);

                try{
                    var b = await Users.addScheduled(user, scheduled2);
                    
                }catch(error){
                    res.json({error});
                }
                
                
            }
        }

        res.json({
            msg: 'success'
        });
    }

    deleteClient = async (req, res) => {
        var result = req.headers.authorization.split(' ');
        var token = result[1];
        var result2 = jwt.verify(token, jwtSecret);
        var email = result2.email;

        clientEmail = req.body.clientEmail;

        try{
            var a = await Servicers.findByEmail(email);
        }catch(error){
            res.json({error})
        }
        if(a.length <= 0) {
            res.json({msg: 'error', error: 'negócio não encontrado'});
        }else{
            var clients = a[0].clients;
            var k = clients.length;
            console.log(clients[0].email);
            console.log(k);
            console.log(req.body.email);
            console.log(clients);
            var indexToDelete = null;
            for(var i = 0; i < k; i++){
                var clientEmail = clients[i].email;

                if (clientEmail == req.body.clientEmail){
                    indexToDelete = i;
                    console.log('achou')
                }
                
                
            }
            var clientss = clients;
               
            clientss.splice(indexToDelete, 1);
            
            try{
                var b = await Servicers.updateSolicitation(email, clientss);
            }catch(error){
                res.json({error});
            }

            //delete servicer from clients collection
            try{
                var client = await Users.findByEmail(req.body.clientEmail);
            }catch(error){
                res.json(error)
            }
            
            var indexToDelete = null;
            var servicers = client[0].services;
            var k = clients.length;
            for(var l = 0; l < k; l++){
                if(servicers[l].email == email){
                    indexToDelete = l
                }
            }
            var servicerrs = servicers;
            servicerrs.splice(indexToDelete, 1);
            try{
                var j = await Users.addServicer(req.body.clientEmail, servicerrs);
            }catch(error){
                res.json(error);
            }
            
            
            res.json({
                msg: 'success'
            });
        }
    }

    recoverPassword = async (req, res) => {
        var email = req.body.email;
        try{
            var a = await Servicers.findByEmail(email);
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
                var b = await Servicers.defineRecoverPass(email, recoverpass)
            }catch(error){
                console.log(error);
                res.json({
                    error,
                });
            }
            //sending the emaill to recover to the user

            var transporter = nodeMailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                auth: {
                    user: "---EMAIL---",
                    pass: "---PASSWORD--"
                }
            });

             
            transporter.sendMail({
                from: "Pablo Barros <---EMAIL--->",
                to: email,
                subject: "YAGENDA - redefinição de senha",
                text: "clique no link a seguir, ou copie e cole no seu navegador, para ir para a pagina de redefinição de sua senha: "+ process.env.FRONT_URL +"/servicer/define-password/"+ email + '/' + recoverpass,
                html: "<h1 style='color: #bea562;background: #212121;padding:15px;border-radius:8px;'> Clique no botão a seguir para ir à página de redefinição de senha da YawAgenda, se a solicitação não foi feita por você, apenas ignore </h1> <br> <a style='color: #212121; background: #bea562; padding: 20px; border-radius: 8px;' href='"+ process.env.FRONT_URL +"/servicer/define-password/" + email + '/' + recoverpass + "'> DEFINIR SENHA </a> <br>"
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
                var user = await Servicers.findByEmail(email)
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
                            var a = await Servicers.updatePassword(email, definedPass, newRecover);
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

module.exports = new ServicerController();
