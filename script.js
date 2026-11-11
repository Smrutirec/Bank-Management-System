
// Load saved information from Local Storage
let accounts = JSON.parse(
    localStorage.getItem("bankAccounts")
) || [];

let transactions = JSON.parse(
    localStorage.getItem("bankTransactions")
) || [];

// Save data
function saveData() {
    localStorage.setItem(
        "bankAccounts",
        JSON.stringify(accounts)
    );

    localStorage.setItem(
        "bankTransactions",
        JSON.stringify(transactions)
    );
}

// Convert amount into two decimal places
function money(value) {
    return Number(value).toFixed(2);
}

// Protect customer names before displaying them
function safeText(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Generate account number
function generateAccountNumber() {
    let number;

    do {
        number = String(
            Math.floor(100000 + Math.random() * 900000)
        );
    } while (accounts.some(a => a.number === number));

    return number;
}

// Record transaction
function addTransaction(account, type, amount) {
    transactions.unshift({
        date: new Date().toLocaleString(),
        account: account,
        type: type,
        amount: money(amount)
    });
}

// Create new account
document.getElementById("accountForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById(
        "customerName"
    ).value.trim();

    const deposit = Number(
        document.getElementById("initialDeposit").value
    );

    if (!name || !Number.isFinite(deposit) ||
        deposit < 0 || !Number.isSafeInteger(
            Math.round(deposit * 100)
        )) {
        alert("Enter valid customer details.");
        return;
    }

    const account = {
        number: generateAccountNumber(),
        name: name,
        balance: Math.round(deposit * 100) / 100
    };

    accounts.push(account);

    if (deposit > 0) {
        addTransaction(account.number, "Opening Deposit", deposit);
    }

    saveData();
    displayAccounts();
    updateDashboard();

    alert(
        "Account created successfully!\nAccount Number: " +
        account.number
    );

    this.reset();
});

// Deposit and Withdraw
document.getElementById("transactionForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const number = document.getElementById(
        "accountNumber"
    ).value.trim();

    const type = document.getElementById(
        "transactionType"
    ).value;

    const amount = Number(
        document.getElementById("amount").value
    );

    const account = accounts.find(
        a => a.number === number
    );

    if (!account) {
        alert("Account not found!");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0 ||
        !Number.isSafeInteger(Math.round(amount * 100))) {
        alert("Enter a valid amount.");
        return;
    }

    const value = Math.round(amount * 100) / 100;

    if (type === "deposit") {
        account.balance = Math.round(
            (account.balance + value) * 100
        ) / 100;

        addTransaction(number, "Deposit", value);

        alert("Money deposited successfully!");
    }

    else {
        if (account.balance < value) {
            alert("Insufficient balance!");
            return;
        }

        account.balance = Math.round(
            (account.balance - value) * 100
        ) / 100;

        addTransaction(number, "Withdrawal", value);

        alert("Money withdrawn successfully!");
    }

    saveData();
    displayAccounts();
    displayTransactions();
    updateDashboard();

    this.reset();
});

// Transfer Money
document.getElementById("transferForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const from = document.getElementById(
        "fromAccount"
    ).value.trim();

    const to = document.getElementById(
        "toAccount"
    ).value.trim();

    const amount = Number(
        document.getElementById("transferAmount").value
    );

    const sender = accounts.find(a => a.number === from);
    const receiver = accounts.find(a => a.number === to);

    if (!sender || !receiver) {
        alert("One or both accounts do not exist!");
        return;
    }

    if (sender === receiver) {
        alert("Cannot transfer money to the same account!");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0 ||
        !Number.isSafeInteger(Math.round(amount * 100))) {
        alert("Enter a valid transfer amount.");
        return;
    }

    const value = Math.round(amount * 100) / 100;

    if (sender.balance < value) {
        alert("Insufficient balance!");
        return;
    }

    sender.balance = Math.round(
        (sender.balance - value) * 100
    ) / 100;

    receiver.balance = Math.round(
        (receiver.balance + value) * 100
    ) / 100;

    addTransaction(from, "Transfer Sent", value);
    addTransaction(to, "Transfer Received", value);

    saveData();
    displayAccounts();
    displayTransactions();
    updateDashboard();

    alert("Money transferred successfully!");

    this.reset();
});

// Display Accounts
function displayAccounts() {

    const table = document.getElementById(
        "accountTable"
    );

    const search = document.getElementById(
        "searchAccount"
    ).value.toLowerCase();

    table.innerHTML = "";

    accounts
    .filter(account =>
        account.name.toLowerCase().includes(search) ||
        account.number.includes(search)
    )
    .forEach(account => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${safeText(account.number)}</td>
            <td>${safeText(account.name)}</td>
            <td>₹${money(account.balance)}</td>
            <td>
                <button class="delete-btn"
                    data-account="${safeText(account.number)}">
                    Delete
                </button>
            </td>
        `;

        table.appendChild(row);
    });
}

// Delete Account
document.getElementById("accountTable")
.addEventListener("click", function(event) {

    const button = event.target.closest(
        "button[data-account]"
    );

    if (!button) return;

    const number = button.dataset.account;

    const account = accounts.find(
        a => a.number === number
    );

    if (!account) return;

    if (account.balance !== 0) {
        alert("Withdraw the remaining balance before deleting.");
        return;
    }

    if (confirm("Are you sure you want to delete this account?")) {

        accounts = accounts.filter(
            a => a.number !== number
        );

        saveData();
        displayAccounts();
        updateDashboard();

        alert("Account deleted successfully!");
    }
});

// Display Transaction History
function displayTransactions() {

    const table = document.getElementById(
        "transactionTable"
    );

    table.innerHTML = "";

    transactions.forEach(transaction => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${safeText(transaction.date)}</td>
            <td>${safeText(transaction.account)}</td>
            <td>${safeText(transaction.type)}</td>
            <td>₹${money(transaction.amount)}</td>
        `;

        table.appendChild(row);
    });
}

// Update Dashboard
function updateDashboard() {

    const total = accounts.reduce(
        (sum, account) => sum + account.balance,
        0
    );

    document.getElementById(
        "totalBalance"
    ).textContent = "₹" + money(total);

    document.getElementById(
        "accountCount"
    ).textContent = "Total Accounts: " + accounts.length;
}

// Search Accounts
document.getElementById("searchAccount")
.addEventListener("input", displayAccounts);

// Initial Display
displayAccounts();
displayTransactions();
updateDashboard();
