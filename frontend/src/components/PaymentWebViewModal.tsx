import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

type Props = {
  visible: boolean;
  url: string | null;
  simulated?: boolean;
  gateway: "razorpay" | "paypal";
  onClose: () => void;
  onApproved: () => void; // called when payment looks completed (success URL detected, or user confirms simulated)
};

const SUCCESS_HINTS = [
  "payment-success",
  "payment_status=paid",
  "PayerID=",
  "razorpay_payment_id",
  "status=COMPLETED",
  "status=paid",
];
const CANCEL_HINTS = ["payment-cancelled", "cancel_url", "user_cancelled"];

export function PaymentWebViewModal({
  visible,
  url,
  simulated,
  gateway,
  onClose,
  onApproved,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfirmed(false);
      setLoading(true);
    }
  }, [visible, url]);

  const handleNav = (nav: WebViewNavigation) => {
    const u = (nav.url || "").toLowerCase();
    if (SUCCESS_HINTS.some((h) => u.includes(h.toLowerCase()))) {
      onApproved();
    } else if (CANCEL_HINTS.some((h) => u.includes(h.toLowerCase()))) {
      onClose();
    }
  };

  const gatewayLabel = gateway === "razorpay" ? "Razorpay" : "PayPal";
  const gatewayColor = gateway === "razorpay" ? "#0c2451" : "#003087";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} testID="pay-close">
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Secure checkout</Text>
            <Text style={[styles.subtitle, { color: gatewayColor }]}>
              {gatewayLabel} · {simulated ? "Sandbox preview" : "Live"}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {simulated ? (
          <View style={styles.simWrap}>
            <View style={styles.simIcon}>
              <Ionicons name="card" size={32} color={gatewayColor} />
            </View>
            <Text style={styles.simTitle}>{gatewayLabel} sandbox preview</Text>
            <Text style={styles.simBody}>
              Real {gatewayLabel} keys aren’t configured yet, so this is a simulated
              checkout. In production, this screen opens the actual {gatewayLabel}{" "}
              checkout page — the rest of the flow stays exactly the same.
            </Text>
            <View style={styles.simReceipt}>
              <Text style={styles.simReceiptLabel}>You’re paying for</Text>
              <Text style={styles.simReceiptItem}>LoveAssist AI — Premium (monthly)</Text>
              <Text style={styles.simReceiptPrice}>$7.60 USD</Text>
            </View>
            <TouchableOpacity
              style={[styles.simBtn, { backgroundColor: gatewayColor }]}
              activeOpacity={0.9}
              onPress={() => {
                setConfirmed(true);
                onApproved();
              }}
              disabled={confirmed}
              testID="pay-simulate-approve"
            >
              {confirmed ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.simBtnText}>
                    Simulate successful payment
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.simCancel}
              testID="pay-simulate-cancel"
            >
              <Text style={styles.simCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : url ? (
          <View style={{ flex: 1 }}>
            {Platform.OS === "web" ? (
              <View style={styles.simWrap}>
                <Ionicons
                  name="open-outline"
                  size={32}
                  color={gatewayColor}
                />
                <Text style={styles.simTitle}>Open {gatewayLabel} checkout</Text>
                <Text style={styles.simBody}>
                  Mobile WebView is not available on web preview. Tap below to
                  open the secure checkout in a new tab.
                </Text>
                <TouchableOpacity
                  style={[styles.simBtn, { backgroundColor: gatewayColor }]}
                  activeOpacity={0.9}
                  onPress={() => Linking.openURL(url)}
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.simBtnText}>Open checkout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simCancel}
                  onPress={() => {
                    onApproved();
                  }}
                >
                  <Text style={styles.simCancelText}>
                    I’ve completed payment
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <WebView
                  ref={webRef}
                  source={{ uri: url }}
                  onNavigationStateChange={handleNav}
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  startInLoadingState
                  style={{ flex: 1 }}
                />
                {loading && (
                  <View style={styles.loader} pointerEvents="none">
                    <ActivityIndicator color={COLORS.rose} />
                  </View>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.simWrap}>
            <ActivityIndicator color={COLORS.rose} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBorder,
  },
  title: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.textPrimary },
  subtitle: { fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.5, marginTop: 2 },
  loader: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  simWrap: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  simIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.blush,
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  simTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  simBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  simReceipt: {
    width: "100%",
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  simReceiptLabel: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.textMuted,
  },
  simReceiptItem: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  simReceiptPrice: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  simBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    minWidth: 240,
    marginTop: SPACING.md,
  },
  simBtnText: {
    color: "#fff",
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  simCancel: { marginTop: SPACING.md, padding: 8 },
  simCancelText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
  },
});
