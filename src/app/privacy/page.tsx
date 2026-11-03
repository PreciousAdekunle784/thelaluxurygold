import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Privacy policy" title={<>Privacy <span className="font-light italic normal-case">policy</span></>} intro="How LA Luxury Gold collects, uses and protects your personal information.">
      <h2>Who we are</h2>
      <p>LA Luxury Gold ([registered legal entity and address]) is responsible for the personal information collected through this website.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Contact and delivery details you provide when placing an order request or contacting us (name, email, telephone, address).</li>
        <li>Your email address if you subscribe to our newsletter.</li>
        <li>Your bag, wishlist and currency preference, stored locally in your browser.</li>
        <li>[Analytics and cookies — to be confirmed once tools are selected.]</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To confirm, fulfil and deliver your orders and respond to enquiries.</li>
        <li>To send marketing emails, only where you have opted in. You can unsubscribe at any time.</li>
        <li>To meet legal, tax and anti-money-laundering obligations that may apply to precious-metal purchases.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We share information only with service providers who help us operate (for example couriers and payment providers) and where required by law. [List of processors to be confirmed.]</p>
      <h2>Your rights</h2>
      <p>Depending on where you live, you may have rights to access, correct or delete your data. Contact us to make a request.</p>
      <h2>Retention</h2>
      <p>[Retention periods to be confirmed.]</p>
      <h2>Contact</h2>
      <p>For privacy questions, please contact us through the contact page.</p>
    </LegalPage>
  );
}
