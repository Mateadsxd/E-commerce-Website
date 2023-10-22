"use strict";

const express = require("express");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const multer = require("multer");

const app = express();

const DEFAULT_PORT = 8080;
const PORT = process.env.PORT || DEFAULT_PORT;

const BASE_VALUE = 36;
const MINIMUM_ADD_FUNDS = 0.01;

const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {sqlite3.Database} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "ecommerce.db",
    driver: sqlite3.Database
  });

  return db;
}

/**
 * Returns all products from the database as a JSON response.
 */
app.get("/products", async function(req, res) {
  let db = await getDBConnection();

  try {
    let query = "SELECT P.*, C.name as category FROM products AS P, categories AS C " +
      "WHERE C.id = P.category;";
    let results = await db.all(query);

    res.type("json")
      .send(results);
  } catch (err) {
    res.type("text")
      .status(INTERNAL_SERVER_ERROR)
      .send("Uh oh. Something went wrong. Please try again later.");
  }
});

/**
 * Returns user information if valid, or an error message if invalid or encountered an error.
 */
app.post("/login", async function(req, res) {
  let db = await getDBConnection();

  let {username, password} = req.body;

  if (!username || !password) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else {
    try {
      let query = "SELECT name, email, balance FROM users WHERE username = ? AND password = ?;";
      let results = await db.get(query, [username, password]);

      if (results) {
        res.type("json")
          .send({
            ...results,
            username
          });
      } else {
        res.type("text")
          .status(BAD_REQUEST)
          .send("Invalid username or password!");
      }
    } catch (err) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

/**
 * Handles user signup and returns user information.
 */
app.post("/signup", async function(req, res) {
  let db = await getDBConnection();

  let {name, username, password, email} = req.body;

  if (!name || !username || !password) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else if (await usernameExists(username)) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Username already exists!");
  } else if (await emailExists(email)) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Email already exists!");
  } else {
    try {
      let query = `INSERT INTO users (name, username, password, email, balance)
        VALUES (?, ?, ?, ?, ?);`;
      await db.run(query, [name, username, password, email, 0.00]);

      res.type("json")
        .send({name, username, email, balance: 0.00});
    } catch (err) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

/**
 * Checks if a username already exists in the database.
 * @param {string} username - The username to check.
 * @returns {Promise<boolean>} A Promise that resolves to a boolean
 */
async function usernameExists(username) {
  let db = await getDBConnection();

  try {
    let query = "SELECT username FROM users WHERE username = ?;";
    let results = await db.get(query, username);

    return results !== undefined;
  } catch (err) {
    return false;
  }
}

/**
 * Checks if an email already exists in the database.
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} A Promise that resolves to a boolean
 */
async function emailExists(email) {
  let db = await getDBConnection();

  try {
    let query = "SELECT email FROM users WHERE email = ?;";
    let results = await db.get(query, email);

    return results !== undefined;
  } catch (err) {
    return false;
  }
}

/**
 * Retrieves a product by its ID and returns the product
 */
app.get("/product/:id", async function(req, res) {
  let id = req.params["id"];

  if (!id) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else if (!(await isValidproductID(id))) {
    res
      .type("text")
      .status(BAD_REQUEST)
      .send("Invalid product id, product does not exist");
  } else {
    try {
      let results = await getproductFromID(id);
      res.type("json")
        .send(results);
    } catch (err) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

/**
 * Checks if a product ID is valid by verifying if it exists in the database.
 * @param {number} id - The product ID to check.
 * @returns {Promise<boolean>} A Promise that resolves to a boolean
 */
async function isValidproductID(id) {
  let db = await getDBConnection();

  try {
    let query = "SELECT id FROM products WHERE id = ?;";
    let results = await db.get(query, id);

    return results !== undefined;
  } catch (err) {
    return false;
  }
}

/**
 * Performs a search for products returns the matching product IDs.
 */
app.get("/search", async function(req, res) {
  let db = await getDBConnection();

  let phrase = req.query["phrase"];

  if (!phrase) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else {
    try {
      let query = "SELECT id FROM products WHERE name LIKE ? OR description LIKE ?;";
      let results = await db.all(query, ["%" + phrase + "%", "%" + phrase + "%"]);

      res.type("json")
        .send(objectArrayToArray(results, "id"));
    } catch (err) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

/**
 * Converts an array of objects to an array of the values of the specified key.
 * @param {Array} objArr - The array of objects to convert.
 * @param {String} key - The key to get the values of.
 * @returns {Array} - The array of values.
 */
function objectArrayToArray(objArr, key) {
  return objArr.map((result) => result[key]);
}

/**
 * Returns user's transaction history with products and total cost based on username
 */
app.post("/user/transactions", async function(req, res) {
  let db = await getDBConnection();
  let username = req.body["username"];

  if (!username) {
    res
      .type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else if (!await (usernameExists(username))) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Username does not exist!");
  } else {
    try {
      let query = "SELECT * FROM transactions WHERE user = ? ORDER BY time DESC;";
      let results = await db.all(query, username);

      await getTransactionContents(results, db);

      res.type("json").send(results);
    } catch (error) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

/**
 * Gets the contents of the transactions and adds them to the transaction object.
 * This includes the products within the transaction and the total cost.
 * @param {Array} transactions - The list of transactions to get the contents of.
 * @param {Object} db - The database connection.
 */
async function getTransactionContents(transactions, db) {
  for (let i = 0; i < transactions.length; i++) {
    let transaction = transactions[i];
    let transactionId = transaction["id"];

    let purchasesQuery =
      "SELECT product_id FROM purchased_products WHERE transaction_id = ?;";
    let purchases = await db.all(purchasesQuery, transactionId);

    await getTransactionProducts(purchases, db);

    transaction["products"] = purchases;
    transaction["total"] = getTotalCost(purchases);
  }
}

/**
 * Retrieves the products for a transaction and to be added to the transaction.
 * @param {Array} purchases - The list of products purchased in the transaction.
 * @param {Object} db - The database connection.
 */
async function getTransactionProducts(purchases, db) {
  for (let j = 0; j < purchases.length; j++) {
    let purchase = purchases[j];
    let productId = purchase["product_id"];

    let productQuery =
      "SELECT id, name, price FROM products WHERE id = ?;";
    let product = await db.get(productQuery, productId);

    purchase["product"] = product;
  }
}

/**
 * Calculates the total cost of a list of products.
 * @param {Array} products - The list of products.
 * @returns {number} The total cost of the products.
 */
function getTotalCost(products) {
  let total = 0;

  for (let i = 0; i < products.length; i++) {
    total += products[i]["product"]["price"];
  }
  return total;
}

/**
 * Creates a new transaction in the database and updates product quantities.
 */
app.post("/transaction", async function(req, res) {
  let db = await getDBConnection();

  let {username, cart, total} = req.body;

  if (!username || !cart) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else if (!(await usernameExists(username))) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Username does not exist!");
  } else {
    try {
      let balance = await getUserBalance(username, db) - parseFloat(total);
      if (balance < 0) {
        res.type("text").status(BAD_REQUEST)
          .send("Insufficient funds!");
      } else {
        await transactionActions(username, db, JSON.parse(cart), parseFloat(total));

        res.type("json")
          .send({balance});
      }
    } catch (err) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

/**
 * Creates a new transaction, records the items in the
 * transaction, and deducts the total cost from the user's balance.
 * @param {String} username - The username of the user.
 * @param {Object} db - The database connection.
 * @param {Array} cart - The list of products in the cart.
 * @param {number} total - The total cost of the transaction.
 */
async function transactionActions(username, db, cart, total) {
  let confirmationId = Math.random()
    .toString(BASE_VALUE)
    .slice(2);
  let transactionQuery = "INSERT INTO transactions (user, confirmation_num) VALUES (?, ?);";
  let newTransaction = await db.run(transactionQuery, [username, confirmationId]);

  await recordTransactionItems(cart, newTransaction["lastID"], db);

  let deductQuery = "UPDATE users SET balance = balance - ? WHERE username = ?;";
  await db.run(deductQuery, [total, username]);
}

/**
 * Gets the user's balance from the database.
 * @param {String} username - The username of the user.
 * @param {Object} db - The database connection.
 * @returns {number} The user's balance.
 */
async function getUserBalance(username, db) {
  let query = "SELECT balance FROM users WHERE username = ?;";
  let result = await db.get(query, username);
  return result["balance"];
}

/**
 * Records the items in the transaction in the database. This is done
 * to update quantities of products, and to keep track of what was purchased,
 * along with who purchased it.
 * @param {Array} cart - The list of products in the transaction.
 * @param {number} transactionId - The ID of the transaction.
 * @param {Object} db - The database connection.
 */
async function recordTransactionItems(cart, transactionId, db) {
  for (let i = 0; i < cart.length; i++) {
    let buyQuery =
      "INSERT INTO purchased_products (transaction_id, product_id) VALUES (?, ?);";
    let minusQtyQuery =
      "UPDATE products SET quantity = quantity - 1 WHERE id = ?;";
    await db.run(buyQuery, [transactionId, cart[i]]);
    await db.run(minusQtyQuery, cart[i]);
  }
}

/**
 * Retrieves product information from the database based on the given ID.
 * @param {number} id - The ID of the product to retrieve.
 * @returns {Promise<object>} A Promise that resolves to the product info as an object
 */
async function getproductFromID(id) {
  let db = await getDBConnection();

  try {
    let query = "SELECT * FROM products WHERE id = ?;";
    let results = await db.get(query, id);

    return results;
  } catch (err) {
    return undefined;
  }
}

/**
 * Returns all the categories across products in the database.
 */
app.get("/categories", async function(req, res) {
  let db = await getDBConnection();

  try {
    let query = "SELECT name FROM categories;";
    let results = await db.all(query);

    res.type("json")
      .send(objectArrayToArray(results, "name"));
  } catch (err) {
    res.type("text")
      .status(INTERNAL_SERVER_ERROR)
      .send("Uh oh. Something went wrong. Please try again later.");
  }
});

/**
 * Adds funds to the user's account balance.
 */
app.post("/user/balance", async function(req, res) {
  let db = await getDBConnection();

  let username = req.body["username"];
  let funds = parseFloat(req.body["funds"]);

  if (!username || !funds) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Missing one or more of the required params.");
  } else if (!(await usernameExists(username))) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Username does not exist!");
  } else if (funds < MINIMUM_ADD_FUNDS) {
    res.type("text")
      .status(BAD_REQUEST)
      .send("Cannot add negative or no funds!");
  } else {
    try {
      let updateBalanceQuery = "UPDATE users SET balance = balance + ? WHERE username = ?;";
      await db.run(updateBalanceQuery, [funds, username]);

      let newBalanceQuery = "SELECT balance FROM users WHERE username = ?;";
      let newBalance = await db.get(newBalanceQuery, username);

      res.type("text").send(newBalance["balance"].toString());

    } catch (err) {
      res.type("text")
        .status(INTERNAL_SERVER_ERROR)
        .send("Uh oh. Something went wrong. Please try again later.");
    }
  }
});

app.use(express.static("public"));
app.listen(PORT);
