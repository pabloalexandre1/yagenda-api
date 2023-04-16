const mongoose = require("mongoose");
const servicerModel = require("../database/servicer");

const Servicer = mongoose.model("Servicer", servicerModel);


class Servicers {
    create(name, name_business, email, password, address){
        try{
            var servicer = new Servicer({
                name,
                name_business,
                email,
                password,
                address,
                valid: 'no',
                sessionid: '',
                rawWeek: [],
                scheduled_services: []
            });
    
            servicer.save();
            return true;
        }catch(err){
            console.log(err);
            return false;
        }
        
        
    }

    async findByEmail(email){
        
        
            var user = await Servicer.find({email: email});
            
            return user
            
    }
    
    async confirmEmail(id){
        try{
            var user = await Servicer.findById(id);
            if(user){
                await Servicer.findOneAndUpdate({email: user.email}, {valid: 'yes'});
                return 'success';
            };
            
        }catch(err){
            return 'invalid';
        }
        
        
    }

    async postService(email, service) {
        var a = await Servicer.updateOne({email: email}, {$push: {services: service}})
        return a
    }

    async deleteService(userId, serviceId){
         try{
            var a = await Servicer.updateOne(
                {_id: userId},
                {$pull: {'services': {_id: serviceId}}});
                return "success"
         }catch(err){
            return err
         }
    }

    async updateRawWeek(email, rawWeek){
        try{
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'rawWeek': rawWeek}});
                return "success"
         }catch(err){
            return err
         }
    }

    async updateSolicitation(email, clients){
        try{
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'clients': clients}});
                return "success"
         }catch(err){
            console.log(err);
            return err
         }
    }

    async addClient(newClients, email, userEmail){
        var l = 0;
        for(var i = 0; i < newClients.length; i++){
            
            if(newClients[i].email == userEmail){
                l++;
                
            }
        }
        //solicitation will only be added if there is not repeated
        if(l > 1){
            return 'success'
        }else{
            try{
                
                
                var a = await Servicer.updateOne(
                    {email: email},
                    {$set: {'clients': newClients}});
                    return "success"
             }catch(err){
                console.log(err);
                return err
             }
        }
        
    }

    async setSchedule(email, newSchedule) {
        try{        
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'schedule': newSchedule}});
                return "success"
         }catch(err){
            console.log(err);
            return err
         }
    }

    async postScheduled(email, scheduled) {
        try{        
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'scheduled_services': scheduled}});
                return "success"
         }catch(err){
            console.log(err);
            return err
         }
    }

    async defineRecoverPass(email, recoverpass){
        try{
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'recoverpass': recoverpass}});
                return 'success';
        }catch(err){
            return err
        }
    }

    async updatePassword(email, hash, newRecover){
        try{
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'password': hash}});
                
        }catch(err){
            return err
        }
        try{
            var a = await Servicer.updateOne(
                {email: email},
                {$set: {'recoverpass': newRecover}});
                return 'success';
        }catch(err){
            return err
        }
    }    
}
module.exports = new Servicers();