const WEBSITE_URL = process.env.WEBSITE_URL;

export default {
  disputeOpenedClient: {
    subject: "You opened a dispute",
    title: "Your dispute is opened",
    body:
      "Dear {{ client_first_name }},<br><br>" +
      "We have received your dispute for your payment:<br><br>" +
      "<strong>What happens now?</strong><br><br>" +
      "1. The provider now has <strong>24 hours</strong> to answer the dispute and send information related to it.<br><br>" +
      "2. Then the <strong>Seal Dispute Team will settle the dispute</strong> within 12 hours. You will either get your money back or the payment will be released to the provider.<br><br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Destination:</strong> {{ provider_email }}<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}",
    action_title: "View Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{mission_id}}`,
  },
  disputeOpenedProvider: {
    subject:
      "{{ client_first_name }} raised a dispute - Please respond within 24 hours",
    title: "Tell us what happened",
    body:
      "Dear {{ provider_first_name }},<br><br>" +
      "Oops! Your customer has reported your mission as incomplete.<br><br>" +
      "<strong>What should you do now?</strong><br><br>" +
      "<strong>1. Read the dispute</strong><br><br>" +
      "2. Submit your objection within <strong>24 hours</strong><br><br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Payer:</strong> {{ client_email }}<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Respond to the Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{mission_id}}`,
  },
  disputeReviewed: {
    subject: "Dispute resolution completed",
    title: "Your dispute has been reviewed",
    body:
      "Dear {{ client_first_name }},<br><br>" +
      "We have resolved the dispute for your payment.<br><br>" +
      "<strong>Outcome:</strong><br><br>" +
      "{{ outcome_description }}<br><br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Destination:</strong> {{ provider_email }}<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Send another payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  disputeNoAnswer: {
    subject: "Dispute response deadline passed: Payment is being refunded",
    title: "No response received: Funds returned to payer",
    body:
      "Dear {{ provider_first_name }},<br><br>" +
      "We have not received a response from you regarding the dispute raised by {{ client_first_name }}.<br><br>" +
      "As per our terms, <strong>the funds will be returned to the payer</strong>.<br><br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Payer:</strong> {{ client_email }}<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
  },
  forgotPassword: {
    subject: "Reset your password",
    title: "Reset your password",
    body: "You have requested to reset your password. Click the button below to create a new password and access your account.",
    action_title: "Reset Password",
    action_link: `${WEBSITE_URL}/auth/reset-password?token={{ token }}`,
  },
  signupConfirmEmail: {
    subject: "Please Confirm Your Email",
    title: "Please Confirm Your Email",
    body:
      "Before you dive in, we need to <strong>confirm your email address</strong> to ensure your account is secure and ready to go.<br><br>" +
      "Once you've verified your email, you'll be ready to:<br><br>" +
      "1. Set up secure, hassle-free transactions.<br><br>" +
      "2. Protect your payments with ease.<br><br>" +
      "3. Enjoy a trusted platform for all your payment needs.<br><br>",
  },
  signupSuccess: {
    subject: "Welcome to Seal - Please confirm your email",
    title: "Welcome to Seal! Please confirm your email",
    body:
      "Dear {{ first_name }}<br><br>" +
      "We're thrilled to have you on board!<br><br>" +
      "<strong>Please confirm your email address by clicking the button below:</strong><br><br>" +
      "You've taken the first step toward <strong>secure, hassle-free transactions</strong>. Whether you're managing a project or getting paid for your hard work, Seal ensures your funds are protected every step of the way.<br><br>" +
      "Now, let's get started!",
    action_title: "Confirm Email",
    action_link: `${WEBSITE_URL}/auth/confirm-email?token={{ token }}`,
  },
  confirmNewEmail: {
    subject: "Seal - Please confirm your new email address",
    title: "Please confirm your new email address",
    body:
      "Dear {{ first_name }}<br><br>" +
      "We noticed you've requested to change your email address.<br><br>" +
      "<strong>Please confirm your new email address by clicking the button below:</strong><br><br>" +
      "This helps us ensure the security of your account. If you didn't request this change, please contact our support team immediately.<br><br>" +
      "Thank you for using Seal!",
    action_title: "Confirm New Email",
    action_link: `${WEBSITE_URL}/auth/confirm-new-email?token={{ token }}&new-email={{ newEmail }}`,
  },
  paymentRequestUser: {
    subject: "{{ provider_first_name }} requests payment via Seal",
    title: "Seal payment request",
    body:
      "Dear {{ client_first_name }}<br><br>" +
      "{{ provider_first_name }} has requested a Seal payment to get their mission started.<br><br>",
    detail_title: "Mission details",
    details:
      "<strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Go to payment",
    action_link: "https://checkout.stripe.com/c/pay/{{ payment_id }}",
  },
  paymentRequestAnonymous: {
    subject: "{{ provider_first_name }} requests payment via Seal",
    title: "Seal payment request",
    body:
      "Dear future Seal user,<br><br>" +
      "Nice to meet you!<br><br>" +
      "{{ provider_first_name }} has requested a Seal payment to get their mission started.<br><br>" +
      "<strong>Why using Seal?</strong><br><br>" +
      "Seal is a secure payment platform that holds funds until the job is completed as agreed, <strong>protecting both you and your provider</strong>.<br><br>" +
      "<strong>No fees</strong> for the payer.<br><br>" +
      "Way more efficient than a <strong>contract</strong>.<br><br>" +
      "Provider must complete the mission <strong>within 5 days</strong>.<br><br>",
    detail_title: "Mission details",
    details:
      "<strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Sign Up And Pay",
    action_link: `${WEBSITE_URL}/auth/register`,
  },
  missionCreated: {
    subject: "Your payment is securely held by Seal",
    title: "Your payment is now securely held",
    body:
      "Dear {{ client_first_name }},<br><br>" +
      "Congratulations, your payment is securely held by Seal.<br><br>" +
      "Your provider now has <strong>5 days to complete the mission</strong>.<br><br>",
    detail_title: "Payment Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "{{{ provider_destination }}}" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Send Another Payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionReceived: {
    subject: "Your payment is securely held by Seal",
    title: "Your payment is now securely held",
    body:
      "Dear {{ provider_first_name }},<br><br>" +
      "The funds are securely held by Seal, you now have <strong>5 days to complete your mission</strong>.<br><br>" +
      "Make sure you complete the mission before the deadline and comply with the specifications.<br><br>",
    detail_title: "Mission Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Open Seal Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionCancelled: {
    subject: "Your Mission Has Been Cancelled",
    title: "Your Mission Has Been Cancelled",
    body: "The mission associated with your payment of <strong>{{ currency }}{{ amount }}</strong> has been canceled by the provider (<strong>{{ provider_email }}</strong>). As a result, the full payment has been automatically refunded to your payment method.",
    detail_title: "Transaction Details:",
    details:
      "<strong>Provider:</strong> {{ provider_email }}<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Reason:</strong> Mission Cancelled<br><br>",
  },
  missionCompletedClient: {
    subject:
      "{{ provider_first_name }}’s mission has ended - Review within 12 hours",
    title: "Funds will be released soon – Review now",
    body:
      "Dear {{ client_first_name }},<br><br>" +
      "{{ provider_first_name }}’s 5-day mission has just ended.<br><br>" +
      "<strong>The funds will be released in 12 hours unless you judge that the specifications have not been met and want to raise a dispute.</strong>",
    detail_title: "Mission details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "{{{ provider_details }}}" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>" +
      "<strong>The specifications are not met?</strong>",
    action_title: "Open a Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{ mission_id }}`,
  },
  missionCompletedProvider: {
    subject: "Mission completed – Your funds will be released soon",
    title: "Your will receive the money on your bank account within 7 days",
    body:
      "Dear {{ provider_first_name }},<br><br>" +
      "Congratulations on completing your mission!<br><br>" +
      "The funds are being processed and will be delivered to your bank account within <strong>7 days</strong>.<br><br>" +
      "Thank you for your excellent work and for using Seal to secure your payments.",
    detail_title: "Payment details:",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
  },
  missionReminder: {
    subject: "Reminder: Mission deadline in 24 hours",
    title: "Complete your mission within 24 hours to secure payment",
    body:
      "Dear {{ provider_first_name }},<br><br>" +
      "Just a quick reminder: the deadline for your mission is approaching! <strong>You have 24 hours left to deliver the work to your customer.</strong>",
    detail_title: "Mission Details:",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
    action_title: "Open Seal Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
  paymentReleasedClient: {
    subject: "Your payment has been released",
    title: "Your payment has been released",
    body:
      "Dear {{ client_first_name }},<br><br>" +
      "Your payment has been released to {{ provider_first_name }}.<br><br>" +
      "Thank you for using Seal to secure your payments.",
    detail_title: "Payment Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br><br>" +
      "<strong>Destination:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br><br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br><br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br><br>" +
      "<strong>Specifications: </strong>{{specifications}}<br><br>",
  },
  inviteToPlatform: {
    subject: "{{ inviter_name }} wants to work with you on Seal",
    title: "Join Seal to start working together",
    body:
      "Dear future Seal user,<br><br>" +
      "{{ inviter_name }} would like to work with you and wants to secure the payment through Seal.<br><br>" +
      "<strong>Why use Seal?</strong><br><br>" +
      "1. Get paid securely - funds are held safely until work is completed<br><br>" +
      "2. No upfront fees - Seal only takes a small fee when you get paid<br><br>" +
      "3. Protection for both parties - clear terms and dispute resolution if needed<br><br>" +
      "4. Fast payments - receive funds in your bank account within 7 days of job completion<br><br>" +
      "Create your account now to get started!",
    action_title: "Create My Account",
    action_link: `${WEBSITE_URL}/auth/register`,
  },
  setupBankAccount: {
    subject: "{{ inviter_name }} wants to send you a payment",
    title: "Set up your bank account to receive payments",
    body:
      "Dear {{ first_name }},<br><br>" +
      "{{ inviter_name }} wants to send you a secure payment through Seal, but we noticed you haven't set up your bank account yet.<br><br>" +
      "<strong>To receive payments, you need to:</strong><br><br>" +
      "1. Go to your payment settings<br><br>" +
      "2. Connect your bank account securely through Stripe<br><br>" +
      "3. Start receiving payments within 7 days of completing work<br><br>" +
      "It only takes a few minutes to set up!",
    action_title: "Set Up Bank Account",
    action_link: `${WEBSITE_URL}/mission`,
  },
};
