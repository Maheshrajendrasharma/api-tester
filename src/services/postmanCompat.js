import { api } from "./scriptRuntime"

function generateTimestamp() {
    return Math.floor(Date.now() / 1000)
}

function generateRandomFirstName() {
    const names = [
        "Aarav",
        "Vivaan",
        "Aditya",
        "Arjun",
        "Rahul",
        "Rohan",
        "Karan",
        "Vikram",
        "Neha",
        "Priya",
        "Ananya",
        "Sneha",
    ]

    return names[
        Math.floor(Math.random() * names.length)
    ]
}

function generateRandomLastName() {
    const names = [
        "Sharma",
        "Patel",
        "Verma",
        "Singh",
        "Mehta",
        "Gupta",
        "Joshi",
        "Kapoor",
        "Malhotra",
        "Desai",
    ]

    return names[
        Math.floor(Math.random() * names.length)
    ]
}

function generateRandomCompanyName() {
    const companies = [
        "Tech Solutions",
        "Global Enterprises",
        "Digital Systems",
        "Smart Technologies",
        "Prime Services",
        "NextGen Solutions",
        "Innovative Labs",
        "Cloud Systems",
    ]

    return companies[
        Math.floor(Math.random() * companies.length)
    ]
}

function replaceDynamicVariable(value) {

    if (typeof value !== "string") {
        return value
    }

    return value.replace(
        /\{\{\$(timestamp|randomFirstName|randomLastName|randomCompanyName)\}\}/g,
        (_match, variable) => {

            switch (variable) {

                case "timestamp":
                    return String(
                        generateTimestamp()
                    )

                case "randomFirstName":
                    return generateRandomFirstName()

                case "randomLastName":
                    return generateRandomLastName()

                case "randomCompanyName":
                    return generateRandomCompanyName()

                default:
                    return _match
            }
        }
    )
}

export const pm = {

    variables: {

        replaceIn(value) {

            const resolved =
                replaceDynamicVariable(value)

            return resolved
        },

        get(key) {
            return api.get(key)
        },

        set(key, value) {
            api.set(key, value)
        },

        has(key) {
            return api.has(key)
        },

        remove(key) {
            api.remove(key)
        },
    },

    environment: {

        set(key, value) {

            /*
             * For Phase 1 we store the value
             * in the runtime store.
             *
             * This allows:
             *
             * Pre-request
             *       ↓
             * Request
             *       ↓
             * Post-response
             *       ↓
             * Later request
             */

            api.set(key, value)
        },

        get(key) {
            return api.get(key)
        },

        has(key) {
            return api.has(key)
        },

        unset(key) {
            api.remove(key)
        },
    },
}
