// Created to spread the authConfig Object. Make auth, signIn, and signOut available to the program.

import NextAuth from 'next-auth';
// The Credentials provider allows you to handle signing in with arbitrary credentials, such as a username and password, domain, two factor authentication or hardware device (e.g. YubiKey U2F / FIDO).
// It is intended to support use cases where you have an existing system you need to authenticate users against, and therefore users authenticated in this manner are not persisted in the database.
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

// After validating the creds, create a function that queries the user from our database. Generic Type assigned to Promise for flexibility, it should either return a User or undefined.
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // You can use the authorize function to handle the authentication logic. Similarly to Server Actions, you can use zod to validate the email and password before checking if the user exists in the database.
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        // Above we defined a getUser Function which takes in an email address as an argument, and returns a User or undefined. If a validated data object or parsedCredentials has a success property, we'll destructure or access email & password from parsedCreds.data. Then, we'll use the function above to fetch the user by email. If not, return null.
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          // If a user is returned, we call a bcrypt method/function that takes the parsedCreds password, and the password of the fetcehd userand compares the two, and should return a boolean.
          const passwordsMatch = await bcrypt.compare(password, user.password);
          // If the boolean returns true, return the fetched user. Else, return null.
          if (passwordsMatch) return user;
        }

        console.log('Invalid Credentials');
        return null;
      },
    }),
  ],
});
