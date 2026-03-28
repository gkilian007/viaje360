import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/pricing"],
        disallow: ["/plan", "/mapa", "/ai", "/trips", "/onboarding", "/api/"],
      },
    ],
    sitemap: "https://viaje360.app/sitemap.xml",
  }
}
