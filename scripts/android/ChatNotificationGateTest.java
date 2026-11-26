package com.disclosuredesk.preview;

/** Offline/no-Firebase/no-Android JVM tests for account-scoped notification routing. */
public final class ChatNotificationGateTest {
    private static int tests=0;
    private static void expect(boolean ok,String name){
        tests++;
        if(!ok)throw new AssertionError(name);
    }
    public static void main(String[] args) {
        String a="11111111-1111-4111-8111-111111111111";
        String b="22222222-2222-4222-8222-222222222222";
        String pair="33333333-3333-4333-8333-333333333333";
        String pairB="44444444-4444-4444-8444-444444444444";
        expect(ChatNotificationGate.isUserId(a),"valid A");
        expect(!ChatNotificationGate.isUserId("a"),"deny invalid user");
        expect(!ChatNotificationGate.isUserId(null),"deny null user");
        expect(ChatNotificationGate.canOpen(a,a,pair),"same recipient");
        expect(ChatNotificationGate.canOpen(a.toUpperCase(java.util.Locale.ROOT),a,pair),"UUID casing");
        expect(!ChatNotificationGate.canOpen(a,b,pair),"old account denied");
        expect(!ChatNotificationGate.canOpen(a,"",pair),"signed out denied");
        expect(!ChatNotificationGate.canOpen(null,a,pair),"old notifications without recipient denied");
        expect(!ChatNotificationGate.canOpen(a,a,"https://evil.com"),"external route denied");
        expect(!ChatNotificationGate.canOpen(a,a,null),"missing pair denied");
        expect(ChatNotificationGate.requestCode(a,pair)!=ChatNotificationGate.requestCode(b,pair),"account scoped pending intent");
        expect(ChatNotificationGate.requestCode(a,pair)!=ChatNotificationGate.requestCode(a,pairB),"conversation scoped intent");
        boolean rejected=false;
        try { ChatNotificationGate.requestCode(a,"invalid"); }
        catch(IllegalArgumentException e){rejected=true;}
        expect(rejected,"unsafe pair rejected");
        System.out.println("PASS M96 "+tests+" chat notification account and tap routing checks");
    }
}
