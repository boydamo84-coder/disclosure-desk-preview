package com.disclosuredesk.preview;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure-Java, non-network parser for Android ACTION_SEND text/plain links.
 * Never executes or fetches a shared URL. Only ordinary HTTP(S) references
 * without inline credentials can enter the device-only Research Inbox.
 */
public final class ResearchLinkParser {
    private static final Pattern URL = Pattern.compile("(?i)https?://[^\\s<>\"']+");
    private static final int MAX_TEXT = 8192;
    private static final int MAX_URL = 2048;
    private static final int MAX_TITLE = 120;

    public static final class Entry {
        public final String url;
        public final String title;
        public Entry(String url, String title) {
            this.url = url;
            this.title = title;
        }
    }

    private ResearchLinkParser() {}

    public static Entry fromSharedText(String text) {
        if (text == null || text.trim().isEmpty() || text.length() > MAX_TEXT) return null;
        Matcher matcher = URL.matcher(text);
        while (matcher.find()) {
            String candidate = cleanUrl(matcher.group());
            if (candidate == null) continue;
            String before = text.substring(0, matcher.start()).trim();
            String after = text.substring(matcher.end()).trim();
            String title = before.isEmpty() ? after : before;
            title = cleanTitle(title, candidate);
            return new Entry(candidate, title);
        }
        return null;
    }

    public static String cleanUrl(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        // Do not trim away control characters before validating the raw input.
        // A link containing hidden control bytes must be rejected outright.
        for (int i=0;i<raw.length();i++) {
            if (Character.isISOControl(raw.charAt(i))) return null;
        }
        String url = raw.trim();
        while (!url.isEmpty() && ".,!?;:)]}>".indexOf(url.charAt(url.length()-1)) >= 0) {
            url = url.substring(0, url.length()-1);
        }
        if (url.length() < 9 || url.length() > MAX_URL) return null;
        for (int i=0;i<url.length();i++) {
            char c=url.charAt(i);
            if (Character.isISOControl(c) || Character.isWhitespace(c)) return null;
        }
        try {
            URI parsed=new URI(url);
            String scheme=parsed.getScheme(),host=parsed.getHost();
            if (scheme==null || !(scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))) return null;
            if (host==null || host.trim().isEmpty() || parsed.getRawUserInfo()!=null) return null;
            if (parsed.getPort()>65535) return null;
            String normalizedHost=host.toLowerCase(Locale.ROOT);
            if (normalizedHost.equals("localhost") || normalizedHost.endsWith(".localhost")) return null;
            // Never retain credential-bearing auth callbacks or token fragments
            // in the device research list. They are not research sources.
            if (looksLikeCredentialLink(parsed.getRawQuery()) ||
                looksLikeCredentialLink(parsed.getRawFragment())) return null;
            return url;
        } catch (URISyntaxException | IllegalArgumentException exception) {
            return null;
        }
    }

    private static boolean looksLikeCredentialLink(String rawParams) {
        if (rawParams==null || rawParams.isEmpty()) return false;
        String source=rawParams.toLowerCase(Locale.ROOT);
        for (String param:source.split("[&;]")) {
            String key=param.split("=",2)[0];
            if (key.equals("access_token") || key.equals("refresh_token") ||
                key.equals("id_token") || key.equals("auth_token") ||
                key.equals("session_token") || key.equals("api_key") ||
                key.equals("client_secret") || key.equals("secret") || key.equals("password") ||
                key.equals("authorization_code") || key.equals("code")) return true;
        }
        return false;
    }

    static String formatInboxRow(String title, String source) {
        String titleHost = title.replaceFirst("(?i)^www[.]", "");
        String sourceHost = source.replaceFirst("(?i)^www[.]", "");
        return titleHost.equalsIgnoreCase(sourceHost) ? title : title + "\n" + source;
    }

    private static String cleanTitle(String text, String url) {
        String title=(text==null?"":text).replaceAll("[\\p{Cntrl}]+", " ")
            .replaceAll("\\s+", " ").trim();
        if (title.length()>MAX_TITLE) title=title.substring(0,MAX_TITLE).trim();
        if (title.isEmpty()) {
            try {
                String host=new URI(url).getHost();
                return host==null?"Shared research link":host;
            } catch (Exception ignored) {
                return "Shared research link";
            }
        }
        return title;
    }
}
