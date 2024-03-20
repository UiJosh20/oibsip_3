const express = require('express')
const router = express.Router()
const {userRegister, userLogin, verifyToken, forgotten, verifyOTP, createNewPassword} = require("../controller/user.controller")

router.post('/user/register', userRegister)
router.post('/user/login', userLogin)
router.post('/user/forgot', forgotten)
router.post('/user/verifyOtp', verifyOTP)
router.post('/user/createNewPassword', createNewPassword)
router.post('/user/verifyToken', verifyToken)


module.exports = router