'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Scale, Shield, RefreshCw, FileText } from 'lucide-react';

type TabType = 'terms' | 'privacy' | 'refund';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  const tabs = [
    { id: 'terms' as TabType, label: 'Terms of Service', icon: Scale },
    { id: 'privacy' as TabType, label: 'Privacy Policy', icon: Shield },
    { id: 'refund' as TabType, label: 'Refund Policy', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))', boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.3)' }}>
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Legal Information
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Please read our terms, privacy policy, and refund policy carefully
          </p>
        </div>

        {/* Tab Navigation */}
        <Card variant="default" className="p-2">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                    transition-all duration-300 font-medium text-sm md:text-base
                    ${
                      activeTab === tab.id
                        ? 'accent-bg accent-text shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">
                    {tab.id === 'terms' ? 'Terms' : tab.id === 'privacy' ? 'Privacy' : 'Refund'}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content */}
        <Card variant="default" className="p-6 md:p-8 animate-slide-up">
          {activeTab === 'terms' && <TermsOfService />}
          {activeTab === 'privacy' && <PrivacyPolicy />}
          {activeTab === 'refund' && <RefundPolicy />}
        </Card>

        {/* Footer Note */}
        <Card variant="default" className="p-4 text-center">
          <p className="text-gray-500 text-sm">
            Last updated: January 18, 2026 • For questions, contact us on{' '}
            <a
              href="https://discord.gg/F4sAf6z8Ph"
              target="_blank"
              rel="noopener noreferrer"
              className="accent-text hover-accent transition-colors"
            >
              Discord
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="space-y-6 text-gray-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Scale className="w-6 h-6 accent-text" />
          Terms of Service
        </h2>
        <p className="text-gray-400 mb-6">
          By using Seisen services, you agree to the following terms and conditions.
        </p>
      </div>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing and using Seisen's scripts and services, you accept and agree to be bound by
          these Terms of Service. If you do not agree to these terms, please do not use our
          services.
        </p>
      </Section>

      <Section title="2. Service Description">
        <p className="mb-3">Seisen provides two tiers of service:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong className="text-white">Free Tier:</strong> Access to basic scripts with a
            time-based key system that requires periodic renewal
          </li>
          <li>
            <strong className="text-white">Premium Tier:</strong> Full access to all premium
            scripts with no time limitations or renewal requirements
          </li>
        </ul>
      </Section>

      <Section title="3. User Responsibilities">
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>You must be at least 13 years old to use our services</li>
          <li>You are responsible for maintaining the confidentiality of your access keys</li>
          <li>You agree not to share, sell, or distribute your premium access keys</li>
          <li>You agree to use our scripts in accordance with the terms of service of the platforms where they are executed</li>
          <li>You will not attempt to reverse engineer, decompile, or modify our scripts</li>
        </ul>
      </Section>

      <Section title="4. Prohibited Activities">
        <p className="mb-3">You agree not to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Use our services for any illegal or unauthorized purpose</li>
          <li>Attempt to gain unauthorized access to our systems or user accounts</li>
          <li>Distribute malware or engage in any activity that harms our services</li>
          <li>Resell or redistribute our scripts without explicit permission</li>
          <li>Use automated systems to abuse our key generation system</li>
        </ul>
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          All scripts, code, designs, and content provided by Seisen are protected by intellectual
          property rights. You are granted a limited, non-exclusive, non-transferable license to
          use our scripts for personal use only.
        </p>
      </Section>

      <Section title="6. Service Modifications">
        <p>
          We reserve the right to modify, suspend, or discontinue any part of our services at any
          time without prior notice. We are not liable for any modifications or interruptions to
          our services.
        </p>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>
          Our services are provided "as is" without any warranties, express or implied. We do not
          guarantee that our services will be uninterrupted, secure, or error-free. Use of our
          scripts is at your own risk.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          Seisen and its operators shall not be liable for any direct, indirect, incidental,
          special, or consequential damages resulting from the use or inability to use our
          services, including but not limited to account bans, data loss, or any other damages.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          We reserve the right to terminate or suspend your access to our services at any time,
          with or without cause, and without prior notice. Upon termination, your right to use our
          services will immediately cease.
        </p>
      </Section>

      <Section title="10. Changes to Terms">
        <p>
          We may update these Terms of Service from time to time. Continued use of our services
          after changes constitutes acceptance of the updated terms. We encourage you to review
          these terms periodically.
        </p>
      </Section>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="space-y-6 text-gray-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 accent-text" />
          Privacy Policy
        </h2>
        <p className="text-gray-400 mb-6">
          Your privacy is important to us. This policy explains how we collect, use, and protect
          your information.
        </p>
      </div>

      <Section title="1. Information We Collect">
        <p className="mb-3">We collect the following types of information:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong className="text-white">Account Information:</strong> Email addresses and
            usernames for premium users
          </li>
          <li>
            <strong className="text-white">Payment Information:</strong> Processed securely through
            PayPal (we do not store credit card details)
          </li>
          <li>
            <strong className="text-white">Usage Data:</strong> Access keys, script usage
            statistics, and service interaction logs
          </li>
          <li>
            <strong className="text-white">Technical Data:</strong> IP addresses, browser type, and
            device information for security purposes
          </li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <p className="mb-3">We use collected information to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Provide and maintain our services</li>
          <li>Process premium subscriptions and payments</li>
          <li>Generate and validate access keys</li>
          <li>Detect and prevent fraud or abuse</li>
          <li>Improve our services and user experience</li>
          <li>Send important service updates and notifications</li>
          <li>Respond to support requests and inquiries</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing and Disclosure">
        <p className="mb-3">We do not sell your personal information. We may share data with:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong className="text-white">Payment Processors:</strong> PayPal for processing
            premium subscriptions
          </li>
          <li>
            <strong className="text-white">Service Providers:</strong> Third-party services that
            help us operate our platform
          </li>
          <li>
            <strong className="text-white">Legal Requirements:</strong> When required by law or to
            protect our rights
          </li>
        </ul>
      </Section>

      <Section title="4. Data Security">
        <p>
          We implement industry-standard security measures to protect your information, including
          encryption, secure servers, and access controls. However, no method of transmission over
          the internet is 100% secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="5. Data Retention">
        <p>
          We retain your information for as long as necessary to provide our services and comply
          with legal obligations. Premium user data is retained for the duration of the
          subscription and for a reasonable period thereafter for record-keeping purposes.
        </p>
      </Section>

      <Section title="6. Your Rights">
        <p className="mb-3">You have the right to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your data (subject to legal requirements)</li>
          <li>Opt out of marketing communications</li>
          <li>Withdraw consent for data processing where applicable</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, please contact us through our Discord server.
        </p>
      </Section>

      <Section title="7. Cookies and Tracking">
        <p>
          We use cookies and similar technologies to enhance user experience, analyze usage
          patterns, and maintain session information. You can control cookie settings through your
          browser preferences.
        </p>
      </Section>

      <Section title="8. Third-Party Links">
        <p>
          Our services may contain links to third-party websites. We are not responsible for the
          privacy practices of these external sites. We encourage you to review their privacy
          policies.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          Our services are not intended for children under 13. We do not knowingly collect personal
          information from children. If you believe we have collected information from a child,
          please contact us immediately.
        </p>
      </Section>

      <Section title="10. Changes to Privacy Policy">
        <p>
          We may update this Privacy Policy periodically. We will notify users of significant
          changes through our website or Discord server. Continued use of our services after
          changes constitutes acceptance of the updated policy.
        </p>
      </Section>
    </div>
  );
}

function RefundPolicy() {
  return (
    <div className="space-y-6 text-gray-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 accent-text" />
          Refund Policy
        </h2>
        <p className="text-gray-400 mb-6">
          Please read our refund policy carefully before making a purchase.
        </p>
      </div>

      <Section title="1. No Refund Policy">
        <p className="mb-3">
          <strong className="text-white">All sales are final.</strong> Due to the digital nature of
          our services and instant access to premium scripts, we do not offer refunds for any
          purchases, including but not limited to:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Premium subscriptions (daily, weekly, monthly, or lifetime)</li>
          <li>Access keys or license purchases</li>
          <li>Any other digital products or services</li>
        </ul>
      </Section>

      <Section title="2. Reasons for No Refund Policy">
        <p className="mb-3">Our no-refund policy exists because:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong className="text-white">Instant Access:</strong> You receive immediate access to
            all premium scripts upon purchase
          </li>
          <li>
            <strong className="text-white">Digital Nature:</strong> Our products are digital and
            cannot be "returned" once accessed
          </li>
          <li>
            <strong className="text-white">Abuse Prevention:</strong> To prevent fraudulent
            purchases and chargebacks
          </li>
          <li>
            <strong className="text-white">Clear Information:</strong> All features and limitations
            are clearly stated before purchase
          </li>
        </ul>
      </Section>

      <Section title="3. Before You Purchase">
        <p className="mb-3">We strongly recommend that you:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Try our free tier first to evaluate our service quality</li>
          <li>Read all product descriptions and feature lists carefully</li>
          <li>Join our Discord server to ask questions and see user feedback</li>
          <li>Watch tutorial videos to understand how our scripts work</li>
          <li>Ensure you understand what you're purchasing</li>
        </ul>
      </Section>

      <Section title="4. Exceptions">
        <p className="mb-3">
          While we maintain a strict no-refund policy, we may consider exceptions in the following
          rare circumstances:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong className="text-white">Technical Issues:</strong> If our services are
            completely non-functional for an extended period and we cannot resolve the issue
          </li>
          <li>
            <strong className="text-white">Duplicate Charges:</strong> If you were accidentally
            charged multiple times for the same purchase
          </li>
          <li>
            <strong className="text-white">Unauthorized Transactions:</strong> If you can prove
            your account was compromised and purchases were made without your consent
          </li>
        </ul>
        <p className="mt-3">
          Exception requests must be submitted within 48 hours of purchase through our Discord
          support system with appropriate evidence.
        </p>
      </Section>

      <Section title="5. Service Disruptions">
        <p>
          In the event of planned maintenance or temporary service disruptions, we will extend
          premium subscriptions accordingly. This does not constitute grounds for a refund.
        </p>
      </Section>

      <Section title="6. Account Termination">
        <p>
          If your account is terminated due to violation of our Terms of Service, you will not be
          eligible for any refund. This includes but is not limited to:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
          <li>Sharing or selling access keys</li>
          <li>Attempting to reverse engineer our scripts</li>
          <li>Engaging in fraudulent activities</li>
          <li>Violating any other terms outlined in our Terms of Service</li>
        </ul>
      </Section>

      <Section title="7. Chargebacks">
        <p>
          <strong className="text-white">Filing a chargeback is considered fraud</strong> and will
          result in immediate termination of your account and permanent ban from our services. All
          chargeback disputes will be contested with full documentation of service delivery.
        </p>
      </Section>

      <Section title="8. Contact for Issues">
        <p>
          If you experience any issues with our services, please contact our support team through
          Discord before considering any payment disputes. We are committed to resolving legitimate
          technical issues promptly.
        </p>
      </Section>

      <Section title="9. Subscription Cancellation">
        <p>
          You may cancel recurring subscriptions at any time to prevent future charges. However,
          cancellation does not entitle you to a refund for the current billing period. You will
          retain access until the end of your paid period.
        </p>
      </Section>

      <Section title="10. Agreement">
        <p>
          By making a purchase, you acknowledge that you have read, understood, and agree to this
          refund policy. You confirm that you understand all sales are final and that you will not
          be eligible for a refund except in the rare circumstances outlined above.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}
