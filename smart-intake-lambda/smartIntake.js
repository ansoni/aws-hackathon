var _ = require("lodash"),
  moment = require("moment"),
  AWS = require("aws-sdk"),
  UUID = require("uuid"),

  callSmart = require('./callSmart'),

  S3_BUCKET_NAME = "hackwcs-team37-test";

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
        return queryDescriptor.name === "Wildlife" ||
          queryDescriptor.name === "All Observations" ||
          queryDescriptor.name === "Weapons and Gear Seized " ||
          queryDescriptor.name === "People Direct Observation";
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
              type: queriesWeWant[index].name.replace(/ /g, "_").toLowerCase().trim(),
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

          function putRow(row) {
            return new Promise(function(resolve, reject) {
              var fileKey = row.type + "-" + UUID.v4();
              console.log("  Putting " + fileKey + " object to S3");

              s3.putObject({
                Bucket: S3_BUCKET_NAME,
                Key: fileKey,
                Body: JSON.stringify(row.result, null, ""),
                ContentType: "application/json"
              }, function(err, data) {
                if(!err) {
                  console.log("    - put successful");
                  resolve();
                }
                else {
                  console.log(err);
                  reject(err);
                }
              });
            });
          }

          var completedPromise = new Promise(function(resolve, reject) {
            // put each record that we read from SMART to S3 as its own file under a random UUID
            function putRows(rows) {
              // if there are no more rows, resolve and return the completedPromise immediately
              if(!rows.length) {
                resolve();
                return;
              }

              // put the 0th row, wait for it to finish
              putRow(rows[0]).then(function() {
                rows.shift();
                putRows(rows);
              },
              function(error) {
                reject(error);
              });
            }

            console.log("Putting " + resultsByRow.length + " rows to S3");

            putRows(resultsByRow);
          });

          completedPromise.then(function() {
            callback(null, "success!!");
          }, function(error) {
            console.log("An error occurred: " + error);
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
