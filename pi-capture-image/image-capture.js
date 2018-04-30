var RaspiCam = require('raspicam')
const awsClient = require('./aws-image-client')

var camera = new RaspiCam({
  mode: 'timelapse',
  w: 1200,
  h: 1200,
  output: './pi-capture-image/photo.jpg',
  q: 100,
  sh: 100,
  t: 0,
  tl: 5000, // take photo ever 5 seconds
  log: () => {} // This disables logging which was excessive from raspicam
})

// listen for the "start" event triggered when the start method has been successfully initiated
camera.on('read', function (err, timestamp, filename) {
  if (err) {
    console.log('read error: ', err)
    return
  }

  console.log(`Captured photo ${filename}`)
  submitImage(filename)
})

async function submitImage (filename) {
  let result = await awsClient.submitImage(filename)
  if (result.error != null) {
    console.log(`Error:\n${result.error}`)
  }
}

// to take a snapshot
async function main () {
  camera.start()
}

main()
