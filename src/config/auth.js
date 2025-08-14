import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "username", type: "username", required: true },
        password: { label: "password", type: "password", required: true },
      },
      authorize: async (credentials) => {
        let user = null;
        console.log(credentials);
        try {
          const data = await axios.post(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`,
            { identifier: credentials.username, password: credentials.password }
          );
          user = {
            jwt: data.data?.jwt,
            name: data.data?.user?.username,
            email: data.data?.user?.email,
            view_role: (data.data?.user?.view_role || "").trim() || null,
          };
        } catch (err) {
          console.log(err);
        }

        console.log("user", user);
        if (!user) {
          throw new Error("Invalid credentials.");
        }
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.jwt = user.jwt;
        token.view_role = (user.view_role || "").trim();
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.jwt = token.jwt;
      session.user.view_role = token.view_role;
      return session;
    },
  },
});
