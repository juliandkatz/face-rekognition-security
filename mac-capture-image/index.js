const AWS = require('aws-sdk')
const kinesis = new AWS.Kinesis({ region: 'us-east-1' })
const Path = require('path')
const fs = require('mz/fs')
const snapshot = require('./snapshot')

// For personalized stacks
const PROJECT_NAME = process.env.PROJECT_NAME
const FRAME_STREAM_NAME = `${PROJECT_NAME}-us-east-1-frame-stream`

// CONFIG
const FRAMES_PER_SECOND = 1
const SNAPSHOT_OVERWRITE = true
const TESTING = false

function getSnapshotName () {
  const postfix = SNAPSHOT_OVERWRITE ? '' : '-' + (new Date()).getTime().toString()
  return `output/snapshot${postfix}.jpg`
}

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

async function main () {
  try {
    let buffer
    if (!TESTING) {
      const snapshotName = getSnapshotName()
      buffer = await snapshot(snapshotName)
    } else {
      buffer = await getTestImage('test-pics/pete-test.jpg')
    }

    console.log('Snapshot Successful!')

    const params = {
      Data: buffer,
      PartitionKey: '1', /* required */
      StreamName: FRAME_STREAM_NAME
    }

    const kinesisResponse = await kinesis.putRecord(params).promise() // Abstract away for use in pete's raspicam

    console.log('kinesis upload successful: ', kinesisResponse)
  } catch (err) {
    console.log('error: ', err)
  }
}

setInterval(main, Math.ceil(1000 / FRAMES_PER_SECOND))
