package com.bpandey690.frontend

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsMessage
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.provider.Telephony.SMS_RECEIVED") {
            val bundle = intent.extras
            if (bundle != null) {
                try {
                    val pdus = bundle.get("pdus") as? Array<*> ?: return
                    for (i in pdus.indices) {
                        val format = bundle.getString("format")
                        val sms = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                            SmsMessage.createFromPdu(pdus[i] as ByteArray, format)
                        } else {
                            @Suppress("DEPRECATION")
                            SmsMessage.createFromPdu(pdus[i] as ByteArray)
                        }
                        val messageBody = sms.messageBody
                        val sender = sms.originatingAddress

                        val reactApplication = context.applicationContext as? com.facebook.react.ReactApplication
                        val reactContext = reactApplication
                            ?.reactNativeHost
                            ?.reactInstanceManager
                            ?.currentReactContext

                        if (reactContext != null) {
                            val params = Arguments.createMap().apply {
                                putString("messageBody", messageBody)
                                putString("sender", sender)
                            }
                            reactContext
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                .emit("onSmsReceived", params)
                        }
                    }
                } catch (e: Exception) {
                    Log.e("SmsReceiver", "Error receiving SMS", e)
                }
            }
        }
    }
}
