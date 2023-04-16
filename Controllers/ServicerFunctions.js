class ServicerFunctions {
    calcSchedule = async (init, end) => {
        var newInit = init.split(":"); 
        var init1 = parseInt(newInit[0]);
        var init2 = parseInt(newInit[1]);
        var newEnd = end.split(":");
        var end1 = parseInt(newEnd[0]);
        var end2 = parseInt(newEnd[1]);
    
        var available = []
        var minutesInit =(init1 * 60) + init2;
        var minutesEnd = (end1 * 60) + end2;
        
        var i = minutesInit;
    
        for(i = i +0; i < minutesEnd; i = i + 15){
            console.log(i);
            available.push({
                minutes: i,
                available: 'yes'
            });
        };
        
        return available;
    }   
}

module.exports = new ServicerFunctions();