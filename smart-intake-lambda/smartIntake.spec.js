var expect = require("chai").expect,
  callSmart = require("./callSmart");

describe("SMART api retrieveAllQueriesPossible", function() {
  it("will succeed if good credentials are passed to retrieveAllQueriesPossible", function(done) {
    this.timeout(10000);

    callSmart.retrieveAllQueriesPossible("hackathon", "a1SL!HV0").then(
      function(body) {
        expect(body.allQueries.length).to.be.greaterThan(0);

        done();
      },
      function(errorReason) {
        done("Did not expect " + errorReason);
      }
    );
  });
});

describe("SMART api retrieveQueryDateRange", function() {
  it("will succeed if good credentials are passed to retrieveQueryDateRange", function(done) {
    this.timeout(300000);

    callSmart.retrieveAllQueriesPossible("hackathon", "a1SL!HV0").then(
      function(allQueries) {
        console.log("will query " + allQueries.allQueries[0].uuid);
        callSmart.retrieveQueryDateRange(allQueries.allQueries[0].uuid, "hackathon", "a1SL!HV0", Date.now() - 1000000000000, Date.now()).then(
          function(body) {
            console.log(JSON.stringify(body.parsedJson, null, " "));

            expect(body.rawData.length).greaterThan(0);

            done();
          },
          function(errorReason) {
            done("Did not expect " + errorReason);
          }
        );

      }
    );

  });
});