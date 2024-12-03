import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";
import path from "path";

import templates from "../templates/emails.js";

export const sendEmail = async (email, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const emailSent = await transporter.sendMail({
    from: `Bindpay <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: subject,
    html: html,
  });
  return emailSent;
};

export const sendEmailWithTemplateKey = async (recipient, key, variables) => {
  try {
    if (!recipient) {
      return;
    }
    const template = templates[key];
    const file = fs.readFileSync("./src/templates/generic-email.html", "utf8");
    const renderedTemplate = {};
    for (const [templateKey, templateValue] of Object.entries(template)) {
      renderedTemplate[templateKey] = mustache.render(templateValue, variables);
    }
    const document = mustache.render(file, {
      ...renderedTemplate,
      ...variables,
      logo: `${process.env.API_URL}/images/logo.png`,
    });
    return sendEmail(recipient, renderedTemplate.subject, document);
  } catch (error) {
    console.log(error);
  }
};
