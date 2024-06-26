const userModel = require("../model/user.model");
const UserCart = require("../model/userCart.model");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const MAILEREMAIL = process.env.MAILEREMAIL;
const MAILERPASS = process.env.MAILERPASS;
const secret = process.env.SECRET;
const stripe = require('stripe')(process.env.PAYMENT_APIKEY)


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
const generateVerificationTokenLink = (verificationToken) => {
  return `http://localhost:3000/user/verify/${verificationToken}`;
};

const verificationToken = generateVerificationToken();
const verificationTokenLink = generateVerificationTokenLink(verificationToken);

const userRegister = (req, res) => {
  const otp = generateOTP();
  const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
  const { email } = req.body;
  const users = new userModel({ ...req.body, otp, otpExpiration });
  users
    .save()
    .then(() => {
      console.log("User saved successfully");
      sendVerificationToEmail(email);
      res
        .status(201)
        .send({ message: "User registered successfully", status: 200 });
    })
    .catch((error) => {
      console.error("Error saving user:", error);
      res.status(500).json({ message: "Internal Server Error" });
    });
};

const sendVerificationToEmail = (email) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAILEREMAIL,
        pass: MAILERPASS,
      },
    });

    const mailOptions = {
      from: MAILEREMAIL,
      to: email,
      subject: "Verify your email address",
      text: `Congratulations your email has been verified successfully`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const userLogin = (req, res) => {
  let { email, password } = req.body;
  userModel
    .findOne({ email })
    .then((user) => {
      if (!user) {
        console.log("User not found");
        return res.status(404).send({ message: "User not found" });
      }

      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res.status(500).json({ message: "No internet connection or Slow internet connection" });
        }

        if (!match) {
          console.log("Incorrect password");
          return res.status(401).send({ message: "Incorrect password" });
        }

        const token = jwt.sign({ email }, secret, { expiresIn: "1h" });
        console.log("User signed in successfully");
        res.send({
          message: "User signed in successfully",
          status: true,
          user: user,
          token: token,
        });
      });
    })
    .catch((err) => {
      console.error("Error finding user:", err);
      res.status(500).send({ message: "Internal server error" });
    });
};

const sendOTPToEmail = (email, otp) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAILEREMAIL,
        pass: MAILERPASS,
      },
    });

    const mailOptions = {
      from: MAILEREMAIL,
      to: email,
      subject: "Pizzacle forgotten password OTP",
      text: `Your one time password OTP is : ${otp}
This OTP is valid for 30 minutes. Please do not share this OTP with anyone.
          `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const forgotten = (req, res) => {
  const otp = generateOTP();
  const expirationTime = new Date(Date.now() + 30 * 60 * 1000);
  const { email } = req.body;

  userModel
    .findOneAndUpdate(
      { email },
      { otp, otpExpiration: expirationTime },
      { new: true, upsert: true }
    )
    .then((user) => {
      if (user) {
        sendOTPToEmail(email, otp)
          .then(() => {
            res
              .status(200)
              .send({ message: "OTP sent to email", status: true, otp: otp });
          })
          .catch((error) => {
            res.status(500).json({ error: "Failed to send OTP to email" });
          });
      } else {
        console.log("user not found");
      }
    })
    .catch((err) => {
      res.status(500).json({ error: "Database error" });
    });
};

const verifyOTP = (req, res) => {
  const { otp } = req.body;

  userModel
    .findOne({ otp })
    .then((user) => {
      if (user) {
        user.otp = null;
        user.otpExpiration = null;
        user
          .save()
          .then(() => {
            res
              .status(200)
              .json({ message: "OTP verified successfully", status: true });
          })
          .catch((error) => {
            console.error("Error clearing OTP:", error);
            res.status(500).json({ error: "Internal Server Error" });
          });
      } else {
        res.status(404).json({ message: "Invalid OTP", status: false });
      }
    })
    .catch((error) => {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

const createNewPassword = (req, res) => {
  const { email, password } = req.body;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: "Internal Server Error" });
    }
    userModel
      .findOneAndUpdate({ email }, { password: hashedPassword }, { new: true })
      .then((user) => {
        if (!user) {
          return res
            .status(404)
            .send({ message: "User not found", status: false });
        }

        res
          .status(200)
          .json({ message: "Password updated successfully", status: true });
      })
      .catch((error) => {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal Server Error" });
      });
  });
};

const verifyToken = (req, res) => {
  const { token } = req.body;
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err);
    } else {
      console.log("Token verified successfully");
      res.send({
        message: "Token verified successfully",
        status: true,
        decoded: decoded,
        valid: true,
        token: token,
      });
    }
  });
};

const pizzaList = [
  {
    id: 1,
    name: "Margherita",
    description:
      "A classic pizza with tomato sauce, mozzarella cheese, and basil.",
    price: 10,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019363/pizzacle/l52iwm6t3jmf1osobn47.png",
  },
  {
    id: 2,
    name: "Pepperoni",
    description: "A pizza with tomato sauce, mozzarella cheese, and pepperoni.",
    price: 12,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
  {
    id: 3,
    name: "Hawaiian",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and ham and pineapple.",
    price: 15,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711025368/pizzacle/hyk9ohyu2yjhqypet593.png",
  },
  {
    id: 4,
    name: "Veggie",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various vegetables.",
    price: 13,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
  {
    id: 5,
    name: "Meat Lovers",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various meats.",
    price: 14,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711025368/pizzacle/hyk9ohyu2yjhqypet593.png",
  },
  {
    id: 6,
    name: "Cheese",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and extra cheese.",
    price: 11,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019363/pizzacle/l52iwm6t3jmf1osobn47.png",
  },
  {
    id: 7,
    name: "BBQ Chicken",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and barbecue chicken.",
    price: 16,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
  {
    id: 7,
    name: "Chicken Tikka",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and chicken tikka.",
    price: 17,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019363/pizzacle/l52iwm6t3jmf1osobn47.png",
  },
  {
    id: 8,
    name: "Mexican Green Wave",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various meats and vegetables.",
    price: 18,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
  {
    id: 9,
    name: "Mexican Red Wave",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various meats and vegetables.",
    price: 20,
       image_URL: "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019363/pizzacle/l52iwm6t3jmf1osobn47.png"

  },
  {
    id: 10,
    name: "Mexican Yellow Wave",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various meats and vegetables.",
    price: 20,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },

  {
    id: 11,
    name: "Mexican Blue Wave",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various meats and vegetables.",
    price: 20,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
];

const pizzaDashboard = [
  {
    id: 1,
    name: "Margherita",
    description:
      "A classic pizza with tomato sauce, mozzarella cheese, and basil.",
    price: 10,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019363/pizzacle/l52iwm6t3jmf1osobn47.png",
  },
  {
    id: 2,
    name: "Pepperoni",
    description: "A pizza with tomato sauce, mozzarella cheese, and pepperoni.",
    price: 12,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
  {
    id: 3,
    name: "Hawaiian",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and ham and pineapple.",
    price: 15,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711025368/pizzacle/hyk9ohyu2yjhqypet593.png",
  },
  {
    id: 4,
    name: "Veggie",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various vegetables.",
    price: 13,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019366/pizzacle/ubeeehds8jfhvcbjqyb6.png",
  },
  {
    id: 5,
    name: "Meat Lovers",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and various meats.",
    price: 14,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711025368/pizzacle/hyk9ohyu2yjhqypet593.png",
  },
  {
    id: 6,
    name: "Cheese",
    description:
      "A pizza with tomato sauce, mozzarella cheese, and extra cheese.",
    price: 11,
    image_URL:
      "https://res.cloudinary.com/dubaep0qz/image/upload/v1711019363/pizzacle/l52iwm6t3jmf1osobn47.png",
  },
 
];

const sideDish = [
  {
    id: 1,
    name: "Garlic Bread",
    description: "A classic bread with garlic butter.",
    price: 5,
    image_URL: "",
  },
  {
    id: 2,
    name: "French Fries",
    description: "Fried irish potatoes",
    price: 10,
    image_URL: "",
  },
  {
    id: 3,
    name: "Chicken Wings",
    description: "Fried chicken wings",
    price: 15,
    image_URL: "",
  },
  {
    id: 4,
    name: "Cacio e pepe",
    description: "A combination of pasta and vegetables",
    price: "24",
    image_URL: "",
  },
  {
    id: 5,
    name: "Caesar Salad",
    description: "A romanian salad",
    price: "20",
    image_URL: "",
  },
    {
    id: 1,
    name: "Coca Cola",
    description: "A carbonated soft drink",
    price: 5,
    image_URL: "",
  },
  {
    id: 2,
    name: "Pepsi",
    description: "A carbonated soft drink",
    price: 5,
    image_URL: "",
  },
  {
    id: 3,
    name: "Sprite",
    description: "A carbonated soft drink",
    price: 5,
    image_URL: "",
  },
  {
    id: 4,
    name: "Fanta",
    description: "A carbonated soft drink",
    price: 5,
    image_URL: "",
  },
];


const pizzaMenu = (req, res) => {
  res.send(pizzaList);
};

const pizzaDash = (req, res) => {
  res.send(pizzaDashboard);
};

const pizzaDisplay = (req, res) => {
  const id = parseInt(req.params.id);
  const pizza = pizzaList.find((pizza) => pizza.id === id);
  if (!pizza) {
    res.status(404).json({ error: "Van not found" });
  } else {
    res.send(pizza);
  }
};

const userCart = (req, res) => {
  const { image, name, price, productId, quantity } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const user = jwt.verify(token, process.env.SECRET);
  const userId = user.email;

  UserCart.findOne({ userId })
    .then((cart) => {
      if (cart) {
        const existingItem = cart.items.find((pizza) => pizza.name === name);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.items.push({ image, name, price, productId, quantity });
        }
        cart
          .save()
          .then((updatedCart) => {
            console.log("Product added/quantity updated in cart");

            res
              .status(200)
              .send({ message: "Pizza added successfully" });
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send({ error: "Internal Server Error" });
          });
      } else {
        const newCart = new UserCart({
          userId,
          items: [{ image, name, price, productId, quantity }],
        });
        newCart
          .save()
          .then((savedCart) => {
            console.log("Product added to new cart");

            res.status(201).send(savedCart);
          })
          .catch((error) => {
            console.error("Error saving new cart:", error);
            res.status(500).send({ error: "Internal Server Error" });
          });
      }
    })
    .catch((error) => {
      console.error("Error finding user cart:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

const cartDisplay = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.SECRET);
  const userId = decoded.email;

  UserCart.findOne({ userId })
    .then((cart) => {
      if (cart) {
        res.status(200).json(cart);
      } else {
        res.status(404).json({ message: "Cart not found" });
      }
    })
    .catch((error) => {
      console.error("Error fetching cart data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

const deleteCartItem = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.SECRET);
  const userId = decoded.email;
  const productId = req.params.id;



  UserCart.findOneAndUpdate(
    { userId },
    { $pull: { items: { productId: productId} } },
    { new: true }
  )
  .then((updatedCart) => {
    if (updatedCart) {
      res.status(200).json({ message: "Item deleted from cart successfully" });
      console.log("item deleted successfully")
    } else {
      res.status(404).json({ message: "User or item not found" });
    }
  })
  .catch((error) => {
    console.error("Error deleting item from cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  });
};

const checkOut = (req, res) => {
  const { cartItems, totalPrice } = req.body; 


  const lineItems = cartItems.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        images: [item.image_URL],
      },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity,
  }));

  stripe.checkout.sessions.create({
    line_items: lineItems,
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: 'https://oibsip-90i2.onrender.com/success',
    cancel_url: 'https://oibsip-90i2.onrender.com/cancel',
  })
  .then(session => {
    res.status(200).json({ sessionId: session.id });
  })
  .catch(error => {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  });
};

const successController = (req, res) => {
  res.send( `
  <section style="background-color:black; color:white; text-align:center; display:flex; justify-content:center; align-items:center; margin:0px; height:100vh;">
  <h1>Payment successful your order is being processed!</h2>
  </section>
  ` );
};


module.exports = {
  userRegister,
  userLogin,
  forgotten,
  verifyOTP,
  createNewPassword,
  verifyToken,
  pizzaMenu,
  pizzaDash,
  pizzaDisplay,
  userCart,
  cartDisplay,
  deleteCartItem,
  checkOut,
  successController,
};
