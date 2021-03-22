// Load the AWS SDK
var AWS = require("aws-sdk");

AWS.region = "us-east-2";

// Create a Secrets Manager client
var secretsManager = new AWS.SecretsManager();

const waitForSecret = async (secretName) => {
  try {
    console.log("trying to get secrets from secrets manager");
    const data = await secretsManager
      .getSecretValue({
        SecretId: secretName,
      })
      .promise();

    if (data) {
      if (data.SecretString) {
        const secret = data.SecretString;
        const parsedSecret = JSON.parse(secret);
        console.log("Got secret.");
        return parsedSecret;
      }

      const binarySecretData = data.SecretBinary;
      return binarySecretData;
    }
  } catch (error) {
    console.log("Error retrieving secrets");
    console.log(error);
  }
};

module.exports = waitForSecret;
