import S3 from '../s3Client';
import s3UploadDirectory from '../utils/s3UploadDirectory';
import commentOnPr from '../utils/commentOnPr';
import validateEnvVars from '../utils/validateEnvVars';
import checkBucketExists from '../utils/checkBucketExists';

export const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'GITHUB_TOKEN'
];

export default async (bucketName: string, uploadDirectory: string) => {
  console.log('PR Updated');
  console.log('TEEEEST')

  validateEnvVars(requiredEnvVars);

  const bucketExists = await checkBucketExists(bucketName);

  if (!bucketExists) {
    console.log('S3 bucket does not exist. Creating...');
    await S3.createBucket({ Bucket: bucketName }).promise();

    console.log('Configuring bucket website...');
    await S3.putBucketWebsite({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: 'index.html' }
      }
    }).promise();

  } else {
    console.log('S3 Bucket already exists. Skipping creation...');
  }
  
  console.log('Uploading files...');
  const fileNames: any = await s3UploadDirectory(bucketName, uploadDirectory) || [];
  console.log(fileNames)
  
  const fileName = fileNames.find((name: string) => (name.includes('dmg') || name.includes('exe') || name.includes('appimage')) && !name.includes('blockmap'))

  const websiteUrl = `http://${bucketName}.s3-website-us-east-1.amazonaws.com/${fileName}`;
  console.log(`Website URL: ${websiteUrl}`);

  await commentOnPr(websiteUrl);
};
