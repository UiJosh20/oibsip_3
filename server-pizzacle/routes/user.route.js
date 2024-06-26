const express = require('express')
const router = express.Router()
const {userRegister, userLogin, verifyToken, forgotten, verifyOTP, createNewPassword, pizzaMenu,pizzaDash, pizzaDisplay, userCart, cartDisplay, deleteCartItem, checkOut, successController,} = require("../controller/user.controller")

router.post('/user/register', userRegister)
router.post('/user/login', userLogin)
router.post('/user/forgot', forgotten)
router.post('/user/verifyOtp', verifyOTP)
router.post('/user/createNewPassword', createNewPassword)
router.post('/user/verifyToken', verifyToken)
router.get('/user/pizzaMenu', pizzaMenu)
router.get('/user/pizzaDashboard', pizzaDash)
router.get('/user/pizzaMenu/:id', pizzaDisplay)
router.post('/user/cart', userCart)
router.get('/user/displayCart', cartDisplay)
router.delete('/user/cart/:id', deleteCartItem)
router.post('/user/checkout', checkOut)
router.get('/success', successController)



module.exports = router