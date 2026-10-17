export default async (request) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(
    /^\/\.netlify\/functions\/api/,
    "/api"
  );
  const method = request.method.toUpperCase();

  const json = (data, status = 200) =>
    Response.json(data, {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    });

  // Health check
  if (method === "GET" && path.endsWith("/health")) {
    return json({
      name: "Alhassan Hosting",
      status: "online"
    });
  }

  // Minecraft Java versions
  if (method === "GET" && path.endsWith("/versions")) {
    try {
      const response = await fetch(
        "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
      );

      if (!response.ok) {
        return json({
          error: "Could not load Minecraft versions"
        }, 502);
      }

      const data = await response.json();

      return json({
        java: data.versions
          .filter((v) => v.type === "release")
          .map((v) => v.id),
        source: "Mojang"
      });
    } catch {
      return json({
        error: "Could not load Minecraft versions"
      }, 502);
    }
  }

  // Registration route
  if (
    method === "POST" &&
    path.endsWith("/auth/register")
  ) {
    return json({
      error: "Registration requires a connected database."
    }, 503);
  }

  // Login route
  if (
    method === "POST" &&
    path.endsWith("/auth/login")
  ) {
    return json({
      error: "Login requires a connected database."
    }, 503);
  }

  // Current user
  if (
    method === "GET" &&
    path.endsWith("/auth/me")
  ) {
    return json({
      error: "Not logged in"
    }, 401);
  }

  // Logout
  if (
    method === "POST" &&
    path.endsWith("/auth/logout")
  ) {
    return json({
      success: true
    });
  }

  // Server API routes
  if (path.includes("/servers")) {
    return json({
      error: "Server management requires a connected database and backend."
    }, 503);
  }

  return json({
    error: "API route not found",
    path,
    method
  }, 404);
};