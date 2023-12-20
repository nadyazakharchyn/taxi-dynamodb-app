const AWS = require("aws-sdk");
const crypto = require('crypto');
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
      ":partitionKey": `${req.params.pk}`,
      ":sortKey":`${req.params.pk}`
    },
  }
  try {
    const result = await dynamoClient.query(params).promise();
    console.log(result.Items);
    res.json(result.Items);
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error; // You may want to handle this error appropriately
  }
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

const addUser = async(req, res) => {
  const { fullName, email, password, phone} = req.body;
  var random_k = require('time-uuid/time');
  k = "u"+random_k();
  const params = {
    TableName: TABLE_NAME,
    Item: {
      pk: k,
      sk: k,
      entity_type: "user",
      name: fullName,
      email: email,
      hash_password: crypto.createHash('sha1').update(password).digest('hex'),
      phone: phone
    },
  }
  try {
    const result = await dynamoClient.put(params).promise();
    console.log("User added successfully");
    res.status(200).send("User added successfully");
  } catch (error) {
    console.error("Error creating a user:", error);
    res.status(500).send(`Error creating a user: ${error.message}`) 
  }
}

const getRidesforUser = async (req, res) => {
  const params = {
    TableName: TABLE_NAME,
      KeyConditionExpression: "pk=:pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        // ":pk": "u#"+pk,
        ":pk": `${req.params.pk}`,
        ":sk": "r",
      }
  }
  console.log(`${req.params.pk}`)
  console.log(`${req.params.pk}`)
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

const getRidesforDriver = async (req, res) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1_pk = :gsiPK AND begins_with(gsi1_sk, :gsiSK)",
    ExpressionAttributeValues: {
      ":gsiPK": `${req.params.gsi1_pk}`,
      ":gsiSK": "r"
    },
  };
  try {
    const result = await dynamoClient.query(params).promise();
    console.log(result.Items);
    res.json(result.Items);
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    res.status(500).send("Error getting driver rides");
    throw error; // You may want to handle this error appropriately
  }
};

const getPendingRides = async (req, res) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi2",
    KeyConditionExpression: "gsi2_pk = :gsiPK AND begins_with(gsi2_sk, :gsiSK)",
    ExpressionAttributeValues: {
      ":gsiPK": "Pending",
      ":gsiSK": "r"
    },
  };
  try {
    const result = await dynamoClient.query(params).promise();
    console.log(result.Items);
    res.json(result.Items);
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    res.status(500).send("Error getting pending rides");
    throw error; // You may want to handle this error appropriately
  }
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
    pickup_loc,
    dropoff_loc
  } = req.body;
  user_pk = `${req.params.user_pk}`;
  var random_sk = require('time-uuid/time');
  rand_sk = "r"+random_sk();
  const params = {
    TableName: TABLE_NAME,
    Item: {
      pk: user_pk,
      sk: rand_sk,
      gsi2_pk: "Pending",
      gsi2_sk: rand_sk,
      entity_type: "ride",
      pickup_location: pickup_loc,
      dropoff_location: dropoff_loc
    },
    ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
  }

  if (checkPendingBookedRides(user_pk)==true){
    console.log("User already has a pending or booked ride");
    res.status(400).send("User already has a pending or booked ride");
  } else {
    try {
      await dynamoClient.put(params).promise();
      console.log("Record added successfully");
      res.status(200).send("Ride created successfully");
    } catch (error) {
      console.error("Error creating a ride:", error);
      res.status(500).send(`Error creating a ride: ${error.message}`) 
    }
  }
  
}

const checkPendingBookedRides = async (pk) => {
  const params ={
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk",
    FilterExpression: "gsi2_pk = :status1 OR gsi2_pk = :status2",
    ExpressionAttributeValues: {
      ":pk": pk,
      ":status1": "Pending",
      ":status2": "Booked"
    },
  }
  try {
    const result = await dynamoClient.query(params).promise();
    console.log(result.Count);
    console.log(result.Count!=0);
    return (result.Count!=0);
    
  } catch (error) {
    console.error("Error checking pending/booked rides:", error);
    throw error; 
  }
}

//checkPendingBookedRides("u1703023895286087");


module.exports = {
  getUserById,
  getDrivers, 
  getRidesforUser,
  addPendingRide,
  updateRide, 
  checkPendingBookedRides,
  addUser,
  getPendingRides,
  getRidesforDriver
};
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

