import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 2525,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Sends a welcome email to a new user.
 * @param {string} to - The recipient's email address.
 * @param {string} name - The recipient's name.
 * @param {string} tempPassword - The generated temporary password.
 */
const sendWelcomeEmail = async (to,firstname,lastname,tempPassword) => {
  const mailOptions = {
    from: '"LMS Portal Admin" <noreply@LMSportal.com>',
    to: to,
    subject: 'Welcome to the LMS Portal!',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Hello ${firstname} ${lastname},</h2>
        <p>An account has been created for you on the student portal.</p>
        <p>Please use the following credentials to log in. You will be required to change your password upon your first login.</p>
        <hr>
        <p><strong>Email ID:</strong> ${to}</p>
        <p><strong>Temporary Password:</strong> <strong>${tempPassword}</strong></p>
        <hr>
        <p><a href="http://localhost:5173/login" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Click Here to Login</a></p>
        <br>
        <p>Thank you,</p>
        <p>The Portal Administration Team</p>
      </div>
    `,
  };

  try {
    // 2. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Simulated welcome email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending simulated email to ${to}:`, error);
  }
};

const sendReport=async (adminEmail,operationType,successfulImports,errors,attachmentPath=null) => {
      const failureTotal=errors.length;
      const totalProcessed=successfulImports+failureTotal;
      // 1. Create the attachments array
      const attachments = [];
      if (attachmentPath && failureTotal > 0) {
           attachments.push({
           filename: 'errors.csv', // The name the admin will see
           path: attachmentPath,        // The path to the file on your server
           contentType: 'text/csv',
      });
      }

        // 2. Modify the email body to be simpler
        const errorDetails = failureTotal > 0
         ? `<p><strong>${failureTotal} records failed to process.</strong> Please see the attached 'errors.csv' file for details.</p>`
        : '<p>All records processed successfully!</p>';

        const mailOptions = {
           from: '"Student Portal Admin" <noreply@studentportal.com>',
           to: adminEmail,
           subject: `Report: ${operationType} Process Complete`,
           html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>Your ${operationType} report is ready.</h2>
            <p>The bulk operation you started has finished processing.</p>
            <hr>
            <h3>Summary:</h3>
            <ul>
            <li><strong>Total Records Processed:</strong> ${totalProcessed}</li>
            <li style="color: green;"><strong>Successful:</strong> ${successfulImports}</li>
            <li style="color: red;"><strong>Failed:</strong> ${failureTotal}</li>
           </ul>
           <hr>
           ${errorDetails}
          </div>
          `,
          // 3. Add the attachments array to the mail options
          attachments: attachments,
        };

        try {
          await transporter.sendMail(mailOptions);
             console.log(`Successfully sent  report to ${adminEmail}`);
         } catch (error) {
            console.error(`Failed to send  report to ${adminEmail}:`, error);
        }
    };   

export {sendWelcomeEmail,sendReport};