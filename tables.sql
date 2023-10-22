
CREATE TABLE "categories" (
	"id" INTEGER PRIMARY KEY,
	NAME TEXT
);

CREATE TABLE "products" (
	"id"	INTEGER,
	"name"	TEXT,
	"price"	REAL,
	"image"	TEXT,
	"rating"	INTEGER,
	"description"	TEXT,
	"category"	INTEGER,
	"quantity"	integer,
	FOREIGN KEY("category") REFERENCES "categories"("id"),
	PRIMARY KEY("id")
)

CREATE TABLE "users" (
	"name"	TEXT,
	"username"	TEXT,
	"password"	TEXT,
	"email"	TEXT,
	PRIMARY KEY("username")
);

CREATE TABLE "transactions" (
	"id"	INTEGER,
	"user"	TEXT,
	"time"	DATETIME DEFAULT (datetime('now', 'localtime')),
	"confirmation_num"	TEXT,
	FOREIGN KEY("user") REFERENCES "users",
	PRIMARY KEY("id")
);

CREATE TABLE "purchased_products" (
	"transaction_id"	INTEGER,
	"product_id"	INTEGER,
	"id"	INTEGER,
	FOREIGN KEY("product_id") REFERENCES "products",
	FOREIGN KEY("transaction_id") REFERENCES "transactions",
	PRIMARY KEY("id")
);
