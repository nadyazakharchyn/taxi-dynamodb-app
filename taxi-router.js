const express = require('express');
const router = express.Router();
const Controller = require('./taxi-controller');

//router.get('/users', Controller.getUsers);
router.get('/users/:pk', Controller.getUserById);
router.post('/users/', Controller.addUser);
router.get('/drivers/:pk', Controller.getDrivers);
router.get('/users/:pk/rides', Controller.getRidesforUser);
router.get('/drivers/:gsi1_pk/rides', Controller.getRidesforDriver);
router.get('/rides/pending', Controller.getPendingRides);
router.post('/:user_pk/rides', Controller.addPendingRide);
router.patch('/rides/:sk', Controller.updateRide);
module.exports = router;