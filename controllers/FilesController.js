const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    // eslint-disable-next-line object-curly-newline
    const { name, type, data, parentId, isPublic } = req.body;
    const { userId } = req;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const filesCollection = await dbClient.client.collection('files');
      const parentFile = await filesCollection.findOne({
        _id: ObjectId(parentId),
      });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    let localPath = '';

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, true);
      }

      const fileId = uuidv4();
      localPath = `${folderPath}/${fileId}`;
      const fileBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileBuffer);
    }

    const filesCollection = await dbClient.client.collection('files');
    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    };

    if (type !== 'folder') {
      newFile.localPath = localPath;
    }
    const result = await filesCollection.insertOne(newFile);

    const { _id: id, ...rest } = result.ops[0];
    const newResult = { id, ...rest };

    return res.status(201).json(newResult);
  }

  static async getShow(req, res) {
    const { userId } = req;
    const filesCollection = await dbClient.client.collection('files');
    const fileForUser = await filesCollection.findOne({
      userId: ObjectId(userId),
      _id: ObjectId(req.params.id),
    });

    if (!fileForUser) {
      return res.status(404).json({ error: 'Not found' });
    }

    const { _id: id, ...rest } = fileForUser;
    const newFileForUser = { id, ...rest };

    return res.status(200).json({
      id: id.toString(),
      userId: userId.toString(),
      ...newFileForUser,
    });
  }

  static async getIndex(req, res) {
    const { userId } = req;
    const filesCollection = await dbClient.client.collection('files');

    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const skip = page * pageSize;
    const parentId = req.query.parentId || 0;

    const aggregationPipeline = [
      { $match: { userId: ObjectId(userId), parentId: ObjectId(parentId) } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    const items = await filesCollection
      .aggregate(aggregationPipeline)
      .toArray();
    const modifyResult = items.map((file) => ({
      ...file,
      id: file._id.toString(),
      _id: undefined,
    }));
    return res.status(200).json(modifyResult);
  }

  static async putPublish(req, res) {
    const { userId } = req;
    const fileId = req.params.id;

    const filesCollection = await dbClient.client.collection('files');
    let fileForUser = await filesCollection.findOne({
      userId: ObjectId(userId),
      _id: ObjectId(fileId),
    });

    if (!fileForUser) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne(
      {
        userId: ObjectId(userId),
        _id: ObjectId(fileId),
      },
      { $set: { isPublic: true } },
    );

    fileForUser = await filesCollection.findOne({
      _id: ObjectId(fileId),
    });
    return res.status(200).json(fileForUser);
  }

  static async putUnpublish(req, res) {
    const { userId } = req;
    const fileId = req.params.id;

    const filesCollection = await dbClient.client.collection('files');
    let fileForUser = await filesCollection.findOne({
      userId: ObjectId(userId),
      _id: ObjectId(fileId),
    });

    if (!fileForUser) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne(
      {
        userId: ObjectId(userId),
        _id: ObjectId(fileId),
      },
      { $set: { isPublic: false } },
    );

    fileForUser = await filesCollection.findOne({
      _id: ObjectId(fileId),
    });
    return res.status(200).json(fileForUser);
  }
}

module.exports = FilesController;
