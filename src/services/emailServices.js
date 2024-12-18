import nodemailer from "nodemailer";
import mustache from "mustache";
import fs from "fs";
import path from "path";

import templates from "../templates/emails.js";
import { currencyMap } from "../utils/helpers.js";
import { User } from "../models/userModel.js";
import dayjs from "dayjs";

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

    const client = await User.findById(mission?.from_user_sub);
    const provider = await User.findById(mission?.to_user_sub);
    const completedDate = dayjs()
      .add(EXPRESS_MODE ? 5 : 120, EXPRESS_MODE ? "minute" : "hour")
      .set(EXPRESS_MODE ? "second" : "minute", 0)
      .set(EXPRESS_MODE ? "millisecond" : "second", 0)
      .set("millisecond", 0);

    const stripePaymentId = mission.paymentLink.split("/").pop();
    const variables = {
      client_first_name: client?.firstName,
      client_last_name: client?.lastName,
      client_email: client?.email,
      provider_first_name: provider?.firstName,
      provider_last_name: provider?.lastName,
      provider_email: provider?.email,
      mission_id: mission?.id,
      amount: mission?.amount,
      specifications: mission?.description,
      currency: currencyMap[mission?.currency],
      completed_date: completedDate.format("dddd, MMMM D, YYYY, h:mm A"),
      payment_id: stripePaymentId,
      ...extras,
    };
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
