const AWS = require('aws-sdk')
const path = require('path');
const child_process = require('child_process');
const fs = require('fs');

exports.handler = async (event, context, callback) => {
	
	callback();
    	
	const bucket = event['Records'][0].s3.bucket.name;
    	const key = event['Records'][0].s3.object.key;

    	const outputPath = 'output/' + path.basename(key,'.mp4') + '.mp4';
	console.log("OUTPUT PATH :", outputPath);
	
	const params = {
    		Bucket: bucket,
    		Key: key
  	};

	const s3 = new AWS.S3()
	const inputPath = '/tmp/axinput.mp4'
  	
	s3.getObject(params, (err, data) => {
    		if (err) {
			console.error(err);
			throw err;
		} else {
			fs.writeFileSync(inputPath, data.Body);
    			console.log(`${inputPath} has been created!`);
	
			const ffmpeg = path.resolve(__dirname, 'exodus', 'bin', 'ffmpeg');
    			
			const ffmpegArgs = [
				"-y",
				"-i", inputPath,
				"-b:v", "1M",
				"-vf", "scale='if(gt(iw,ih),960,540)':'if(gt(iw,ih),540,960)'",
      				"/tmp/axoutput.mp4",
    			];

			/*const ffmpegArgs = [
      				"-i", inputPath,
      				"-vn", // Disable the video stream in the output.
      				"-acodec", "libmp3lame", // Use Lame for the mp3 encoding.
      				"-ac", "2", // Set 2 audio channels.
      				"-q:a", "6", // Set the quality to be roughly 128 kb/s.
      				"/tmp/axoutput.mp3",
    			];*/

			console.log(ffmpegArgs);

    			const process = child_process.spawnSync(ffmpeg, ffmpegArgs);
			const ret = process.stdout.toString() + process.stderr.toString();
    			console.log("FFMpeg: ", ret);

			const fileContent = fs.readFileSync('/tmp/axoutput.mp4');

    			const params = {
        			Bucket: bucket,
        			Key: outputPath,
        			Body: fileContent
    			};

    			s3.upload(params, function(err, data) {
        			if (err) {
            				throw err;
        			}
        			console.log(`File uploaded successfully. ${data.Location}`);
    			});
	  	}
	});

    	const response = {
        	statusCode: 200,
        	body: JSON.stringify("Conversion completed"),
    	};

    	return response;
};

