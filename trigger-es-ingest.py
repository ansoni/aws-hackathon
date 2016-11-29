import boto3
import uuid
import os

bucket='hackwcs-team37-json'

s3_client = boto3.client('s3')

json="""{
  "eventtype": "wildlife",
  "name" : "Donald John Trump",
  "affiliation" : "Republican",
  "age" : "69",
  "occupation" : "businessman",
  "twitter" : "https://twitter.com/realDonaldTrump",
  "website" : "http://www.donaldjtrump.com",
  "@timestamp" : "2016-11-28T21:55:19Z"
}"""

object_name = "wildlife-" + str(uuid.uuid4()) + ".json"
open('temp.json', 'w').write(json)

# Upload the file to S3
response = s3_client.upload_file('temp.json', bucket, object_name)

os.remove("temp.json")
print response



# Download the file from S3
#s3_client.download_file('MyBucket', 'hello-remote.txt', 'hello2.txt')
#print(open('hello2.txt').read())