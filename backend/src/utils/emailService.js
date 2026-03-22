import nodemailer from 'nodemailer';

const getFrontendBaseUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const canSendEmail = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const safeSend = async (mailOptions) => {
  if (!canSendEmail()) {
    console.log(`Email skipped (SMTP not configured): ${mailOptions.subject} -> ${mailOptions.to}`);
    return { skipped: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { skipped: false };
  } catch (error) {
    console.error('Email Error:', error);
    return { skipped: false, error: error.message };
  }
};

const emailService = {
  sendMatchAlert: async (userEmail, job) => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `New Job Match: ${job.title} at ${job.company}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #222831;">
          <h2 style="color: #00ADB5;">New Match Found!</h2>
          <p>We found a new job that matches your profile with a score of <strong>${job.matchScore}%</strong>.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin: 0;">${job.title}</h3>
            <p style="margin: 5px 0; color: #393E46;">${job.company} - ${job.location}</p>
          </div>
          <a href="${getFrontendBaseUrl()}/dashboard/job-feed" style="background: #00ADB5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Job Details</a>
        </div>
      `,
    };

    await safeSend(mailOptions);
    console.log(`Match alert processed for ${userEmail}`);
  },

  sendWeeklyDigest: async (userEmail, count, highlights = []) => {
    const highlightHtml = highlights.length
      ? `<ul>${highlights.map((h) => `<li>${h}</li>`).join('')}</ul>`
      : '<p>No major highlights this week.</p>';

    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Your Weekly Jobsbazaar Digest',
      html: `<p>Hi,</p><p>You had ${count} application-related updates this week.</p>${highlightHtml}<p>Visit your dashboard for details.</p>`
    };

    await safeSend(mailOptions);
  },

  sendApplicationConfirmation: async (userEmail, userName, job) => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Application confirmed: ${job?.title || 'Job'} at ${job?.company || 'Company'}`,
      html: `<p>Hi ${userName},</p><p>We tracked your application for <strong>${job?.title || 'this role'}</strong> at <strong>${job?.company || 'the company'}</strong>.</p><p>We will keep you posted with reminders and follow-ups.</p>`
    };

    await safeSend(mailOptions);
  },

  sendFiveDayFollowUpReminder: async (userEmail, userName, job) => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `5-day follow-up reminder for ${job?.title || 'your application'}`,
      html: `<p>Hi ${userName},</p><p>It has been 5 days since your application to <strong>${job?.company || 'this company'}</strong>.</p><p>Consider sending a concise follow-up message.</p>`
    };

    await safeSend(mailOptions);
  },

  sendInterviewReminder: async (userEmail, userName, job, whenText = 'soon') => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Interview reminder: ${job?.title || 'Upcoming interview'}`,
      html: `<p>Hi ${userName},</p><p>This is your reminder for an interview with <strong>${job?.company || 'the company'}</strong> ${whenText}.</p><p>Review your match notes and prepare examples from your projects.</p>`
    };

    await safeSend(mailOptions);
  },

  sendNewMatchAlert: async (userEmail, userName, jobs = []) => {
    const listHtml = jobs.length
      ? `<ul>${jobs.map((j) => `<li>${j.title} at ${j.company} (${j.matchScore || 0}% match)</li>`).join('')}</ul>`
      : '<p>No high-priority matches today.</p>';

    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'New high-match jobs available for you',
      html: `<p>Hi ${userName},</p><p>We found new high-match opportunities:</p>${listHtml}<p><a href="${getFrontendBaseUrl()}/dashboard/best-matches">Open Best Matches</a></p>`
    };

    await safeSend(mailOptions);
  },

  sendVerificationEmail: async (userEmail, userName, token) => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Verify your email - Jobsbazaar',
      html: `<p>Hi ${userName},</p><p>Click <a href="${getFrontendBaseUrl()}/verify-email?token=${token}">here</a> to verify your email.</p>`,
    };
    await safeSend(mailOptions);
  },

  sendWelcomeEmail: async (userEmail, userName) => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to Jobsbazaar!',
      html: `<p>Hi ${userName},</p><p>Welcome to Jobsbazaar! We're glad to have you.</p>`,
    };
    await safeSend(mailOptions);
  },

  sendResetPasswordEmail: async (userEmail, userName, token) => {
    const mailOptions = {
      from: `"Jobsbazaar" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Reset your password - Jobsbazaar',
      html: `<p>Hi ${userName},</p><p>Click <a href="${getFrontendBaseUrl()}/reset-password?token=${token}">here</a> to reset your password.</p>`,
    };
    await safeSend(mailOptions);
  }
};

export const {
  sendMatchAlert,
  sendWeeklyDigest,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendApplicationConfirmation,
  sendFiveDayFollowUpReminder,
  sendInterviewReminder,
  sendNewMatchAlert
} = emailService;
export default emailService;
