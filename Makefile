PROJECT_NAME = 'julian-hackathon-project'  # MAKE SURE TO PIC SOMETHING UNIQUE

### Local web cam

web-cam-install:
	brew install ffmpeg

web-cam:
	env PROJECT_NAME=${PROJECT_NAME} node mac-capture-image/index.js

### raspberry-pi

push-to-pi:
	sudo scp -r . pi@raspberrypi.local:/home/pi/rekognition

take-photos:
	env PROJECT_NAME=${PROJECT_NAME} node pi-capture-image/image-capture.js

### Serverless

deploy-serverless:
	cd ./video-analyzer; env PROJECT_NAME=${PROJECT_NAME} serverless deploy

undeploy-serverless:
	cd ./video-analyzer; env PROJECT_NAME=${PROJECT_NAME} serverless remove

### Face collection

upload-faces:
	env PROJECT_NAME=${PROJECT_NAME} ./face-collection/upload-and-index.sh

### Poll the SQS Queue

poll-queue:
	env PROJECT_NAME=${PROJECT_NAME} node ./sqs-poller/index.js

### Utilities

phony:
	@sed -ne '/#/!s/:$$/ \\/p' Makefile | sed -e '$$s/ \\//'

.PHONY: \
	phony
