import db from '../Database/db.js';
import crypto from 'crypto'; // Built-in Node.js module
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '../Services/emailService.js';

/**
 * Finds a user by their email and role, checking all three user tables.
 * This is a critical utility for the reset process.
 */
const findUserByEmailAndRole = async (email, role) => {
  let query, table, idCol, nameCol, emailCol;

  switch (role) {
    case 'Student':
      table = 'Student';
      idCol = 'Student_ID';
      nameCol = 'Student_First_Name';
      emailCol = 'Student_Email_ID';
      break;
    case 'Teacher':
      table = 'Teacher';
      idCol = 'Teacher_ID';
      nameCol = 'Teacher_First_Name';
      emailCol = 'Teacher_Email_ID';
      break;
    default:
      return null;
  }
  
  query = `SELECT ${idCol} as id, ${nameCol} as name, ${emailCol} as email, '${role}' as role FROM ${table} WHERE ${emailCol} = $1`;
  const { rows } = await db.query(query, [email]);
  
  return rows[0]; // Returns the user or undefined
};

/**
 * Updates a user's password in the correct table.
 */
const updateUserPassword = async (userId, role, newHashedPassword) => {
  let query, table, idCol, passCol;

  switch (role) {
    case 'Student':
      table = 'Student';
      idCol = 'Student_ID';
      passCol = 'Student_Password';
      break;
    case 'Teacher':
      table = 'Teacher';
      idCol = 'Teacher_ID';
      passCol = 'Teacher_Password';
      break;
    default:
      throw new Error('Invalid role');
  }

  query = `UPDATE ${table} SET ${passCol} = $1 WHERE ${idCol} = $2`;
  await db.query(query, [newHashedPassword, userId]);
};


/**
 * @route   POST /api/password/forgot
 * @desc    Handles the "forgot password" request.
 * Finds user, generates token, sends reset email.
 */
export const forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  try {
    const user = await findUserByEmailAndRole(email, role);

    // --- SECURITY ---
    // Always send a 200 OK, even if the user is not found.
    // This prevents "user enumeration attacks," where a hacker
    // can guess valid emails by checking for 404 vs 200.
    if (!user) {
      console.log(`Password reset attempt for non-existent user: ${email} (${role})`);
      return res.status(200).json({ message: 'If an account with this email and role exists, a reset link has been sent.' });
    }

    // 1. Create a secure, random token (this is for the URL)
    const token = crypto.randomBytes(32).toString('hex');
    
    // 2. Hash the token (this is what we store in the DB)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Store the hashed token in the database
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, role, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, user.role, tokenHash, expiresAt]
    );

    // 5. Send the email with the *plaintext* token
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.status(200).json({ message: 'If an account with this email and role exists, a reset link has been sent.' });

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * @route   POST /api/password/reset
 * @desc    Handles the actual password reset.
 * Verifies token, updates password, deletes token.
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    // 1. Hash the token from the URL
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find the *valid* and *unexpired* token in the database
    const { rows } = await db.query(
      `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token is invalid or has expired. Please try again.' });
    }

    const tokenData = rows[0];

    // 3. Hash the new password for storage
    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    // 4. Update the correct user's password
    await updateUserPassword(tokenData.user_id, tokenData.role, newHashedPassword);

    // 5. --- CRITICAL ---
    //     Delete the token so it cannot be used again.
    await db.query(`DELETE FROM password_reset_tokens WHERE id = $1`, [tokenData.id]);

    res.status(200).json({ message: 'Password has been updated successfully. You can now log in.' });

  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};