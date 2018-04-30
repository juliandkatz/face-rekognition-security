#!/bin/bash

COLLECTION_ID="${PROJECT_NAME}-face-matches"

## Grab the reference images bucket
BUCKET_POSTFIX="${PROJECT_NAME}-us-east-1-reference-images"

if (( $(aws s3 ls | grep $BUCKET_POSTFIX | wc -l) > 1 )); then
  printf "ERROR: multiple buckets found with the postfix '%s'.\n" $BUCKET_POSTFIX
  exit 1
fi

bucket_name=$(aws s3 ls | grep $BUCKET_POSTFIX | cut -d ' ' -f 3)

# Upload everything in the images directory to the bucket
aws s3 sync "./face-collection/index-images/" "s3://${bucket_name}"

# Delete the collection if it exists and create it anew (Don't need the delete first time running this
aws rekognition delete-collection --collection-id "${COLLECTION_ID}" || True
aws rekognition create-collection --collection-id "${COLLECTION_ID}"

# Index faces in these images for rekognition
aws s3 ls "s3://${bucket_name}" | while read filename
do
  short_filename="$(echo $filename | awk '{print $4}')"
  person_name="$(echo $short_filename | cut -f 1 -d '.')"
  aws rekognition index-faces \
    --collection-id "${COLLECTION_ID}" \
    --image "S3Object={Bucket=${bucket_name},Name=${short_filename}}" \
    --external-image-id "${person_name}"
done
