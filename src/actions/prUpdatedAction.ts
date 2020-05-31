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
  
  const fileName = fileNames.find((name: string) => (
    name.includes('dmg') || name.includes('exe') || name.includes('AppImage')) && !name.includes('blockmap')
  )
  const OS = () => {
    if (fileName.includes('dmg')) return 'Mac OS'
    if (fileName.includes('exe')) return 'Windows'
    if (fileName.includes('AppImage')) return 'LInux'
  }

  const formattedFileName = fileName.split(' ').join('+')
  const websiteUrl = `https://${bucketName}.s3.amazonaws.com/${formattedFileName}`;
  const message = `Deployment done for ${OS()} ✅. You can download the app [here](${websiteUrl})`

  await commentOnPr(message);
};
