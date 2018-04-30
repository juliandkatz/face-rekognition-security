'use strict'

const AWS = require('aws-sdk')
const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'})
const sqs = new AWS.SQS({apiVersion: '2012-11-05'})
const s3 = new AWS.S3({apiVersion: '2006-03-01'})

// CONFIG
const FACE_COLLECTION_ID = process.env.FACE_COLLECTION_ID
const IMAGES_BUCKET = process.env.IMAGES_BUCKET
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL
const STATES = {
  NO_FACES: 'no-faces',
  ALL_IDENTIFIED: 'all-identified',
  ALL_UNKNOWN: 'all-unknown',
  SOME_UNKNOWN: 'some-unknown'
}

module.exports.main = (event, context, callback) => {
  event.Records.forEach(record => recordHandler(record))
}

async function recordHandler (record) {
  const dataBuffer = Buffer.from(record.kinesis.data, 'base64')

  try {
    const detectFacesResult = await detectFaces(dataBuffer)
    const numFacesFound = detectFacesResult.FaceDetails.length
    if (!numFacesFound === 0) { return }

    const searchFacesByImageResult = await searchFacesByImage(FACE_COLLECTION_ID, dataBuffer)
    const faceMatches = searchFacesByImageResult.FaceMatches

    switch (getState(numFacesFound, faceMatches.length)) {
      case STATES.NO_FACES:
        await sendMessage(JSON.stringify({ message: 'face found -- no match' }))
        break
      case STATES.ALL_IDENTIFIED:
        await sendMessage(JSON.stringify({ message: faceMatches }))
        break
      case STATES.ALL_UNKNOWN:
        await sendToS3(dataBuffer)
        break
      case STATES.SOME_UNKNOWN:
        await Promise.all([
          sendMessage(faceMatches),
          sendToS3(dataBuffer)
        ])
        break
    }
  } catch (err) {
    console.log('top level for each error: ', err)
  }
}

async function sendToS3 (dataBuffer) {
  const currentTime = Date.now().toString()
  const randomNumber = Math.floor(Math.random() * 100000000000).toString()
  const params = {
    Body: dataBuffer,
    Bucket: IMAGES_BUCKET,
    Key: `${currentTime}-${randomNumber}`
  }

  try {
    await s3.putObject(params).promise()
  } catch (err) {
    console.log('s3 putobject error: ', err)
  }
}

function getState (numFacesFound, numFacesRecognized = 0) {
  if (numFacesFound === 0) { return STATES.NO_FACES }

  if (numFacesFound === numFacesRecognized) { return STATES.ALL_IDENTIFIED }

  if (numFacesRecognized === 0) { return STATES.ALL_UNKNOWN }

  return STATES.SOME_UNKNOWN
}

async function sendMessage (message) {
  try {
    const result = await sqs.sendMessage({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: message
    }).promise()
    return result
  } catch (err) {
    console.log('sendMessage error: ', err)
  }
}

async function detectFaces (buffer) {
  const params = {
    Image: {
      Bytes: buffer
    },
    Attributes: ['ALL']
  }

  try {
    const result = await rekognition.detectFaces(params).promise()
    return result
  } catch (err) {
    console.log('detectFaces error: ', err)
  }
}

async function searchFacesByImage (collectionId, buffer) {
  const params = {
    CollectionId: collectionId,
    FaceMatchThreshold: 90,
    Image: {
      Bytes: buffer
    }
  }

  try {
    const result = await rekognition.searchFacesByImage(params).promise()
    return result
  } catch (err) {
    console.log('searchFacesByImage error: ', err)
  }
}
