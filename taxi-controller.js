const AWS = require("aws-sdk");
require('dotenv').config(); 

AWS.config.update({
  region: "eu-north-1", // replace with your region in AWS account
  accessKeyID: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME="taxi";


const returnQueryResult = async(params)=>{ // performs DynamoDB query with passed parameters
  try {
    const result = await dynamoClient.query(params).promise();
    console.log(result.Items);
    return result.Items;
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error; // You may want to handle this error appropriately
  }
}; 

const getUserById = async (req, res) => { // in user entity, pk = sk
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :partitionKey AND sk = :sortKey",
    ExpressionAttributeValues: {
      // ":partitionKey": pk,
      // ":sortKey": pk,
      ":partitionKey": `${req.params.pk}`,
    },
  }
  returnQueryResult(params);
};

const getDrivers = async (req, res) => {
  try {
    const result = await dynamoClient.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk=:pk",
      ExpressionAttributeValues: {
        ":pk": `${req.params.pk}`,
      },
    }).promise();

    console.log(result.Items);
    res.json(result.Items);
    //return result.Items;
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error; 
  }
};

const getRidesforUser = async (req, res) => {
  const params = {
    TableName: TABLE_NAME,
      KeyConditionExpression: "pk=:pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        // ":pk": "u#"+pk,
        ":pk": "u"+`${req.params.pk}`,
        ":sk": "r",
      }
  }
  console.log(`${req.params.pk}`)
  console.log("u"+`${req.params.pk}`)
  //returnQueryResult(params)
  try {
    const result = await dynamoClient.query(params).promise();
    console.log(result.Items);
    res.json(result.Items);
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error; 
  }
};

const getRidesforDriver = async (gsiPKValue) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1_pk = :gsiPK AND begins_with(gsi1_sk, :gsiSK)",
    ExpressionAttributeValues: {
      ":gsiPK": "d"+gsiPKValue,
      ":gsiSK": "r",
    },
  };
  returnQueryResult(params)
};

const getPendingRides = async () => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi2",
    KeyConditionExpression: "gsi2_pk = :gsiPK",
    ExpressionAttributeValues: {
      ":gsiPK": "Pending",
    },
  };
  returnQueryResult(params)
};

const updateRide = async(req, res) => {
  const {user_pk, ride_sk, updatedAttributes} = req.body;

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: user_pk,
      sk: `${req.params.sk}`,
    },
    UpdateExpression: "SET",
    ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
    ExpressionAttributeValues:{
      pk: user_pk,
      sk: `${req.params.sk}`,
    },
    ExpressionAttributeValues: {},
    ReturnValues: "ALL_NEW", 
  };
  // Construct the UpdateExpression and ExpressionAttributeValues based on updatedAttributes
  Object.keys(updatedAttributes).forEach((attributeName, index) => {
    const valueKey = `:value${index}`;
    params.UpdateExpression += ` ${attributeName} = ${valueKey},`;
    params.ExpressionAttributeValues[valueKey] = updatedAttributes[attributeName];
  });

  // Remove the trailing comma from UpdateExpression
  params.UpdateExpression = params.UpdateExpression.slice(0, -1);
  
  try {
    const result = await dynamoClient.update(params).promise();
    console.log(result.Attributes);
    res.status(200).send(result.Attributes);
  } catch (error) {
    res.status(500).send("Error updating a ride");
  }
};

const addPendingRide = async(req, res) => {
  const {
    user_pk,
    pickup_loc,
    dropoff_loc
  } = req.body
  var random_sk = require('time-uuid/time');
  const params = {
    TableName: TABLE_NAME,
    Item: {
      pk: user_pk,
      sk: "r"+random_sk(),
      gsi2_pk: "Pending",
      entity_type: "ride",
      pickup_location: pickup_loc,
      dropoff_location: dropoff_loc
    },
    ConditionExpression: 'attribute_not_exists(pk)',
    ExpressionAttributeValues:{

    }
  }
  try {
    await dynamoClient.put(params).promise();
    console.log("Record added successfully");
    res.status(200).send("Record added successfully");
  } catch (error) {
    console.error("Error creating a ride:", error);
    res.status(500).send(`Error adding record: ${error.message}`) // You may want to handle this error appropriately
  }
}

// const checkRecordExists = async (pk, sk) => {
//   const params = {
//     TableName: TABLE_NAME,
//     Key: {
//       pk,
//       sk,
//     },
//   };

//   try {
//     const result = await dynamoClient.get(params).promise();
//     return !!result.Item; // Returns true if the item exists, false otherwise
//   } catch (error) {
//     handleDynamoDBError(error, 'get item');
//     throw error;
//   }
// };

module.exports = {
  getDrivers, 
  getRidesforUser,
  addPendingRide,
  updateRide
}

//getDrivers();
//getUsers();
//getRides();
//getRidesforUser("0912nz")
//getRidesforDriver("1")
//getPendingRides()
//addRide("u#2609is", "Khreshchatyk 1", "Metalistiv 3")
//getUserById("u#2609is")

// const updatedAttributes = {
//   gsi2_pk: "Booked",
//   fare: "200"
// };
// updateRide("u#2609is", "r:1702600542049224", updatedAttributes)

