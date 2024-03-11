import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) {
      res.status(200).send({ redis: true, db: true });
    }
  }

  static async getStats(req, res) {
    res.status(200).send({
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    });
  }
}

module.exports = AppController;
