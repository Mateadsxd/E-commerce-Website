"use strict";

(function() {
  window.addEventListener("load", init);

  const STAR_EMOJI = 0x2b50;

  let currentUser = window.localStorage.getItem("username");
  let currentProduct = null;
  let currentCategory = "All";

  /**
   * This function is called when the page loads. It sets up the event handlers for the page,
   * as well as the UI manipulation functions.
   */
  function init() {
    id("login-account-form").addEventListener("submit", signIn);
    id("create-account-form").addEventListener("submit", signUp);
    id("add-funds-form").addEventListener("submit", addFunds);

    searchInit();
    buttonInit();
    resetProductDetails();

    if (currentUser) {
      id("username").value = currentUser;
    }

    if (window.localStorage.getItem("cart") === null) {
      window.localStorage.setItem("cart", JSON.stringify([]));
    }

    populateAllProducts();
    populateCart();
    populateCategories();
  }

  /**
   * Initializes the buttons across the page, ranging from cart to account
   * functionality
   */
  function buttonInit() {
    id("confirm-transaction").addEventListener("click", confirmTransaction);
    id("change-display").addEventListener("click", toggleProducts);
    id("cart-button").addEventListener("click", showCart);
    id("account-button").addEventListener("click", showAccount);
    id("title-button").addEventListener("click", showAllProducts);
    id("add-to-cart-button").addEventListener("click", addToCart);
    id("back-button").addEventListener("click", () => {
      showAllProducts();
      resetSearch();
    });

    id("close-error-notif").addEventListener("click", closeErrorNotif);
  }

  /**
   * Initializes the search bar and related buttons, including the search
   * button and the reset search button.
   */
  function searchInit() {
    id("search-term").addEventListener("input", searchBarInput);
    id("search-button").addEventListener("click", () => {
      showHomeView();
      searchProducts();
    });
    id("reset-search").addEventListener("click", () => {
      showHomeView();
      resetSearch();
    });
  }

  /**
   * Toggles the display of products between a grid and a list view.
   */
  function toggleProducts() {
    let productsArea = id("all-products");

    productsArea.classList.toggle("grid");
    productsArea.classList.toggle("list");

    id("change-display").textContent = productsArea.classList.contains("grid") ?
      "Show as List" :
      "Show as Grid";
  }

  /**
   * Gets all products from the Ecommerce API and populates the "All Products" section of the page.
   */
  function populateAllProducts() {
    let productsArea = id("all-products");
    fetch("/products")
      .then(statusCheck)
      .then((resp) => resp.json())
      .then((resp) => {
        for (let product of resp) {
          let productCard = genProductCard(product);
          productsArea.appendChild(productCard);
        }
      })
      .catch((err) => handleError(err));
  }

  /**
   * Populates the cart with the items stored in the cart,
   * showing total price, individual prices, and quantities.
   */
  async function populateCart() {

    let tempCart = JSON.parse(window.localStorage.getItem("cart"));

    await updateCart(tempCart);

    let cartArea = id("cart-items");
    cartArea.innerHTML = "";

    for (let product of [...new Set(tempCart.sort())]) {
      fetch("/product/" + product)
        .then(statusCheck)
        .then((resp) => resp.json())
        .then((resp) => genCartProductCard(resp, product, cartArea, tempCart))
        .catch((err) => handleError(err));
    }

    if (tempCart.length === 0) {
      let noItems = createElementWithClass("p", "no-items");
      noItems.textContent = "No items in cart. Add some products!";
      cartArea.appendChild(noItems);
    }
  }

  /**
   * Updates the items in the cart count in the header, along with
   * the total price of the cart.
   * @param {Array} tempCart - The temporary cart to get the quantity from.
   */
  async function updateCart(tempCart) {
    let cartItemsCount = id("cart-count");

    if (tempCart) {
      cartItemsCount.textContent = tempCart.length + " Product" +
        sGen(tempCart.length) + " in Cart";
    } else {
      cartItemsCount.textContent = "No Products in Cart";
    }

    let cartTotal = id("cart-total");
    cartTotal.textContent = "Total: $" + (await getCartTotal()).toFixed(2);
  }

  /**
   * Returns an "s" if the count is not 1, and an empty string otherwise.
   * @param {number} count - The count to check.
   * @returns {string} - An "s" if the count is not 1, and an empty string otherwise.
   */
  function sGen(count) {
    return count === 1 ? "" : "s";
  }

  /**
   * Generates a product card specifically for the cart, with a remove butto,
   * total price, and quantity.
   * @param {Object} product - The product to generate a card for.
   * @param {string} productId - The id of the product.
   * @param {HTMLElement} cartArea - The area to append the card to.
   * @param {Array} tempCart - The temporary cart to get the quantity from.
   */
  function genCartProductCard(product, productId, cartArea, tempCart) {
    let productCard = genProductCard(product, `cart-${productId}`, true);
    cartArea.appendChild(productCard);

    let cardBody = qs(`#cart-${productId} .card-body`);

    let quantityCount = tempCart.filter((x) => x === product.id).length;
    let quantity = createElementWithClass("p", "quantity");
    quantity.textContent = "Quantity: " + quantityCount;
    cardBody.appendChild(quantity);
    cardBody.appendChild(removeButton(productId, quantityCount));
  }

  /**
   * Generates a button to remove a product from the cart.
   * @param {string} id - The id of the product to remove.
   * @param {number} quantityCount - The number of the product in the cart.
   * @returns {HTMLElement} - The button to remove the product.
   */
  function removeButton(id, quantityCount) {
    let button = createElementWithClass("button", "text-button");
    button.textContent = "Remove " + (quantityCount === 1 ? "" : "one") + " from cart";
    button.addEventListener("click", function() {
      let tempCart = JSON.parse(window.localStorage.getItem("cart"));
      tempCart.splice(tempCart.indexOf(id), 1);
      window.localStorage.setItem("cart", JSON.stringify(tempCart.sort()));
      populateCart();
    });
    return button;
  }

  /**
   * Fetches all transactions for the current user and populates the transactions
   * section of the page.
   */
  function populateTransactions() {
    let transactionArea = id("transactions");
    let data = new FormData();

    transactionArea.innerHTML = "";

    if (currentUser) {
      data.append("username", currentUser);

      fetch("/user/transactions", {
        method: "POST",
        body: data
      })
        .then(statusCheck)
        .then((resp) => resp.json())
        .then((resp) => {
          for (let transaction of resp) {
            let transactionItem = genTransaction(transaction);
            transactionArea.appendChild(transactionItem);
          }

          if (resp.length === 0) {
            let noTransactions = createElementWithClass("p", "no-transactions");
            noTransactions.textContent = "No transactions to show.";
            transactionArea.appendChild(noTransactions);
          }
        })
        .catch((err) => handleError(err));
    }
  }

  /**
   * Generates a transaction list item DOM element with placeholder data.
   * @param {object} transaction Transaction object to generate the list item for.
   * @returns {object} New DOM object for the transaction list item.
   */
  function genTransaction(transaction) {
    let transactionItem = createElementWithClass("li", "transaction");

    let start = createElementWithClass("div", "start");
    let end = createElementWithClass("div", "end");

    let transactionDateTime = createElementWithClass("p", "date");
    transactionDateTime.textContent = new Date(transaction.time).toLocaleString();

    let transactionName = createElementWithClass("h4", "name");
    transactionName.textContent = "Confirmation: " + transaction.confirmation_num;

    let showItems = genShowItems(transactionItem);

    let transactionItems = genTransactionItems(transaction.products, transactionItem);

    let transactionTotal = createElementWithClass("p", "total");
    transactionTotal.textContent = "Total: $" + transaction.total.toFixed(2);

    let totalProducts = createElementWithClass("p", "total-products");
    totalProducts.textContent = transaction.products.length + " product" +
      sGen(transaction.products.length) + " purchased";

    groupAppend(start, [transactionDateTime, transactionName, transactionItems, totalProducts]);
    groupAppend(end, [showItems, transactionTotal]);
    groupAppend(transactionItem, [start, end]);

    return transactionItem;
  }

  /**
   * Generates a button to show or hide the items in a transaction.
   * @param {HTMLElement} transactionItem - The transaction item to show or hide.
   * @returns {HTMLElement} - The button to show or hide the items.
   */
  function genShowItems(transactionItem) {
    let showItems = createElementWithClass("button", "text-button");
    showItems.textContent = "Show Items";

    showItems.addEventListener("click", function() {
      let items = transactionItem.querySelector(".items");
      items.classList.toggle("hidden");
      showItems.textContent = items.classList.contains("hidden") ?
        "Show Items" :
        "Hide Items";
    });

    return showItems;
  }

  /**
   * Generates a list of items for a transaction.
   * @param {object} products - The products to generate the list for.
   * @returns {HTMLElement} - The list of items.
   */
  function genTransactionItems(products) {
    let transactionItems = createElementWithClass("ul", "items");
    transactionItems.classList.add("hidden");

    for (let item of consolidateProducts(products)) {
      let quantity = products.filter((x) => x.product_id === item.product_id).length;
      let listItem = createElementWithClass("li", "item");

      listItem.textContent =
        item.product.name + " - $" + item.product.price +
        (products.length > 1 ? " x " + quantity : "");

      transactionItems.appendChild(listItem);
    }

    return transactionItems;
  }

  /**
   * Consolidates the products in a transaction. This is done to avoid
   * duplicate products and enable the quantity to be displayed.
   * @param {object} products - The products to consolidate.
   * @returns {object} - The consolidated products.
   */
  function consolidateProducts(products) {
    let arr = [];

    for (let product of products) {
      if (arr.filter((x) => x.product_id === product.product_id).length === 0) {
        arr.push(product);
      }
    }

    return arr;
  }

  /**
   * Generates a product card DOM element with placeholder data.
   * @param {object} product Product object to generate the card for.
   * @param {string} id custom ID to assign to the card.
   * @param {boolean} disableEvent Whether or not to disable the click event.
   * @returns {object} New DOM object for the product card.
   */
  function genProductCard(product, id = null, disableEvent = false) {
    let card = createElementWithClass("div", "product-card");
    card.id = id ? id : "product-" + product.id;

    let img = gen("img");
    img.src = "/images/" + product.image;
    img.alt = product.name;
    card.appendChild(img);

    let cardBody = createElementWithClass("div", "card-body");

    let cardTitle = createElementWithClass("h5", "card-title");
    cardTitle.textContent = product.name;

    let cardDesc = createElementWithClass("p", "card-desc");
    cardDesc.textContent = product.description;

    let category = createElementWithClass("p", "card-category");
    category.textContent = product.category;

    groupAppend(cardBody, [category, cardTitle, cardDesc]);

    let cardInfo = createElementWithClass("div", "card-info");

    let cardPrice = createElementWithClass("p", "card-price");
    cardPrice.textContent = "$" + product.price;

    let reviewStars = createElementWithClass("div", "review-stars");

    generateReviewStars(reviewStars, product.rating);

    groupAppend(cardInfo, [cardPrice, reviewStars]);
    groupAppend(card, [cardBody, cardInfo]);

    if (!disableEvent) {
      card.addEventListener("click", () => showProductPage(product));
    }

    return card;
  }

  /**
   * Returns a new DOM element with the given tag name and class.
   * @param {string} tagName Tag name of the new DOM element.
   * @param {string} className Class of the new DOM element.
   * @returns {object} New DOM object with the given tag name and class.
   */
  function createElementWithClass(tagName, className) {
    let element = gen(tagName);
    element.classList.add(className);
    return element;
  }

  /**
   * Appends a group of childrenDOM elements to a parent element.
   * @param {object} parent Parent DOM element.
   * @param {object[]} children Array of DOM elements to append to the parent.
   */
  function groupAppend(parent, children) {
    for (let child of children) {
      parent.appendChild(child);
    }
  }

  /**
   * Generates a product page DOM element with placeholder data.
   * @param {object} reviewStars DOM element to append review stars to.
   * @param {number} total Total number of stars to generate.
   */
  function generateReviewStars(reviewStars, total) {
    reviewStars.innerHTML = "";
    for (let starCount = 0; starCount < total; starCount++) {
      let star = createElementWithClass("span", "review-star");
      star.textContent = String.fromCodePoint(STAR_EMOJI);
      reviewStars.appendChild(star);
    }
  }

  /**
   * Adds a product to the cart, then shows the cart.
   */
  function addToCart() {
    let tempCart = JSON.parse(window.localStorage.getItem("cart"));
    tempCart.push(currentProduct);
    window.localStorage.setItem("cart", JSON.stringify(tempCart.sort()));

    showCart();
    populateCart();
  }

  /**
   * Shows the cart section and hides other sections.
   */
  function showCart() {
    id("products").classList.add("hidden");
    id("user").classList.add("hidden");
    id("product").classList.add("hidden");
    id("cart").classList.remove("hidden");
  }

  /**
   * Shows the account section and hides other sections
   */
  function showAccount() {
    id("products").classList.add("hidden");
    id("cart").classList.add("hidden");
    id("product").classList.add("hidden");
    id("user").classList.remove("hidden");

    inverseCheckout();
  }

  /**
   * Shows the product section and hides other sections.
   */
  function showHomeView() {
    id("cart").classList.add("hidden");
    id("user").classList.add("hidden");
    id("product").classList.add("hidden");
    id("products").classList.remove("hidden");

    showProducts();
    inverseCheckout();
  }

  /**
   * Gets all of the products from the database and displays them.
   * This is usually run when the page is first loaded, but is
   * also used when resetting search and other filters.
   */
  function showAllProducts() {
    id("search-term").value = "";
    showProducts();

    id("filter-all").checked = true;

    currentProduct = null;
    resetProductDetails();
    showHomeView();

    fetch("/products")
      .then(statusCheck)
      .then((resp) => resp.json())
      .then((products) => {
        id("all-products").innerHTML = "";
        for (let product of products) {
          let productCard = genProductCard(product);
          id("all-products").appendChild(productCard);
        }
      })
      .catch((err) => handleError(err));
  }

  /**
   * Populates all the possible categories for the category filter.
   */
  function populateCategories() {
    let filters = id("category-filter");
    filters.innerHTML = "";

    fetch("/categories")
      .then(statusCheck)
      .then((resp) => resp.json())
      .then((categories) => {
        filters.appendChild(generateFilter("All"));
        for (let category of categories) {
          filters.appendChild(generateFilter(category));
        }
      })
      .catch((err) => handleError(err));
  }

  /**
   * Generates a category filter element that is a radio button.
   * Functionality is added to the radio button to filter products by category.
   * @param {string} value Value of the category filter.
   * @returns {object} New DOM object for the category filter.
   */
  function generateFilter(value) {
    let radio = gen("input");
    radio.type = "radio";
    radio.name = "category";
    radio.value = value;
    radio.id = "filter-" + value.toLowerCase().replaceAll(" ", "-");

    let label = gen("label");
    label.htmlFor = "filter-" + value.toLowerCase().replaceAll(" ", "-");
    label.textContent = value;

    let filter = gen("li");
    groupAppend(filter, [radio, label]);

    if (value === "All") {
      radio.checked = true;
    }

    radio.addEventListener("change", () => {
      currentCategory = value;
      filterProducts();
    });

    return filter;
  }

  /**
   * Adds funds to the user's balance.
   * @param {Event} event - The event object.
   */
  function addFunds(event) {
    event.preventDefault();

    id("add-funds-error").textContent = "";

    let data = new FormData(id("add-funds-form"));
    data.append("username", currentUser);

    fetch("/user/balance", {method: "POST", body: data})
      .then(statusCheck)
      .then((res) => res.text())
      .then((res) => {
        id("account-balance").textContent = "$" + parseInt(res).toFixed(2);
        id("add-funds-form").reset();
      })
      .catch((err) => (id("add-funds-error").textContent = err));
  }

  /**
   * Logs in the user when the user clicks on the login button.
   * The form data is sent to the server and the user is logged in.
   * @param {Event} event - The event object.
   */
  function signIn(event) {
    event.preventDefault();

    id("login-account-error").textContent = "";

    let data = new FormData(id("login-account-form"));

    fetch("/login", {method: "POST", body: data})
      .then(statusCheck)
      .then((res) => res.json())
      .then((res) => userFunctionality(res))
      .catch((err) => (id("login-account-error").textContent = err));
  }

  /**
   * Creates a new account when the user clicks on the create account button.
   * The form data is sent to the server and the user is logged in.
   * @param {Event} event - The event object.
   */
  function signUp(event) {
    event.preventDefault();

    id("create-account-error").textContent = "";

    let data = new FormData(id("create-account-form"));

    fetch("/signup", {method: "POST", body: data})
      .then(statusCheck)
      .then((res) => res.json())
      .then((res) => userFunctionality(res))
      .catch((err) => (id("create-account-error").textContent = err));
  }

  /**
   * Functionality that runs when a user logs in or creates
   * an account. Things like setting up the account page,
   * showing transactions, and enabling the checkout button.
   * @param {object} user - The user object.
   */
  function userFunctionality(user) {
    currentUser = user.username;
    window.localStorage.setItem("username", currentUser);

    id("welcome-message").textContent = "Welcome back, " + user.name + "!";
    id("user-details").textContent = "@" + user.username + " | " + user.email;

    id("user-main").classList.add("hidden");
    id("user-account").classList.remove("hidden");
    id("account-button").textContent = "Account";
    id("logout-button").addEventListener("click", logOut);

    id("account-balance").textContent = "$" + user.balance.toFixed(2);

    populateTransactions();

    let checkoutButton = id("checkout-button");

    checkoutButton.addEventListener("click", checkout);
    checkoutButton.disabled = false;
    checkoutButton.classList.remove("disabled");
    checkoutButton.classList.remove("text-button");
    checkoutButton.classList.add("button");
    checkoutButton.textContent = "Checkout";

    id("password").value = "";
  }

  /**
   * Logs the user out, clears the cart, and resets the page.
   * All additional data about the user on the page is also cleared.
   */
  function logOut() {
    // window.localStorage.removeItem("username");
    window.localStorage.setItem("cart", JSON.stringify([]));
    currentUser = null;

    id("welcome-message").textContent = "";
    id("user-details").textContent = "";

    resetProductDetails();
    id("user-main").classList.remove("hidden");
    id("user-account").classList.add("hidden");
    id("account-button").textContent = "Sign In/Sign Up";

    id("transactions").innerHTML = "";

    let checkoutButton = id("checkout-button");

    checkoutButton.removeEventListener("click", checkout);
    checkoutButton.disabled = true;
    checkoutButton.classList.add("disabled");
    checkoutButton.classList.add("text-button");
    checkoutButton.classList.remove("button");
    checkoutButton.textContent = "You must be logged in before checking out.";
  }

  /**
   * Resets the product details section.
   */
  function resetProductDetails() {
    qs(".product-image img").src = "";
    qs(".product-info .product-price").textContent = "";
    qs(".product-info .product-quantity").textContent = "";
    qs(".product-info .product-description").textContent = "";
    qs("#product .heading h3").textContent = "";
    id("welcome-message").textContent = "";
  }

  /**
   * Shows a product page when the user clicks on a product card.
   * @param {object} product - The product object.
   */
  function showProductPage(product) {
    currentProduct = product.id;
    id("search-term").value = "";
    id("products").classList.add("hidden");
    id("cart").classList.add("hidden");
    id("user").classList.add("hidden");
    id("product").classList.remove("hidden");

    qs("#product img").src = "/images/" + product.image;
    qs("#product img").alt = product.name;

    qs("#product .heading h3").textContent = product.name;
    qs(".product-info .product-description").textContent = product.description;
    qs(".product-info .product-price").textContent = "$" + product.price;

    let quantity = calculatedQuantity(product.quantity, product.id);
    let inStock = quantity > 0;

    qs(".product-info .product-quantity").textContent = inStock ?
      `In Stock: ${quantity} left!` :
      "Out of Stock";

    qs(".product-info .product-category").textContent = product.category;

    id("add-to-cart-button").disabled = !inStock;
    id("add-to-cart-button").textContent = inStock ?
      "Add to Cart" :
      "Check back soon!";

    id("add-to-cart-button").classList.toggle("disabled", !inStock);

    generateReviewStars(qs(".product-review-stars"), product.rating);
  }

  /**
   * A method that keeps track of the "real" quantity of a product,
   * taking into account the number of times it has been added to the cart.
   * @param {number} quantity - The quantity of the product.
   * @param {number} id - The id of the product.
   * @returns {number} The "real" quantity of the product.
   */
  function calculatedQuantity(quantity, id) {
    let tempCart = JSON.parse(window.localStorage.getItem("cart"));
    let count = tempCart.filter((item) => item === id).length;

    return quantity - count;
  }

  /**
   * Asks for confirmation after the user wants to check out.
   */
  function checkout() {
    id("checkout-button").classList.add("hidden");
    id("confirm-transaction").classList.remove("hidden");
    id("checkout-error").textContent = "";
  }

  /**
   * Cancels the transaction and hides the confirmation button.
   */
  function inverseCheckout() {
    id("checkout-button").classList.remove("hidden");
    id("confirm-transaction").classList.add("hidden");
    id("checkout-error").textContent = "";
  }

  /**
   * Confirms the transaction and sends the transaction details to the server.
   * The cart is also cleared, and the user is shown their account page with
   * their updated transaction history.
   */
  async function confirmTransaction() {
    let data = new FormData();
    data.append("username", currentUser);
    data.append(
      "cart",
      JSON.stringify(JSON.parse(window.localStorage.getItem("cart")))
    );
    data.append("total", await getCartTotal());

    fetch("/transaction", {method: "POST", body: data})
      .then(statusCheck)
      .then((res) => res.json())
      .then((res) => {
        window.localStorage.setItem("cart", JSON.stringify([]));
        populateTransactions();
        id("account-balance").textContent = "$" + res.balance.toFixed(2);
        showAccount();
      })
      .catch((err) => (id("checkout-error").textContent = err));
  }

  /**
   * Gets the total cost of the cart.
   */
  async function getCartTotal() {
    let tempCart = JSON.parse(window.localStorage.getItem("cart"));
    let total = 0;

    for (let product of tempCart) {
      await fetch("/product/" + product)
        .then(statusCheck)
        .then((resp) => resp.json())
        .then((resp) => {
          total += parseFloat(resp.price);
        })
        .catch((err) => handleError(err));
    }

    return total;
  }

  /**
   * A function used to track the input in the search bar. If the search
   * bar is empty, the search button is disabled. Otherwise, it is enabled.
   * This is to prevent users from searching for nothing.
   */
  function searchBarInput() {
    let searchTerm = id("search-term");
    let searchButton = id("search-button");

    let searchValue = searchTerm.value;

    if (searchValue.trim().length === 0) {
      searchButton.disabled = true;
      searchButton.classList.add("disabled");
    } else {
      searchButton.disabled = false;
      searchButton.classList.remove("disabled");
    }
  }

  /**
   * Resets the search bar and related actions and shows all products.
   */
  function resetSearch() {
    id("search-term").value = "";
    id("reset-search").classList.add("hidden");
    id("products-title").textContent = "All Products";
    showAllProducts();
  }

  /**
   * Searches for products based on the search term in the search bar.
   */
  function searchProducts() {
    showHomeView();

    id("reset-search").classList.remove("hidden");
    id("filter-all").checked = true;

    let term = id("search-term").value.trim();

    fetch("/search?phrase=" + term)
      .then(statusCheck)
      .then((resp) => resp.json())
      .then((resp) => hideProducts(resp))
      .catch((err) => handleError(err));
  }

  /**
   * Hides all products in the products area of the page except for the ones
   * whose category isn't the currently selected category. If the category is
   * "All", then all products are shown.
   */
  function filterProducts() {
    let products =
      id("search-term").value.trim().length === 0 ?
        qsa("#all-products .product-card") :
        qsa("#all-products .product-card.searched");

    if (currentCategory !== "All") {
      for (let i = 0; i < products.length; i++) {
        let product = products[i];
        let category = qs(`#${product.id} .card-category`).textContent;

        if (currentCategory !== category) {
          product.classList.add("hidden");
        } else {
          product.classList.remove("hidden");
        }
      }
    } else {
      for (let i = 0; i < products.length; i++) {
        let product = products[i];
        product.classList.remove("hidden");
      }
    }
  }

  /**
   * Hides all products in the products area of the page except for the ones
   * with the given product ids.
   * @param {array} productIds - The ids of the products to show.
   */
  function hideProducts(productIds) {
    let products = qsa("#all-products .product-card:not(.hidden)");

    for (let i = 0; i < products.length; i++) {
      let product = products[i];
      let productId = parseInt(product.id.replace("product-", ""));
      if (!productIds.includes(productId)) {
        product.classList.add("hidden");
      } else {
        product.classList.add("searched");
      }
    }

    if (productIds.length === 0) {
      id("products-title").textContent = "No products found. Try a different search.";
    } else {
      id("products-title").textContent = `${productIds.length} products found`;
    }
  }

  /**
   * Shows all products in the products area of the page.
   */
  function showProducts() {
    let products = qsa("#all-products .product-card");

    for (let i = 0; i < products.length; i++) {
      let product = products[i];
      product.classList.remove("hidden");
      product.classList.remove("searched");
    }
  }

  /**
   * Shows a notification with an error message.
   * @param {string} message - The error message to show.
   */
  function handleError(message) {
    id("error-notif").classList.remove("hidden");
    qs("#error-notif p").textContent = message;
  }

  /**
   * Closes the error notification.
   */
  function closeErrorNotif() {
    id("error-notif").classList.add("hidden");
    id("#error-notif p").textContent = "";
  }

  /**
   * Checks the status of the response and throws an error if it is not ok.
   * @param {object} res - the response to check
   * @returns {object} the response if it is ok
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();
