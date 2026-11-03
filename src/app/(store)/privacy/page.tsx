import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "How LA Luxury Gold collects, uses and protects your personal information.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Privacy policy" title={<>Privacy <span className="script">policy</span></>} intro="How LA Luxury Gold collects, uses and protects your personal information.">
      <h2>Who we are</h2>
      <p>
        LA Luxury Gold is a jewellery house based in Dubai, United Arab Emirates. We are responsible for the personal information collected through this website
        and when you contact us. We only collect what we need to serve you, and we never sell your information.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Orders:</strong> your name, email address, telephone number, delivery address and any notes you add when you place an order request.
        </li>
        <li>
          <strong>Enquiries:</strong> the details you share when you contact us through the website, WhatsApp, telephone or social media.
        </li>
        <li>
          <strong>Newsletter:</strong> your email address, if you choose to subscribe.
        </li>
        <li>
          <strong>Verification:</strong> for high-value purchases and gold bullion, proof of identity and related information where the law requires it.
        </li>
        <li>
          <strong>Your browser:</strong> your bag, wishlist and currency preference are saved on your own device so they are still there when you come back.
        </li>
        <li>
          <strong>Visit statistics:</strong> the pages you view, the website that referred you, your device type and browser, and your country. These are linked
          to a random identifier stored in your browser — not to your name — and we do not store IP addresses.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To confirm, prepare and deliver your order, and to keep you updated about it.</li>
        <li>To answer your questions and provide aftercare.</li>
        <li>To send news about collections and releases — only if you have opted in. Every email includes a way to unsubscribe.</li>
        <li>To understand how the website is used so we can improve it.</li>
        <li>To prevent fraud and meet our legal, tax and anti-money-laundering obligations as a dealer in precious metals.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We share personal information only with trusted providers who help us run our business — such as our website hosting and database providers, couriers who
        deliver your order, and payment providers — and only as much as they need to do their job. We may also disclose information where the law requires it.
        Because we deliver worldwide, your information may be processed outside the country where you live; we take care that it remains protected.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order records are kept for as long as we need them for aftercare, accounting and legal purposes — generally up to five years after your purchase.
        Enquiries are kept for up to two years. You can unsubscribe from the newsletter at any time and we will stop emailing you straight away.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        Your information is stored on secure servers, access is limited to our team, and connections to this website are encrypted. We never ask for card details
        by WhatsApp, email or telephone.
      </p>

      <h2>Your choices & rights</h2>
      <p>
        You can ask us for a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it where we no longer need it for an
        order or a legal obligation. You can also clear your bag, wishlist and preferences at any time by clearing your browser&rsquo;s data for this website.
      </p>

      <h2>Changes to this policy</h2>
      <p>If we change how we use your information we will update this page and the date shown alongside it.</p>

      <h2>Contact</h2>
      <p>
        For any privacy question or request, please <Link href="/contact">contact us</Link>.
      </p>
    </LegalPage>
  );
}
