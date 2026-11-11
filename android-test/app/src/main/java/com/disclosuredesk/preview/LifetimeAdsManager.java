package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

/**
 * One-time, non-consumable Play product. Only Google Play PURCHASED transactions grant
 * a locally cached no-ads state; pending and cancelled orders never do.
 * PRE-PUBLICATION GATE: migrate receipt verification/acknowledgement and refund sync
 * to a trusted Play Developer API backend before a paid production launch.
 */
public final class LifetimeAdsManager implements PurchasesUpdatedListener {
    public static final String PRODUCT_ID = "remove_ads_lifetime";
    private final Activity activity;
    private final Consumer<Boolean> adFreeChanged;
    private final BillingClient billing;
    private ProductDetails product;
    private boolean connected;

    public LifetimeAdsManager(Activity activity, Consumer<Boolean> adFreeChanged) {
        this.activity=activity;
        this.adFreeChanged=adFreeChanged;
        this.billing=BillingClient.newBuilder(activity)
          .setListener(this)
          .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
          .enableAutoServiceReconnection().build();
        // The last verified Play result is only an offline display cache.
        adFreeChanged.accept(activity.getSharedPreferences("dd-premium",Context.MODE_PRIVATE).getBoolean("verified-purchased",false));
        connect();
    }
    private void notifyUi(String message){
        activity.runOnUiThread(()->Toast.makeText(activity,message,Toast.LENGTH_LONG).show());
    }
    private void setEntitled(boolean entitled){
        activity.getSharedPreferences("dd-premium",Context.MODE_PRIVATE).edit().putBoolean("verified-purchased",entitled).apply();
        activity.runOnUiThread(()->adFreeChanged.accept(entitled));
    }
    private void connect(){
        billing.startConnection(new BillingClientStateListener(){
            @Override public void onBillingSetupFinished(@NonNull BillingResult result){
                connected=result.getResponseCode()==BillingClient.BillingResponseCode.OK;
                if(connected){loadProduct();restore();}
            }
            @Override public void onBillingServiceDisconnected(){connected=false;}
        });
    }
    private void loadProduct(){
        QueryProductDetailsParams params=QueryProductDetailsParams.newBuilder().setProductList(
          Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
            .setProductId(PRODUCT_ID).setProductType(BillingClient.ProductType.INAPP).build())).build();
        billing.queryProductDetailsAsync(params,(result,details)->{
            if(result.getResponseCode()==BillingClient.BillingResponseCode.OK&&!details.getProductDetailsList().isEmpty())
                product=details.getProductDetailsList().get(0);
        });
    }
    public void restore(){
        if(!connected){notifyUi("Connecting to Google Play for purchase status.");return;}
        QueryPurchasesParams params=QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build();
        billing.queryPurchasesAsync(params,(result,purchases)->{
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK){
                // Preserve the last verified state while offline; do not grant a new entitlement.
                return;
            }
            setEntitled(process(purchases));
        });
    }
    private boolean process(List<Purchase> purchases){
        boolean found=false;
        if(purchases==null)return false;
        for(Purchase purchase:purchases){
            if(!purchase.getProducts().contains(PRODUCT_ID))continue;
            if(purchase.getPurchaseState()==Purchase.PurchaseState.PURCHASED){
                found=true;
                if(!purchase.isAcknowledged()){
                    AcknowledgePurchaseParams params=AcknowledgePurchaseParams.newBuilder()
                      .setPurchaseToken(purchase.getPurchaseToken()).build();
                    billing.acknowledgePurchase(params,(result)->{
                        if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK)
                          notifyUi("Purchase saved by Google Play. Acknowledgement needs retry.");
                    });
                }
            }else if(purchase.getPurchaseState()==Purchase.PurchaseState.PENDING)
                notifyUi("Payment pending. Ads will be removed when Google Play confirms it.");
        }
        return found;
    }
    @Override public void onPurchasesUpdated(@NonNull BillingResult result,List<Purchase> purchases){
        if(result.getResponseCode()==BillingClient.BillingResponseCode.OK){
            if(process(purchases)){setEntitled(true);notifyUi("Thank you! Ads removed on this device.");}
        }else if(result.getResponseCode()!=BillingClient.BillingResponseCode.USER_CANCELED)
            notifyUi("Google Play purchase unavailable. Please try again later.");
    }
    private String price(){
        if(product!=null){
            List<ProductDetails.OneTimePurchaseOfferDetails> offers=product.getOneTimePurchaseOfferDetailsList();
            if(offers!=null&&!offers.isEmpty())return offers.get(0).getFormattedPrice();
            ProductDetails.OneTimePurchaseOfferDetails legacy=product.getOneTimePurchaseOfferDetails();
            if(legacy!=null)return legacy.getFormattedPrice();
        }
        return "one-time payment";
    }
    public void showOptions(){
        boolean purchased=activity.getSharedPreferences("dd-premium",Context.MODE_PRIVATE).getBoolean("verified-purchased",false);
        String[] options=purchased?new String[]{"Restore / check Google Play purchase"}:
          new String[]{"Remove ads · "+price(),"Restore previous purchase"};
        new AlertDialog.Builder(activity).setTitle("Disclosure Desk · Ad-free")
          .setMessage(purchased?"Your Google Play purchase is active. Thank you for supporting independent research.":
            "One payment, no subscription. Ads in the Disclosure Desk app are removed permanently for the purchasing Google Play account. This does not remove adverts supplied by external video players.")
          .setItems(options,(dialog,which)->{
              if(purchased||which==1){restore();return;}
              purchase();
          }).setNegativeButton("Close",null).show();
    }
    private void purchase(){
        if(!connected||product==null){loadProduct();notifyUi("Remove Ads isn't available in Google Play yet. Check the product setup.");return;}
        BillingFlowParams.ProductDetailsParams.Builder chosen=BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product);
        List<ProductDetails.OneTimePurchaseOfferDetails> offers=product.getOneTimePurchaseOfferDetailsList();
        if(offers!=null&&!offers.isEmpty())chosen.setOfferToken(offers.get(0).getOfferToken());
        BillingFlowParams flow=BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(chosen.build())).build();
        billing.launchBillingFlow(activity,flow);
    }
    public void close(){billing.endConnection();}
}
