require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superadmin_db').then(async () => {
  console.log("Connected to DB");
  
  const LicenseSchema = new mongoose.Schema({
    key: String,
    client: mongoose.Schema.Types.ObjectId
  }, { strict: false });
  const License = mongoose.model('License', LicenseSchema);
  
  const ClientSchema = new mongoose.Schema({
    hardwareId: String
  }, { strict: false });
  const Client = mongoose.model('Client', ClientSchema);
  
  const license = await License.findOne({ key: 'MSBILL-A591-7C7B-7D03' });
  if (!license) {
     console.log("License not found");
     process.exit(1);
  }
  
  const result = await Client.updateOne({ _id: license.client }, { $set: { hardwareId: null } });
  console.log(result);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
