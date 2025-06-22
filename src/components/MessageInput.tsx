import React, { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../styles/MessageInput.styles"

interface Props {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  keyboardHeight?: number;
}

const MessageInput: React.FC<Props> = ({ onSendMessage, disabled = false}) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (disabled || !inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleFocus = () => {
    // Klavye açıldığında biraz bekleyip scroll yap
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <View style={[
      styles.inputContainer
    ]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, disabled && styles.disabledInput]}
        value={inputText}
        onChangeText={setInputText}
        placeholder={disabled ? t("chat.waitingPlaceholder") : t("chat.inputPlaceholder")}
        placeholderTextColor={disabled ? "#999" : "#666"}
        testID="message-input"
        editable={!disabled}
        multiline={false}
        maxLength={1000}
        autoCorrect={false}
        autoCapitalize="sentences"
        returnKeyType="send"
        onSubmitEditing={handleSend}
        onFocus={handleFocus}
      />
      <TouchableOpacity 
        style={[styles.sendButton, disabled && styles.disabledButton]} 
        onPress={handleSend} 
        testID="send-button"
        disabled={disabled}
      >
        <Text style={styles.sendButtonText}>{t("chat.sendButton")}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MessageInput;
