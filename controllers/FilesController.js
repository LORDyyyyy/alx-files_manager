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

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, true);
    }

    let localPath = '';
    if (type !== 'folder') {
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
        return res.send("TODO");
  }
}

module.exports = FilesController;
