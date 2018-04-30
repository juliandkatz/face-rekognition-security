const Path = require('path')
const exec = require('mz/child_process').exec
const fs = require('mz/fs')

// If the command isn't working, try switching to the other one.  Top one works on my laptop,
// lower one works on monitors at work
const baseCommand = 'ffmpeg -y -f avfoundation -video_size 1280x720 -framerate 30 -i "0" -vframes 1 '
// const baseCommand = 'ffmpeg -y -f avfoundation -video_size 1280x720 -i "0" -vframes 1 '

exports = module.exports = takeSnapshot

// returns a buffer

async function takeSnapshot (filename) {
  if (!filename) {
    throw new Error('Filename is falsy')
  }

  if (!Path.isAbsolute(filename)) {
    filename = Path.resolve(__dirname, filename)
  }

  await exec(baseCommand + filename)
  const data = await fs.readFile(filename, 'base64')
  return Buffer.from(data, 'base64')
}
