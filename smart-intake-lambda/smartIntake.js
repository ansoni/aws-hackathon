var _ = require("lodash"),
  moment = require("moment"),
  AWS = require("aws-sdk"),

  callSmart = require('./callSmart');

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
  var userName = "hackathon";
  var password = "a1SL!HV0";
  var startDate = moment("2012-01-01", "YYYY-MM-DD").toDate();
  var endDate = Date.now();

  callSmart.retrieveAllQueriesPossible(userName, password).then(
    function(allQueryTypes) {
      var queriesWeWant = _.filter(allQueryTypes.allQueries, function(queryDescriptor) {
        return queryDescriptor.name === "Wildlife" || queryDescriptor.name === "All Observations";
      });

      var descriptorPromises = _.map(queriesWeWant, function(queryDescriptor) {
        return callSmart.retrieveQueryDateRange(queryDescriptor.uuid, userName, password, startDate, endDate);
      });

      Promise.all(descriptorPromises).then(
        function(allResults) {
          _.forEach(allResults,
            /**
             * @param {QueryResults} queryResult
             * @param {number} index which descriptor from queriesWeWant the result belongs to
             */
            function(queryResult, index) {
              console.log("for query name: " + queriesWeWant[index].name);
              console.log(queryResult.parsedJson);
              //
              // var params = {Bucket: 'myBucket', Key: 'myKey', Body: 'Hello!'};
              //
              // s3.putObject(params, function(err, data) {
            });

          callback(null, "Success!!");
        },
        function(error) {
          callback(error);
        }
      );
    },
    function(error) {
      callback(error);
    }
  );

};
