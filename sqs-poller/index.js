const AWS = require('aws-sdk')
const sqs = new AWS.SQS({
  apiVersion: '2012-11-05',
  region: 'us-east-1'
})

const PROJECT_NAME = process.env.PROJECT_NAME
const QUEUE_NAME = `${PROJECT_NAME}-us-east-1-results-queue`
const POLLS_PER_SECOND = 8

async function getQueueUrlByName (queueName) {
  try {
    const result = await sqs.listQueues({ QueueNamePrefix: queueName }).promise()

    if (!result.QueueUrls) {
      throw new Error(`No queues found with QueueNamePrefix === '${queueName}'`)
    }

    if (result.QueueUrls.length > 1) {
      throw new Error(`Multiple queues found with QueueNamePrefix === '${queueName}'`)
    }

    return result.QueueUrls[0]
  } catch (err) {
    console.log('listQueues', err)
  }
}

async function poll (queueUrl) {
  try {
    const result = await sqs.receiveMessage({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10
    }).promise()

    if (!result.Messages) {
      return
    }

    console.log(result.Messages.length, ' messages')

    result.Messages.forEach(async message => {
      console.log(message.Body)

      await sqs.deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle
      }).promise()
    })
    console.log()
  } catch (err) {
    console.log('ERROR: ', err)
  }
}

(async function () {
  const queueUrl = await getQueueUrlByName(QUEUE_NAME)
  const rate = Math.ceil(1000 / POLLS_PER_SECOND)
  setInterval(poll.bind(null, queueUrl), rate)
})()
