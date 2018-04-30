const AWS = require('aws-sdk')
const kinesis = new AWS.Kinesis({region: 'us-east-1'})
const Path = require('path')
const fs = require('mz/fs')

// CONFIG
const PROJECT_NAME = process.env.PROJECT_NAME
const FRAME_STREAM_NAME = `${PROJECT_NAME}-us-east-1-frame-stream`

async function getTestImage (filename) {
  if (!filename) {
    throw new Error('Filename is falsy')
  }

  if (!Path.isAbsolute(filename)) {
    filename = Path.resolve(__dirname, filename)
  }

  const data = await fs.readFile(filename, 'base64')
  return Buffer.from(data, 'base64')
}

// this submits a face against your s3 bucket of faces for facial recognition
async function submitImage (imageFileName) {
  try {
    let buffer = await getTestImage(imageFileName)

    const params = {
      Data: buffer,
      PartitionKey: '1', /* required */
      StreamName: FRAME_STREAM_NAME
    }

    const kinesisResponse = await kinesis.putRecord(params).promise() // Abstract away for use in pete's raspicam

    console.log('Success:\n')
    // console.log(JSON.stringify(kinesisResponse, null, 4))
    return kinesisResponse
  } catch (err) {
    console.log('error: ', err)
    return {error: err}
  }
}

exports = module.exports = { submitImage }
