export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Google OAuth start
    if (url.pathname === "/auth") {
      const redirectUri =
        `${url.origin}/callback`;

      const googleUrl = new URL(
        "https://accounts.google.com/o/oauth2/v2/auth"
      );

      googleUrl.searchParams.set(
        "client_id",
        env.GOOGLE_CLIENT_ID
      );

      googleUrl.searchParams.set(
        "redirect_uri",
        redirectUri
      );

      googleUrl.searchParams.set(
        "response_type",
        "code"
      );

      googleUrl.searchParams.set(
        "scope",
        "https://www.googleapis.com/auth/youtube.readonly"
      );

      googleUrl.searchParams.set(
        "access_type",
        "offline"
      );

      googleUrl.searchParams.set(
        "prompt",
        "consent"
      );

      return Response.redirect(googleUrl.toString(), 302);
    }

    // Google OAuth callback
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        return new Response(
          `Google OAuth Error: ${error}`,
          { status: 400 }
        );
      }

      if (!code) {
        return new Response(
          "Authorization code missing.",
          { status: 400 }
        );
      }

      const redirectUri =
        `${url.origin}/callback`;

      const tokenResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
          })
        }
      );

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return new Response(
          `Token Error: ${JSON.stringify(tokenData)}`,
          { status: 400 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "YouTube OAuth connected successfully.",
          token: tokenData
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      "Sanatan Secrets YouTube OAuth Worker is running."
    );
  }
};
