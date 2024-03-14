import dbClient from './utils/db';

const Queue = require('bull');
const thumbnail = require('image-thumbnail');
const { ObjectId } = require('mongodb');
const fs = require('fs');

const fileQueue = Queue('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const fileForUser = await dbClient.client.collection('files').findOne({
    _id: ObjectId(fileId),
  });

  if (!fileForUser) {
    throw new Error('File not found');
  }

  const { localPath } = fileForUser.localPath;
  try {
    const thumbnailW500 = await thumbnail(localPath, { width: 500 });
    const thumbnailW250 = await thumbnail(localPath, { width: 250 });
    const thumbnailW100 = await thumbnail(localPath, { width: 100 });

    fs.writeFileSync(`${localPath}_500`, thumbnailW500);
    fs.writeFileSync(`${localPath}_250`, thumbnailW250);
    fs.writeFileSync(`${localPath}_100`, thumbnailW100);
  } catch (err) {
    console.error(err);
  }
});
