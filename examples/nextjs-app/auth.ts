import NextAuth from 'next-auth'

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
      async request({client, params, checks, provider}) {
        console.log("I am here.........")
        // https://github.com/frappe/frappe/pull/15161
        // https://github.com/nextauthjs/next-auth/discussions/9480
        // https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/todoist.ts
        // https://github.com/nextauthjs/next-auth/issues/8895
        // https://github.com/nextauthjs/next-auth-example
        try {
          const response = await fetch('http://dh.localhost:8000/api/method/frappe.integrations.oauth2.get_token', {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: provider.clientId,
              client_secret: provider.clientSecret,
              grant_type: "authorization_code",
              code: params.code,
              redirect_uri: params.redirect_uri,
            }),
          });
          console.log("Response.....", response)
          if (!response.ok) {
            throw new Error(`Token request failed: ${response.statusText}`);
          }

          const tokens = await response.json();
          return { tokens };
        } catch (error) {
          console.error("Error in token request:", error);
          throw error;
        }
      }
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
  // jwt: {
  //   encode: async ({ secret, token }) => {
  //     return jwt.sign(token, secret, { algorithm: "HS256", expiresIn: "30d" });
  //   },
  //   decode: async ({ secret, token }) => {
  //     return jwt.verify(token, secret, { algorithms: ["HS256"] });
  //   },
  // },
  session: { strategy: 'jwt' },
  callbacks: {
    // jwt: ({ token, profile }) => {
    //   console.log("I am in the jwt callback................", token, profile)
    //   if (profile?.sub && profile?.email) {
    //     return {
    //       sub: profile.sub,
    //       name: profile.name,
    //       email: profile.email,
    //       picture: profile.picture,
    //     }
    //   }
    //   return token
    // },
    session: async ({ session }) => {
      return session
    },
    signIn: async ({ user, account }) => {
      console.log("SignIn callback called with user:", user, "and account:", account);
      return true; // Allow sign-in
    },
  }
})
