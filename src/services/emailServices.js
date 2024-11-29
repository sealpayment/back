import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";

export const sendEmail = async (email, subject, html) => {
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
    html: html,
  });
  return emailSent;
};

export const sendEmailWithTemplate = async (
  recipient,
  subject,
  template,
  variables
) => {
  try {
    const logo = fs.readFileSync("./src/templates/logo.png").toString("base64");
    const file = fs.readFileSync(template, "utf8");
    const document = mustache.render(file, {
      ...variables,
      logo,
    });
    return sendEmail(recipient, subject, document);
  } catch (error) {
    console.log(error);
  }
};
