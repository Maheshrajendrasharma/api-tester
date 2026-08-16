function generateGuid() {

    return crypto.randomUUID()

}


function generateTimestamp() {

    return Math.floor(
        Date.now() / 1000
    )

}


function generateIsoTimestamp() {

    return new Date()
        .toISOString()

}


function generateRandomFirstName() {

    const names = [
        "Rahul",
        "Amit",
        "Neha",
        "Priya",
        "Mahesh",
        "Ankit"
    ]

    return names[
        Math.floor(
            Math.random() * names.length
        )
    ]

}


function generateRandomLastName() {

    const names = [
        "Sharma",
        "Patel",
        "Verma",
        "Singh"
    ]

    return names[
        Math.floor(
            Math.random() * names.length
        )
    ]

}

function generateRandomCountryCode() {

    const countryCodes = [
        "IN",
        "US",
        "GB",
        "CA",
        "AU",
        "DE",
        "FR",
        "SG",
        "AE",
        "JP"
    ]

    return countryCodes[
        Math.floor(
            Math.random() * countryCodes.length
        )
    ]

}


export function resolveDynamicVariable(key) {


    switch(key) {


        case "guid":
            return generateGuid()

        case "randomUUID":
            return generateGuid()
        

        case "timestamp":
            return generateTimestamp()


        case "isoTimestamp":
            return generateIsoTimestamp()


        case "randomFirstName":
            return generateRandomFirstName()


        case "randomLastName":
            return generateRandomLastName()


        case "randomCountryCode":
            return generateRandomCountryCode()


        default:
            return undefined
    }

}