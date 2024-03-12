import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId } = req.body;
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    const parent = parentId
      ? await dbClient.files.find({ _id: parentId })
      : null;
    if (parentId && !parent) {
      return res.status(400).send({ error: 'Parent not found' });
    }

    const newFile = await dbClient.files.insertOne({
      name,
      type,
      parentId,
    });
    return res.status(201).send({
      id: newFile.insertedId,
      name,
      type,
      parentId,
    });
  }
}

module.exports = FilesController;
