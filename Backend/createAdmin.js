import db from "./Database/db.js";
import bcrypt from "bcryptjs";

const email=process.env.ADMIN_ID;
const password=process.env.ADMIN_PASSWORD;
const saltRounds=12;

async function createAdmin() {
    let existingAdmin=await db.query("SELECT Admin_ID from Site_Admin");
    if(existingAdmin.rows.length>0) {
        console.log("Admin already exists. Permission Denied");
        return;
    }
    const hashedPassword=bcrypt.hash(password, saltRounds);
    await db.query("INSERT INTO Site_Admin VALUES($1,$2)",[email,hashedPassword]);
    console.log("Admin Account created Successfully");
}
try {
    createAdmin();
}
catch(err) {
    console.error("Error: ",err);
}