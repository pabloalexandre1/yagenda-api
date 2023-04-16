var express = require("express")
var app = express();
var router = express.Router();
const UserController = require("../Controllers/UserController");
const ServicerController = require("../Controllers/ServicerController");
const Middlewares = require("../middlewares/Middlewares");

router.get("/", (req, res) => {
    res.send(process.env.FRONT_URL);

});

router.get("/user/emailconfirmation/:id", UserController.emailConfirmation);
router.get("/servicer/emailconfirmation/:id", ServicerController.emailConfirmation);
router.get("/verifytoken/:token", UserController.verifyToken);


router.post("/user/login", UserController.login);
router.post("/servicer/login", ServicerController.login);

router.post("/user/register", UserController.register);
router.post("/servicer/register", ServicerController.register);

router.post("/servicer/create-checkout", ServicerController.createCheckout);
router.post("/servicer/payment-success", ServicerController.sucessPayment);

router.put("/user/define-password", UserController.updatePassword);
router.put("/servicer/define-password", ServicerController.updatePassword);

router.post("/user/recover-password", UserController.recoverPassword);
router.post("/servicer/recover-password", ServicerController.recoverPassword);


//authentication needed routes

router.get("/servicer/rawweek", Middlewares.authenticateServicer, ServicerController.getRawWeek);
router.get("/servicer/clients", Middlewares.authenticateServicer, ServicerController.getClients);
router.get("/user/getservices", Middlewares.authenticateUser, UserController.getServices);
router.get("/servicer/schedule", Middlewares.authenticateServicer, ServicerController.getSchedule);
router.get("/servicer/email/:email", Middlewares.authenticateUser, ServicerController.getServicer);
router.get("/scheduled", Middlewares.authenticateServicer, ServicerController.getScheduled);
router.get("/user-scheduled", Middlewares.authenticateUser, UserController.getScheduled);


router.post("/service", Middlewares.authenticateServicer,  ServicerController.postService);
router.post('/getservices', Middlewares.authenticateServicer, ServicerController.getServices);
router.post('/user/solicitation', Middlewares.authenticateUser, UserController.addServicer);
router.post('/servicer/scheduled', Middlewares.authenticateServicer, ServicerController.postScheduled);
router.post('/user/scheduled', Middlewares.authenticateUser, UserController.postScheduled);

router.put("/servicer/rawweek", Middlewares.authenticateServicer, ServicerController.updateRawWeek);
router.put("/servicer/solicitations", Middlewares.authenticateServicer, ServicerController.putSolicitations);

router.delete("/service", Middlewares.authenticateServicer, ServicerController.deleteService);
router.delete("/user/servicer", Middlewares.authenticateUser, UserController.deleteServicer);
router.delete("/servicer/user", Middlewares.authenticateServicer, ServicerController.deleteClient);
router.delete("/servicer/scheduled", Middlewares.authenticateServicer, ServicerController.deleteScheduled);
router.delete("/user/scheduled", Middlewares.authenticateUser, UserController.deleteScheduled);

module.exports = router;