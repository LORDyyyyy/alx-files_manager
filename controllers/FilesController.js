const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

function changeKey(obj, oldKey, newKey) {
  const updatedObj = {};

  for (const key in obj) {
    if (key === oldKey) {
      updatedObj[newKey] = obj[key];
    } else {
      updatedObj[key] = obj[key];
    }
  }

  return updatedObj;
}

function ObjectIdToString(obj) {
  if (Object.keys(obj).includes["_id"]) {
    obj['_id'] = obj['_id'].toString();
  }

  if (Object.keys(obj).includes["UserId"]) {
    obj['UserId'] = obj['UserId'].toString();
  }
  return obj;
}

class FilesController {
  static async postUpload(req, res) {

    // eslint-disable-next-line object-curly-newline
    const { name, type, data, parentId, isPublic } = req.body;
    const userId = req.userId;

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
      const filesCollection = await dbClient.db.collection('files');
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

    const filesCollection = await dbClient.db.collection('files');
    const newFile = {
      userId: userId,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    };

    if (type !== 'folder') {
      newFile.localPath = localPath;
    }
    const result = await filesCollection.insertOne(newFile);

    return res.status(201).json(changeKey(result.ops[0], '_id', 'id'));
  }

  static async getShow(req, res) {
    const userId = req.userId;
    const user = req.user;
    const filesCollection = await dbClient.db.collection('files');
    const fileForUser = await filesCollection.findOne({ userId: ObjectId(userId), _id: ObjectId(req.params.id) });

    if (!fileForUser) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(ObjectIdToString(changeKey(fileForUser, '_id', 'id')));
  }

  static async getIndex(req, res) {
    const userId = req.userId;
    const user = req.user;
  }
}

module.exports = FilesController;
