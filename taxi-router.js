const express = require('express');
const router = express.Router();
const Controller = require('/taxi-controller');

//router.get('/users', Controller.getUsers);
router.get('/drivers', Controller.getDrivers);
//router.get('/:user/rides', Controller.getRidesforUser)

module.exports = router;