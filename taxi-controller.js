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

const getUserById = async (pk) => { // in user entity, pk = sk
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :partitionKey AND sk = :sortKey",
    ExpressionAttributeValues: {
      ":partitionKey": pk,
      ":sortKey": pk,
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
        ":pk": "d#1",
      },
    }).promise();

    console.log(result.Items);
    //res.json(result.Items);
    return result.Items;
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error; 
  }
};

const getRidesforUser = async (pk) => {
  //const { pk } = req.params;
  const params = {
    TableName: TABLE_NAME,
      KeyConditionExpression: "pk=:pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": "u#"+pk,
        ":sk": "r",
      }
  }
  returnQueryResult(params)
  
};

const getRidesforDriver = async (gsiPKValue) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1_pk = :gsiPK AND begins_with(gsi1_sk, :gsiSK)",
    ExpressionAttributeValues: {
      ":gsiPK": "d#"+gsiPKValue,
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

const updateRide = async(partitionKeyValue, sortKeyValue, updatedAttributes) => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: partitionKeyValue,
      sk: sortKeyValue,
    },
    UpdateExpression: "SET",
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

    // Assuming `result.Attributes` contains the updated item
    console.log(result.Attributes);

    // Return the updated item if needed
    return result.Attributes;
  } catch (error) {
    console.error("Error updating a ride:", error);
    throw error; // You may want to handle this error appropriately
  }
};

const addRide = async(user_pkValue, pickup_loc, dropoff_loc) => {
  var random_sk = require('time-uuid/time');
  const params = {
    TableName: TABLE_NAME,
    Item: {
      pk: user_pkValue,
      sk: "r:"+random_sk(),
      gsi2_pk: "Pending",
      entity_type: "ride",
      pickup_location: pickup_loc,
      dropoff_location: dropoff_loc
    }
  }
  try {

    await dynamoClient.put(params).promise();
    console.log("Record added successfully");
  } catch (error) {
    console.error("Error creating a ride:", error);
    throw error; // You may want to handle this error appropriately
  }
}

module.exports = {
  getDrivers
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

