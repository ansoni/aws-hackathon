var _ = require("lodash"),
  moment = require("moment"),
  AWS = require("aws-sdk"),

  callSmart = require('./callSmart'),

  S3_BUCKET_NAME = "myBucket";

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
          var s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            params: {Bucket: S3_BUCKET_NAME}
          });

          var resultsByType = _.map(allResults, function(aResult, index) {
            return {
              type: queriesWeWant[index].name.replace(/ /g, "_"),
              resultSet: aResult.parsedJson  // this is a json array of records
            }
          });

          // sanitize the data and make a row per result
          var resultsByRow = _.flatMap(resultsByType, function(byType) {
            // denormalize, store the record type with the parsed json from the resultSet
            return _.map(byType.resultSet, function(parsedJson) {
              return {
                type: byType.type,
                result: _.transform(parsedJson, function(output, value, key) {
                  output[key.replace(/ /g, "_").toLowerCase()] = value;
                }, {})
              };
            });
          });

          // put each record that we read from SMART to S3 as its own file under a random UUID
          var putPromises = _.map(resultsByRow,
            function(row) {
              console.log(row);

              return new Promise(function(resolve, reject) {
                resolve();
              });

              // return new Promise(function(resolve, reject) {
              //   s3.putObject({
              //     Bucket: S3_BUCKET_NAME,
              //     Key:
              //   }, function(err, data) {
              //     if(!err) {
              //       resolve();
              //     }
              //     else {
              //       reject(err);
              //     }
              //   });
              // });
            });

          Promise.all(putPromises, function() {
            callback(null, "Success!!");
          },
          function(error) {
            callback(error);
          });
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
