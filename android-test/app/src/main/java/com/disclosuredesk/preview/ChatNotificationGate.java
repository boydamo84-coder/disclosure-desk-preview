package com.disclosuredesk.preview;

/**
 * Shared validation for private push tap routes. Must be safe to test with
 * the plain JVM, without a device, auth service or actual push delivery.
 */
final class ChatNotificationGate {
    private static final String UUID="(?i)[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}";
    private ChatNotificationGate() { }

    static boolean isUserId(String value) {
        return value!=null && value.matches(UUID);
    }

    static boolean canOpen(String intendedRecipient,String currentUser,String pairId) {
        return isUserId(intendedRecipient) && intendedRecipient.equalsIgnoreCase(currentUser)
                && isUserId(pairId);
    }

    static int requestCode(String intendedRecipient,String pairId) {
        if(!isUserId(intendedRecipient) || !isUserId(pairId))throw new IllegalArgumentException("Invalid private chat route");
        return ("dd-chat:"+intendedRecipient.toLowerCase(java.util.Locale.ROOT)+":"+pairId.toLowerCase(java.util.Locale.ROOT)).hashCode();
    }
}
