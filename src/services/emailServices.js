import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";
import path from "path";

import templates from "../templates/emails.js";
import { signedS3Url } from "../utils/aws.js";

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
    const file = fs.readFileSync(template, "utf8");
    const document = mustache.render(file, {
      ...variables,
    });
    return sendEmail(recipient, subject, document);
  } catch (error) {
    console.log(error);
  }
};

export const sendEmailWithTemplateKey = async (recipient, key, variables) => {
  try {
    if (!recipient) {
      return;
    }
    const logoUrl = await signedS3Url(
      "ilmlak-public",
      "s3://ilmlak-public/BindPay1.png"
    );
    const template = templates[key];
    const file = fs.readFileSync("./src/templates/generic-email.html", "utf8");
    const renderedTemplate = {};
    for (const [templateKey, templateValue] of Object.entries(template)) {
      renderedTemplate[templateKey] = mustache.render(templateValue, variables);
    }
    const document = mustache.render(file, {
      ...renderedTemplate,
      ...variables,
      logo: logoUrl,
    });
    return sendEmail(recipient, renderedTemplate.subject, document);
  } catch (error) {
    console.log(error);
  }
};

export const getDocumentWithTemplate = async (key, variables) => {
  try {
    const template = templates[key];
    const file = fs.readFileSync("./src/templates/generic-email.html", "utf8");
    const body = template.body ? mustache.render(template.body, variables) : "";
    const details = template.details
      ? mustache.render(template.details, variables)
      : "";
    return mustache.render(file, {
      ...template,
      body,
      details,
      ...variables,
    });
  } catch (error) {
    console.log(error);
  }
};
