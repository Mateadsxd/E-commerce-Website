# Ecommerce Store API Documentation

The Ecommerce Store API provides information for integrating with the Ecommerce Store API, allowing developers to interact with the e-commerce store's functionality, such as retrieving product information, user authentication, creating users, checking transaction status, searching the database, and retrieving transaction history.

## Retrieve all products.

**Request Format:** /products

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** This endpoint allows you to retrieve all the product available in the e-commerce store.

**Example Request:** /products

**Example Response:**

```json
[
  {
    "id": 1,
    "name": "product 1",
    "price": 100.0,
    "description": "This is product 1",
    "image": "https://via.placeholder.com/150",
    "category": "Video Games",
    "rating": 4,
    "quantity": 10
  },
  {
    "id": 2,
    "name": "product 2",
    "price": 200.0,
    "description": "This is product 2",
    "image": "https://via.placeholder.com/150",
    "category": "Fruits",
    "rating": 2,
    "quantity": 5
  },
  ...
]
```

**Error Handling:**

- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`

## Checks if username and password match entry in the database.

**Request Format:** /login endpoint with POST parameters of `username` and `password`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a valid `username` and `password`, and verifies the user again agaist the database for authentication purposes. If successful, returns the user's information in JSON format.

**Example Request:** /login

**Example Response:**

```json
{
  "username": "greg",
  "name": "Greg Heffley",
  "email": "greg@diary.com",
  "balance": 25.00
}
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If invalid username or password, an error is returned with the message: `Invalid username or password!`
  - If missing the username or password, an error is returned with the message: `Missing one or more of the required params.`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`


## Create a new user

**Request Format:** /signup endpoint with POST parameters of `name`, `username`, `email`, and `password`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a `name`, `username`, `email`, and `password`, creates a new user in the database. If successful, returns the user's information in JSON format.

**Example Request:** /signup

**Example Response:**

```json
{
  "username": "greg",
  "name": "Greg Heffley",
  "email": "greg@diary.com",
  "balance": 0.00
}
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If username already exists, an error is returned with the message: `Username already exists!`
  - If email already exists, an error is returned with the message: `Email already exists!`
  - If missing the name, username or password, an error is returned with the message: `Missing one or more of the required params.`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`

## Retrieve detailed product information

**Request Format:** /product/:id

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Retrieves detailed information about a specific product using its unique id as a parameter.

**Example Request:** /product/1

**Example Response:**

```json
{
  "id": 1,
  "name": "product 1",
  "price": 100.0,
  "description": "This is product 1",
  "image": "https://via.placeholder.com/150",
  "category": "Video Games",
  "rating": 4,
  "quantity": 10
}
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If missing the id, an error is returned with the message: `Missing one or more of the required params.`
  - If passed in an invalid product id, returns an error with the message: `Invalid product id, product does not exist`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`


## Search for products

**Request Format:** /search endpoint with query parameter of `phrase`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a `phrase`, searches the database and returns an array of the ids of products when their names or descriptions contain `phrase` in JSON format.

**Example Request:** /search

**Example Response:**

```json
[1, 2]
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If missing the phrase, an error is returned with the message: `Missing one or more of the required params.`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`


## Retrieve transaction history

**Request Format:** /user/transactions endpoint with POST parameters of the  `username`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a `username` retrieves all transactions from the user.

**Example Request:** /user/transactions

**Example Response:**

```json
[
  {
    id: 1,
    date: "2020-11-11T00:00:00.000Z",
    name: "Transaction 1",
    total: 100.0,
    products: [
      {
        id: 1,
        name: "product 1",
        price: 57.0,
      },
      {
        id: 2,
        name: "product 2",
        price: 43.0,
      },
      ...
    ]
  },
  ...
]
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If missing the username, an error is returned with the message: `Missing one or more of the required params.`
  - If username does not exist, an error is returned with the message: `Username does not exist!`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`

## Check transaction successful or not

**Request Format:** /transaction endpoint with POST parameter of the `cart` `total`, and `username`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a `cart`, `total`, and `username`, retrieves all products in cart to check the success status of a transaction. This is done by creating a transaction and keeping record of every product in the cart that is purchased. If the user does not have enough in their balance, the transaction will not be successful. If successful, returns the user's new balance in JSON format.

**Example Request:** /transaction

**Example Response:**

```json
{
  balance: 100.0,
}
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If missing the cart or username, an error is returned with the message: `Missing one or more of the required params.`
  - If username does not exist, an error is returned with the message: `Username does not exist!`
  - If the user does not have enough in their balance, an error is returned with the message: `Insufficient funds!`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`


## Add balance to user

**Request Format:** /user/balance endpoint with POST parameter of `username` and `funds`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Given a `username` and `funds`, adds the `funds` to the user's balance. If successful, returns the user's new balance in a text format.

**Example Request:** /user/balance

**Example Response:**

```
100.00
```

**Error Handling:**

- Possible 400 (invalid request) errors (all plain text):
  - If missing the funds or username, an error is returned with the message: `Missing one or more of the required params.`
  - If funds is zero or is negative, an error is returned with the message: `Cannot add negative or no funds!`
  - If username does not exist, an error is returned with the message: `Username does not exist!`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`

## Retrieve all categories.

**Request Format:** /categories

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** This endpoint allows you to retrieve all the categories of products in the e-commerce store.

**Example Request:** /categories

**Example Response:**

```json
[
  "VIP",
  "Electronics",
  "Fashion"
]
```

**Error Handling:**

- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Uh oh. Something went wrong. Please try again later.`
