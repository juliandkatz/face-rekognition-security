# Rekognition Hackathon POC

This is the POC for creating a serverless, distributed, image-analysis pipeline.
It can use either a raspberry-pi or your mac as a camera.
It sends photos to AWS Rekognition by way of Kinesis and Lambda.
Results are sent to an SQS queue, where they can be read from via the AWS SDK (or CLI).

This `README` will take you through how to set up an AWS account, your raspberry pi, and your local environment.

We will be using **personal AWS accounts**, as these come with [AWS Free Tier](https://aws.amazon.com/free/).
This will cover 5000 image-analysis calls to rekognition per month.

We advise you delete these accounts when the hackathon ends.   

- [Install Dependencies](#install-dependencies)
- [Connect and Setup Your Raspberry Pi](#connect-and-setup-your-raspberry-pi)
- [Set Up Your AWS Environment](#set-up-your-aws-environment)
- [Deploy The Serverless Application](#deploy-the-serverless-application)
- [Start Taking Photos on the Pi](#start-taking-photos-on-the-pi)
- [Poll the SQS Queue for Results](#poll-the-sqs-queue-for-results)

![pic](https://media3.giphy.com/media/3aGZA6WLI9Jde/giphy.gif)

---

### Install Dependencies

The serverless component of this project expects `Node v8.10.0`.  It may run on other versions as well, but has not been tested.

If you are new to `Node`, I highly suggest you install it via [nvm](https://github.com/creationix/nvm). This greatly simplifies switching between versions and managing global dependencies, which we will use via the CLI.

If you use/install `nvm`, just run:
```
nvm install
```

[Serverless](https://github.com/serverless/serverless) will be used via the command line, so it must be installed globally:
```
npm install -g serverless
```

Early versions of `serverless` may not support the full feature set.  Make sure you end up somewhere around:
```
$ serverless -v
1.26.1
```

Install other dependencies:
```
npm install
make web-cam-install  // For mac version only.  Not needed on pi.
```

---

### Connect and Setup Your Raspberry Pi

Connect to your raspberry pi to computer using micro usb.  This will allow you to connect via SSH:
```
ssh pi@raspberrypi.local
password: raspberry
```

The pi can't connect to our usual Wifi network, as the pi only supports 2.4 GHz networks (facepalm).
You'll have to set up a hotspot for the pi.  We recommend using your mac for this.

Follow these [directions on setting up a hotspot](https://www.howtogeek.com/214053/how-to-turn-your-mac-into-a-wi-fi-hotspot/).

__Make sure not to include any spaces in your wifi network name!!__  
- Pete saw problems with this on the pi.
- Something like `my-nice-wifi-network` is great.   
- Watch for name collisions.

Once you've got that setup, add the `ssid` and `password` to the pi:
```
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
sudo reboot
```
Verify wifi is working after restart.
```
iwconfig
```

Once you've got that working, it's time to get things going in AWS.

![pic](https://media1.giphy.com/media/v0MO5isRawUJW/giphy.gif)

---

### Set Up Your AWS Environment

1. Create an AWS account and sign in ([http://aws.amazon.com](http://aws.amazon.com/))

1. Create an IAM user
    * Use your AWS account email address and password to sign in as the  [_AWS account root user_](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html) to the IAM console at  [https://console.aws.amazon.com/iam/](https://console.aws.amazon.com/iam/).
    * In the navigation pane, choose  **Users**  and then choose  **Add user**.
    * For  **User name** , type a user name, such as  **Administrator**. The name can consist of letters, digits, and the following characters: plus (+), equal (=), comma (,), period (.), at (@), underscore (\_), and hyphen (-). The name is not case sensitive and can be a maximum of 64 characters in length.
    * Select the check box next to  **AWS Management Console access** , select  **Custom password** , and then type your new password in the text box. If you&#39;re creating the user for someone other than yourself, you can optionally select  **Require password reset**  to force the user to create a new password when first signing in.
    * Choose  **Next: Permissions**.
    * On the  **Set permissions for user**  page, choose  **Add user to group**.
    * Choose  **Create group**.
    * In the  **Create group**  dialog box, type the name for the new group. The name can consist of letters, digits, and the following characters: plus (+), equal (=), comma (,), period (.), at (@), underscore (\_), and hyphen (-). The name is not case sensitive and can be a maximum of 128 characters in length.
    * In the policy list, select the check box next to  **AdministratorAccess**. Then choose  **Create group**.
    * Back in the list of groups, select the check box for your new group. Choose  **Refresh**  if necessary to see the group in the list.
    * Choose  **Next: Review**  to see the list of group memberships to be added to the new user. When you are ready to proceed, choose  **Create user**.

1. Navigate to the User section and click on the newly created AWS User.
    * Select the Security Credentials tab
    * Click Create access key
    * Insert these credentials on your local box and on the raspberry pi...

1. Insert credentials on your local box
    * Open `~/.aws/credentials`.  Create the folder and the file if they do not exist.
    * Paste in your credentials.  Set a profile name like `hack`.  

    ```
    [hack]
    region = us-east-1
    aws_access_key_id = LookIAmAnAccessKeyId
    aws_secret_access_key = LookIAmASecretAccessKey
    ```
    **Make sure to add the region**: `us-east-1`

1. Insert credentials on the raspberry pi
    * Open `~/.aws/credentials`.  Create the folder and the file if they do not exist.
    * Add the same credentials.  Again, you will need the region.  

    ```
    [default]
    region = us-east-1
    aws_access_key_id = LookIAmAnAccessKeyId
    aws_secret_access_key = LookIAmASecretAccessKey
    ```
    **Important:** Set the profile name to `default`.  That way the AWS SDK on the pi will choose these credentials by default.

**You're getting close.  Stay in the game.**

![pic](https://media1.giphy.com/media/HjPbLbmep2aJO/giphy.gif)

---

### Deploy The Serverless Application

To deploy the serverless stack, make sure your `AWS_PROFILE` is set to whatever you set it as in your `~/.aws/credentials` file.
```
export AWS_PROFILE='hack'
```

From this project's root, run:
```
make deploy-serverless
```

To configure the function, look in `video-analyzer/serverless.yml` and see the three boolean
environment variables.  Toggle them `True or False` and redeploy.  This will restrict the results
and make your function run faster.

---

### Start Taking Photos on the Pi

SSH into your pi.  Navigate to the `~/rekognition` directory.  Run:
```
make take-photos
```

---

### Poll the SQS Queue for Results

In another shell, run:

```
export AWS_PROFILE='hack'
make poll-queue
```

You should see responses coming in after a few seconds of waiting.  Try spitting out the entire response to json and then looking it over in a JSON formatter.

Also, you can see the results in the SQS console if you'd like.  
[Directions for that here](https://aws.amazon.com/blogs/aws/aws-management-console-now-supports-the-simple-queue-service-sqs/).

![pic](https://media0.giphy.com/media/vmv47p4zksWDC/giphy.gif)

Congrats!  You've got the POC up and running.


---

### Extra -- Upload a Face Collection

Add photos to the `face-collection/index-images/` directory.  They need unique names.  See how they're done right now.
This is useful in recognizing a person.

Run:
```
make upload-faces
``` 

This will upload the faces to rekognition as a collection, which is rekognition's preferred method of performing facial recognition.
