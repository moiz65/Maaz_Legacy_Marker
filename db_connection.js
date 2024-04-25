const mysql = require("mysql");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "legacy_marker",
  port: "3306",
});

connection.connect(function (err) {
  if (err) {
    console.error("Error connecting to database: " + err.stack);
    return;
  }

  console.log(
    "Connected to database with connection id: " + connection.threadId
  );
  // Send a success response when the connection is established
  app.set("dbConnected", true);
});

app.post("/register", (req, res) => {
  const mysql =
    "INSERT INTO legacy_users (`f_name`, `l_name`, `u_name`, `email`, `password`) VALUES (?)";
  const values = [
    req.body.f_name,
    req.body.l_name,
    req.body.u_name,
    req.body.email,
    req.body.password,
  ];
  connection.query(mysql, [values], (err, data) => {
    if (err) {
      return res.json("Failed to register");
    }
    return res.json(data);
  });
});

// Login endpoint
app.post("/login", (req, res) => {
  const mysql =
    "SELECT * FROM legacy_users WHERE `email` = ? AND `password` = ?";
  connection.query(mysql, [req.body.email, req.body.password], (err, data) => {
    if (err) {
      return res.json("Failed to register");
    }
    if (data.length > 0) {
      return res.json("Successfully Login");
    } else {
      return res.json("Invalid email or password");
    }
  });
});

// Save address endpoint
app.post("/profile", (req, res) => {
  const {
    city,
    state,
    zip_code,
    apartment,
    s_address,
    email, // Include email in the request body
  } = req.body;
  const mysql =
    "UPDATE legacy_users SET s_address = ?, apartment = ?, city = ?, state = ?, zip_code = ? WHERE email = ?";
  const addressValues = [
    s_address,
    apartment,
    city,
    state,
    zip_code,
    email, // Include email in the values
  ];

  connection.query(mysql, addressValues, (err, data) => {
    if (err) {
      console.error("Failed to update address:", err);
      return res.status(500).json("Failed to update address");
    }
    console.log("Address updated successfully");
    return res.json("Address updated successfully");
  });
});

// update Phone
app.post("/update-phone", (req, res) => {
  const {
    phone_number,
    email, // Include email in the request body
  } = req.body;
  const mysql = "UPDATE legacy_users SET phone_number = ? WHERE email = ?";
  const addressValues = [
    phone_number,
    email, // Include email in the values
  ];

  connection.query(mysql, addressValues, (err, data) => {
    if (err) {
      console.error("Failed to update address:", err);
      return res.status(500).json("Failed to update address");
    }
    console.log("Address updated successfully");
    return res.json("Address updated successfully");
  });
});
// update Email
app.post("/update-email", (req, res) => {
  const {
    alt_email,
    email, // Include email in the request body
  } = req.body;
  const mysql = "UPDATE legacy_users SET alt_email = ? WHERE email = ?";
  const addressValues = [
    alt_email,
    email, // Include email in the values
  ];

  connection.query(mysql, addressValues, (err, data) => {
    if (err) {
      console.error("Failed to update address:", err);
      return res.status(500).json("Failed to update address");
    }
    console.log("Address updated successfully");
    return res.json("Address updated successfully");
  });
});

// udpate new pass
app.post("/update-pass", (req, res) => {
  const { email, newPassword } = req.body;
  const mysql = "UPDATE legacy_users SET password = ? WHERE email = ?";
  const passwordValues = [newPassword, email];
  connection.query(mysql, passwordValues, (err, data) => {
    if (err) {
      console.error("Failed to update password:", err);
      return res.status(500).json("Failed to update password");
    }
    console.log("Request Body:", req.body);
    return res.json("Password updated successfully");
  });
});
// udpate new pass
app.post("/update-names", (req, res) => {
  const { email, name_f_name, name_l_name } = req.body;
  const mysql =
    "UPDATE legacy_users SET f_name = ?, l_name = ? WHERE email = ?";
  const NameValues = [name_f_name, name_l_name, email];
  connection.query(mysql, NameValues, (err, data) => {
    if (err) {
      console.error("Failed to update password:", err);
      return res.status(500).json("Failed to update password");
    }
    console.log("Request Body:", req.body);
    return res.json("Names updated successfully");
  });
});
// fetch Names yeh endpoint haii db se data get ho raha haii yhn mysql
app.get("/FetchNames", (req, res) => {
  const email = req.query.email;
  const mysql = "SELECT f_name, l_name FROM legacy_users WHERE email = ?";
  const EmailValue = [email];

  connection.query(mysql, EmailValue, (err, data) => {
    if (err) {
      console.error("Failed to fetch names:", err);
      return res.status(500).json("Failed to fetch names");
    }

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    console.log("Names fetched successfully:", data);
    return res.json(data);
  });
});

// Set up multer for handling profile photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles"); // Specify the directory where uploaded images will be saved
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, "profilePhoto-" + Date.now() + ext); // Generate a unique filename for the uploaded image
  },
});

const uploadProfilePhoto = multer({ storage: storage }).single("profilePhoto");

// Profile photo upload endpoint
app.post("/ChangeProfile", (req, res) => {
  uploadProfilePhoto(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer error occurred
      console.error("Multer error:", err);
      return res.status(500).json({ error: "Error uploading profile photo" });
    } else if (err) {
      // Other error occurred
      console.error("Error uploading profile photo:", err);
      return res.status(500).json({ error: "Error uploading profile photo" });
    }

    // Profile photo uploaded successfully
    // Save the file path in the database for the respective user
    const profilePhotoPath = req.file.path;
    const email = req.body.email; // Change this to the actual email of the user

    const sql = "UPDATE legacy_users SET profile_photo_url = ? WHERE email = ?";
    const values = [profilePhotoPath, email];

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error("Failed to update profile photo path in database:", err);
        return res.status(500).json({
          error: "Failed to update profile photo path in database",
        });
      }

      console.log("Profile photo path updated in database");
      return res.json({ profilePhotoPath: profilePhotoPath });
    });
  });
});

// Cover updated in database

// Set up multer for handling profile photo uploads
const coverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/cover"); // Specify the directory where uploaded images will be saved
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, "coverPhoto-" + Date.now() + ext);
  },
});

const uploadCoverPhoto = multer({ storage: coverStorage }).single("coverphoto");

// Profile photo upload endpoint
app.post("/update-CoverPhoto", (req, res) => {
  uploadCoverPhoto(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer error occurred
      console.error("Multer error:", err);
      return res.status(500).json({ error: "Error uploading profile photo" });
    } else if (err) {
      // Other error occurred
      console.error("Error uploading profile photo:", err);
      return res.status(500).json({ error: "Error uploading profile photo" });
    }

    // Cover photo uploaded successfully
    // Save the file path in the database for the respective user
    const CoverPhotoPath = req.file.path;
    const email = req.body.email; // Change this to the actual email of the user

    const sql = "UPDATE legacy_users SET cover_photo_url = ? WHERE email = ?";
    const CoverValues = [CoverPhotoPath, email];

    connection.query(sql, CoverValues, (err, result) => {
      if (err) {
        console.error("Failed to update Cover photo path in database:", err);
        return res.status(500).json({
          error: "Failed to update Cover photo path in database",
        });
      }

      console.log("Cover photo path updated in database");
      return res.json({ CoverPhotoPath: CoverPhotoPath });
    });
  });
});

// // for fetching the data from the database

app.listen(8081, () => {
  console.log(`Server is running on port 8081`);
});
