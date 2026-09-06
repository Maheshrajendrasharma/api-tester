import '../styles/PrivacyPolicy.css'

export default function PrivacyPolicy() {
    const goHome = () => {
        window.location.href = '/'
    }

    return (
        <div className="privacy-page">

            <header className="privacy-navbar">

                <button
                    className="privacy-brand"
                    onClick={goHome}
                >
                    <span className="privacy-brand-mark">
                        AT
                    </span>

                    <span>
                        <strong>API Tester</strong>
                        <small>API testing, simplified</small>
                    </span>
                </button>

                <button
                    className="privacy-back"
                    onClick={goHome}
                >
                    ← Back to API Tester
                </button>

            </header>

            <main className="privacy-content">

                <div className="privacy-header">

                    <div className="privacy-badge">
                        PRIVACY
                    </div>

                    <h1>
                        Privacy Policy
                    </h1>

                    <p>
                        Last updated: September 6, 2026
                    </p>

                </div>

                <article className="privacy-card">

                    <p>
                        This Privacy Policy explains how API Tester
                        ("API Tester", "we", "us", or "our") collects,
                        uses, stores, and protects information when you
                        use the API Tester application and related services.
                    </p>

                    <section>
                        <h2>1. Information We Collect</h2>

                        <h3>Account Information</h3>

                        <p>
                            When you create an API Tester account, we may
                            collect information such as your name, email
                            address, authentication information, and
                            account-related information.
                        </p>

                        <h3>API Testing Data</h3>

                        <p>
                            API Tester allows you to create and execute
                            API requests. Depending on how you use the
                            application, this may include API URLs,
                            HTTP methods, headers, parameters, request
                            bodies, authorization configuration,
                            collections, environments, variables,
                            and API responses.
                        </p>

                        <h3>Workspace Data</h3>

                        <p>
                            Your workspaces may contain collections,
                            requests, environments, variables,
                            authorization settings, and other information
                            that you choose to save.
                        </p>
                    </section>

                    <section>
                        <h2>2. How We Use Information</h2>

                        <p>We may use information to:</p>

                        <ul>
                            <li>Provide and maintain API Tester.</li>
                            <li>Create and manage user accounts.</li>
                            <li>Authenticate users.</li>
                            <li>Provide workspace functionality.</li>
                            <li>Provide API testing functionality.</li>
                            <li>Provide optional integrations requested by users.</li>
                            <li>Maintain security and prevent unauthorized access.</li>
                            <li>Diagnose technical problems and improve reliability.</li>
                        </ul>

                        <p>
                            We do not sell your personal information.
                        </p>
                    </section>

                    <section>
                        <h2>3. Google Drive Integration</h2>

                        <p>
                            API Tester may provide an optional Google Drive
                            integration that allows users to connect their
                            own Google account and store or synchronize
                            API Tester workspace data in their Google Drive.
                        </p>

                        <p>
                            Google Drive access is initiated only when you
                            choose to connect your Google Drive account and
                            authorize the requested permissions.
                        </p>

                        <p>
                            Each user's Google Drive connection is associated
                            with that user's API Tester account. We do not
                            intentionally provide one user's Google Drive
                            access to another user.
                        </p>
                    </section>

                    <section>
                        <h2>4. Google API Data</h2>

                        <p>
                            When you authorize Google Drive access, API Tester
                            may receive information and permissions necessary
                            to provide the Google Drive functionality you
                            requested.
                        </p>

                        <p>
                            Google API data is used only to provide the
                            functionality described by the application,
                            subject to the permissions you grant.
                        </p>

                        <p>
                            We do not sell Google Drive data or use Google
                            Drive content for advertising purposes.
                        </p>
                    </section>

                    <section>
                        <h2>5. API Credentials and Sensitive Information</h2>

                        <p>
                            API Tester may allow you to configure credentials
                            and authentication information such as API keys,
                            bearer tokens, basic authentication credentials,
                            OAuth credentials, and environment variables.
                        </p>

                        <p>
                            You are responsible for the information and
                            credentials that you enter into API Tester.
                        </p>

                        <p>
                            You should avoid entering production secrets
                            or other highly sensitive information into
                            environments where you do not intend to store
                            or transmit that information.
                        </p>
                    </section>

                    <section>
                        <h2>6. Local Application Data</h2>

                        <p>
                            The API Tester desktop application may store
                            application data locally on your device.
                            This may include workspace information,
                            collections, configuration, and other
                            application state.
                        </p>

                        <p>
                            The supporting API Tester Agent may also use
                            local application storage for application data
                            required to provide its functionality.
                        </p>
                    </section>

                    <section>
                        <h2>7. Server Processing</h2>

                        <p>
                            API Tester may communicate with application
                            servers to provide authentication, workspace
                            functionality, API request execution,
                            synchronization, and other application features.
                        </p>

                        <p>
                            Information transmitted to our services may be
                            processed as necessary to provide the requested
                            functionality.
                        </p>
                    </section>

                    <section>
                        <h2>8. Third-Party Services</h2>

                        <p>
                            API Tester may use third-party services to
                            provide application functionality. These may
                            include authentication, hosting, infrastructure,
                            and Google services such as Google Drive APIs.
                        </p>

                        <p>
                            Third-party services may process information
                            according to their own terms and privacy policies.
                        </p>
                    </section>

                    <section>
                        <h2>9. Data Security</h2>

                        <p>
                            We take reasonable technical and organizational
                            measures to protect information against
                            unauthorized access, disclosure, alteration,
                            loss, or destruction.
                        </p>

                        <p>
                            However, no internet transmission or electronic
                            storage system can be guaranteed to be completely
                            secure.
                        </p>
                    </section>

                    <section>
                        <h2>10. Data Retention</h2>

                        <p>
                            We retain information for as long as reasonably
                            necessary to provide our services, maintain
                            security, comply with applicable legal obligations,
                            resolve disputes, and enforce our agreements.
                        </p>
                    </section>

                    <section>
                        <h2>11. Data Deletion</h2>

                        <p>
                            You may request deletion of your API Tester
                            account and associated information, subject to
                            applicable legal and operational requirements.
                        </p>

                        <p>
                            Data that you have stored directly in your own
                            Google Drive may remain there after deletion
                            of your API Tester account. You can delete
                            those files directly from Google Drive.
                        </p>
                    </section>

                    <section>
                        <h2>12. Disconnecting Google Drive</h2>

                        <p>
                            You may disconnect Google Drive from API Tester.
                            When disconnected, API Tester will no longer use
                            the Google Drive authorization for the disconnected
                            account, subject to processing required to complete
                            the disconnection.
                        </p>

                        <p>
                            Disconnecting API Tester does not automatically
                            delete files that were previously created in
                            your Google Drive.
                        </p>
                    </section>

                    <section>
                        <h2>13. Children's Privacy</h2>

                        <p>
                            API Tester is not intended for children who are
                            unable to legally use the service. We do not
                            knowingly collect personal information from
                            children in violation of applicable law.
                        </p>
                    </section>

                    <section>
                        <h2>14. Your Rights</h2>

                        <p>
                            Depending on applicable law, you may have rights
                            relating to your personal information, including
                            rights to request access, correction, deletion,
                            or information about how your data is processed.
                        </p>

                        <p>
                            You may also withdraw permissions granted to
                            third-party integrations such as Google Drive.
                        </p>
                    </section>

                    <section>
                        <h2>15. Changes to This Privacy Policy</h2>

                        <p>
                            We may update this Privacy Policy from time to
                            time. When material changes are made, we may
                            update the "Last updated" date and provide
                            additional notice where appropriate.
                        </p>
                    </section>

                    <section>
                        <h2>16. Contact Us</h2>

                        <p>
                            If you have questions, concerns, or requests
                            regarding this Privacy Policy or your personal
                            information, please contact us.
                        </p>

<div className="privacy-contact">
    <strong>API Tester</strong>

    <span>
        Email:{' '}
        <a
            href="mailto:maheshsharma23112011@gmail.com"
            className="privacy-contact-link"
        >
            maheshsharma23112011@gmail.com
        </a>
    </span>

    <span>
        Website:{' '}
        <a
            href="https://api-tester-jade.vercel.app/app"
            target="_blank"
            rel="noopener noreferrer"
            className="privacy-contact-link"
        >
         api-tester-jade.vercel.app/app 
        </a>
    </span>
</div>
                    </section>

                    <section>
                        <h2>17. Google API Services User Data Policy</h2>

                        <p>
                            API Tester's use of information received from
                            Google APIs will comply with the applicable
                            Google API Services User Data Policy, including
                            applicable Limited Use requirements.
                        </p>

                        <p>
                            Google Drive access is requested only when a
                            user chooses to connect Google Drive to API Tester.
                        </p>
                    </section>

                    <div className="privacy-footer-note">
                        By using API Tester, you acknowledge that you have
                        read and understood this Privacy Policy.
                    </div>

                </article>

            </main>

        </div>
    )
}