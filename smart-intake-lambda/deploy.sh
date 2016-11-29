#!/usr/bin/env bash

# Deploys updates to smart-intake-lambda, assumes you have already done a full, initial deployment
# of the "smartIntake" lambda function to AWS.  See smartIntake.js for details.
#
# Invoke this script as AWS_DEFAULT_PROFILE=«profile_name» ./deploy.sh
#
#   where profile_name is defined in your ~/.aws/credentials file

rm smart-intake.zip
zip smart-intake.zip package.json smartIntake.js callSmart.js

aws lambda update-function-code \
--region us-west-2 \
--function-name smartIntake \
--zip-file fileb://./smart-intake.zip
