// const express = require("express");
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));

// /* --------------------------
//    SIMPLE ADMIN LOGIN SYSTEM
// ----------------------------*/
// const ADMIN_USER = "IBRAHIM";
// const ADMIN_PASS = "Ibrahim9250";

// app.post("/login", (req, res) => {
//     const { username, password } = req.body;

//     if (username === ADMIN_USER && password === ADMIN_PASS) {
//         res.json({ success: true });
//     } else {
//         res.json({ success: false });
//     }
// });

// /* --------------------------
//    IMAGE UPLOAD CONFIG
// ----------------------------*/
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "public/images/");
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

// /* --------------------------
//    ADD USER (AUTO ID)
// ----------------------------*/
// app.post("/add-user", upload.single("image"), (req, res) => {

//     let users = [];

//     if (fs.existsSync("users.json")) {
//         const data = fs.readFileSync("users.json");
//         users = JSON.parse(data);
//     }

//     const newId = users.length + 1;

//     const newUser = {
//         id: req.body.id,
//         name: req.body.name,
//         father: req.body.father,
//         mother: req.body.mother,
//         birth: req.body.birth,
//         address: req.body.address,
//         image: "images/" + req.file.filename
//     };

//     users.push(newUser);

//     fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

//     res.json({ message: "User Added", id: newUser.id });
// });

// /* --------------------------
//    SEARCH USER
// ----------------------------*/
// app.get("/search-user", (req, res) => {
//     const query = req.query.q;

//     if (!fs.existsSync("users.json")) {
//         return res.json(null);
//     }

//     const users = JSON.parse(fs.readFileSync("users.json"));

//     const result = users.find(
//         user => user.id === query || user.name === query
//     );

//     res.json(result || null);
// });

// const cors = require("cors");

// app.use(cors({
//     origin: "*"
// }));


// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log("Server running");
// });

require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());

// ১. ক্লাউডিনারি কনফিগারেশন
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// ২. মঙ্গোডিবি কানেকশন
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// ৩. ইউজার স্কিমা
const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    father: String,
    mother: String,
    birth: String,
    address: String,
    image: String
});
const User = mongoose.model("User", userSchema);

// ৪. ইমেজ স্টোরেজ সেটিংস
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "user_profiles",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: [{ width: 800, height: 800, crop: "limit" }]
    }
});
const upload = multer({ storage: storage });

// ৫. এডমিন লগইন (Static)
const ADMIN_USER = "IBRAHIM";
const ADMIN_PASS = "Ibrahim9250";

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Invalid Credentials" });
    }
});

// ৬. নতুন ইউজার যোগ করা
app.post("/add-user", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Image is required" });

        const newUser = new User({
            id: req.body.id, // আপনার HTML এ id ফিল্ড থাকতে হবে, না থাকলে auto generate করতে পারেন
            name: req.body.name,
            father: req.body.father,
            mother: req.body.mother,
            birth: req.body.birth,
            address: req.body.address,
            image: req.file.path
        });

        await newUser.save();
        res.json({ message: "User Saved Permanently!", id: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save user to database" });
    }
});

// ৭. ইউজার সার্চ
app.get("/search-user", async (req, res) => {
    try {
        const query = req.query.q;
        // নাম অথবা আইডি দিয়ে সার্চ
        const result = await User.findOne({
            $or: [{ id: query }, { name: new RegExp(query, 'i') }]
        });
        res.json(result || null);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
});

// ৮. রুট রুট (Root Route)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));