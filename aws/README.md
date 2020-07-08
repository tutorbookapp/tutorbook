# AWS

We use [AWS SES](https://docs.aws.amazon.com/ses/) (Simple Email Service) with
[AWS Lambda](https://docs.aws.amazon.com/lambda) (Amazon's serverless functions
service) and [AWS S3](https://docs.aws.amazon.com/AmazonS3) (Simple Storage
Service) for:

- Transactional emails (e.g. new request notifications).
- Anonymous email relay (see [this
  issue](https://github.com/tutorbookapp/tutorbook/issues/82) for more info).

This directory contains the source code for our AWS Lambda function that is
invoked whenever we receive an email (at `@mail.tutorbook.org`). This function
then forwards that email to it's intended recipient and modifies the sender
address to be anonymous.
