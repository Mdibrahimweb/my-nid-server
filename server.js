const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* --------------------------
   SIMPLE ADMIN LOGIN SYSTEM
----------------------------*/
const ADMIN_USER = "IBRAHIM";
const ADMIN_PASS = "Ibrahim9250";

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

/* --------------------------
   IMAGE UPLOAD CONFIG
----------------------------*/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/* --------------------------
   ADD USER (AUTO ID)
----------------------------*/
app.post("/add-user", upload.single("image"), (req, res) => {

    let users = [];

    if (fs.existsSync("users.json")) {
        const data = fs.readFileSync("users.json");
        users = JSON.parse(data);
    }

    const newId = users.length + 1;

    const newUser = {
        id: req.body.id,
        name: req.body.name,
        father: req.body.father,
        mother: req.body.mother,
        birth: req.body.birth,
        address: req.body.address,
        image: "images/" + req.file.filename
    };

    users.push(newUser);

    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    res.json({ message: "User Added", id: newUser.id });
});

/* --------------------------
   SEARCH USER
----------------------------*/
app.get("/search-user", (req, res) => {
    const query = req.query.q;

    if (!fs.existsSync("users.json")) {
        return res.json(null);
    }

    const users = JSON.parse(fs.readFileSync("users.json"));

    const result = users.find(
        user => user.id === query || user.name === query
    );

    res.json(result || null);
});

const cors = require("cors");

app.use(cors({
    origin: "*"
}));


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});

