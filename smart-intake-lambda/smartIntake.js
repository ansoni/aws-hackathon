/**
 * Intake SMART data.
 *
 * <p>Called periodically to query the SMART api for recent updates.  Migrates data from raw CSV
 * data to normalized JSON.
 *
 * <ul>
 *   <li>Runtime: nodejs4.3</li>
 *   <li>Handler: smartIntake.intakeMain</li>
 *   <li>Role:  -- describe me --</li>
 *   <li>Description:  Intake SMART data save it to S3.</li>
 *   <li>Memory: 128mb</li>
 *   <li>Timeout: 0min 10sec</li>
 *   <li>VPC, subnets, security groups:  -- describe me --</li>
 * </ul>
 */

exports.intakeMain = function(event, context, callback) {
  console.log("we got here!!");

  callback(null, "Success message!!");
};
