import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";
import path from "path";

import templates from "../templates/emails.js";
import { currencyMap } from "../utils/helpers.js";
import { User } from "../models/userModel.js";
import dayjs from "dayjs";
import FormData from "form-data";
import Mailgun from "mailgun.js";

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
    from: `Seal <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: subject,
    html: html,
  });
  return emailSent;
};

const EXPRESS_MODE = process.env.EXPRESS_MODE === "true";

export const sendEmailWithTemplateKey = async (
  recipient,
  key,
  mission,
  extras
) => {
  try {
    if (!recipient) {
      return;
    }
    const template = templates[key];
    const file = fs.readFileSync("./src/templates/generic-email.html", "utf8");

    const client = await User.findById(mission?.fromUserSub);
    const provider = await User.findById(mission?.toUserSub);
    const completedDate = dayjs()
      .add(EXPRESS_MODE ? 5 : 120, EXPRESS_MODE ? "minute" : "hour")
      .set(EXPRESS_MODE ? "second" : "minute", 0)
      .set(EXPRESS_MODE ? "millisecond" : "second", 0)
      .set("millisecond", 0);

    const stripePaymentId = mission?.paymentLink?.split("/").pop();
    const variables = {
      client_first_name: client?.firstName,
      client_last_name: client?.lastName,
      client_email: client?.email,
      provider_first_name: provider?.firstName
        ? provider?.firstName
        : mission?.recipient,
      provider_destination: provider?.email
        ? `<strong>Destination:</strong> ${provider?.firstName} ${provider?.lastName} (${provider?.email})<br><br>`
        : `<strong>Destination:</strong> ${mission?.recipient}<br><br>`,
      provider_last_name: provider?.lastName,
      provider_details: provider?.email
        ? `<strong>Provider:</strong> ${provider?.firstName} ${provider?.lastName} (${provider?.email})<br><br>`
        : `<strong>Provider:</strong> ${mission?.recipient}<br><br>`,
      provider_email: provider?.email,
      mission_id: mission?.id,
      amount: mission?.amount,
      specifications: mission?.description,
      currency: currencyMap[mission?.currency],
      completed_date: completedDate.format("dddd, MMMM D, YYYY, h:mm A"),
      ...extras,
    };
    if (stripePaymentId) {
      variables.payment_id = stripePaymentId;
    }
    const renderedTemplate = {};
    for (const [templateKey, templateValue] of Object.entries(template)) {
      renderedTemplate[templateKey] = mustache.render(templateValue, variables);
    }
    const document = mustache.render(file, {
      ...renderedTemplate,
      logo: `${process.env.API_URL}/images/logo.png`,
    });
    return sendEmail(recipient, renderedTemplate.subject, document);
  } catch (error) {
    console.log(error);
  }
};

export const sendEmailWithMailgunTemplate = async (
  recipient,
  templateName,
  mission,
  extras
) => {
  try {
    if (!recipient) {
      return;
    }

    const client = await User.findById(mission?.fromUserSub);
    const provider = await User.findById(mission?.toUserSub);
    const completedDate = dayjs()
      .add(EXPRESS_MODE ? 5 : 120, EXPRESS_MODE ? "minute" : "hour")
      .set(EXPRESS_MODE ? "second" : "minute", 0)
      .set(EXPRESS_MODE ? "millisecond" : "second", 0)
      .set("millisecond", 0);

    const stripePaymentId = mission?.paymentLink?.split("/").pop();

    const template_variables = {
      client_first_name: client?.firstName,
      client_last_name: client?.lastName,
      client_email: client?.email,
      provider_first_name: provider?.firstName || mission?.recipient,
      provider_last_name: provider?.lastName,
      provider_email: provider?.email,
      provider_destination: provider?.email
        ? `${provider?.firstName} ${provider?.lastName} (${provider?.email})`
        : mission?.recipient,
      provider_details: provider?.email
        ? `${provider?.firstName} ${provider?.lastName} (${provider?.email})`
        : mission?.recipient,
      mission_id: mission?.id,
      amount: mission?.amount,
      specifications: mission?.description,
      currency: currencyMap[mission?.currency],
      completed_date: completedDate.format("dddd, MMMM D, YYYY, h:mm A"),
      payment_id: stripePaymentId,
      ...extras,
    };
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_API_URL,
    });
    return await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Seal Payment${process.env.EMAIL_FROM_ADDRESS}`,
      to: recipient,
      template: templateName,
      "h:X-Mailgun-Variables": JSON.stringify(template_variables),
    });
  } catch (error) {
    console.log(error);
  }
};
