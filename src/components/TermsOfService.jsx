import '../styles/TermsOfService.css'

export default function TermsOfService() {
    const goHome = () => {
        window.location.href = '/'
    }

    return (
        <div className="terms-page">
            <nav className="terms-navbar">
                <div className="terms-brand">
                    <span className="terms-brand-icon">⌘</span>
                    <span>API Tester</span>
                </div>

                <button className="terms-back" onClick={goHome}>
                    ← Back to Home
                </button>
            </nav>

            <main className="terms-content">
                <header className="terms-header">
                    <div className="terms-badge">LEGAL</div>
                    <h1>Terms of Service</h1>
                    <p>
                        These Terms of Service govern your use of the API Tester
                        application and related services.
                    </p>
                    <span className="terms-updated">
                        Last updated: September 6, 2026
                    </span>
                </header>

                <section className="terms-card">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using API Tester, you agree to be bound
                        by these Terms of Service. If you do not agree with
                        these terms, you should not use the application.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>2. Description of the Service</h2>
                    <p>
                        API Tester is a software application designed to help
                        developers and QA teams create, organize, execute, and
                        manage API testing workflows.
                    </p>
                    <p>
                        The service may include web-based functionality,
                        desktop or agent software, workspace management, API
                        execution, and integrations with third-party services
                        such as Google Drive.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>3. User Accounts</h2>
                    <p>
                        Some features require you to create an API Tester
                        account. You are responsible for maintaining the
                        confidentiality of your account credentials and for
                        activities performed through your account.
                    </p>
                    <p>
                        You agree to provide accurate information when creating
                        an account and to notify us if you believe your account
                        has been accessed without authorization.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>4. Google Drive Integration</h2>
                    <p>
                        API Tester may allow you to connect your Google account
                        and use Google Drive for storing or managing workspace
                        data.
                    </p>
                    <p>
                        By connecting Google Drive, you authorize API Tester to
                        access the Google Drive permissions that you approve
                        during the Google authorization process.
                    </p>
                    <p>
                        You can disconnect the Google Drive integration at any
                        time through the available account or integration
                        controls.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>5. Acceptable Use</h2>
                    <p>You agree not to use API Tester to:</p>
                    <ul>
                        <li>Violate applicable laws or regulations.</li>
                        <li>
                            Gain unauthorized access to systems, accounts, or
                            data.
                        </li>
                        <li>
                            Conduct malicious attacks, abuse, or unauthorized
                            security testing.
                        </li>
                        <li>
                            Upload or distribute malware or other harmful
                            software.
                        </li>
                        <li>
                            Interfere with the availability or security of the
                            service.
                        </li>
                        <li>
                            Circumvent authentication, authorization, or other
                            security controls.
                        </li>
                    </ul>
                </section>

                <section className="terms-card">
                    <h2>6. API Credentials and Sensitive Information</h2>
                    <p>
                        You are responsible for the API keys, tokens,
                        passwords, credentials, request data, and other
                        sensitive information that you enter into API Tester.
                    </p>
                    <p>
                        You should not use API Tester to store credentials or
                        sensitive information unless you understand and accept
                        the associated risks and have appropriate authorization
                        to do so.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>7. Your Data</h2>
                    <p>
                        You retain ownership of the data and content that you
                        provide to API Tester, subject to the rights necessary
                        for us to provide the service.
                    </p>
                    <p>
                        You are responsible for ensuring that you have the
                        necessary rights and permissions to use any data,
                        credentials, APIs, files, or other content through the
                        application.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>8. Third-Party Services</h2>
                    <p>
                        API Tester may integrate with third-party services,
                        including Google services. Your use of those services
                        may also be subject to the third party's own terms,
                        policies, and conditions.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>9. Availability and Changes</h2>
                    <p>
                        We may modify, update, suspend, or discontinue parts of
                        API Tester from time to time. Features may change as the
                        application develops.
                    </p>
                    <p>
                        We do not guarantee that the service will always be
                        available, uninterrupted, or error-free.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>10. Intellectual Property</h2>
                    <p>
                        API Tester and its software, design, branding,
                        interfaces, and related materials may be protected by
                        applicable intellectual property laws.
                    </p>
                    <p>
                        These Terms do not transfer ownership of API Tester or
                        its intellectual property to you.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>11. Disclaimer</h2>
                    <p>
                        API Tester is provided on an "as is" and "as available"
                        basis to the extent permitted by applicable law.
                    </p>
                    <p>
                        You are responsible for validating API requests,
                        responses, test results, credentials, and other output
                        generated or processed through the application.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>12. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by applicable law, API
                        Tester and its operators will not be responsible for
                        indirect, incidental, special, consequential, or
                        similar damages arising from your use of the service.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>13. Account Termination</h2>
                    <p>
                        You may stop using API Tester at any time. We may
                        suspend or terminate access where reasonably necessary,
                        including for violations of these Terms or misuse of
                        the service.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>14. Privacy</h2>
                    <p>
                        Your use of API Tester is also governed by our Privacy
                        Policy, which explains how information is collected,
                        used, stored, and processed.
                    </p>

                    <button
                        className="terms-inline-link"
                        onClick={() => {
                            window.location.href = '/privacy-policy'
                        }}
                    >
                        View Privacy Policy →
                    </button>
                </section>

                <section className="terms-card">
                    <h2>15. Changes to These Terms</h2>
                    <p>
                        We may update these Terms of Service from time to time.
                        Updated terms will be published on this page with a
                        revised "Last updated" date.
                    </p>
                </section>

                <section className="terms-card">
                    <h2>16. Contact</h2>

                    <div className="terms-contact">
                        <strong>API Tester</strong>

                        <span>
                            Email:{' '}
                            <a
                                href="mailto:maheshsharma23112011@gmail.com"
                                className="terms-contact-link"
                            >
                                maheshsharma23112011@gmail.com
                            </a>
                        </span>

                        <span>
                            Website:{' '}
                            <a
                                href="https://api-tester-jade.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="terms-contact-link"
                            >
                                https://api-tester-jade.vercel.app
                            </a>
                        </span>
                    </div>
                </section>

                <div className="terms-footer-note">
                    By using API Tester, you acknowledge that you have read and
                    agree to these Terms of Service.
                </div>
            </main>
        </div>
    )
}