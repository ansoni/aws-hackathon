#!/usr/bin/env bash

# deploy updates to smart-intake-lambda, assumes you have already done a full, initial deployment
# of this lambda function to AWS.  See smartIntake.js for details.
#
# invoke this script as AWS_DEFAULT_PROFILE=«profile_name» ./deploy.sh
#
#   where profile_name is defined in your ~/.aws/credentials file

rm smart-intake.zip
zip smart-intake.zip package.json smartIntake.js

aws lambda update-function-code \
--region us-west-2 \
--function-name smartIntake \
--zip-file fileb://./smart-intake.zip
