const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const familyAccountSchema = new mongoose.Schema(
  {
    mail: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      // for security reasons do not select the password field by default
      select: false,
    },
    Title: {
      type: String,
      required: [true, "Please provide your family title"],
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// Hash the password before saving the family account
familyAccountSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
// check if the provided password is correct
familyAccountSchema.methods.correctPassword = async function (
  candidatePassword
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

//create the model , then export it so we can use it in other files
const FamilyAccount = mongoose.models.FamilyAccount || mongoose.model("FamilyAccount", familyAccountSchema);
module.exports = FamilyAccount;


