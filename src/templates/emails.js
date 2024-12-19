const WEBSITE_URL = process.env.WEBSITE_URL;

export default {
  disputeOpenedClient: {
    subject: "You opened a dispute",
    title: "Your dispute is opened",
    body:
      "Dear {{ client_first_name }},<br>" +
      "We have received your dispute for your payment:<br>" +
      "<strong>What happens now?</strong><br>" +
      "1. The provider now has <strong>24 hours</strong> to answer the dispute and send information related to it.<br>" +
      "2. Then the BindPay Dispute Team will settle the dispute within 12 hours. You will either get your money back or the payment will be released to the provider.<br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Destination:</strong> {{ provider_email }}<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}",
    action_title: "View Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{mission_id}}`,
  },
  disputeOpenedProvider: {
    subject:
      "{{ client_first_name }} raised a dispute - Respond within 24 hours",
    title: "Tell us what happened",
    body:
      "Dear {{ provider_first_name }},<br>" +
      "Oops! Your customer has reported your mission as incomplete.<br>" +
      "<strong>What should you do now?</strong><br>" +
      "<strong>1. Read the dispute</strong><br>" +
      "2. Submit your objection within <strong>24 hours</strong><br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Payer:</strong> {{ client_email }}<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Respond to the Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{mission_id}}`,
  },
  disputeReviewed: {
    subject: "Dispute resolution completed",
    title: "Your dispute has been reviewed",
    body:
      "Dear {{ client_first_name }},<br>" +
      "We have resolved the dispute for your payment.<br>" +
      "<strong>Outcome:</strong><br>" +
      "{{ outcome_description }}<br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Destination:</strong> {{ provider_email }}<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Send another payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  disputeNoAnswer: {
    subject: "Dispute response deadline passed: Payment is being refunded",
    title: "No response received â€“ Funds returned to payer",
    body:
      "Dear {{ provider_first_name }},<br>" +
      "We have not received a response from you regarding the dispute raised by {{ client_first_name }}.<br>" +
      "As per our terms, the funds will be returned to the payer.<br>",
    detail_title: "Payment details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Payer:</strong> {{ client_email }}<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
  },
  signupConfirmEmail: {
    subject: "Please Confirm Your Email",
    title: "Please Confirm Your Email",
    body:
      "Before you dive in, we need to confirm your email address to ensure your account is secure and ready to go.<br>" +
      "Once you've verified your email, you'll be ready to:<br>" +
      "1. Set up secure, hassle-free transactions.<br>" +
      "2. Protect your payments with ease.<br>" +
      "3. Enjoy a trusted platform for all your payment needs.<br>",
  },
  signupSuccess: {
    subject: "Welcome to BindPay, secure payments made simple!",
    title: "Welcome to BindPay!",
    body:
      "Dear {{ first_name }}<br>" +
      "We're thrilled to have you on board!<br>" +
      "You've taken the first step toward secure, hassle-free transactions. Whether you're managing a project or getting paid for your hard work, BindPay ensures your funds are protected every step of the way.<br>" +
      "Now, let's get started!",
    action_title: "Send or Ask Payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  paymentRequestUser: {
    subject: "{{ provider_first_name }} requests payment via BindPay",
    title: "BindPay payment request",
    body:
      "Dear {{ client_first_name }}<br>" +
      "{{ provider_first_name }} has requested a BindPay payment to get their mission started.<br>",
    detail_title: "Mission details",
    details:
      "<strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Go to payment",
    action_link: "{{ action_link }}",
  },
  paymentRequestAnonymous: {
    subject: "{{ provider_first_name }} requests payment via BindPay",
    title: "BindPay payment request",
    body:
      "Dear future BindPay user,<br>" +
      "Nice to meet you!<br>" +
      "{{ provider_first_name }} has requested a BindPay payment to get their mission started.<br>" +
      "<strong>Why using BindPay?</strong><br>" +
      "BindPay is a secure payment platform that holds funds until the job is completed as agreed, protecting both you and your provider.<br>" +
      "No fees for the payer.<br>" +
      "Way more efficient than a contract.<br>" +
      "Provider must complete the mission within 5 days.<br>",
    detail_title: "Mission details",
    details:
      "<strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Sign Up And Pay",
    action_link: "{{ action_link }}",
  },
  missionCreated: {
    subject: "Your payment is securely held by BindPay",
    title: "Your payment is now securely held",
    body:
      "Dear {{ provider_first_name }},<br>" +
      "Congratulations, your payment is securely held by BindPay.<br>" +
      "Your provider now has 5 days to complete the mission.<br>",
    detail_title: "Payment Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Destination:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Send Another Payment",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionReceived: {
    subject: "Your payment is securely held by BindPay",
    title: "Your payment is now securely held",
    body:
      "Dear {{ client_first_name }},<br>" +
      "The funds are securely held by BindPay, you now have 5 days to complete your mission.<br>" +
      "Make sure you complete the mission before the deadline and comply with the specifications.<br>",
    detail_title: "Mission Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Open BindPay Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
  missionReceivedAnonymous: {
    subject: "You have received a payment from {{ client_first_name }}",
    title:
      "Create your account and complete your mission to release the payment",
    body:
      "Dear new BindPay user,<br>" +
      "Congratulations! {{ client_first_name }}, has sent a you a payment of {{currency}}{{amount}}.<br>" +
      "The funds are securely held by BindPay and will be released to your bank account once you complete the mission<br>." +
      "<strong>What's Next?</strong><br>" +
      "<strong>1. Create your BindPay account</strong><br>" +
      "2. Complete the mission before the deadline and make sure it aligns with the specifications.<br>" +
      "3. If you comply with the specifications, you will receive the money on your bank account within 7 days<br>.",
    detail_title: "Mission Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}",
    action_title: "Create my account",
    action_link: `${WEBSITE_URL}/auth/register`,
  },
  missionCancelled: {
    subject: "Your Mission Has Been Cancelled",
    title: "Your Mission Has Been Cancelled",
    body: "The mission associated with your payment of <strong>{{ currency }}{{ amount }}</strong> has been canceled by the provider (<strong>{{ provider_email }}</strong>). As a result, the full payment has been automatically refunded to your payment method.",
    detail_title: "Transaction Details:",
    details:
      "<strong>Provider:</strong> {{ provider_email }}<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Reason:</strong> Mission Cancelled<br>",
  },
  missionCompletedClient: {
    subject:
      "{{ provider_first_name }}’s mission has ended - Review within 12 hours",
    title: "Funds will be released soon – Review now",
    body:
      "Dear {{ client_first_name }},<br>" +
      "{{ provider_first_name }}’s 5-day mission has just ended.<br>" +
      "<strong>The funds will be released in 12 hours unless you judge that the specifications have not been met and want to raise a dispute.</strong>",
    detail_title: "Mission details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Provider:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>" +
      "<strong>The specifications are not met?</strong>",
    action_title: "Open a Dispute",
    action_link: `${WEBSITE_URL}/mission/dispute/{{ mission_id }}`,
  },
  missionCompletedProvider: {
    subject: "Mission completed – Your funds will be released soon",
    title: "Your will receive the money on your bank account within 7 days",
    body:
      "Dear {{ provider_first_name }},<br>" +
      "Congratulations on completing your mission!<br>" +
      "The funds are being processed and will be delivered to your bank account within <strong>7 days</strong>.<br>" +
      "Thank you for your excellent work and for using BindPay to secure your payments.",
    detail_title: "Next steps :",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
  },
  missionReminder: {
    subject: "Reminder: Mission deadline in 24 hours",
    title: "Complete your mission within 24 hours to secure payment",
    body:
      "Dear {{ provider_first_name }},<br>" +
      "Just a quick reminder: the deadline for your mission is approaching! You have 24 hours left to deliver the work to your customer.",
    detail_title: "Mission Details:",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Payer:</strong> {{ client_first_name }} {{ client_last_name }} ({{ client_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
    action_title: "Open BindPay Dashboard",
    action_link: `${WEBSITE_URL}/mission`,
  },
  paymentReleasedClient: {
    subject: "Your payment has been released",
    title: "Your payment has been released",
    body:
      "Dear {{ client_first_name }},<br>" +
      "Your payment has been released to {{ provider_first_name }}.<br>" +
      "Thank you for using BindPay to secure your payments.",
    detail_title: "Payment Details",
    details:
      "<strong>Payment number:</strong> {{ mission_id }}<br>" +
      "<strong>Destination:</strong> {{ provider_first_name }} {{ provider_last_name }} ({{ provider_email }})<br>" +
      "<strong>Amount:</strong> {{ currency }}{{ amount }}<br>" +
      "<strong>Mission deadline:</strong> {{completed_date}}<br>" +
      "<strong>Specifications: </strong>{{specifications}}<br>",
  },
};
