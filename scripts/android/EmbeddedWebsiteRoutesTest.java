package com.disclosuredesk.preview;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * M11: assert that the visible Who's Who link works without a network.
 * Also protects canonical links and other public research pages.
 */
public final class EmbeddedWebsiteRoutesTest {
    public static void main(String[] args) {
        Set<String> allowed = new HashSet<>(Arrays.asList(
                "index.html", "guide.html", "who-is-who.html", "investigations.html",
                "rendlesham-forest-1980.html", "roswell-1947.html", "sources.html",
                "research-edition.html", "privacy.html", "terms.html",
                "community-rules.html", "assets/evidence-dna.js"
        ));
        for (String slug : Arrays.asList(
                "guide", "who-is-who", "investigations", "rendlesham-forest-1980",
                "roswell-1947", "sources", "research-edition",
                "privacy", "terms", "community-rules"
        )) {
            assertRoute(allowed, "/" + slug, slug + ".html");
            assertRoute(allowed, "/" + slug + "/", slug + ".html");
            assertRoute(allowed, "/" + slug + ".html", slug + ".html");
        }
        assertRoute(allowed, "/", "index.html");
        assertRoute(allowed, "/index.html", "index.html");
        assertRoute(allowed, "/assets/evidence-dna.js", "assets/evidence-dna.js");
        for (String bad : Arrays.asList(
                "/no-such-page", "/who-is-who/../terms", "/../../private/file",
                "//who-is-who", "/who-is-who\\file", "/admin/secret",
                "/data/private-users.json", "", "who-is-who"
        )) {
            assertRoute(allowed, bad, null);
        }
        assertRoute(new HashSet<>(), "/who-is-who", null);
        assertRoute(allowed, null, null);
        System.out.println("PASS M11 offline HTML routes: directory/news shortcut, dossiers, guide/legal and unknown-path isolation");
    }

    private static void assertRoute(Set<String> allowed, String path, String expected) {
        String actual = EmbeddedWebsiteRoutes.resolve(path, allowed);
        if (expected == null ? actual != null : !expected.equals(actual))
            throw new AssertionError("Route " + path + ": expected " + expected + ", got " + actual);
    }
}
