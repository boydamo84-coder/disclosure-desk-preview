package com.disclosuredesk.preview;

/** Offline JVM test: URL parser never reaches network or Android SDK. */
public final class ResearchLinkParserTest {
    private static int checks=0;
    private static void ok(boolean value,String label) {
        checks++;
        if(!value)throw new AssertionError(label);
    }
    private static ResearchLinkParser.Entry capture(String text) {
        return ResearchLinkParser.fromSharedText(text);
    }
    public static void main(String[] ignored) {
        ResearchLinkParser.Entry article=capture("Interesting source\nhttps://example.org/uap/report?id=123&utm_source=share");
        ok(article!=null,"Article captured");
        ok(article.url.equals("https://example.org/uap/report?id=123&utm_source=share"),"Query preserved");
        ok(article.title.equals("Interesting source"),"Title extracted");
        ResearchLinkParser.Entry bare=capture("https://www.example.net/feature.");
        ok(bare!=null&&bare.url.equals("https://www.example.net/feature"),"Punctuation trimmed");
        ok(bare.title.equals("www.example.net"),"Hostname fallback");
        ok(capture("Read this (https://example.com/news).").url.equals("https://example.com/news"),"Parenthetical link trimmed");
        ok(capture("https://example.com/uap#analysis").url.contains("#analysis"),"Ordinary article fragment retained");
        ok(capture("http://example.org/history")!=null,"Normal HTTP link allowed");
        ok(capture("HTTPS://EXAMPLE.ORG/")!=null,"Uppercase HTTPS accepted");
        ok(capture("javascript:alert(1)")==null,"Script scheme rejected");
        ok(capture("intent://example.com/#Intent;scheme=https;end")==null,"Intent scheme rejected");
        ok(capture("file:///etc/passwd")==null,"File scheme rejected");
        ok(capture("content://example.com/photo")==null,"Content URI rejected");
        ok(capture("https://user:pass@example.com/private")==null,"Inline HTTP credentials rejected");
        ok(capture("https://localhost/admin")==null,"Localhost rejected");
        ok(capture("https://server.localhost/private")==null,"Subdomain localhost rejected");
        ok(capture("https://example.com/path?access_token=secret")==null,"Access token not retained");
        ok(capture("https://example.com/path#refresh_token=secret")==null,"Fragment refresh token not retained");
        ok(capture("https://example.com/oauth?code=secret")==null,"OAuth authorization code not retained");
        ok(capture("https://example.com/?id=5")!=null,"Ordinary ID preserved");
        ok(capture("https://example.com/#the-evidence")!=null,"Non-secret hash retained");
        ok(capture("No source link here")==null,"No URL ignored");
        ok(capture(null)==null,"Null ignored");
        ok(capture("https://")==null,"Incomplete host rejected");
        ok(capture("https://example.com/a b").url.equals("https://example.com/a"),"Only valid URL token captured");
        ok(capture("https://example.com/?secret=token")==null,"Secrets are not saved");
        ok(capture("https://example.com\nhttps://other.com").url.equals("https://example.com"),"First source wins");
        ok(capture("x".repeat(9000)+" https://example.com")==null,"Oversize share rejected");
        ok(ResearchLinkParser.cleanUrl("https://example.com/"+ "x".repeat(2200))==null,"Oversize URL rejected");
        ok(capture("Long title ".repeat(200)+" https://example.com").title.length()<=120,"Long share title truncated");
        ok(ResearchLinkParser.cleanUrl("https://exam ple.com")==null,"Embedded whitespace URL rejected");
        ok(ResearchLinkParser.cleanUrl("https://example.com/\u0001")==null,"Control chars rejected");
        ok(ResearchLinkParser.cleanUrl("https://example.com:99999/path")==null,"Invalid port rejected");
        System.out.println("PASS M81 native Android share-link parser: "+checks+" safe offline JVM assertions");
    }
}
