import { AuthOptions, DefaultSession, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { login } from "./auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await login({
            email: credentials.email,
            password: credentials.password,
          });

          if (!response.user) {
            return null;
          }

          return {
            id: response.user.id,
            email: response.user.email,
            name: `${response.user.first_name} ${response.user.last_name}`.trim(),
          };
        } catch (error) {
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session as Session;
    }
  },
  session: {
    strategy: "jwt",
  }
};
