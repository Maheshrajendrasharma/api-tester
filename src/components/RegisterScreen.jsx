import { useState } from 'react'
import { supabase } from '../lib/supabase'

function RegisterScreen({

    onRegistered,

    onBackToLogin

}) {

    const [name, setName] =
        useState("")

    const [email, setEmail] =
        useState("")

    const [password, setPassword] =
        useState("")

    const [confirmPassword, setConfirmPassword] =
        useState("")

    const [error, setError] =
        useState("")

    const [success, setSuccess] =
        useState("")

    const [loading, setLoading] =
        useState(false)



    async function handleRegister(event) {

        event.preventDefault()

        setError("")

        setSuccess("")



        const normalizedName =
            name.trim()

        const normalizedEmail =
            email.trim().toLowerCase()



        if (!normalizedName) {

            setError(
                "Name is required."
            )

            return
        }



        if (!normalizedEmail) {

            setError(
                "Email is required."
            )

            return
        }



if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
    )
) {

            setError(
                "Please enter a valid email address."
            )

            return
        }



        if (password.length < 8) {

            setError(
                "Password must be at least 8 characters long."
            )

            return
        }



        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            )

            return
        }



        setLoading(true)



        try {

            const {
                data,
                error
            } = await supabase.auth.signUp({

                email:
                    normalizedEmail,

                password,

                options: {

                    data: {

                        name:
                            normalizedName

                    }

                }

            })



            if (error) {

                throw new Error(
                    error.message ||
                    "Registration failed."
                )

            }



            if (!data?.user) {

                throw new Error(
                    "Registration failed."
                )

            }



            console.log(
                "[AUTH] Supabase registration successful:",
                data.user
            )



            setName("")

            setEmail("")

            setPassword("")

            setConfirmPassword("")



/*
 * Supabase may require email confirmation.
 * In that case session will be null.
 */

            if (!data.session) {

                setSuccess(
                    "Account created successfully. Please check your email to confirm your account."
                )

            }
            else {

                setSuccess(
                    "Account created successfully."
                )

            }



            if (onRegistered) {

                onRegistered({

                    id:
                        data.user.id,

                    email:
                        data.user.email,

                    name:
                        data.user.user_metadata?.name ||
                        normalizedName

                })

            }

        }

        catch (error) {

            console.error(
                "[AUTH] Registration failed:",
                error
            )

            setError(
                error?.message ||
                "Registration failed."
            )

        }

        finally {

            setLoading(false)

        }

    }



    return (

        <div className="login-screen">

            <div className="login-card">

                <div className="login-title">

                    Create Account

                </div>


                <div className="login-subtitle">

                    Create your API Tester account

                </div>



                <form

                    onSubmit={handleRegister}

                    className="login-form"

                >

                    <div className="login-field">

                        <label>

                            Name

                        </label>


                        <input

                            type="text"

                            value={name}

                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }

                            placeholder="Enter your name"

                            autoComplete="name"

                            disabled={loading}

                        />

                    </div>



                    <div className="login-field">

                        <label>

                            Email

                        </label>


                        <input

                            type="email"

                            value={email}

                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }

                            placeholder="Enter your email"

                            autoComplete="email"

                            disabled={loading}

                        />

                    </div>



                    <div className="login-field">

                        <label>

                            Password

                        </label>


                        <input

                            type="password"

                            value={password}

                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }

                            placeholder="Minimum 8 characters"

                            autoComplete="new-password"

                            disabled={loading}

                        />

                    </div>



                    <div className="login-field">

                        <label>

                            Confirm Password

                        </label>


                        <input

                            type="password"

                            value={confirmPassword}

                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }

                            placeholder="Re-enter password"

                            autoComplete="new-password"

                            disabled={loading}

                        />

                    </div>



                    {error && (

                        <div className="login-error">

                            {error}

                        </div>

                    )}



                    {success && (

                        <div className="login-success">

                            {success}

                        </div>

                    )}



                    <button

                        type="submit"

                        className="login-button"

                        disabled={loading}

                    >

                        {loading

                            ? "Creating account..."

                            : "Create Account"}

                    </button>



                </form>



                <div className="login-footer">

                    Already have an account?


                    <button

                        type="button"

                        className="login-link-button"

                        onClick={onBackToLogin}

                        disabled={loading}

                    >

                        Sign in

                    </button>

                </div>

            </div>

        </div>

    )

}



export default RegisterScreen