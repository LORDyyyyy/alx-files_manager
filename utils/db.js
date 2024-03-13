const mongodb = require('mongodb');

class DBClient {
  constructor() {
    this.uri = `mongodb://${process.env.DB_HOST || 'localhost'}:${
      process.env.DB_PORT || 27017
    }`;

    this.client = new mongodb.MongoClient(this.uri);

    this.client.connect((err) => {
      if (err) {
        console.log(err.message);
        this.client = null;
      }
      this.client = this.client.db(process.env.DB_DATABASE || 'files_manager');
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
