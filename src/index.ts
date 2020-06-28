import * as core from '@actions/core';
import * as github from '@actions/github';
import prClosedAction from './actions/prClosedAction';
import prUpdatedAction from './actions/prUpdatedAction';

const main = async () => {
  try {
    const bucketPrefix = core.getInput('bucket-prefix');
    const folderToCopy = core.getInput('folder-to-copy');
    const prNumber = github.context.payload.client_payload.pull_request!.number;
    const bucketName = `${bucketPrefix}-pr${prNumber}`;

    console.log(`Bucket Name: ${bucketName}`);

    if (github.context.payload.action === 'closed') {
      await prClosedAction(bucketName);
      return
    }
    await prUpdatedAction(bucketName, folderToCopy);
  } catch (error) {
    console.log(error);
    core.setFailed(error);
  }
};

main();
