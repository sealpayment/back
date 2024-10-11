import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";

export const sendEmail = (email, subject, document) => {
  const transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: "notification@ariane.guide",
      pass: "@Ariane!210123",
    },
  });

  const mailOptions = {
    name: "Ariane",
    from: "notification@ariane.guide",
    to: email,
    subject: subject,
    html: document,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.send("Email envoyé: " + info.response);
  });
};
