import { Disk } from 'flydrive'
import { S3Driver } from 'flydrive/drivers/s3'

const disk = new Disk(
    new S3Driver({
        credentials: {
            accessKeyId: process.env.S3_AWS_KEY,
            secretAccessKey: process.env.S3_AWS_PRIVATE_KEY
        },
        region: 'eu-central-1',
        bucket: process.env.S3_AWS_BUCKET,
        visibility: 'private'
    })
)

export default disk
