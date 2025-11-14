// Signup
document.getElementById("signupForm") ? .addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (localStorage.getItem(email)) {
        alert("User already exists! Please login.");
    } else {
        localStorage.setItem(email, JSON.stringify({ name, password }));
        alert("Signup successful! You can now login.");
        window.location.href = "login.html";
    }
});

// Login
document.getElementById("loginForm") ? .addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const user = JSON.parse(localStorage.getItem(email));

    if (user && user.password === password) {
        alert("Login successful! Welcome " + user.name);
        window.location.href = "index.html"; // redirect to homepage
    } else {
        alert("Invalid email or password.");
    }
});