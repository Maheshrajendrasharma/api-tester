import { useState } from "react"


const AUTH_LOGIN_URL =
    "http://localhost:3001/api/auth/login"


function LoginScreen({
    onLogin,
    onRegister
}) {

    const [email, setEmail] =
        useState("")

    const [password, setPassword] =
        useState("")

    const [error, setError] =
        useState("")

    const [isSubmitting, setIsSubmitting] =
        useState(false)


    async function handleSubmit(
        event
    ) {

        event.preventDefault()


        setError("")


        const normalizedEmail =
            email.trim()


        if (!normalizedEmail) {

            setError(
                "Email is required."
            )

            return
        }


        if (!password) {

            setError(
                "Password is required."
            )

            return
        }


        setIsSubmitting(
            true
        )


        try {

            const response =
                await fetch(
                    AUTH_LOGIN_URL,
                    {

                        method:
                            "POST",

                        credentials:
                            "include",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                email:
                                    normalizedEmail,

                                password

                            })

                    }
                )


            const result =
                await response.json()


            if (
                !response.ok
            ) {

                throw new Error(
                    result?.error ||
                    "Login failed."
                )

            }


            if (
                !result?.success ||
                !result?.user
            ) {

                throw new Error(
                    "Login failed."
                )

            }


            setPassword("")


            onLogin(
                result.user
            )

        }
        catch (error) {

            console.error(
                "[AUTH] Login failed:",
                error
            )


            setError(
                error?.message ||
                "Unable to login."
            )

        }
        finally {

            setIsSubmitting(
                false
            )

        }

    }


    return (

        <div className="login-screen">

            <div className="login-card">

                <div className="login-header">

                    <div className="login-logo">
                        API Tester
                    </div>

                    <div className="login-title">
                        Sign in
                    </div>

                    <div className="login-subtitle">
                        Sign in to continue to API Tester
                    </div>

                </div>


                <form
                    className="login-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    <label
                        className="login-field"
                    >

                        <span>
                            Email
                        </span>

                        <input
                            type="email"
                            value={email}
                            onChange={
                                event =>
                                    setEmail(
                                        event.target.value
                                    )
                            }
                            placeholder="Enter your email"
                            autoComplete="username"
                            disabled={
                                isSubmitting
                            }
                        />

                    </label>


                    <label
                        className="login-field"
                    >

                        <span>
                            Password
                        </span>

                        <input
                            type="password"
                            value={password}
                            onChange={
                                event =>
                                    setPassword(
                                        event.target.value
                                    )
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={
                                isSubmitting
                            }
                        />

                    </label>


                    {
                        error
                            ? (
                                <div
                                    className="login-error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )
                            : null
                    }


                    <button
                        type="submit"
                        className="login-submit"
                        disabled={
                            isSubmitting
                        }
                    >

                        {
                            isSubmitting
                                ? "Signing in..."
                                : "Sign in"
                        }

                    </button>

                </form>

                <div className="login-footer">

    Don't have an account?

    <button
        type="button"
        className="login-link-button"
        onClick={onRegister}
    >
        Create account
    </button>

</div>

            </div>

        </div>

    )

}

export default LoginScreen