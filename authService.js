import crypto from "node:crypto"
import path from "node:path"

import {
    mkdir,
    readFile,
    writeFile,
    rename
} from "node:fs/promises"

import { fileURLToPath } from "node:url"


const __filename =
    fileURLToPath(
        import.meta.url
    )


const __dirname =
    path.dirname(
        __filename
    )


const DATA_DIRECTORY =
    path.join(
        __dirname,
        ".api-tester-data"
    )


const USERS_FILE =
    path.join(
        DATA_DIRECTORY,
        "users.json"
    )


const SESSIONS_FILE =
    path.join(
        DATA_DIRECTORY,
        "sessions.json"
    )


const SESSION_DURATION_MS =
    30 * 24 * 60 * 60 * 1000



const PASSWORD_KEY_LENGTH =
    64


const PASSWORD_SALT_LENGTH =
    32


const PASSWORD_SCRYPT_COST =
    16384


const PASSWORD_SCRYPT_BLOCK_SIZE =
    8


const PASSWORD_SCRYPT_PARALLELIZATION =
    1


/*
 * =========================================================
 * DATA DIRECTORY
 * =========================================================
 */

async function ensureDataDirectory() {

    await mkdir(
        DATA_DIRECTORY,
        {
            recursive: true
        }
    )

}


/*
 * =========================================================
 * EMPTY DATABASE
 * =========================================================
 */

function createDefaultUserDatabase() {

    return {

        version:
            1,

        users:
            []

    }

}


/*
 * =========================================================
 * NORMALIZE USER
 * =========================================================
 */

function normalizeUser(
    user
) {

    return {

        id:
            user?.id ??
            crypto.randomUUID(),

        email:
            String(
                user?.email ??
                ""
            )
                .trim()
                .toLowerCase(),

        name:
            String(
                user?.name ??
                ""
            )
                .trim(),

        passwordSalt:
            user?.passwordSalt ??
            null,

        passwordHash:
            user?.passwordHash ??
            null,

        createdAt:
            user?.createdAt ??
            new Date().toISOString(),

        updatedAt:
            user?.updatedAt ??
            new Date().toISOString()

    }

}


/*
 * =========================================================
 * LOAD USER DATABASE
 * =========================================================
 */

export async function loadUserDatabase() {

    await ensureDataDirectory()


    try {

        const content =
            await readFile(
                USERS_FILE,
                "utf8"
            )


        if (!content.trim()) {

            return createDefaultUserDatabase()

        }


        const parsed =
            JSON.parse(
                content
            )


        return {

            version:
                parsed?.version ??
                1,

            users:
                Array.isArray(
                    parsed?.users
                )
                    ? parsed.users.map(
                        normalizeUser
                    )
                    : []

        }

    }
    catch (error) {

        if (
            error?.code ===
            "ENOENT"
        ) {

            const database =
                createDefaultUserDatabase()


            await saveUserDatabase(
                database
            )


            return database

        }


        throw error

    }

}


/*
 * =========================================================
 * SAVE USER DATABASE
 * =========================================================
 */

export async function saveUserDatabase(
    database
) {

    await ensureDataDirectory()


    const normalizedDatabase = {

        version:
            database?.version ??
            1,

        users:
            Array.isArray(
                database?.users
            )
                ? database.users.map(
                    normalizeUser
                )
                : []

    }


    const temporaryFile =
        `${USERS_FILE}.tmp`


    await writeFile(

        temporaryFile,

        JSON.stringify(
            normalizedDatabase,
            null,
            2
        ),

        "utf8"

    )


    await rename(
        temporaryFile,
        USERS_FILE
    )


    return normalizedDatabase

}

/*
 * =========================================================
 * SESSION DATABASE
 * =========================================================
 */

function createDefaultSessionDatabase() {

    return {

        version:
            1,

        sessions:
            []

    }

}


async function loadSessionDatabase() {

    await ensureDataDirectory()


    try {

        const content =
            await readFile(
                SESSIONS_FILE,
                "utf8"
            )


        if (
            !content.trim()
        ) {

            return createDefaultSessionDatabase()

        }


        const parsed =
            JSON.parse(
                content
            )


        return {

            version:
                parsed?.version ??
                1,

            sessions:
                Array.isArray(
                    parsed?.sessions
                )
                    ? parsed.sessions
                    : []

        }

    }
    catch (error) {

        if (
            error?.code ===
            "ENOENT"
        ) {

            const database =
                createDefaultSessionDatabase()


            await saveSessionDatabase(
                database
            )


            return database

        }


        throw error

    }

}


async function saveSessionDatabase(
    database
) {

    await ensureDataDirectory()


    const normalizedDatabase = {

        version:
            database?.version ??
            1,

        sessions:
            Array.isArray(
                database?.sessions
            )
                ? database.sessions
                : []

    }


    const temporaryFile =
        `${SESSIONS_FILE}.tmp`


    await writeFile(

        temporaryFile,

        JSON.stringify(
            normalizedDatabase,
            null,
            2
        ),

        "utf8"

    )


    await rename(
        temporaryFile,
        SESSIONS_FILE
    )


    return normalizedDatabase

}


/*
 * =========================================================
 * NORMALIZE EMAIL
 * =========================================================
 */

export function normalizeEmail(
    email
) {

    return String(
        email ??
        ""
    )
        .trim()
        .toLowerCase()

}


/*
 * =========================================================
 * FIND USER
 * =========================================================
 */

export async function findUserByEmail(
    email
) {

    const normalizedEmail =
        normalizeEmail(
            email
        )


    if (
        !normalizedEmail
    ) {

        return null

    }


    const database =
        await loadUserDatabase()


    return (
        database.users.find(
            user =>
                user.email ===
                normalizedEmail
        ) ??
        null
    )

}


export async function findUserById(
    userId
) {

    if (!userId) {

        return null

    }


    const database =
        await loadUserDatabase()


    return (
        database.users.find(
            user =>
                user.id ===
                userId
        ) ??
        null
    )

}


/*
 * =========================================================
 * PASSWORD HASHING
 * =========================================================
 */

export async function hashPassword(
    password
) {

    if (
        typeof password !==
        "string" ||
        password.length ===
        0
    ) {

        throw new Error(
            "Password is required."
        )

    }


    const salt =
        crypto.randomBytes(
            PASSWORD_SALT_LENGTH
        )


    const derivedKey =
        await new Promise(
            (
                resolve,
                reject
            ) => {

                crypto.scrypt(

                    password,

                    salt,

                    PASSWORD_KEY_LENGTH,

                    {

                        N:
                            PASSWORD_SCRYPT_COST,

                        r:
                            PASSWORD_SCRYPT_BLOCK_SIZE,

                        p:
                            PASSWORD_SCRYPT_PARALLELIZATION

                    },

                    (
                        error,
                        key
                    ) => {

                        if (error) {

                            reject(
                                error
                            )

                            return

                        }


                        resolve(
                            key
                        )

                    }

                )

            }
        )


    return {

        salt:
            salt.toString(
                "hex"
            ),

        hash:
            Buffer
                .from(
                    derivedKey
                )
                .toString(
                    "hex"
                )

    }

}


/*
 * =========================================================
 * PASSWORD VERIFY
 * =========================================================
 */

export async function verifyPassword(
    password,
    passwordSalt,
    passwordHash
) {

    if (
        typeof password !==
        "string" ||
        !passwordSalt ||
        !passwordHash
    ) {

        return false

    }


    const salt =
        Buffer.from(
            passwordSalt,
            "hex"
        )


    const expectedHash =
        Buffer.from(
            passwordHash,
            "hex"
        )


    const derivedKey =
        await new Promise(
            (
                resolve,
                reject
            ) => {

                crypto.scrypt(

                    password,

                    salt,

                    expectedHash.length,

                    {

                        N:
                            PASSWORD_SCRYPT_COST,

                        r:
                            PASSWORD_SCRYPT_BLOCK_SIZE,

                        p:
                            PASSWORD_SCRYPT_PARALLELIZATION

                    },

                    (
                        error,
                        key
                    ) => {

                        if (error) {

                            reject(
                                error
                            )

                            return

                        }


                        resolve(
                            key
                        )

                    }

                )

            }
        )


    const actualHash =
        Buffer.from(
            derivedKey
        )


    if (
        actualHash.length !==
        expectedHash.length
    ) {

        return false

    }


    return crypto.timingSafeEqual(
        actualHash,
        expectedHash
    )

}




/*
 * =========================================================
 * CREATE SESSION
 * =========================================================
 */

export async function createSession(
    userId
) {

    if (!userId) {

        throw new Error(
            "User ID is required."
        )

    }


    const token =
        crypto.randomBytes(
            32
        ).toString(
            "hex"
        )


    const tokenHash =
        crypto
            .createHash(
                "sha256"
            )
            .update(
                token
            )
            .digest(
                "hex"
            )


    const now =
        new Date()


    const expiresAt =
        new Date(
            now.getTime() +
            SESSION_DURATION_MS
        )


    const database =
        await loadSessionDatabase()


    /*
     * Remove expired sessions.
     */

    database.sessions =
        database.sessions.filter(
            session =>
                new Date(
                    session.expiresAt
                ) > now
        )


    /*
     * Remove previous sessions
     * belonging to this user.
     *
     * For the first implementation,
     * one active session per user
     * is enough.
     */

    database.sessions =
        database.sessions.filter(
            session =>
                session.userId !==
                userId
        )


    database.sessions.push({

        id:
            crypto.randomUUID(),

        tokenHash,

        userId,

        createdAt:
            now.toISOString(),

        expiresAt:
            expiresAt.toISOString()

    })


    await saveSessionDatabase(
        database
    )


    return {

        token,

        expiresAt:
            expiresAt.toISOString()

    }

}


/*
 * =========================================================
 * FIND SESSION
 * =========================================================
 */

export async function findSession(
    token
) {

    if (
        !token
    ) {

        return null

    }


    const tokenHash =
        crypto
            .createHash(
                "sha256"
            )
            .update(
                token
            )
            .digest(
                "hex"
            )


    const database =
        await loadSessionDatabase()


    const now =
        new Date()


    let changed =
        false


    database.sessions =
        database.sessions.filter(
            session => {

                const valid =
                    new Date(
                        session.expiresAt
                    ) > now

                if (!valid) {

                    changed =
                        true

                }

                return valid

            }
        )


    if (
        changed
    ) {

        await saveSessionDatabase(
            database
        )

    }


    const session =
        database.sessions.find(
            item =>
                item.tokenHash ===
                tokenHash
        )


    if (
        !session
    ) {

        return null

    }


    const user =
        await findUserById(
            session.userId
        )


    if (
        !user
    ) {

        return null

    }


    return {

        session,

        user

    }

}


/*
 * =========================================================
 * DESTROY SESSION
 * =========================================================
 */

export async function destroySession(
    token
) {

    if (
        !token
    ) {

        return false

    }


    const tokenHash =
        crypto
            .createHash(
                "sha256"
            )
            .update(
                token
            )
            .digest(
                "hex"
            )


    const database =
        await loadSessionDatabase()


    const originalLength =
        database.sessions.length


    database.sessions =
        database.sessions.filter(
            session =>
                session.tokenHash !==
                tokenHash
        )


    if (
        database.sessions.length !==
        originalLength
    ) {

        await saveSessionDatabase(
            database
        )

        return true

    }


    return false

}

/*
 * =========================================================
 * CREATE USER
 * =========================================================
 */

export async function createUser(
    {
        name,
        email,
        password
    }
) {

    const normalizedEmail =
        normalizeEmail(
            email
        )


    const normalizedName =
        String(
            name ??
            ""
        )
            .trim()


    if (
        !normalizedEmail
    ) {

        throw new Error(
            "Email is required."
        )

    }


    if (
        !password
    ) {

        throw new Error(
            "Password is required."
        )

    }


    const existingUser =
        await findUserByEmail(
            normalizedEmail
        )


    if (
        existingUser
    ) {

        throw new Error(
            "An account with this email already exists."
        )

    }


    const {

        salt,
        hash

    } =
        await hashPassword(
            password
        )


    const now =
        new Date().toISOString()


    const user = {

        id:
            crypto.randomUUID(),

        email:
            normalizedEmail,

        name:
            normalizedName,

        passwordSalt:
            salt,

        passwordHash:
            hash,

        createdAt:
            now,

        updatedAt:
            now

    }


    const database =
        await loadUserDatabase()


    database.users.push(
        user
    )


    await saveUserDatabase(
        database
    )


    return sanitizeUser(
        user
    )

}


/*
 * =========================================================
 * REMOVE PASSWORD DATA FROM API RESULTS
 * =========================================================
 */

export function sanitizeUser(
    user
) {

    if (!user) {

        return null

    }


    return {

        id:
            user.id,

        name:
            user.name,

        email:
            user.email,

        createdAt:
            user.createdAt,

        updatedAt:
            user.updatedAt

    }

}