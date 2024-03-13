const mongodb = require('mongodb');

class DBClient {
  constructor() {
    this.client = null;

    this.mongoClinent = new mongodb.MongoClient(
      `mongodb://${process.env.DB_HOST || 'localhost'}:${
        process.env.DB_PORT || 27017
      }`,
    );

    this.mongoClinent.connect((err) => {
      if (err) {
        this.client = null;
        console.log(err.message);
      }
      this.client = this.mongoClinent.db(
        process.env.DB_DATABASE || 'files_manager',
      );
    });
  }

  isAlive() {
    return !!this.client;
  }

  async nbUsers() {
    return this.client.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
