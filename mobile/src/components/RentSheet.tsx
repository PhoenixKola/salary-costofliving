import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, fonts, radii, spacing } from "../theme";
import { fmtALL } from "../lib/format";

const QUICK_RENTS = [20000, 35000, 50000, 70000];

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  doneLabel: string;
  value: number;
  onChange: (v: number) => void;
  onClose: () => void;
};

/** Dark bottom sheet for entering monthly rent, with quick-pick chips. */
export function RentSheet({ visible, title, subtitle, doneLabel, value, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = React.useState(String(value));

  React.useEffect(() => {
    if (visible) setText(value > 0 ? String(value) : "");
  }, [visible, value]);

  const commit = (raw: string) => {
    setText(raw.replace(/[^\d]/g, ""));
  };

  const done = () => {
    const num = Number(text.replace(/[^\d]/g, ""));
    onChange(Number.isFinite(num) ? num : 0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={done}>
      <Pressable style={styles.backdrop} onPress={done} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.avoid}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>

          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={commit}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={done}
            />
            <Text style={styles.currency}>ALL</Text>
          </View>

          <View style={styles.chips}>
            {QUICK_RENTS.map((r) => (
              <AnimatedPressable
                key={r}
                onPress={() => setText(String(r))}
                haptic
                style={{ flex: 1 }}
                contentStyle={styles.chip}
              >
                <Text style={styles.chipTxt}>{fmtALL(r)}</Text>
              </AnimatedPressable>
            ))}
          </View>

          <AnimatedPressable onPress={done} haptic contentStyle={styles.doneBtn}>
            <Text style={styles.doneTxt}>{doneLabel}</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)"
  },
  avoid: {
    flex: 1,
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 19,
    color: colors.text,
    marginBottom: 4
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.text
  },
  currency: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  chip: {
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center"
  },
  chipTxt: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textSecondary
  },
  doneBtn: {
    paddingVertical: 15,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center"
  },
  doneTxt: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.onAccent
  }
});
