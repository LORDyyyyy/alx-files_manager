const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
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

      localPath = `${folderPath}/${uuidv4()}`;

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
    const parentId = req.query.parentId || 0;
    const page = req.query.page || 0;
    const itemsPerPage = 20;
    const filesCollection = await dbClient.client.collection('files');
    const filesForUser = await filesCollection
      .find({ userId: ObjectId(userId), parentId: String(parentId) })
      .skip(Number(page) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray();

    const files = filesForUser.map((file) => {
      const { _id: id, ...rest } = file;
      return { id, ...rest };
    });

    return res.status(200).json(files);
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

  static async getFile(req, res) {
    const { userId } = req;
    const ID = req.params.id;

    const filesCollection = await dbClient.client.collection('files');
    const file = await filesCollection.findOne({
      _id: ObjectId(ID),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic && file.userId.toString() !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);

    res.setHeader('Content-Type', mimeType);
    const fileContent = fs.readFileSync(file.localPath, 'utf8');

    return res.send(fileContent);
  }
}

module.exports = FilesController;
