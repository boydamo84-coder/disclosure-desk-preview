plugins { id("com.android.application") }

val uploadKeystorePath = System.getenv("DD_UPLOAD_KEYSTORE_PATH").orEmpty()
val uploadStorePassword = System.getenv("DD_UPLOAD_STORE_PASSWORD").orEmpty()
val uploadKeyAlias = System.getenv("DD_UPLOAD_KEY_ALIAS").orEmpty()
val uploadKeyPassword = System.getenv("DD_UPLOAD_KEY_PASSWORD").orEmpty()
val uploadSigningValues = listOf(uploadKeystorePath, uploadStorePassword, uploadKeyAlias, uploadKeyPassword)
val hasUploadSigning = uploadSigningValues.any(String::isNotBlank)
require(!hasUploadSigning || uploadSigningValues.all(String::isNotBlank)) {
    "Set all four DD_UPLOAD_* signing variables together. Without them, the Play bundle is unsigned."
}

android {
    namespace = "com.disclosuredesk.preview"
    compileSdk = 36
    buildToolsVersion = "35.0.0"
    defaultConfig {
        applicationId = "com.boyddigitalstudios.disclosuredesk"
        minSdk = 26
        targetSdk = 36

        buildConfigField("String", "DD_FIREBASE_APP_ID", "\"${System.getenv("DD_FIREBASE_APP_ID") ?: ""}\"")

        buildConfigField("String", "DD_FIREBASE_API_KEY", "\"${System.getenv("DD_FIREBASE_API_KEY") ?: ""}\"")

        buildConfigField("String", "DD_FIREBASE_PROJECT_ID", "\"${System.getenv("DD_FIREBASE_PROJECT_ID") ?: ""}\"")

        buildConfigField("String", "DD_FIREBASE_SENDER_ID", "\"${System.getenv("DD_FIREBASE_SENDER_ID") ?: ""}\"")
        versionCode = 45
        versionName = "0.16.11"
        manifestPlaceholders["ddAppLabel"] = "Disclosure Desk"
    }
    buildFeatures { buildConfig = true }
    signingConfigs {
        if (hasUploadSigning) {
            create("upload") {
                storeFile = file(uploadKeystorePath)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }
    buildTypes {
        getByName("debug") {
            // Never uninstall or overwrite the owner's installed production package.
            applicationIdSuffix = ".beta.m109"
            versionNameSuffix = "-preview"
            manifestPlaceholders["ddAppLabel"] = "Disclosure Desk Beta M109"
        }
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("upload")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies { implementation("androidx.work:work-runtime:2.9.1"); implementation("com.google.guava:guava:31.1-android"); implementation("com.google.android.gms:play-services-ads:25.5.0"); implementation("com.google.android.ump:user-messaging-platform:3.2.0"); implementation("com.android.billingclient:billing:9.1.0"); implementation("com.google.firebase:firebase-messaging:26.0.1"); implementation("androidx.webkit:webkit:1.17.1") }
dependencies {
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.2.0")
}

configurations.configureEach {
    exclude(group = "com.google.firebase", module = "firebase-analytics")
    exclude(group = "com.google.firebase", module = "firebase-analytics-ktx")
}
