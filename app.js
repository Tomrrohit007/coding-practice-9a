const express = require("express");
const app = express();
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

intializeDBandServer();

//CREATE USER ACCOUNT

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `
    SELECT *
    FROM user 
    WHERE username = '${username}';
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO
            user (username, name, password, gender, location)
            VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//LOGIN USER ACCOUNT
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT *
    FROM user 
    WHERE username = '${username}';
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isCorrectPassword = await bcrypt.compare(password, dbUser.password);
    if (isCorrectPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//CHANGE ACCOUNT PASSWORD

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `
    SELECT * 
    FROM user 
    WHERE username = '${username}';`;
  const dbUser = await db.get(userQuery);
  const isSamePassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (isSamePassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      const newPasswordQuery = `UPDATE user SET password = '${newHashedPassword}' WHERE username ='${username}' ;`;
      await db.run(newPasswordQuery);
      response.send("Password updated");
    }
  }
});

module.exports = app;
