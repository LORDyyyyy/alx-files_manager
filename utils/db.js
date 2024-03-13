const mongodb = require('mongodb');

class DBClient {
  constructor() {
    this.uri = `mongodb://${process.env.DB_HOST || 'localhost'}:${
      process.env.DB_PORT || 27017
    }/${process.env.DB_DATABASE || 'files_manager'}`;

    this.client = new mongodb.MongoClient(this.uri);

    this.client.connect((err, client) => {
      if (err) {
        console.log(err.message);
        this.client = null;
      }
      this.client = client;
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
