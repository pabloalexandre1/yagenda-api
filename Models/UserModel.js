const mongoose = require("mongoose");
const userModel = require("../database/user");

const User = mongoose.model("User", userModel);


class Users {
    create(name, email, password){
        try{
            var user = new User({
                name,
                email,
                password,
                valid: 'no',
                services: [],
                scheduled_services: [
                    
                ],
                recoverpass: ''
            });
    
            user.save();
            return true;
        }catch(err){
            console.log(err);
            return false;
        }
        
        
    }

    async findByEmail(email){
        
        
            var user = await User.find({email: email});
            
            return user
            
    }
    
    async confirmEmail(id){
        try{
            var user = await User.findById(id);
            if(user){
                await User.findOneAndUpdate({email: user.email}, {valid: 'yes'});
                return 'success';
            };
            
        }catch(err){
            return 'invalid';
        }
        
        
    }

    async addServicer(email, servicers){
        try{
            var a = await User.updateOne(
                {email: email},
                {$set: {'services': servicers}});
                return 'success';
        }catch(err){
            return err
        }
       
    }

    async addScheduled(email, newScheduleds){
        try{
            var a = await User.updateOne(
                {email: email},
                {$set: {'scheduled_services': newScheduleds}});
                return 'success';
        }catch(err){
            return err
        }
    }

    async defineRecoverPass(email, recoverpass){
        try{
            var a = await User.updateOne(
                {email: email},
                {$set: {'recoverpass': recoverpass}});
                return 'success';
        }catch(err){
            return err
        }
    }

    async updatePassword(email, hash, newRecover){
        try{
            var a = await User.updateOne(
                {email: email},
                {$set: {'password': hash}});
                
        }catch(err){
            return err
        }
        try{
            var a = await User.updateOne(
                {email: email},
                {$set: {'recoverpass': newRecover}});
                return 'success';
        }catch(err){
            return err
        }
    }
    
}

module.exports = new Users();