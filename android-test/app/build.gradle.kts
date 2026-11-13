plugins { id("com.android.application") }
android {
    namespace = "com.disclosuredesk.preview"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.boyddigitalstudios.disclosuredesk"
        minSdk = 26
        targetSdk = 36

        buildConfigField("String", "DD_FIREBASE_APP_ID", "\"${System.getenv("DD_FIREBASE_APP_ID") ?: ""}\"")

        buildConfigField("String", "DD_FIREBASE_API_KEY", "\"${System.getenv("DD_FIREBASE_API_KEY") ?: ""}\"")

        buildConfigField("String", "DD_FIREBASE_PROJECT_ID", "\"${System.getenv("DD_FIREBASE_PROJECT_ID") ?: ""}\"")

        buildConfigField("String", "DD_FIREBASE_SENDER_ID", "\"${System.getenv("DD_FIREBASE_SENDER_ID") ?: ""}\"")
        versionCode = 24
        versionName = "0.14.0-m92-private-beta"
        manifestPlaceholders["ddAppLabel"] = "Disclosure Desk"
    }
    buildFeatures { buildConfig = true }
    signingConfigs {
        create("upload") {
            val storeFilePath = System.getenv("DD_UPLOAD_KEYSTORE_PATH")
            if (!storeFilePath.isNullOrBlank()) {
                storeFile = file(storeFilePath)
                storePassword = System.getenv("DD_UPLOAD_STORE_PASSWORD")
                keyAlias = System.getenv("DD_UPLOAD_KEY_ALIAS")
                keyPassword = System.getenv("DD_UPLOAD_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        getByName("debug") {
            // Never uninstall or overwrite the owner's installed production package.
            applicationIdSuffix = ".beta.m92"
            versionNameSuffix = "-preview"
            manifestPlaceholders["ddAppLabel"] = "Disclosure Desk Beta M92"
        }
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("upload")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies { implementation("androidx.work:work-runtime:2.9.1"); implementation("com.google.guava:guava:31.1-android"); implementation("com.google.android.gms:play-services-ads:25.5.0"); implementation("com.google.android.ump:user-messaging-platform:3.2.0"); implementation("com.android.billingclient:billing:9.1.0"); implementation("com.google.firebase:firebase-messaging:26.0.1"); implementation("androidx.webkit:webkit:1.17.1") }
