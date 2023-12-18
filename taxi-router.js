const express = require('express');
const router = express.Router();
const Controller = require('./taxi-controller');

//router.get('/users', Controller.getUsers);
router.get('/drivers', Controller.getDrivers);
router.get('/:pk/rides', Controller.getRidesforUser);
router.post('/rides', Controller.addPendingRide);
router.patch('/rides/:sk', Controller.updateRide);
module.exports = router;