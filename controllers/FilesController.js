const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

function changeKey(obj, oldKey, newKey) {
  let updatedObj = {};

  for (let key in obj) {
    if (key === oldKey) {
      updatedObj[newKey] = obj[key];
    } else {
      updatedObj[key] = obj[key];
    }
  }

  return updatedObj;
}

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const usersCollection = await dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // eslint-disable-next-line object-curly-newline
    const { name, type, data, parentId, isPublic } = req.body;

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

    if (!fs.existsSync('/tmp/files_manager/')) {
      fs.mkdirSync('/tmp/files_manager/');
    }
    let localPath = '';
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileId = uuidv4();
      localPath = `${folderPath}/${fileId}`;
      const fileBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileBuffer);
    }

    const filesCollection = await dbClient.db.collection('files');
    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || '0',
    };

    if (type !== 'folder') {
      newFile['localPath'] = localPath;
    }
    const result = await filesCollection.insertOne(newFile);

    return res.status(201).json(changeKey(result.ops[0], "_id", "id"));
  }
}

module.exports = FilesController;
