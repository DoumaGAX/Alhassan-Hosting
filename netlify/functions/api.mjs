export default async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.endsWith("/versions")) {
    try {
      const response = await fetch(
        "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
      );

      if (!response.ok) {
        return Response.json(
          { error: "Could not load Minecraft versions" },
          { status: 502 }
        );
      }

      const data = await response.json();

      return Response.json({
        java: data.versions
          .filter((version) => version.type === "release")
          .map((version) => version.id),
        source: "Mojang"
      });
    } catch {
      return Response.json(
        { error: "Could not load Minecraft versions" },
        { status: 502 }
      );
    }
  }

  return Response.json(
    { error: "API route not configured" },
    { status: 404 }
  );
};