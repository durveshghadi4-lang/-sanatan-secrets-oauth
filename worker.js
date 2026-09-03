export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ================================
    // HEALTH CHECK
    // ================================
    if (url.pathname === "/") {
      return new Response(
        "Sanatan Secrets YouTube OAuth Worker is running.",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    // ================================
    // GOOGLE OAUTH START
    // ================================
    if (url.pathname === "/auth") {
      if (!env.GOOGLE_CLIENT_ID) {
        return new Response(
          "Configuration Error: GOOGLE_CLIENT_ID is missing.",
          { status: 500 }
        );
      }

      const redirectUri = `${url.origin}/callback`;

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

      googleUrl.searchParams.set(
        "include_granted_scopes",
        "true"
      );

      return Response.redirect(
        googleUrl.toString(),
        302
      );
    }

    // ================================
    // GOOGLE OAUTH CALLBACK
    // ================================
    if (url.pathname === "/callback") {
      const error = url.searchParams.get("error");

      if (error) {
        return new Response(
          `Google OAuth Error: ${error}`,
          {
            status: 400,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }

      const code = url.searchParams.get("code");

      if (!code) {
        return new Response(
          "Authorization code missing.",
          {
            status: 400,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }

      if (
        !env.GOOGLE_CLIENT_ID ||
        !env.GOOGLE_CLIENT_SECRET
      ) {
        return new Response(
          "Configuration Error: OAuth environment variables are missing.",
          { status: 500 }
        );
      }

      const redirectUri = `${url.origin}/callback`;

      // ================================
      // EXCHANGE CODE FOR TOKENS
      // ================================
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
          {
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      // IMPORTANT:
      // Do NOT expose access_token / refresh_token
      // directly in the browser.

      return new Response(
        JSON.stringify(
          {
            success: true,
            message:
              "YouTube OAuth connected successfully.",
            token_received: true,
            has_access_token:
              !!tokenData.access_token,
            has_refresh_token:
              !!tokenData.refresh_token,
            expires_in:
              tokenData.expires_in || null,
            scope:
              tokenData.scope || null
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // ================================
    // 404
    // ================================
    return new Response(
      "Not Found",
      {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
};
