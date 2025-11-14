// Teacher Registration Form Script
document.getElementById("teacherForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const experience = document.getElementById("experience").value.trim();
    const about = document.getElementById("about").value.trim();

    if (name && email && subject && experience && about) {
        alert(`Thank you ${name}! Your registration has been received. We'll contact you soon.`);
        document.getElementById("teacherForm").reset();
    } else {
        alert("Please fill in all fields before submitting.");
    }
});

document.getElementById("teacherForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("register_teacher.php", {
            method: "POST",
            body: formData,
        })
        .then((response) => response.text())
        .then((data) => {
            if (data.trim() === "success") {
                alert("✅ Thank you! Your registration has been successfully submitted.");
                document.getElementById("teacherForm").reset();
            } else {
                alert("❌ Error submitting form: " + data);
            }
        })
        .catch((error) => {
            alert("⚠️ Something went wrong: " + error);
        });
});


const params = new URLSearchParams(window.location.search);
if (params.get('error')) {
    alert(decodeURIComponent(params.get('error')));
}
if (params.get('success')) {
    alert(decodeURIComponent(params.get('message') || 'Registration successful.'));
    // optional: clear form or scroll
}