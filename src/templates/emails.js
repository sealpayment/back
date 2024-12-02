export default {
  disputeOpenedClient: {
    subject: "A Dispute Has Been Opened !",
    title: "Your Dispute Has Been Opened !",
    body: "We have received your dispute for the payment of <strong>{{currency}}{{amount}}</strong> to <strong>{{email}}</strong>. We will investigate the issue and get back to you soon.",
    detail_title: "What's Next?",
    details:
      "1. The provider has 24 hours to respond to the dispute and provide relevant information. <br>" +
      "2. BindPay will review the dispute and settle it within 12 hours." +
      "Depending on the resolution, you will either receive a refund or the payment will be released to the provider.",
    action_title: "View Dispute",
    action_link: "/mission/dispute/{{mission_id}}",
  },
  disputeOpenedProvider: {
    subject: "Respond to the Dispute Within 24 Hours",
    title: "Respond to the Dispute Within 24 Hours",
    body: "Oops! <strong>{{ email }}</strong> has reported that the <strong>mission #{{ mission_id }}</strong> was not completed as agreed.",
    detail_title: "What should you do now?",
    details:
      "1. You have <strong>24 hours</strong> to respond to their objections.<br>" +
      "2. Provide evidence to support your case using the button below.",
    action_title: "Respond to the Dispute",
    action_link: "{{ dispute_url }}",
  },
  disputeAnswered: {
    subject: "Our Team Is Reviewing Your Submission !",
    title: "Our Team Is Reviewing Your Submission !",
    body: "Thank you for submitting the dispute regarding the <strong>mission #{{ mission_id }}</strong>.",
    detail_title: "What happens next?",
    details:
      "1. Our team will carefully review the evidence you provided.<br>" +
      "2. A decision will be made by <strong>{{ resolution_deadline }}</strong>.",
  },
  disputeReviewed: {
    subject: "Your Dispute Has Been Reviewed !",
    title: "Your Dispute Has Been Reviewed !",
    body: "The dispute for your payment of <strong>{{ currency }}{{ amount }}</strong> with <strong>{{ email }}</strong> has been resolved.",
    detail_title: "Outcome",
    details: "{{ outcome_description }}",
  },
  disputeNoAnswer: {
    subject: "Dispute Deadline Passed",
    title: "No Response Received – Funds Returned to Payer",
    body: "We have not received a response from you regarding the objections raised by <strong>{{ client_first_name }}</strong> for the <strong>mission #{{ mission_id }}</strong>.",
    detail_title: "Resolution",
    details:
      "As per our terms, the funds of <strong>{{ currency }}{{ amount }}</strong> will be returned to your client, <strong>{{ client_first_name }}</strong>.",
  },
  signupConfirmEmail: {
    subject: "Please Confirm Your Email",
    title: "Please Confirm Your Email",
    body:
      "Before you dive in, we need to confirm your email address to ensure your account is secure and ready to go. " +
      "<p>Once you’ve verified your email, you’ll be ready to:</p>" +
      "<ul>" +
      "<li>✅ Set up secure, hassle-free transactions.</li>" +
      "<li>✅ Protect your payments with ease.</li>" +
      "<li>✅ Enjoy a trusted platform for all your payment needs.</li>" +
      "</ul>",
    action_title: "Confirm Email",
    action_link: "{{ verification_link }}",
  },
  signupSuccess: {
    subject: "Welcome to BindPay!",
    title: "You're All Set to Start!",
    body:
      "Welcome to <strong>BindPay</strong> – we’re thrilled to have you on board!<br>" +
      "You’ve taken the first step toward secure, hassle-free transactions. " +
      "Whether you’re managing a project or getting paid for your hard work, " +
      "BindPay ensures your funds are protected every step of the way.<br>" +
      "<p>Here’s what you can do next:</p>" +
      '<p>1️⃣ <a href="{{ setup_link }}">Set Up Your First Transaction</a> – Start holding funds securely in just a few clicks.</p>' +
      '<p>2️⃣ <a href="{{ learn_more_link }}">Learn How It Works</a> – Need a quick walkthrough? We’ve got you covered.</p>' +
      '<p>3️⃣ <a href="{{ faq_link }}">Explore FAQs</a> – Find answers to common questions about using BindPay.</p>' +
      "<p>With BindPay, you can:</p>" +
      "<ul>" +
      "<li>✅ Hold payments securely until tasks are completed.</li>" +
      "<li>✅ Avoid complex contracts and expensive fees.</li>" +
      "<li>✅ Build trust between both parties with our easy-to-use platform.</li>" +
      "</ul>",
    action_title: "Get Started Now",
    action_link: "{{ get_started_link }}",
  },
  paymentRequestUser: {
    subject: "You Received A Payment Request",
    title: "You Received A Payment Request",
    body:
      "You have received a payment request for <strong>{{ currency }}{{ amount }}</strong> from <strong>{{ provider_email }}</strong>.<br>" +
      "Please review the details below and approve the payment request.",
    detail_title: "Mission Details :",
    details: "{{ specifications }}",
    action_title: "Pay Now",
    action_link: "{{ redirect_link }}",
  },
  paymentRequestAnonymous: {
    subject: "You Received A Payment Request",
    title: "You Received A Payment Request",
    body:
      "You have received a payment request for <strong>{{ currency }}{{ amount }}</strong> from <strong>{{ provider_email }}</strong> " +
      "<p><strong>What’s BindPay?</strong></p>" +
      "<p>" +
      "BindPay is a secure payment platform that holds funds until the job is " +
      "completed as agreed, protecting both you and your provider." +
      "</p>",
    detail_title: "Mission Details :",
    details: "{{ specifications }}",
    action_title: "Sign Up Now",
    action_link: "{{ redirect_link }}",
  },
  missionCreated: {
    subject: "Your payment is now securely held",
    title: "Your payment is now securely held",
    body: "Congratulations! The provider now has <strong>5 days</strong> to complete the mission. The funds will be released 24 hours later unless the mission has not been completed and you raise a dispute.",
    detail_title: "Mission Details:",
    details:
      "<p><strong>Provider:</strong> {{ provider_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
  },
  missionReceived: {
    subject: "Your Received A Payment",
    title: "You Received A Payment",
    body:
      "Great news! <strong>{{ client_first_name }}</strong> has sent a payment for your  services. The funds are now securely held in BindPay." +
      "<p><strong>What’s Next?</strong></p>" +
      "<ul>" +
      "<li>Complete the mission as agreed by the {{ completed_date }} deadline.</li>" +
      "<li>Ensure your work aligns with the specifications provided.</li>" +
      "</ul>",
    detail_title: "Mission Details:",
    details:
      "<p><strong>Client:</strong> {{ client_email }}</p>" +
      "<p><strong>Amount:</strong> {{ currency }}{{ amount }}</p>" +
      "<p><strong>Specifications: </strong>{{specifications}}</p>",
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
    subject: "Your Mission Has Been Completed",
    title: "Funds Will Be Released Soon – Review Now",
    body: "<strong>{{ provider_email }}</strong>’s mission has ended, and the funds of <strong>{{ currency }}{{ amount }}</strong> are scheduled to be released in <strong>12 hours</strong>.",
    detail_title: "What you can do :",
    details:
      "<ul>" +
      "<li> If you’re satisfied with the work, no action is needed.</li>" +
      "<li>If there’s an issue, open a dispute before the release deadline.</li>" +
      "</ul>",
  },
  missionCompletedProvider: {
    subject: "Your Customer Has 12 Hours to Reviewed",
    title: "Your Customer Has 12 Hours to Review",
    body: " Congratulations on completing the <strong>mission #{{ mission_id }}</strong>. The 5-day hold period has ended. <strong>{{ client_first_name }}</strong> now has <strong>12 hours</strong> to review the results.",
    detail_title: "Next steps :",
    details:
      "<ul>" +
      "<li>" +
      "If <strong>{{ client_first_name }}</strong> is satisfied, the " +
      "funds of <strong>{{ currency }}{{ amount }}</strong> will be " +
      "released to your account." +
      "</li>" +
      "<li>If they raise an issue, you’ll be notified immediately.</li>" +
      "</ul>",
  },
  missionReminder: {
    subject: "Your Mission Will Be Completed Soon",
    title: "Complete Your Mission to Secure Payment",
    body:
      "Just a quick reminder, the deadline for the <strong>mission #{{ mission_id}}</strong> is approaching! You have <strong>24 hours</strong> left to deliver the work to your customer <br>" +
      "<p><strong>Stay on track to get your payment released on time!</strong></p>",
  },
};
