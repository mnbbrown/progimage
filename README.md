## progimage

Image conversion microservice

### Deploying

To deploy you need docker installed.

1. Build deployment docker container (this handles support for native modules): `sh deploy/build_docker.sh`
2. Deploy functions: `sh deploy/deploy.sh`


### Testing (and coverage)

1. Install deps: `npm i`
2. Run tests: `npm test`

### Areas for improvement

1. Caching conversion results
2. An alternative on the fly approach using redirects (https://dev.to/adnanrahic/a-crash-course-on-serverless-with-aws---image-resize-on-the-fly-with-lambda-and-s3-4foo)
3. Figure out a way to return a stream in AWS lambda to cut down on memory usage.

### Known issues

1. Image size cannot exceed 10MB due to AWS lambda constraints
