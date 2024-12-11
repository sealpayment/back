const WEBSITE_URL = process.env.WEBSITE_URL;

export default {
  disputeOpenedClient: {
    subject: "You opened a dispute",
    title: "Your dispute is opened",
    body:
      "Dear {{ provider_first_name }}," +
      "<p>We have received your dispute for your payment:</p>" +
      "<p><strong>What happens now?</strong></p>" +
      "<p>1. The provider now has <strong>24 hours</strong> to answer the dispute and send information related to it.</p>" +
      "<p>2. Then the BindPay Dispute Team will settle the dispute within 12 hours. You will either get your money back or the payment will be released to the provider.</p>",
    detail_title: "Payment details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Destination:</strong> {{ provider_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "View Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{mission_id}}`,
  },
  disputeOpenedProvider: {
    subject:
      "{{ client_first_name }} raised a dispute - Respond within 24 hours",
    title: "Tell us what happened",
    body:
      "Dear {{ provider_first_name }}," +
      "<p>Oops! Your customer has reported your mission as incomplete.</p>" +
      "<p><strong>What should you do now?</strong></p>" +
      "<p><strong>1. Read the dispute</strong></p>" +
      "<p>2. Submit your objection within <strong>24 hours</strong></p>",
    detail_title: "Payment details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Payer:</strong> {{ client_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Respond to the Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{mission_id}}`,
  },
  disputeReviewed: {
    subject: "Dispute resolution completed",
    title: "Your dispute has been reviewed",
    body:
      "Dear {{ client_first_name }}," +
      "<p>We have resolved the dispute for your payment.</p>" +
      "<p><strong>Outcome:</strong></p>" +
      "<p>{{ outcome_description }}</p>",
    detail_title: "Payment details",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Destination:</strong> {{ provider_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Send another payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  disputeNoAnswer: {
    subject: "Dispute deadline passed: Payment will be refunded",
    title: "No response received – Funds returned to payer",
    body:
      "Dear {{ provider_first_name }}," +
      "<p>We have not received a response from you regarding the dispute raised by {{ client_first_name }}. </p>" +
      "<p>As per our terms, the funds will be returned to the payer.</p>",
    detail_title: "Payment details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Payer:</strong> {{ client_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
  },
  // signupConfirmEmail: {
  //   subject: "Please Confirm Your Email",
  //   title: "Please Confirm Your Email",
  //   body:
  //     "Before you dive in, we need to confirm your email address to ensure your account is secure and ready to go. " +
  //     "<p>Once you’ve verified your email, you’ll be ready to:</p>" +
  //     "<p>✅ Set up secure, hassle-free transactions.</p>" +
  //     "<p>✅ Protect your payments with ease.</p>" +
  //     "<p>✅ Enjoy a trusted platform for all your payment needs.</p>",
  // },
  signupSuccess: {
    subject: "Welcome to BindPay, secure payments made simple 🎉",
    title: "Welcome to BindPay!",
    body:
      "Dear {{ first_name }}" +
      "<p>We’re thrilled to have you on board!</p>" +
      "<p>You’ve taken the first step toward secure, hassle-free transactions. Whether you’re managing a project or getting paid for your hard work, BindPay ensures your funds are protected every step of the way.</p>" +
      "<p>Now, let’s get started!</p>",
    action_title: "Send or Ask Payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  forgotPassword: {
    subject: "Reset Your Password",
    title: "Reset Your Password",
    body: "You’ve requested to reset your password. Click the button below to create a new password and access your account.",
    action_title: "Reset Password",
    action_link: `${WEBSITE_URL}/auth/reset-password?token={{ token }}`,
  },
  paymentRequestUser: {
    subject: "{{ provider_first_name }} requests payment via BindPay",
    title: "BindPay payment request",
    body:
      "Dear {{ client_first_name }}" +
      "<p>{{ provider_first_name }} has requested a BindPay payment to get their mission started.</p>",
    detail_title: "Mission details",
    details:
      "<p><strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Go to payment",
    action_link: "https://checkout.stripe.com/c/pay/{{ payment_id }}",
  },
  paymentRequestAnonymous: {
    subject: "{{ provider_first_name }} requests payment via BindPay",
    title: "BindPay payment request",
    body:
      "Dear future BindPay user," +
      "<p>Nice to meet you!</p>" +
      "<p>{{ provider_first_name }} has requested a BindPay payment to get their mission started.</p>" +
      "<p><strong>Why using BindPay?</strong></p>" +
      "<p>BindPay is a secure payment platform that holds funds until the job is completed as agreed, protecting both you and your provider.</p>" +
      "<p>No fees for the payer.</p>" +
      "<p>Way more efficient than a contract.</p>" +
      "<p>Fast delivery. Maximum 5 days to complete the mission.</p>",
    detail_title: "Mission details",
    details:
      "<p><strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Sign Up And Pay",
    action_link: `${WEBSITE_URL}/auth/register`,
  },
  missionCreated: {
    subject: "Your payment is securely held by BindPay",
    title: "Your payment is now securely held",
    body: "Congratulations, your payment is securely held by BindPay.",
    detail_title: "Payment Details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Destination:</strong> {{ provider_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Send Another Payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionReceived: {
    subject: "Your payment is securely held by BindPay",
    title: "Your payment is now securely held",
    body:
      "Dear {{ client_first_name }}," +
      "<p><strong>What’s Next?</strong></p>" +
      "<p>1. Complete the mission as agreed by the <strong>{{ completed_date }}</strong> deadline.</p>" +
      "<p>2. Ensure your work aligns with the specifications provided.</p>",
    detail_title: "Mission Details:",
    details:
      "<p><strong>Client:</strong> {{ client_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Open BindPay Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionReceivedUser: {
    subject: "You have received a payment from {{ client_first_name }}",
    title: "Complete your mission to receive the funds on your bank account",
    body:
      "Dear {{ provider_first_name }}," +
      "<p>Congratulations! {{ client_first_name }}, has sent a you a payment of {{currency}}{{amount}}.</p>" +
      "<p>The funds are securely held by BindPay, you now have 5 days to complete your mission.</p>",
    detail_title: "Mission Details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Open BindPay Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionReceivedAnonymous: {
    subject: "You have received a payment from {{ client_first_name }}",
    title:
      "Create your account and complete your mission to release the payment to your bank account",
    body:
      "Dear new BindPay user," +
      "<p>Congratulations! {{ client_first_name }}, has sent a you a payment of {{currency}}{{amount}}.</p>" +
      "<p>The funds are securely held by BindPay and will be released once you complete the mission as agreed.</p>" +
      "<p><strong>What’s Next?</strong></p>" +
      "<p><strong>1. Create your BindPay account</strong></p>" +
      "<p>2. Complete the mission before the deadline and make sure it aligns with the specifications.</p>" +
      "<p>3. If you comply with the specifications, you will receive the money on your bank account within 7 days.</p>",
    detail_title: "Mission Details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Create my account",
    action_link: `${WEBSITE_URL}/auth/register`,
  },
  missionCancelled: {
    subject: "Your Mission Has Been Cancelled",
    title: "Your Mission Has Been Cancelled",
    body: "<p>The mission associated with your payment of <strong>{{ currency }}{{ amount }}</strong> has been canceled by the provider (<strong>{{ provider_email }}</strong>). As a result, the full payment has been automatically refunded to your payment method.</p>",
    detail_title: "Transaction Details:",
    details:
      "<p><strong>Provider:</strong> {{ provider_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Reason:</strong> Mission Cancelled</p>",
  },
  missionCompletedClient: {
    subject:
      "{{ provider_first_name }’s mission has ended - Review within 12 hours",
    title: "Funds will be released soon – Review now",
    body:
      "Dear {{ client_first_name }}," +
      "<p>{{ provider_first_name }}’s 5-day mission has just ended.</p>" +
      "<strong>The funds will be released in 12 hours unless you judge that the specifications have not been met and want to raise a dispute.</strong>",
    detail_title: "Mission details",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>" +
      "<p><strong>The specifications are not met?</strong></p>",
    action_title: "Open a Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{ mission_id }}`,
  },
  missionCompletedProvider: {
    subject: "Mission completed – Your funds will be released soon",
    title: "Your will receive the money on your bank account within 7 days",
    body:
      "Dear {{ provider_first_name }}," +
      "<p>Congratulations on completing your mission!</p>" +
      "<p>The funds are being processed and will be delivered to your bank account within <strong>7 days</strong>.</p>" +
      "<p>Thank you for your excellent work and for using BindPay to secure your payments.</p>",
    detail_title: "Next steps :",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
  },
  missionReminder: {
    subject: "Reminder: Mission deadline in 24 hours",
    title: "Complete your mission within 24 hours to secure payment",
    body:
      "Dear {{ provider_first_name }}," +
      "Just a quick reminder: the deadline for your mission is approaching! You have 24 hours left to deliver the work to your customer.",
    detail_title: "Mission Details:",
    details:
      "<p><strong>Payment number:</strong> {{ mission_id }}</p>" +
      "<p><strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Mission deadline:</strong> {{completed_date}}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
    action_title: "Open BindPay Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
};
