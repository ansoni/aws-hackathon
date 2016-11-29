var smartIntake = require("./smartIntake");

return new Promise(function(resolve, reject) {
  smartIntake.intakeMain("", null, function(error, success) {
    if(!error) {
      resolve(success);
    }
    else {
      reject(error);
    }
  });
});
