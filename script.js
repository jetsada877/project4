// Mock user data (ตัวอย่างข้อมูลผู้ใช้)
const mockUser = {
    username: "admin",
    password: "123456"
};

document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้า

    // ดึงค่าจากฟอร์ม
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // ตรวจสอบข้อมูลผู้ใช้
    if (username === mockUser.username && password === mockUser.password) {
        alert("Login Successful!");
        localStorage.setItem("username", username); // บันทึกชื่อผู้ใช้
        window.location.href = "menu.html"; // ไปยังหน้าเมนู
    }
     else {
        document.getElementById("errorMessage").textContent = "Invalid Username or Password.";
    }
});
