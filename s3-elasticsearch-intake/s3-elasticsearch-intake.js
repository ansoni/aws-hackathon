/*
 * Adapted from https://github.com/awslabs/amazon-elasticsearch-lambda-samples
 *
 * Original License:
 *
 * Sample node.js code for AWS Lambda to get Apache log files from S3, parse
 * and add them to an Amazon Elasticsearch Service domain.
 *
 *
 * Copyright 2015- Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at http://aws.amazon.com/asl/
 * or in the "license" file accompanying this file.  This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * express or implied.  See the License for the specific language governing
 * permissions and limitations under the License.
 */

/* Imports */
var AWS = require('aws-sdk');
var path = require('path');
var stream = require('stream');

/* Globals */
var esDomain = {
    endpoint: 'search-hackath-elasti-1x0r8ruwudbcv-gj3rfiq7j3kh6phwt2tjudp4v4.us-west-2.es.amazonaws.com',
    region: 'us-west-2',
    doctype: 'smart'
};
var endpoint =  new AWS.Endpoint(esDomain.endpoint);
var s3 = new AWS.S3();

var creds = new AWS.EnvironmentCredentials('AWS');

function postDocumentToES(doc, index, context) {

    console.log("Write Doc: " + doc)
    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = path.join('/', index, esDomain.doctype);
    req.region = esDomain.region;
    req.body = doc;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;

    console.log("Sign ES Request")
    var signer = new AWS.Signers.V4(req, 'es');
    signer.addAuthorization(creds, new Date());

    console.log("Signed ES Request")

    // Post document to ES
    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var body = '';
        httpResp.on('data', function (chunk) {
            body += chunk;
        });
        httpResp.on('end', function (chunk) {
            context.succeed();
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail();
    });
}

exports.handler = function(event, context) {
    console.log('Received event: ', JSON.stringify(event, null, 2));
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcObject = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    var index = srcObject.split('-')[0]
    
    s3.getObject({ Bucket: srcBucket, Key: srcObject }, function(err, data) {
      if (err) {
        console.log(err, err.stack); 
      } else {
        postDocumentToES(data.Body, index, context);
     }
   })
    
}
