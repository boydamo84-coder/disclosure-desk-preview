package com.disclosuredesk.preview;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Maps only our known public clean URLs to bundled HTML.
 * Used by the private offline-capable WebView, not external websites.
 * Never falls back to arbitrary filesystem paths or client-provided values.
 */
final class EmbeddedWebsiteRoutes {
    private static final Set<String> HTML_SLUGS = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList(
                    "guide", "terms", "privacy", "community-rules", "sources",
                    "research-edition", "who-is-who", "investigations",
                    "rendlesham-forest-1980", "roswell-1947"
            )));

    private EmbeddedWebsiteRoutes() { }

    static String resolve(String decodedPath, Set<String> allowedFiles) {
        if (decodedPath == null || allowedFiles == null ||
                !decodedPath.startsWith("/") || decodedPath.contains("\\") ||
                decodedPath.contains("..") || decodedPath.contains("//") ||
                decodedPath.indexOf('\0') != -1) return null;
        String path = decodedPath;
        if ("/".equals(path)) path = "/index.html";
        else if (path.length() > 1 && path.endsWith("/"))
            path = path.substring(0, path.length() - 1);
        String name = path.substring(1);
        if (HTML_SLUGS.contains(name)) name += ".html";
        return allowedFiles.contains(name) ? name : null;
    }
}
