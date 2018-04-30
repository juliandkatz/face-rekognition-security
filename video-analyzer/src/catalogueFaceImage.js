'use strict'

module.exports.main = (event, context, callback) => {
  console.log('EVENT: ', JSON.stringify(event))
  console.log('context: ', JSON.stringify(context))

  event.Records.forEach(async record => { recordHandler(record) })
}

function recordHandler (record) {
  const objectKey = record.s3.object.key
}
