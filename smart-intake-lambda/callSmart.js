var request = require("request"),
  moment = require("moment"),
  https = require("https"),
  fs = require("fs"),
  csvtojson = require("csvtojson");

// enable ssl
require("ssl-root-cas").inject();

/**
 * @typedef { { uuid: string, caUuid: string, name: string, type: string, typeKey: string, id: string, isShared: (boolean|null), isCcaa: boolean, conservationArea: string } } QueryDescriptor
 */

/**
 * @typedef { { allQueries: Array.<QueryDescriptor>, httpHeaders: object } } AllQueries
 */

/**
 * Get listing of all datasets that can be queried possible.  Use the UUID's retrieved to make specific data
 * queries.
 *
 * @param {string} userName
 * @param {string} password
 * @returns {Promise} resolves to {@link AllQueries}, rejects to {@link String} error reason
 */
function retrieveAllQueriesPossible(userName, password) {
  return new Promise(function(resolve, reject) {
    var options = {
      method: "GET",
      hostname: 'hackathon1.smartconservationtools.org',
      port: 8443,
      path: "/server/api/query/",
      auth: userName + ":" + password,
      agent: false,
      rejectUnauthorized: false
    };

    var req = https.request(options, function(httpResponse) {
      var allChunks = [];

      httpResponse.on("data", function(chunk) {
        allChunks.push(chunk);
      });

      httpResponse.on("end", function() {
        if(httpResponse.statusCode !== 200) {
          reject("Did not get expected 200 status code: " + httpResponse.statusCode + "\n" + response);
        }
        else {
          resolve({
            allQueries: JSON.parse(allChunks.join("")),
            httpHeaders: httpResponse.headers
          });
        }
      });
    });

    req.end();

    req.on("error", function(error) {
      reject("Connection error:  " + error);
    });
  });
}

/**
 * @typedef { { forUuid: string, rawData: string, parsedJson: string, httpHeaders: object } } QueryResults
 */

/**
 * Given a query UUID, retrieve raw CSV data over a date range.
 *
 * @param {string} queryUuid uuid of dataset to be queried
 * @param {string} userName
 * @param {string} password
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise} resolves to {@link QueryResults} containing raw CSV data, rejects to {@link String} error reason
 */
function retrieveQueryDateRange(queryUuid, userName, password, startDate, endDate) {
  return new Promise(function(resolve, reject) {
    var startDateStr = encodeURI(moment(startDate).format("YYYY-M-D HH:mm:ss"));
    var endDateStr = encodeURI(moment(endDate).format("YYYY-M-D HH:mm:ss"));

    var options = {
      method: "GET",
      hostname: 'hackathon1.smartconservationtools.org',
      port: 8443,
      path: "/server/api/query/" + queryUuid + "?format=csv&date_filter=waypointdate&start_date=" + startDateStr + "&end_date=" + endDateStr,
      auth: userName + ":" + password,
      agent: false,
      rejectUnauthorized: false
    };

    var req = https.request(options, function(httpResponse) {
      var allLines = [];

      httpResponse.on("data", function(chunk) {
        allLines.push(chunk);
      });

      httpResponse.on("end", function() {
        if(httpResponse.statusCode !== 200) {
          reject("Did not get expected 200 status code: " + httpResponse.statusCode + "\n" + response);
        }
        else {
          var Converter = require("csvtojson").Converter;
          var converter = new Converter({
            toArrayString: true
          });
          var rawCsv = allLines.join("");

          converter.fromString(rawCsv, function(err, result) {
            if(!err) {
              resolve({
                forUuid: queryUuid,
                rawData: rawCsv,
                parsedJson: result,
                httpHeaders: httpResponse.headers
              });
            }
            else {
              reject(err);
            }
          });
        }
      })
    });

    req.end();

    req.on("error", function(error) {
      reject("Connection error:  " + error);
    });
  });
}

module.exports = {
  retrieveAllQueriesPossible: retrieveAllQueriesPossible,
  retrieveQueryDateRange: retrieveQueryDateRange
};