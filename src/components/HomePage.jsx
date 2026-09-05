import { useState } from 'react'
import '../styles/home.css'

const AGENT_DOWNLOAD_URL ='https://github.com/Maheshrajendrasharma/api-tester/releases/latest/download/API-Tester-Agent-Setup.exe'

const DESKTOP_DOWNLOAD_URL ='https://github.com/Maheshrajendrasharma/api-tester/releases/latest/download/API-Tester-Desktop-Setup.exe'

export default function HomePage({
    onContinueOnline,
}) {
    const [checkingAgent, setCheckingAgent] =
        useState(false)

    const [agentStatus, setAgentStatus] =
        useState('unknown')

    async function checkAgent() {
        setCheckingAgent(true)

        try {
            const response =
                await fetch(
                    'http://localhost:3001/health',
                    {
                        method: 'GET',
                    }
                )

            if (!response.ok) {
                throw new Error(
                    `Agent returned ${response.status}`
                )
            }

            setAgentStatus('connected')
        }
        catch {
            setAgentStatus('offline')
        }
        finally {
            setCheckingAgent(false)
        }
    }

    function handleContinueOnline() {
        if (
            agentStatus ===
            'connected'
        ) {
            onContinueOnline()
            return
        }

        checkAgent()
    }

    return (
        <div className="home-page">

            <header className="home-navbar">

                <div className="home-brand">
                    <div className="home-brand-mark">
                        AT
                    </div>

                    <div>
                        <div className="home-brand-name">
                            API Tester
                        </div>

                        <div className="home-brand-subtitle">
                            API testing, simplified
                        </div>
                    </div>
                </div>

                <div className="home-nav-links">
                    <span>Features</span>
                    <span>Desktop</span>
                    <span>Online</span>
                </div>

            </header>


            <main className="home-main">

                <section className="home-hero">

                    <div className="home-badge">
                        <span className="home-badge-dot" />
                        Professional API Testing Platform
                    </div>

                    <h1>
                        Build, test and automate
                        <br />

                        <span>
                            APIs with confidence.
                        </span>
                    </h1>

                    <p>
                        A powerful API testing workspace for
                        development, QA and automation teams.
                        Use it online from your browser or run
                        the complete desktop application.
                    </p>

                </section>


                <section className="home-products">


                    <article className="product-card product-card-primary">

                        <div className="product-card-top">

                            <div className="product-icon online-icon">
                                ↗
                            </div>

                            <div className="product-card-tag">
                                BROWSER
                            </div>

                        </div>


                        <h2>
                            Online API Tester
                        </h2>

                        <p>
                            Work directly from your browser with
                            your collections, environments,
                            requests and test workflows.
                        </p>


                        <div className="product-requirement">

                            <div className="requirement-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    Supporting Agent required
                                </strong>

                                <span>
                                    Required to send requests
                                    through your local network
                                    and VPN.
                                </span>
                            </div>

                        </div>


                        <div className="agent-status-row">

                            <div className="agent-status">

                                <span
                                    className={
                                        `status-dot ${
                                            agentStatus ===
                                            'connected'
                                                ? 'status-connected'
                                                : 'status-offline'
                                        }`
                                    }
                                />

                                {agentStatus ===
                                'connected'
                                    ? 'Agent connected'
                                    : 'Agent not connected'}

                            </div>


                            <button
                                className="check-agent-button"
                                onClick={
                                    checkAgent
                                }
                                disabled={
                                    checkingAgent
                                }
                            >
                                {
                                    checkingAgent
                                        ? 'Checking...'
                                        : 'Check agent'
                                }
                            </button>

                        </div>


                        <a
                            className="primary-button"
                            href={
                                AGENT_DOWNLOAD_URL
                            }
                        >
                            <span>
                                Download Supporting Agent
                            </span>

                            <span className="button-arrow">
                                →
                            </span>
                        </a>


                        <button
                            className="secondary-button"
                            onClick={
                                handleContinueOnline
                            }
                        >
                            {agentStatus === 'connected'
                                ? 'Continue to Online API Tester'
                                : 'I have installed the Agent'}
                        </button>

                    </article>



                    <article className="product-card">

                        <div className="product-card-top">

                            <div className="product-icon desktop-icon">
                                ▣
                            </div>

                            <div className="product-card-tag">
                                DESKTOP
                            </div>

                        </div>


                        <h2>
                            API Tester Desktop
                        </h2>

                        <p>
                            Get the full Electron-powered API
                            testing experience directly on your
                            Windows desktop.
                        </p>


                        <div className="feature-list">

                            <div>
                                <span>✓</span>
                                Complete API workspace
                            </div>

                            <div>
                                <span>✓</span>
                                Native request engine
                            </div>

                            <div>
                                <span>✓</span>
                                Works with VPN and internal APIs
                            </div>

                            <div>
                                <span>✓</span>
                                No browser agent required
                            </div>

                        </div>


                        <a
                            className="desktop-button"
                            href={
                                DESKTOP_DOWNLOAD_URL
                            }
                        >
                            <span>
                                Download Desktop App
                            </span>

                            <span className="button-arrow">
                                →
                            </span>
                        </a>


                        <div className="desktop-note">
                            Windows desktop application
                        </div>

                    </article>

                </section>


                <section className="home-features">

                    <div>
                        <strong>
                            Collections
                        </strong>

                        <span>
                            Organize and manage API requests.
                        </span>
                    </div>


                    <div>
                        <strong>
                            Environments
                        </strong>

                        <span>
                            Switch quickly between environments.
                        </span>
                    </div>


                    <div>
                        <strong>
                            Runner
                        </strong>

                        <span>
                            Execute complete request workflows.
                        </span>
                    </div>


                    <div>
                        <strong>
                            Secure
                        </strong>

                        <span>
                            Your API traffic can stay on your network.
                        </span>
                    </div>

                </section>

            </main>


            <footer className="home-footer">

                <span>
                    API Tester
                </span>

                <span>
                    Built for developers & QA teams
                </span>

            </footer>

        </div>
    )
}