const express = require('express');
const router = express.Router();
const { getColleges } = require('../controllers/publicController');

router.get('/colleges', getColleges);

module.exports = router;
