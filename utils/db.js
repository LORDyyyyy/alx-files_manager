const mongodb = require('mongodb');

class DBClient {
  constructor() {
    this.db = null;

    this.mongoClient = new mongodb.MongoClient(
      `mongodb://${process.env.DB_HOST || 'localhost'}:${
        process.env.DB_PORT || 27017
      }`,
    );

    this.mongoClient.connect((err) => {
      if (err) {
        console.log(err.message);
        this.db = null;
      } else {
        this.db = this.mongoClient.db('files_manager');
      }
    });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
