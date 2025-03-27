import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import axios from "axios";
// Your own logic for dealing with plaintext password strings; be careful!
// import { saltAndHashPassword } from "@/utils/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            // You can specify which fields should be submitted, by adding keys to the `credentials` object.
            // e.g. domain, username, password, 2FA token, etc.
            credentials: {
                username: { label: "username", type: "username", required: true },
                password: { label: "password", type: "password", required: true }
            },
            authorize: async (credentials) => {
                let user = null
                console.log(credentials)
                try {
                    const data = await axios.post(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, { identifier: credentials.username, password: credentials.password });
                    // console.log("data",data)
                    user = { jwt: data.data?.jwt, name: data.data?.user?.username, email: data.data?.user?.email }
                } catch (err) {
                    console.log(err)
                }
                // logic to verify if the user exists

                console.log("user", user)
                if (!user) {
                    // No user found, so this is their first attempt to login
                    // Optionally, this is also the place you could do a user registration
                    throw new Error("Invalid credentials.")
                }

                // return user object with their profile data
                return user
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login"
    },
    callbacks: {
        jwt: ({ token, user }) => {
            // console.log("jwt", token, user);
            if (user) { // User is available during sign-in
                token.jwt = user.jwt
            }
            return token
        },
        session: ({ session, token }) => {
            // console.log("session", session, token);
            session.user.jwt = token.jwt
            return session
        }
    }
})
