import NextAuth from 'next-auth'

// https://github.com/frappe/frappe/pull/15161
// https://github.com/nextauthjs/next-auth/discussions/9480
// https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/todoist.ts
// https://github.com/nextauthjs/next-auth/issues/8895
// https://github.com/nextauthjs/next-auth-example
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [{
    id: 'testid',
    name: 'TestID',
    issuer: 'http://dh.localhost:8000', // issuer_url
    type: 'oauth',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    // checks: ['pkce', 'state', 'nonce'],
    authorization: {
      url: 'http://dh.localhost:8000/api/method/frappe.integrations.oauth2.authorize', // auth_url
      params: { scope: 'openid', code_challenge_method: 'HS256' } // code_challenge_method
    },
    token: {
      url: 'http://dh.localhost:8000/api/method/frappe.integrations.oauth2.get_token', // token_url
    },
    client: {
      // token_endpoint_auth_method: 'none', // only client_id added to to body
      token_endpoint_auth_method: 'client_secret_post', // both client_id and client_secret added to body
      id_token_signed_response_alg: "HS256",
    },
    userinfo: {
      url: 'http://dh.localhost:8000/api/method/frappe.integrations.oauth2.openid_profile', // userinfo_url
      // params: { scope: 'openid all' }
    }
  }],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: async ({ token, user, account }) => {
        console.log("JWT callback called with token:", token, "user:", user, "account:", account);
        // // If this is the first time the user is signing in, add user info to the token
        // if (user) {
        //     token.id = user.id;
        //     token.email = user.email;
        //     token.name = user.name;
        // }
        return token;
    },
    session: async ({ session, token }) => {
        console.log("Session callback called with session:", session, "and token:", token);
      return session
    },
    signIn: async ({ user, account }) => {
      console.log("SignIn callback called with user:", user, "and account:", account);
      return true; // Allow sign-in
    },
  }
})
