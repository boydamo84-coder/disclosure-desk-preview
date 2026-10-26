plugins { id("com.android.application") }
android {
    namespace = "com.disclosuredesk.preview"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.disclosuredesk.preview"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "0.2.1-test"
    }
    buildTypes { getByName("release") { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies { implementation("androidx.work:work-runtime:2.9.1") }
