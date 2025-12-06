
// connection string , connect to server
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const app = require("./app");

dotenv.config({ path: "./.env" });

const PortNumber = process.env.PORT || 8000;

const dbAtlasString = process.env.DB.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);

mongoose
  .connect(dbAtlasString)
  .then(() => {
    console.log("DB connection successfully");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.listen(PortNumber, () => {
  console.log(`server is running on port ${PortNumber}`);
});



