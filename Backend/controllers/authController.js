import db from '../Database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * A private helper function to issue and send tokens.
 */
const _issueTokensAndSendResponse = async (res, user, role) => {
  try {
    const payload = { 
      user: { 
        id: user.id, 
        role: role, 
        name: user.name // Store the name in the refresh token
      } 
    };

    // 1. Create Access Token (short-lived)
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 2. Create Refresh Token (long-lived)
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // 3. Save the Refresh Token to the database (for revocation)
    await db.query(
      "INSERT INTO refresh_tokens (token, user_id, role) VALUES ($1, $2, $3)",
      [refreshToken, user.id, role]
    );

    // 4. Send the Refresh Token as a secure, HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // 5. Send the Access Token and user info in the response body
    res.status(200).json({ success: true, accessToken, user });
  } catch (err) {
    console.error("Token Issuing Error: ", err);
    throw new Error("Server error during token generation");
  }
};

/**
 * Handles login for all user roles.
 */
export const login = async (req, res) => {
  const { userID, password, role } = req.body;

  if (!userID || !password || !role) {
    return res.status(400).json({ success: false, message: "Missing credentials or role" });
  }

  let query;
  let passwordColumn;
  let userData;

  try {
    // 1. Determine which table to query
    switch (role) {
      case 'Admin':
        query = `SELECT Admin_ID, Admin_Password FROM Site_Admin WHERE Admin_ID = $1`;
        passwordColumn = 'admin_password';
        break;
      case 'Student':
        query = `SELECT Student_ID, Student_First_Name, Student_Password FROM Student WHERE Student_ID = $1`;
        passwordColumn = 'student_password';
        break;
      case 'Teacher':
        query = `SELECT Teacher_ID, Teacher_First_Name, Teacher_Password FROM Teacher WHERE Teacher_ID = $1`;
        passwordColumn = 'teacher_password';
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    // 2. Fetch the user
    const result = await db.query(query, [userID]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const user = result.rows[0];

    // 3. Compare the password
    const isMatch = await bcrypt.compare(password, user[passwordColumn]);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 4. Prepare user data and issue tokens
    switch (role) {
      case 'Admin':
        userData = { id: user.admin_id, name: "Admin" };
        break;
      case 'Student':
        userData = { id: user.student_id, name: user.student_first_name };
        break;
      case 'Teacher':
        userData = { id: user.teacher_id, name: user.teacher_first_name };
        break;
    }
    
    await _issueTokensAndSendResponse(res, userData, role);

  } catch (err) {
    console.error(`Login error for role ${role}:`, err);
    res.status(500).json({ msg: "Server error", success: false });
  }
};

/**
 * Generates a new access token using a valid refresh token.
 */
export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token" });
  }

  // Check if token is in our database (not revoked)
  const { rows } = await db.query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
  if (rows.length === 0) {
    return res.status(403).json({ success: false, message: "Refresh token not found or revoked" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const userFromToken = { 
      id: decoded.user.id, 
      role: decoded.user.role,
      name: decoded.user.name // We stored the name in the refresh token
    };

    // --- FIX WAS HERE ---
    // We now have the user's name from the refresh token payload.
    // We trust this because the refresh token is signed and verified.
    // If you were concerned about name changes, you would re-fetch from the DB here.
    // For this app, trusting the token is efficient and secure.
    const user = { id: userFromToken.id, name: userFromToken.name };

    // Issue a new access token
    const accessToken = jwt.sign(
      { user: userFromToken }, // Sign a new payload
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    
    // Send back the new token AND the user data
    res.json({ success: true, accessToken, user });
    
  } catch (err) {
    // This will catch expired refresh tokens
    return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

/**
 * Logs a user out by revoking their refresh token.
 */
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(204).send(); // Already logged out
  }

  try {
    // 1. Delete the token from the database
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);

    // 2. Clear the cookie from the browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error during logout" });
  }
};