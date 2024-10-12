import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";

export const sendEmail = async (email, subject, body) => {
  const transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: "notification@ariane.guide",
      pass: "@Ariane!210123",
    },
  });

  const emailSent = await transporter.sendMail({
    from: "Bindpay <notification@ariane.guide>",
    to: email,
    subject: subject,
    text: body,
  });
  return emailSent;
};
