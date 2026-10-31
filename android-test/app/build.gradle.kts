plugins { id("com.android.application") }
android {
    namespace = "com.disclosuredesk.preview"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.disclosuredesk.preview"
        minSdk = 26
        targetSdk = 36
        versionCode = 12
        versionName = "0.9.2-play-internal-candidate"
    }
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
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("upload")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies { implementation("androidx.work:work-runtime:2.9.1"); implementation("com.google.guava:guava:31.1-android"); implementation("com.google.android.gms:play-services-ads:25.5.0"); implementation("com.google.android.ump:user-messaging-platform:3.2.0") }
